use rust_xlsxwriter::Workbook;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

use crate::db::DbState;
use crate::error::{AppError, Result};
use crate::services::excel::{
    create_monthly_report, write_single_transaction_legacy,
    TransactionData, TransactionItemData, SupplierInfo,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionItem {
    pub id: Option<i64>,
    pub date: String,
    pub product: String,
    pub price_type: String,
    pub width: i64,
    pub height: i64,
    pub quantity: i64,
    pub unit_price: i64,
    pub supply_price: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub id: Option<i64>,
    pub customer_name: String,
    pub total_amount: i64,
    pub paid_amount: i64,
    pub memo: Option<String>,
    pub created_at: Option<String>,
    pub display_date: Option<String>,
    pub items: Vec<TransactionItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionSummary {
    pub id: i64,
    pub customer_name: String,
    pub total_amount: i64,
    pub paid_amount: i64,
    pub memo: Option<String>,
    pub display_date: String,
}

#[tauri::command]
pub fn get_transactions(
    app_handle: AppHandle,
    search: Option<String>,
) -> Result<Vec<TransactionSummary>> {
    let state = app_handle.state::<DbState>();
    let conn = state.0.lock().unwrap();

    let query = "
        SELECT
            t.id,
            t.customer_name,
            t.total_amount,
            t.paid_amount,
            t.memo,
            COALESCE(
                (SELECT date FROM transaction_items WHERE transaction_id = t.id ORDER BY date ASC LIMIT 1),
                strftime('%Y-%m-%d', t.created_at)
            ) as display_date
        FROM transactions t
        WHERE (?1 IS NULL OR t.customer_name LIKE '%' || ?1 || '%' OR t.memo LIKE '%' || ?1 || '%')
        ORDER BY display_date DESC
    ";

    let mut stmt = conn.prepare(query)?;
    let transactions = stmt
        .query_map([&search], |row: &rusqlite::Row| {
            Ok(TransactionSummary {
                id: row.get(0)?,
                customer_name: row.get(1)?,
                total_amount: row.get(2)?,
                paid_amount: row.get(3)?,
                memo: row.get(4)?,
                display_date: row.get(5)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(transactions)
}

#[tauri::command]
pub fn get_transaction(app_handle: AppHandle, id: i64) -> Result<Transaction> {
    let state = app_handle.state::<DbState>();
    let conn = state.0.lock().unwrap();

    let transaction = conn.query_row(
        "SELECT id, customer_name, total_amount, paid_amount, memo, created_at FROM transactions WHERE id = ?1",
        [id],
        |row| {
            Ok(Transaction {
                id: Some(row.get(0)?),
                customer_name: row.get(1)?,
                total_amount: row.get(2)?,
                paid_amount: row.get(3)?,
                memo: row.get(4)?,
                created_at: row.get(5)?,
                display_date: None,
                items: Vec::new(),
            })
        },
    )?;

    let mut stmt = conn.prepare(
        "SELECT id, date, product, price_type, width, height, quantity, unit_price, supply_price
         FROM transaction_items WHERE transaction_id = ?1 ORDER BY date"
    )?;

    let items = stmt
        .query_map([id], |row: &rusqlite::Row| {
            Ok(TransactionItem {
                id: Some(row.get(0)?),
                date: row.get(1)?,
                product: row.get(2)?,
                price_type: row.get(3)?,
                width: row.get(4)?,
                height: row.get(5)?,
                quantity: row.get(6)?,
                unit_price: row.get(7)?,
                supply_price: row.get(8)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(Transaction {
        items,
        ..transaction
    })
}

#[tauri::command]
pub fn create_transaction(app_handle: AppHandle, transaction: Transaction) -> Result<i64> {
    let state = app_handle.state::<DbState>();
    let mut conn = state.0.lock().unwrap();

    let tx = conn.transaction()?;

    tx.execute(
        "INSERT INTO transactions (customer_name, total_amount, paid_amount, memo, created_at)
         VALUES (?1, ?2, ?3, ?4, datetime('now', 'localtime'))",
        (
            &transaction.customer_name,
            transaction.total_amount,
            transaction.paid_amount,
            &transaction.memo,
        ),
    )?;

    let transaction_id = tx.last_insert_rowid();

    for item in &transaction.items {
        tx.execute(
            "INSERT INTO transaction_items
             (transaction_id, date, product, price_type, width, height, quantity, unit_price, supply_price)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            (
                transaction_id,
                &item.date,
                &item.product,
                &item.price_type,
                item.width,
                item.height,
                item.quantity,
                item.unit_price,
                item.supply_price,
            ),
        )?;
    }

    tx.commit()?;
    Ok(transaction_id)
}

#[tauri::command]
pub fn update_transaction(app_handle: AppHandle, transaction: Transaction) -> Result<()> {
    let state = app_handle.state::<DbState>();
    let mut conn = state.0.lock().unwrap();

    let id = transaction
        .id
        .ok_or_else(|| AppError::Validation("Transaction ID required".to_string()))?;

    let tx = conn.transaction()?;

    // 기존 항목 삭제
    tx.execute("DELETE FROM transaction_items WHERE transaction_id = ?1", [id])?;

    // 거래명세서 업데이트
    tx.execute(
        "UPDATE transactions SET customer_name = ?1, total_amount = ?2, paid_amount = ?3, memo = ?4 WHERE id = ?5",
        (
            &transaction.customer_name,
            transaction.total_amount,
            transaction.paid_amount,
            &transaction.memo,
            id,
        ),
    )?;

    // 새 항목 삽입
    for item in &transaction.items {
        tx.execute(
            "INSERT INTO transaction_items
             (transaction_id, date, product, price_type, width, height, quantity, unit_price, supply_price)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            (
                id,
                &item.date,
                &item.product,
                &item.price_type,
                item.width,
                item.height,
                item.quantity,
                item.unit_price,
                item.supply_price,
            ),
        )?;
    }

    tx.commit()?;
    Ok(())
}

#[tauri::command]
pub fn delete_transaction(app_handle: AppHandle, id: i64) -> Result<()> {
    let state = app_handle.state::<DbState>();
    let mut conn = state.0.lock().unwrap();

    let tx = conn.transaction()?;

    tx.execute("DELETE FROM transaction_items WHERE transaction_id = ?1", [id])?;
    tx.execute("DELETE FROM transactions WHERE id = ?1", [id])?;

    tx.commit()?;
    Ok(())
}

#[tauri::command]
pub fn mark_transactions_paid(app_handle: AppHandle, ids: Vec<i64>) -> Result<()> {
    let state = app_handle.state::<DbState>();
    let mut conn = state.0.lock().unwrap();

    let tx = conn.transaction()?;

    for id in ids {
        tx.execute(
            "UPDATE transactions SET paid_amount = total_amount WHERE id = ?1",
            [id],
        )?;
    }

    tx.commit()?;
    Ok(())
}

#[tauri::command]
pub fn get_available_months(app_handle: AppHandle) -> Result<Vec<String>> {
    let state = app_handle.state::<DbState>();
    let conn = state.0.lock().unwrap();

    let mut stmt = conn.prepare(
        "SELECT DISTINCT strftime('%Y-%m',
            COALESCE(
                (SELECT date FROM transaction_items WHERE transaction_id = t.id ORDER BY date ASC LIMIT 1),
                t.created_at
            )
        ) as month
        FROM transactions t
        ORDER BY month DESC"
    )?;

    let months = stmt
        .query_map([], |row: &rusqlite::Row| row.get(0))?
        .collect::<std::result::Result<Vec<String>, _>>()?;

    Ok(months)
}

#[tauri::command]
pub fn download_monthly_excel(
    app_handle: AppHandle,
    year_month: String,
    customer_name: Option<String>,
    save_path: String,
) -> Result<String> {
    let state = app_handle.state::<DbState>();
    let conn = state.0.lock().unwrap();

    // 해당 월의 거래명세서 조회
    let query = if customer_name.is_some() {
        "SELECT t.id, t.memo
         FROM transactions t
         WHERE strftime('%Y-%m',
             COALESCE(
                 (SELECT date FROM transaction_items WHERE transaction_id = t.id ORDER BY date ASC LIMIT 1),
                 t.created_at
             )
         ) = ?1
         AND t.customer_name = ?2
         ORDER BY t.customer_name"
    } else {
        "SELECT t.id, t.memo
         FROM transactions t
         WHERE strftime('%Y-%m',
             COALESCE(
                 (SELECT date FROM transaction_items WHERE transaction_id = t.id ORDER BY date ASC LIMIT 1),
                 t.created_at
             )
         ) = ?1
         ORDER BY t.customer_name"
    };

    let mut transactions_data: Vec<TransactionData> = Vec::new();

    let mut stmt = conn.prepare(query)?;
    let rows: Vec<(i64, Option<String>)> = if let Some(ref cust) = customer_name {
        stmt.query_map([&year_month, cust], |row: &rusqlite::Row| Ok((row.get(0)?, row.get(1)?)))?
            .collect::<std::result::Result<Vec<_>, _>>()?
    } else {
        stmt.query_map([&year_month], |row: &rusqlite::Row| Ok((row.get(0)?, row.get(1)?)))?
            .collect::<std::result::Result<Vec<_>, _>>()?
    };

    for (tx_id, memo) in rows {
        let mut item_stmt = conn.prepare(
            "SELECT date, product, width, height, quantity, unit_price, supply_price
             FROM transaction_items WHERE transaction_id = ?1 ORDER BY date"
        )?;

        let items = item_stmt
            .query_map([tx_id], |row: &rusqlite::Row| {
                Ok(TransactionItemData {
                    date: row.get(0)?,
                    product: row.get(1)?,
                    width: row.get(2)?,
                    height: row.get(3)?,
                    quantity: row.get(4)?,
                    unit_price: row.get(5)?,
                    supply_price: row.get(6)?,
                })
            })?
            .collect::<std::result::Result<Vec<_>, _>>()?;

        transactions_data.push(TransactionData { memo, items });
    }

    if transactions_data.is_empty() {
        return Err(AppError::NotFound(
            "해당 월에 거래명세서가 없습니다.".to_string(),
        ));
    }

    let mut workbook = create_monthly_report(&year_month, transactions_data)?;
    workbook.save(&save_path)?;

    Ok(save_path)
}

#[tauri::command]
pub fn download_transaction_excel(
    app_handle: AppHandle,
    id: i64,
    save_path: String,
) -> Result<String> {
    let state = app_handle.state::<DbState>();
    let conn = state.0.lock().unwrap();

    // 공급자 정보 조회
    let supplier: Option<SupplierInfo> = conn
        .query_row(
            "SELECT business_id, company_name, representative, address, phone, fax
             FROM supplier_settings WHERE id = 1",
            [],
            |row| {
                Ok(SupplierInfo {
                    business_id: row.get(0)?,
                    company_name: row.get(1)?,
                    representative: row.get(2)?,
                    address: row.get(3)?,
                    phone: row.get(4)?,
                    fax: row.get::<_, Option<String>>(5)?.unwrap_or_default(),
                })
            },
        )
        .ok();

    // 거래명세서 기본 정보 조회 (고객 정보 포함)
    let (customer_name, total_amount, _memo, customer_business_id, customer_representative, address, phone): (
        String,
        i64,
        Option<String>,
        Option<String>,
        Option<String>,
        Option<String>,
        Option<String>,
    ) = conn.query_row(
        "SELECT t.customer_name, t.total_amount, t.memo,
                c.business_id, c.representative, c.address, c.phone
         FROM transactions t
         LEFT JOIN customers c ON t.customer_name = c.company_name
         WHERE t.id = ?1",
        [id],
        |row| Ok((
            row.get(0)?,
            row.get(1)?,
            row.get(2)?,
            row.get(3)?,
            row.get(4)?,
            row.get(5)?,
            row.get(6)?,
        )),
    )?;

    // 항목 조회
    let mut stmt = conn.prepare(
        "SELECT date, product, width, height, quantity, unit_price, supply_price
         FROM transaction_items WHERE transaction_id = ?1 ORDER BY date"
    )?;

    let items: Vec<TransactionItemData> = stmt
        .query_map([id], |row: &rusqlite::Row| {
            Ok(TransactionItemData {
                date: row.get(0)?,
                product: row.get(1)?,
                width: row.get(2)?,
                height: row.get(3)?,
                quantity: row.get(4)?,
                unit_price: row.get(5)?,
                supply_price: row.get(6)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();
    worksheet.set_name("거래명세서")?;

    write_single_transaction_legacy(
        worksheet,
        id,
        &customer_name,
        customer_business_id.as_deref(),
        customer_representative.as_deref(),
        &address.unwrap_or_default(),
        &phone.unwrap_or_default(),
        total_amount,
        &items,
        supplier,
    )?;

    workbook.save(&save_path)?;

    Ok(save_path)
}
