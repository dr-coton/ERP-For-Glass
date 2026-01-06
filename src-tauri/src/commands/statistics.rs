use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::db::DbState;
use crate::error::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PeriodType {
    Daily,
    Weekly,
    Monthly,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatisticsRequest {
    pub period_type: PeriodType,
    pub start_date: String,
    pub end_date: String,
    pub customer_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeriodStatistics {
    pub period_label: String,
    pub period_start: String,
    pub customer_name: String,
    pub total_amount: i64,
    pub transaction_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatisticsResponse {
    pub period_type: PeriodType,
    pub start_date: String,
    pub end_date: String,
    pub data: Vec<PeriodStatistics>,
    pub grand_total: i64,
}

#[tauri::command]
pub fn get_statistics(
    db: State<DbState>,
    request: StatisticsRequest,
) -> Result<StatisticsResponse> {
    let conn = db.0.lock().unwrap();

    let query = match request.period_type {
        PeriodType::Daily => {
            r#"
            SELECT
                ti.date as period_label,
                ti.date as period_start,
                t.customer_name,
                SUM(ti.supply_price) as total_amount,
                COUNT(DISTINCT t.id) as transaction_count
            FROM transaction_items ti
            JOIN transactions t ON ti.transaction_id = t.id
            WHERE ti.date >= ?1 AND ti.date <= ?2
                AND (?3 IS NULL OR t.customer_name = ?3)
            GROUP BY ti.date, t.customer_name
            ORDER BY ti.date ASC, t.customer_name ASC
            "#
        }
        PeriodType::Weekly => {
            // 월요일 시작 기준 주별 통계
            // SQLite에서 weekday 0 = Sunday, 1 = Monday, ...
            // date(ti.date, 'weekday 1', '-7 days') gives the Monday of the week
            r#"
            SELECT
                strftime('%Y년 %m월 ', date(ti.date, 'weekday 1', '-7 days')) ||
                    ((CAST(strftime('%d', date(ti.date, 'weekday 1', '-7 days')) AS INTEGER) - 1) / 7 + 1) || '주차' as period_label,
                date(ti.date, 'weekday 1', '-7 days') as period_start,
                t.customer_name,
                SUM(ti.supply_price) as total_amount,
                COUNT(DISTINCT t.id) as transaction_count
            FROM transaction_items ti
            JOIN transactions t ON ti.transaction_id = t.id
            WHERE ti.date >= ?1 AND ti.date <= ?2
                AND (?3 IS NULL OR t.customer_name = ?3)
            GROUP BY period_start, t.customer_name
            ORDER BY period_start ASC, t.customer_name ASC
            "#
        }
        PeriodType::Monthly => {
            r#"
            SELECT
                strftime('%Y-%m', ti.date) as period_label,
                strftime('%Y-%m-01', ti.date) as period_start,
                t.customer_name,
                SUM(ti.supply_price) as total_amount,
                COUNT(DISTINCT t.id) as transaction_count
            FROM transaction_items ti
            JOIN transactions t ON ti.transaction_id = t.id
            WHERE ti.date >= ?1 AND ti.date <= ?2
                AND (?3 IS NULL OR t.customer_name = ?3)
            GROUP BY strftime('%Y-%m', ti.date), t.customer_name
            ORDER BY period_start ASC, t.customer_name ASC
            "#
        }
        PeriodType::Custom => {
            r#"
            SELECT
                ?1 || ' ~ ' || ?2 as period_label,
                ?1 as period_start,
                t.customer_name,
                SUM(ti.supply_price) as total_amount,
                COUNT(DISTINCT t.id) as transaction_count
            FROM transaction_items ti
            JOIN transactions t ON ti.transaction_id = t.id
            WHERE ti.date >= ?1 AND ti.date <= ?2
                AND (?3 IS NULL OR t.customer_name = ?3)
            GROUP BY t.customer_name
            ORDER BY t.customer_name ASC
            "#
        }
    };

    let mut stmt = conn.prepare(query)?;
    let rows = stmt.query_map(
        params![
            request.start_date,
            request.end_date,
            request.customer_name
        ],
        |row| {
            Ok(PeriodStatistics {
                period_label: row.get(0)?,
                period_start: row.get(1)?,
                customer_name: row.get(2)?,
                total_amount: row.get(3)?,
                transaction_count: row.get(4)?,
            })
        },
    )?;

    let mut data: Vec<PeriodStatistics> = Vec::new();
    let mut grand_total: i64 = 0;

    for row in rows {
        let stat = row?;
        grand_total += stat.total_amount;
        data.push(stat);
    }

    Ok(StatisticsResponse {
        period_type: request.period_type,
        start_date: request.start_date,
        end_date: request.end_date,
        data,
        grand_total,
    })
}

#[tauri::command]
pub fn download_statistics_excel(
    db: State<DbState>,
    request: StatisticsRequest,
    save_path: String,
) -> Result<String> {
    // 통계 데이터 조회
    let response = get_statistics_internal(&db, &request)?;

    // 엑셀 생성
    let mut workbook = crate::services::excel::statistics::create_statistics_report(&response)?;

    // 파일 저장
    workbook.save(&save_path)?;

    Ok(save_path)
}

// 내부용 함수 (State 참조 문제 해결)
fn get_statistics_internal(
    db: &State<DbState>,
    request: &StatisticsRequest,
) -> Result<StatisticsResponse> {
    let conn = db.0.lock().unwrap();

    let query = match request.period_type {
        PeriodType::Daily => {
            r#"
            SELECT
                ti.date as period_label,
                ti.date as period_start,
                t.customer_name,
                SUM(ti.supply_price) as total_amount,
                COUNT(DISTINCT t.id) as transaction_count
            FROM transaction_items ti
            JOIN transactions t ON ti.transaction_id = t.id
            WHERE ti.date >= ?1 AND ti.date <= ?2
                AND (?3 IS NULL OR t.customer_name = ?3)
            GROUP BY ti.date, t.customer_name
            ORDER BY ti.date ASC, t.customer_name ASC
            "#
        }
        PeriodType::Weekly => {
            r#"
            SELECT
                strftime('%Y년 %m월 ', date(ti.date, 'weekday 1', '-7 days')) ||
                    ((CAST(strftime('%d', date(ti.date, 'weekday 1', '-7 days')) AS INTEGER) - 1) / 7 + 1) || '주차' as period_label,
                date(ti.date, 'weekday 1', '-7 days') as period_start,
                t.customer_name,
                SUM(ti.supply_price) as total_amount,
                COUNT(DISTINCT t.id) as transaction_count
            FROM transaction_items ti
            JOIN transactions t ON ti.transaction_id = t.id
            WHERE ti.date >= ?1 AND ti.date <= ?2
                AND (?3 IS NULL OR t.customer_name = ?3)
            GROUP BY period_start, t.customer_name
            ORDER BY period_start ASC, t.customer_name ASC
            "#
        }
        PeriodType::Monthly => {
            r#"
            SELECT
                strftime('%Y-%m', ti.date) as period_label,
                strftime('%Y-%m-01', ti.date) as period_start,
                t.customer_name,
                SUM(ti.supply_price) as total_amount,
                COUNT(DISTINCT t.id) as transaction_count
            FROM transaction_items ti
            JOIN transactions t ON ti.transaction_id = t.id
            WHERE ti.date >= ?1 AND ti.date <= ?2
                AND (?3 IS NULL OR t.customer_name = ?3)
            GROUP BY strftime('%Y-%m', ti.date), t.customer_name
            ORDER BY period_start ASC, t.customer_name ASC
            "#
        }
        PeriodType::Custom => {
            r#"
            SELECT
                ?1 || ' ~ ' || ?2 as period_label,
                ?1 as period_start,
                t.customer_name,
                SUM(ti.supply_price) as total_amount,
                COUNT(DISTINCT t.id) as transaction_count
            FROM transaction_items ti
            JOIN transactions t ON ti.transaction_id = t.id
            WHERE ti.date >= ?1 AND ti.date <= ?2
                AND (?3 IS NULL OR t.customer_name = ?3)
            GROUP BY t.customer_name
            ORDER BY t.customer_name ASC
            "#
        }
    };

    let mut stmt = conn.prepare(query)?;
    let rows = stmt.query_map(
        params![
            request.start_date,
            request.end_date,
            request.customer_name
        ],
        |row| {
            Ok(PeriodStatistics {
                period_label: row.get(0)?,
                period_start: row.get(1)?,
                customer_name: row.get(2)?,
                total_amount: row.get(3)?,
                transaction_count: row.get(4)?,
            })
        },
    )?;

    let mut data: Vec<PeriodStatistics> = Vec::new();
    let mut grand_total: i64 = 0;

    for row in rows {
        let stat = row?;
        grand_total += stat.total_amount;
        data.push(stat);
    }

    Ok(StatisticsResponse {
        period_type: request.period_type.clone(),
        start_date: request.start_date.clone(),
        end_date: request.end_date.clone(),
        data,
        grand_total,
    })
}
