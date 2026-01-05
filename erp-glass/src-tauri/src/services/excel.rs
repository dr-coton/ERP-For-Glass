use rust_xlsxwriter::{Format, FormatAlign, FormatBorder, Workbook, Worksheet, Color};
use crate::error::Result;

pub struct TransactionData {
    pub memo: Option<String>,
    pub items: Vec<TransactionItemData>,
}

pub struct TransactionItemData {
    pub date: String,
    pub product: String,
    pub width: i64,
    pub height: i64,
    pub quantity: i64,
    pub unit_price: i64,
    pub supply_price: i64,
}

pub fn create_monthly_report(
    year_month: &str,
    transactions: Vec<TransactionData>,
) -> Result<Workbook> {
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    worksheet.set_name(&format!("{}월 거래명세서", year_month))?;

    // 열 너비 설정
    worksheet.set_column_width(0, 8)?;   // 월
    worksheet.set_column_width(1, 8)?;   // 일
    worksheet.set_column_width(2, 30)?;  // 품목
    worksheet.set_column_width(3, 15)?;  // 규격
    worksheet.set_column_width(4, 10)?;  // 수량
    worksheet.set_column_width(5, 15)?;  // 단가
    worksheet.set_column_width(6, 15)?;  // 금액
    worksheet.set_column_width(7, 15)?;  // 미수금

    // 헤더 스타일
    let header_format = Format::new()
        .set_bold()
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_border(FormatBorder::Medium)
        .set_background_color(Color::RGB(0x366092))
        .set_font_color(Color::White);

    // 데이터 스타일
    let data_format = Format::new()
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_border(FormatBorder::Thin);

    let number_format = Format::new()
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_border(FormatBorder::Thin)
        .set_num_format("#,##0");

    // 메모 스타일
    let memo_format = Format::new()
        .set_bold()
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_border(FormatBorder::Thin)
        .set_background_color(Color::RGB(0xE6E6E6));

    // 합계 스타일
    let total_format = Format::new()
        .set_bold()
        .set_align(FormatAlign::Center)
        .set_align(FormatAlign::VerticalCenter)
        .set_border_top(FormatBorder::Double)
        .set_border_bottom(FormatBorder::Double)
        .set_border_left(FormatBorder::Thin)
        .set_border_right(FormatBorder::Thin)
        .set_background_color(Color::RGB(0xD9E1F2))
        .set_num_format("#,##0");

    // 헤더 작성
    let headers = ["월", "일", "품목", "규격", "수량", "단가", "금액", "미수금"];
    for (col, header) in headers.iter().enumerate() {
        worksheet.write_with_format(0, col as u16, *header, &header_format)?;
    }
    worksheet.set_row_height(0, 25)?;

    let mut current_row: u32 = 1;
    let mut running_balance: i64 = 0;
    let mut total_rows: Vec<u32> = Vec::new();

    for transaction in transactions {
        // 메모 행 작성
        if let Some(memo) = &transaction.memo {
            if !memo.is_empty() {
                worksheet.merge_range(current_row, 0, current_row, 7, memo, &memo_format)?;
                worksheet.set_row_height(current_row, 20)?;
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

                running_balance += item.supply_price;

                worksheet.write_with_format(current_row, 0, month, &data_format)?;
                worksheet.write_with_format(current_row, 1, day, &data_format)?;
                worksheet.write_with_format(current_row, 2, &item.product, &data_format)?;
                worksheet.write_with_format(
                    current_row,
                    3,
                    format!("{} X {}", item.width, item.height),
                    &data_format,
                )?;
                worksheet.write_with_format(current_row, 4, item.quantity, &number_format)?;
                worksheet.write_with_format(current_row, 5, item.unit_price, &number_format)?;
                worksheet.write_with_format(current_row, 6, item.supply_price, &number_format)?;
                worksheet.write_with_format(current_row, 7, running_balance, &number_format)?;

                worksheet.set_row_height(current_row, 18)?;
                current_row += 1;
            }
        }

        // 합계 행
        if !transaction.items.is_empty() {
            worksheet.merge_range(current_row, 0, current_row, 3, "합계", &total_format)?;

            let sum_formula_qty = format!("=SUM(E{}:E{})", start_row + 1, current_row);
            let sum_formula_price = format!("=SUM(F{}:F{})", start_row + 1, current_row);
            let sum_formula_amount = format!("=SUM(G{}:G{})", start_row + 1, current_row);

            worksheet.write_formula_with_format(current_row, 4, sum_formula_qty.as_str(), &total_format)?;
            worksheet.write_formula_with_format(current_row, 5, sum_formula_price.as_str(), &total_format)?;
            worksheet.write_formula_with_format(current_row, 6, sum_formula_amount.as_str(), &total_format)?;
            worksheet.write_with_format(current_row, 7, running_balance, &total_format)?;

            total_rows.push(current_row);
            worksheet.set_row_height(current_row, 20)?;
            current_row += 1;
        }
    }

    // 최종 합계 행
    if !total_rows.is_empty() {
        current_row += 1;

        let final_format = Format::new()
            .set_bold()
            .set_font_size(14)
            .set_align(FormatAlign::Right)
            .set_align(FormatAlign::VerticalCenter)
            .set_border_top(FormatBorder::Double)
            .set_border_bottom(FormatBorder::Double)
            .set_border_left(FormatBorder::Thin)
            .set_border_right(FormatBorder::Thin)
            .set_background_color(Color::RGB(0xFFE699));

        let final_num_format = Format::new()
            .set_bold()
            .set_font_size(14)
            .set_align(FormatAlign::Center)
            .set_align(FormatAlign::VerticalCenter)
            .set_border_top(FormatBorder::Double)
            .set_border_bottom(FormatBorder::Double)
            .set_border_left(FormatBorder::Thin)
            .set_border_right(FormatBorder::Thin)
            .set_background_color(Color::RGB(0xFFE699))
            .set_num_format("#,##0");

        worksheet.merge_range(current_row, 0, current_row, 6, "월 합계 금액", &final_format)?;

        let total_refs: Vec<String> = total_rows.iter().map(|r| format!("G{}", r + 1)).collect();
        let sum_formula = format!("=SUM({})", total_refs.join(","));
        worksheet.write_formula_with_format(current_row, 7, sum_formula.as_str(), &final_num_format)?;

        worksheet.set_row_height(current_row, 30)?;
    }

    Ok(workbook)
}

