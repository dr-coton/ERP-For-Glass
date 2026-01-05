use rust_xlsxwriter::Workbook;

use crate::error::Result;
use super::layout::{columns, rows, headers};
use super::styles::Styles;
use super::types::TransactionData;

/// 월별 리포트 생성
pub fn create_monthly_report(
    year_month: &str,
    transactions: Vec<TransactionData>,
) -> Result<Workbook> {
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    worksheet.set_name(&format!("{}월 거래명세서", year_month))?;

    // 열 너비 설정 (월별 리포트용, 9열)
    worksheet.set_column_width(0, columns::monthly::MONTH)?;
    worksheet.set_column_width(1, columns::monthly::DAY)?;
    worksheet.set_column_width(2, columns::monthly::PRODUCT)?;
    worksheet.set_column_width(3, columns::monthly::SPEC)?;
    worksheet.set_column_width(4, columns::monthly::PYEONG)?;
    worksheet.set_column_width(5, columns::monthly::QUANTITY)?;
    worksheet.set_column_width(6, columns::monthly::UNIT_PRICE)?;
    worksheet.set_column_width(7, columns::monthly::AMOUNT)?;
    worksheet.set_column_width(8, columns::monthly::BALANCE)?;

    // 헤더 작성
    for (col, header) in headers::MONTHLY.iter().enumerate() {
        worksheet.write_with_format(0, col as u16, *header, &Styles::monthly_header())?;
    }
    worksheet.set_row_height(0, rows::TABLE_HEADER)?;

    let mut current_row: u32 = 1;
    let mut running_balance: i64 = 0;
    let mut total_rows: Vec<u32> = Vec::new();

    for transaction in transactions {
        // 메모 행 작성
        if let Some(memo) = &transaction.memo {
            if !memo.is_empty() {
                worksheet.merge_range(current_row, 0, current_row, 8, memo, &Styles::monthly_memo())?;
                worksheet.set_row_height(current_row, rows::INFO)?;
                current_row += 1;
            }
        }

        let start_row = current_row;

        // 항목 데이터 작성
        for item in &transaction.items {
            let date_parts: Vec<&str> = item.date.split('-').collect();
            if date_parts.len() >= 3 {
                let month: i32 = date_parts[1].parse().unwrap_or(0);
                let day: i32 = date_parts[2].parse().unwrap_or(0);

                // 평 계산: (가로 × 세로) / 90000, 최소 1
                let pyeong_raw = (item.width as f64 * item.height as f64) / 90000.0;
                let pyeong = if pyeong_raw < 1.0 { 1.0 } else { pyeong_raw };

                running_balance += item.supply_price;

                worksheet.write_with_format(current_row, 0, month, &Styles::monthly_data())?;
                worksheet.write_with_format(current_row, 1, day, &Styles::monthly_data())?;
                worksheet.write_with_format(current_row, 2, &item.product, &Styles::monthly_data())?;
                worksheet.write_with_format(
                    current_row,
                    3,
                    format!("{} X {}", item.width, item.height),
                    &Styles::monthly_data(),
                )?;
                worksheet.write_with_format(current_row, 4, pyeong, &Styles::monthly_decimal())?;
                worksheet.write_with_format(current_row, 5, item.quantity, &Styles::monthly_number())?;
                worksheet.write_with_format(current_row, 6, item.unit_price, &Styles::monthly_number())?;
                worksheet.write_with_format(current_row, 7, item.supply_price, &Styles::monthly_number())?;
                worksheet.write_with_format(current_row, 8, running_balance, &Styles::monthly_number())?;

                worksheet.set_row_height(current_row, rows::DATA)?;
                current_row += 1;
            }
        }

        // 합계 행
        if !transaction.items.is_empty() {
            worksheet.merge_range(current_row, 0, current_row, 3, "합계", &Styles::monthly_subtotal())?;

            let sum_formula_pyeong = format!("=SUM(E{}:E{})", start_row + 1, current_row);
            let sum_formula_qty = format!("=SUM(F{}:F{})", start_row + 1, current_row);
            let sum_formula_price = format!("=SUM(G{}:G{})", start_row + 1, current_row);
            let sum_formula_amount = format!("=SUM(H{}:H{})", start_row + 1, current_row);

            worksheet.write_formula_with_format(current_row, 4, sum_formula_pyeong.as_str(), &Styles::monthly_subtotal())?;
            worksheet.write_formula_with_format(current_row, 5, sum_formula_qty.as_str(), &Styles::monthly_subtotal())?;
            worksheet.write_formula_with_format(current_row, 6, sum_formula_price.as_str(), &Styles::monthly_subtotal())?;
            worksheet.write_formula_with_format(current_row, 7, sum_formula_amount.as_str(), &Styles::monthly_subtotal())?;
            worksheet.write_with_format(current_row, 8, running_balance, &Styles::monthly_subtotal())?;

            total_rows.push(current_row);
            worksheet.set_row_height(current_row, rows::TOTAL)?;
            current_row += 1;
        }
    }

    // 최종 합계 행
    if !total_rows.is_empty() {
        current_row += 1;

        worksheet.merge_range(current_row, 0, current_row, 7, "월 합계 금액", &Styles::monthly_final_label())?;

        let total_refs: Vec<String> = total_rows.iter().map(|r| format!("H{}", r + 1)).collect();
        let sum_formula = format!("=SUM({})", total_refs.join(","));
        worksheet.write_formula_with_format(current_row, 8, sum_formula.as_str(), &Styles::monthly_final_number())?;

        worksheet.set_row_height(current_row, rows::MONTHLY_FINAL)?;
    }

    Ok(workbook)
}
