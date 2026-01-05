use rust_xlsxwriter::Worksheet;

use crate::error::Result;
use super::layout::{columns, rows, single_sections, headers, labels};
use super::styles::Styles;
use super::types::{SupplierInfo, ReceiverInfo, TransactionItemData};

/// 거래명세서 시트 빌더
pub struct TransactionSheetBuilder<'a> {
    worksheet: &'a mut Worksheet,
    current_row: u32,
    total_quantity: i64,
    total_pyeong: f64,
    total_amount: i64,
}

impl<'a> TransactionSheetBuilder<'a> {
    /// 새 빌더 생성
    pub fn new(worksheet: &'a mut Worksheet) -> Self {
        Self {
            worksheet,
            current_row: 0,
            total_quantity: 0,
            total_pyeong: 0.0,
            total_amount: 0,
        }
    }

    /// 열 너비 및 A4 인쇄 설정
    pub fn setup_columns(&mut self) -> Result<&mut Self> {
        // 열 너비 설정
        for (col, width) in columns::ALL.iter().enumerate() {
            self.worksheet.set_column_width(col as u16, *width)?;
        }

        // A4 용지 설정 (9 = A4)
        self.worksheet.set_paper_size(9);

        // 여백 설정 (인치 단위: 좌, 우, 상, 하, 헤더, 푸터)
        self.worksheet.set_margins(0.4, 0.4, 0.5, 0.5, 0.3, 0.3);

        // 가로 방향으로 가운데 정렬
        self.worksheet.set_print_center_horizontally(true);

        // 페이지에 맞춤 (가로 1페이지, 세로는 자동)
        self.worksheet.set_print_fit_to_pages(1, 0);

        Ok(self)
    }

    /// 제목 작성
    pub fn write_title(&mut self) -> Result<&mut Self> {
        self.worksheet.merge_range(
            single_sections::TITLE_ROW,
            0,
            single_sections::TITLE_ROW,
            8,  // 9열 (A~I)
            labels::TITLE,
            &Styles::title(),
        )?;
        self.worksheet.set_row_height(single_sections::TITLE_ROW, rows::TITLE)?;
        Ok(self)
    }

    /// 공급자 정보 섹션 작성
    pub fn write_supplier_info(&mut self, supplier: &SupplierInfo) -> Result<&mut Self> {
        let start = single_sections::SUPPLIER_START;

        // 섹션 제목
        self.worksheet.merge_range(start, 0, start + 2, 0, labels::SUPPLIER, &Styles::section_title())?;

        // 1행: 등록번호, 상호, 성명
        // 구조: B=등록번호, C-D=번호값, E=상호, F-G=상호값, H=성명, I=성명값
        self.worksheet.write_with_format(start, 1, labels::BUSINESS_ID, &Styles::label())?;
        self.worksheet.merge_range(start, 2, start, 3, &supplier.business_id, &Styles::value())?;
        self.worksheet.write_with_format(start, 4, labels::COMPANY_NAME, &Styles::label())?;
        self.worksheet.merge_range(start, 5, start, 6, &supplier.company_name, &Styles::value())?;
        self.worksheet.write_with_format(start, 7, labels::REPRESENTATIVE, &Styles::label())?;
        self.worksheet.write_with_format(start, 8, &supplier.representative, &Styles::value())?;
        self.worksheet.set_row_height(start, rows::INFO)?;

        // 2행: 주소
        self.worksheet.write_with_format(start + 1, 1, labels::ADDRESS, &Styles::label())?;
        self.worksheet.merge_range(start + 1, 2, start + 1, 8, &supplier.address, &Styles::value())?;
        self.worksheet.set_row_height(start + 1, rows::INFO)?;

        // 3행: 전화, FAX
        // 구조: B=전화, C-D=전화값, E=FAX, F-I=FAX값
        self.worksheet.write_with_format(start + 2, 1, labels::PHONE, &Styles::label())?;
        self.worksheet.merge_range(start + 2, 2, start + 2, 3, &supplier.phone, &Styles::value())?;
        self.worksheet.write_with_format(start + 2, 4, labels::FAX, &Styles::label())?;
        self.worksheet.merge_range(start + 2, 5, start + 2, 8, &supplier.fax, &Styles::value())?;
        self.worksheet.set_row_height(start + 2, rows::INFO)?;

        Ok(self)
    }