pub fn write_single_transaction(
    worksheet: &mut Worksheet,
    _transaction_id: i64,
    customer_name: &str,
    address: &str,
    phone: &str,
    total_amount: i64,
    items: &[TransactionItemData],
) -> Result<()> {
    // 기본 정보 입력 (템플릿 위치에 맞춤)
    worksheet.write(3, 7, customer_name)?;  // H4
    worksheet.write(4, 7, address)?;        // H5
    worksheet.write(5, 7, phone)?;          // H6

    let amount_format = Format::new().set_num_format("#,##0원");
    worksheet.write_with_format(6, 7, total_amount, &amount_format)?;  // H7

    // 항목 데이터 입력 (9행부터)
    for (idx, item) in items.iter().enumerate() {
        let row = 8 + idx as u32;
        let date_parts: Vec<&str> = item.date.split('-').collect();

        if date_parts.len() >= 3 {
            let month: i32 = date_parts[1].parse().unwrap_or(0);
            let day: i32 = date_parts[2].parse().unwrap_or(0);

            worksheet.write(row, 1, month)?;      // B열: 월
            worksheet.write(row, 2, day)?;        // C열: 일
            worksheet.write(row, 3, &item.product)?;  // D열: 품목명

            let size_info = format!("{} X {}", item.width, item.height);
            worksheet.write(row, 10, &size_info)?;    // K열: 사이즈

            let num_format = Format::new().set_num_format("#,##0");
            worksheet.write_with_format(row, 16, item.quantity, &num_format)?;     // Q열: 수량
            worksheet.write_with_format(row, 20, item.unit_price, &num_format)?;   // U열: 단가
            worksheet.write_with_format(row, 26, item.supply_price, &num_format)?; // AA열: 공급가액
        }
    }

    Ok(())
}
