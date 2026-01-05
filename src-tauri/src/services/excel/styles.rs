use rust_xlsxwriter::{Color, Format, FormatAlign, FormatBorder};

/// 색상 상수
pub mod colors {
    use rust_xlsxwriter::Color;

    pub const HEADER_BG: Color = Color::RGB(0xD9D9D9);
    pub const LABEL_BG: Color = Color::RGB(0xE2EFDA);
    pub const TOTAL_BG: Color = Color::RGB(0xFFF2CC);
    pub const SECTION_BG: Color = Color::RGB(0xF2F2F2);
    pub const MEMO_BG: Color = Color::RGB(0xE6E6E6);
    pub const MONTHLY_HEADER_BG: Color = Color::RGB(0x366092);
    pub const MONTHLY_TOTAL_BG: Color = Color::RGB(0xD9E1F2);
    pub const MONTHLY_FINAL_BG: Color = Color::RGB(0xFFE699);
}

/// 폰트 크기 상수
pub mod fonts {
    pub const TITLE: f64 = 18.0;
    pub const SECTION_TITLE: f64 = 11.0;
    pub const HEADER: f64 = 10.0;
    pub const DATA: f64 = 10.0;
    pub const TOTAL: f64 = 11.0;
    pub const AMOUNT: f64 = 12.0;
}

/// 스타일 팩토리 - 재사용 가능한 스타일 생성
pub struct Styles;

impl Styles {
    /// 제목 스타일
    pub fn title() -> Format {
        Format::new()
            .set_bold()
            .set_font_size(fonts::TITLE)
            .set_align(FormatAlign::Center)
            .set_align(FormatAlign::VerticalCenter)
    }

    /// 섹션 제목 스타일 (공급자, 공급받는자)
    pub fn section_title() -> Format {
        Format::new()
            .set_bold()
            .set_font_size(fonts::SECTION_TITLE)
            .set_align(FormatAlign::Center)
            .set_align(FormatAlign::VerticalCenter)
            .set_border(FormatBorder::Thin)
            .set_background_color(colors::SECTION_BG)
            .set_text_wrap()  // 텍스트 줄바꿈
    }

    /// 레이블 스타일 (등록번호, 상호 등)
    pub fn label() -> Format {
        Format::new()
            .set_bold()
            .set_font_size(fonts::DATA)
            .set_align(FormatAlign::Center)
            .set_align(FormatAlign::VerticalCenter)
            .set_border(FormatBorder::Thin)
            .set_background_color(colors::LABEL_BG)
            .set_text_wrap()  // 텍스트 줄바꿈
    }

    /// 값 스타일 (텍스트)
    pub fn value() -> Format {
        Format::new()
            .set_font_size(fonts::DATA)
            .set_align(FormatAlign::Left)
            .set_align(FormatAlign::VerticalCenter)
            .set_border(FormatBorder::Thin)
    }

    /// 값 스타일 (중앙 정렬)
    pub fn value_center() -> Format {
        Format::new()
            .set_font_size(fonts::DATA)
            .set_align(FormatAlign::Center)
            .set_align(FormatAlign::VerticalCenter)
            .set_border(FormatBorder::Thin)
    }

    /// 금액 표시 스타일
    pub fn amount() -> Format {
        Format::new()
            .set_bold()
            .set_font_size(fonts::AMOUNT)
            .set_align(FormatAlign::Right)
            .set_align(FormatAlign::VerticalCenter)
            .set_border(FormatBorder::Thin)
            .set_num_format("#,##0원")
    }

    /// 테이블 헤더 스타일
    pub fn table_header() -> Format {
        Format::new()
            .set_bold()
            .set_font_size(fonts::HEADER)
            .set_align(FormatAlign::Center)
            .set_align(FormatAlign::VerticalCenter)
            .set_border(FormatBorder::Thin)
            .set_background_color(colors::HEADER_BG)
    }

    /// 데이터 셀 스타일 (텍스트)
    pub fn data_text() -> Format {
        Format::new()
            .set_font_size(fonts::DATA)
            .set_align(FormatAlign::Center)
            .set_align(FormatAlign::VerticalCenter)
            .set_border(FormatBorder::Thin)
    }

    /// 데이터 셀 스타일 (숫자)
    pub fn data_number() -> Format {
        Format::new()
            .set_font_size(fonts::DATA)
            .set_align(FormatAlign::Right)
            .set_align(FormatAlign::VerticalCenter)
            .set_border(FormatBorder::Thin)
            .set_num_format("#,##0")
    }