    /// 공급받는자 정보 섹션 작성
    pub fn write_receiver_info(&mut self, receiver: &ReceiverInfo, total_amount: i64) -> Result<&mut Self> {
        let start = single_sections::RECEIVER_START;

        // 섹션 제목
        self.worksheet.merge_range(start, 0, start + 2, 0, labels::RECEIVER, &Styles::section_title())?;

        // 1행: 등록번호, 상호, 성명
        // 구조: B=등록번호, C-D=번호값, E=상호, F-G=상호값, H=성명, I=성명값
        self.worksheet.write_with_format(start, 1, labels::BUSINESS_ID, &Styles::label())?;
        let biz_id = receiver.business_id.as_deref().unwrap_or("");
        self.worksheet.merge_range(start, 2, start, 3, biz_id, &Styles::value())?;
        self.worksheet.write_with_format(start, 4, labels::COMPANY_NAME, &Styles::label())?;
        self.worksheet.merge_range(start, 5, start, 6, &receiver.company_name, &Styles::value())?;
        self.worksheet.write_with_format(start, 7, labels::REPRESENTATIVE, &Styles::label())?;
        let rep = receiver.representative.as_deref().unwrap_or("");
        self.worksheet.write_with_format(start, 8, rep, &Styles::value())?;
        self.worksheet.set_row_height(start, rows::INFO)?;

        // 2행: 주소
        self.worksheet.write_with_format(start + 1, 1, labels::ADDRESS, &Styles::label())?;
        self.worksheet.merge_range(start + 1, 2, start + 1, 8, &receiver.address, &Styles::value())?;
        self.worksheet.set_row_height(start + 1, rows::INFO)?;

        // 3행: 전화, 합계금액
        // 구조: B=전화, C-D=전화값, E=합계금액, F-I=금액값
        self.worksheet.write_with_format(start + 2, 1, labels::PHONE, &Styles::label())?;
        self.worksheet.merge_range(start + 2, 2, start + 2, 3, &receiver.phone, &Styles::value())?;
        self.worksheet.write_with_format(start + 2, 4, labels::TOTAL_AMOUNT, &Styles::label())?;
        self.worksheet.merge_range(start + 2, 5, start + 2, 8, "", &Styles::value())?;
        self.worksheet.write_with_format(start + 2, 5, total_amount, &Styles::amount())?;
        self.worksheet.set_row_height(start + 2, rows::INFO)?;

        Ok(self)
    }

    /// 테이블 헤더 작성
    pub fn write_table_header(&mut self) -> Result<&mut Self> {
        let row = single_sections::TABLE_HEADER_ROW;

        for (col, header) in headers::SINGLE.iter().enumerate() {
            self.worksheet.write_with_format(row, col as u16, *header, &Styles::table_header())?;
        }
        self.worksheet.set_row_height(row, rows::TABLE_HEADER)?;

        self.current_row = single_sections::TABLE_DATA_START;
        Ok(self)
    }

    /// 데이터 항목 작성
    pub fn write_items(&mut self, items: &[TransactionItemData]) -> Result<&mut Self> {
        for item in items {
            let date_parts: Vec<&str> = item.date.split('-').collect();
            if date_parts.len() >= 3 {
                let month: i32 = date_parts[1].parse().unwrap_or(0);
                let day: i32 = date_parts[2].parse().unwrap_or(0);

                // 평 계산: (가로 × 세로) / 90000, 최소 1
                let pyeong_raw = (item.width as f64 * item.height as f64) / 90000.0;
                let pyeong = if pyeong_raw < 1.0 { 1.0 } else { pyeong_raw };

                self.worksheet.write_with_format(self.current_row, 0, month, &Styles::data_text())?;
                self.worksheet.write_with_format(self.current_row, 1, day, &Styles::data_text())?;
                self.worksheet.write_with_format(self.current_row, 2, &item.product, &Styles::data_text())?;
                self.worksheet.write_with_format(
                    self.current_row,
                    3,
                    format!("{} × {}", item.width, item.height),
                    &Styles::data_text(),
                )?;
                self.worksheet.write_with_format(self.current_row, 4, pyeong, &Styles::data_decimal())?;
                self.worksheet.write_with_format(self.current_row, 5, item.quantity, &Styles::data_number())?;
                self.worksheet.write_with_format(self.current_row, 6, item.unit_price, &Styles::data_number())?;
                self.worksheet.write_with_format(self.current_row, 7, item.supply_price, &Styles::data_number())?;
                self.worksheet.write_with_format(self.current_row, 8, "", &Styles::data_text())?;

                self.total_pyeong += pyeong;
                self.total_quantity += item.quantity;
                self.total_amount += item.supply_price;

                self.worksheet.set_row_height(self.current_row, rows::DATA)?;
                self.current_row += 1;
            }
        }
        Ok(self)
    }

    /// 빈 행 채우기 (최소 행 수 보장)
    pub fn fill_empty_rows(&mut self) -> Result<&mut Self> {
        let min_row = single_sections::TABLE_DATA_START + single_sections::MIN_DATA_ROWS;

        while self.current_row < min_row {
            for col in 0..9 {  // 9열
                self.worksheet.write_with_format(self.current_row, col, "", &Styles::empty())?;
            }
            self.worksheet.set_row_height(self.current_row, rows::DATA)?;
            self.current_row += 1;
        }
        Ok(self)
    }

    /// 합계 행 작성
    pub fn write_total(&mut self) -> Result<&mut Self> {
        self.worksheet.merge_range(
            self.current_row,
            0,
            self.current_row,
            3,
            labels::TOTAL,
            &Styles::total_label(),
        )?;
        self.worksheet.write_with_format(self.current_row, 4, self.total_pyeong, &Styles::total_number())?;
        self.worksheet.write_with_format(self.current_row, 5, self.total_quantity, &Styles::total_number())?;
        self.worksheet.write_with_format(self.current_row, 6, "", &Styles::total_label())?;
        self.worksheet.write_with_format(self.current_row, 7, self.total_amount, &Styles::total_number())?;
        self.worksheet.write_with_format(self.current_row, 8, "", &Styles::total_label())?;
        self.worksheet.set_row_height(self.current_row, rows::TOTAL)?;

        Ok(self)
    }

    /// 인쇄 영역 설정
    pub fn set_print_area(&mut self) -> Result<()> {
        self.worksheet.set_print_area(0, 0, self.current_row, 8)?;  // 9열 (A~I)
        Ok(())
    }
}
