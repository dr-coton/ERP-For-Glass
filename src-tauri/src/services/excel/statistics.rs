use rust_xlsxwriter::Workbook;

use crate::commands::statistics::{PeriodType, StatisticsResponse};
use crate::error::Result;
use super::styles::Styles;

/// 통계 리포트 엑셀 생성
pub fn create_statistics_report(response: &StatisticsResponse) -> Result<Workbook> {
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    // 시트명 설정
    let sheet_name = match response.period_type {
        PeriodType::Daily => "일별 통계",
        PeriodType::Weekly => "주별 통계",
        PeriodType::Monthly => "월별 통계",
        PeriodType::Custom => "기간별 통계",
    };
    worksheet.set_name(sheet_name)?;

    // 열 너비 설정
    worksheet.set_column_width(0, 20.0)?; // 기간
    worksheet.set_column_width(1, 25.0)?; // 거래처
    worksheet.set_column_width(2, 12.0)?; // 거래 건수
    worksheet.set_column_width(3, 18.0)?; // 합계 금액

    // 제목 행
    let title = format!(
        "통계 ({} ~ {})",
        response.start_date, response.end_date
    );
    worksheet.merge_range(0, 0, 0, 3, &title, &Styles::title())?;

    // 헤더 행
    let headers = ["기간", "거래처", "거래 건수", "합계 금액"];
    for (col, header) in headers.iter().enumerate() {
        worksheet.write_with_format(2, col as u16, *header, &Styles::table_header())?;
    }

    // 데이터 행
    let mut row: u32 = 3;
    for item in &response.data {
        worksheet.write_with_format(row, 0, &item.period_label, &Styles::data_text())?;
        worksheet.write_with_format(row, 1, &item.customer_name, &Styles::data_text())?;
        worksheet.write_with_format(row, 2, item.transaction_count, &Styles::data_number())?;
        worksheet.write_with_format(row, 3, item.total_amount, &Styles::data_number())?;
        row += 1;
    }

    // 빈 행이 있으면 빈 데이터 표시
    if response.data.is_empty() {
        worksheet.merge_range(3, 0, 3, 3, "데이터가 없습니다", &Styles::data_text())?;
        row = 4;
    }

    // 합계 행
    row += 1; // 빈 줄 하나
    worksheet.merge_range(row, 0, row, 2, "총 합계", &Styles::total_label())?;
    worksheet.write_with_format(row, 3, response.grand_total, &Styles::total_number())?;

    Ok(workbook)
}