    /// 데이터 셀 스타일 (소수점 2자리 - 평)
    pub fn data_decimal() -> Format {
        Format::new()
            .set_font_size(fonts::DATA)
            .set_align(FormatAlign::Right)
            .set_align(FormatAlign::VerticalCenter)
            .set_border(FormatBorder::Thin)
            .set_num_format("0.00")
    }

    /// 빈 셀 스타일
    pub fn empty() -> Format {
        Format::new()
            .set_border(FormatBorder::Thin)
            .set_align(FormatAlign::Center)
    }

    /// 합계 레이블 스타일
    pub fn total_label() -> Format {
        Format::new()
            .set_bold()
            .set_font_size(fonts::TOTAL)
            .set_align(FormatAlign::Center)
            .set_align(FormatAlign::VerticalCenter)
            .set_border(FormatBorder::Thin)
            .set_background_color(colors::TOTAL_BG)
    }

    /// 합계 숫자 스타일
    pub fn total_number() -> Format {
        Format::new()
            .set_bold()
            .set_font_size(fonts::TOTAL)
            .set_align(FormatAlign::Right)
            .set_align(FormatAlign::VerticalCenter)
            .set_border(FormatBorder::Thin)
            .set_background_color(colors::TOTAL_BG)
            .set_num_format("#,##0")
    }

    // === 월별 리포트용 스타일 ===

    /// 월별 리포트 헤더
    pub fn monthly_header() -> Format {
        Format::new()
            .set_bold()
            .set_align(FormatAlign::Center)
            .set_align(FormatAlign::VerticalCenter)
            .set_border(FormatBorder::Medium)
            .set_background_color(colors::MONTHLY_HEADER_BG)
            .set_font_color(Color::White)
    }

    /// 월별 리포트 메모
    pub fn monthly_memo() -> Format {
        Format::new()
            .set_bold()
            .set_align(FormatAlign::Center)
            .set_align(FormatAlign::VerticalCenter)
            .set_border(FormatBorder::Thin)
            .set_background_color(colors::MEMO_BG)
    }

    /// 월별 리포트 데이터
    pub fn monthly_data() -> Format {
        Format::new()
            .set_align(FormatAlign::Center)
            .set_align(FormatAlign::VerticalCenter)
            .set_border(FormatBorder::Thin)
    }

    /// 월별 리포트 숫자
    pub fn monthly_number() -> Format {
        Format::new()
            .set_align(FormatAlign::Center)
            .set_align(FormatAlign::VerticalCenter)
            .set_border(FormatBorder::Thin)
            .set_num_format("#,##0")
    }

    /// 월별 리포트 소수점 (평)
    pub fn monthly_decimal() -> Format {
        Format::new()
            .set_align(FormatAlign::Center)
            .set_align(FormatAlign::VerticalCenter)
            .set_border(FormatBorder::Thin)
            .set_num_format("0.00")
    }

    /// 월별 리포트 소계
    pub fn monthly_subtotal() -> Format {
        Format::new()
            .set_bold()
            .set_align(FormatAlign::Center)
            .set_align(FormatAlign::VerticalCenter)
            .set_border_top(FormatBorder::Double)
            .set_border_bottom(FormatBorder::Double)
            .set_border_left(FormatBorder::Thin)
            .set_border_right(FormatBorder::Thin)
            .set_background_color(colors::MONTHLY_TOTAL_BG)
            .set_num_format("#,##0")
    }

    /// 월별 리포트 최종 합계 레이블
    pub fn monthly_final_label() -> Format {
        Format::new()
            .set_bold()
            .set_font_size(14.0)
            .set_align(FormatAlign::Right)
            .set_align(FormatAlign::VerticalCenter)
            .set_border_top(FormatBorder::Double)
            .set_border_bottom(FormatBorder::Double)
            .set_border_left(FormatBorder::Thin)
            .set_border_right(FormatBorder::Thin)
            .set_background_color(colors::MONTHLY_FINAL_BG)
    }

    /// 월별 리포트 최종 합계 숫자
    pub fn monthly_final_number() -> Format {
        Format::new()
            .set_bold()
            .set_font_size(14.0)
            .set_align(FormatAlign::Center)
            .set_align(FormatAlign::VerticalCenter)
            .set_border_top(FormatBorder::Double)
            .set_border_bottom(FormatBorder::Double)
            .set_border_left(FormatBorder::Thin)
            .set_border_right(FormatBorder::Thin)
            .set_background_color(colors::MONTHLY_FINAL_BG)
            .set_num_format("#,##0")
    }
}
