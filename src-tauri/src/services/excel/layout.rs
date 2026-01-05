/// 열 너비 상수 (A4 용지에 최적화)
/// A4 가로 기준 총 너비 약 85
pub mod columns {
    pub const SECTION_TITLE: f64 = 10.0;  // A열: 섹션 타이틀 (공급자/공급받는자)
    pub const LABEL: f64 = 8.0;           // B열: 레이블 (등록번호 등)
    pub const PRODUCT: f64 = 12.0;        // C열: 품목
    pub const SPEC: f64 = 11.0;           // D열: 규격
    pub const PYEONG: f64 = 8.0;          // E열: 평 (정보 섹션에서 상호/합계금액 레이블로 사용)
    pub const QUANTITY: f64 = 8.0;        // F열: 수량
    pub const UNIT_PRICE: f64 = 10.0;     // G열: 단가
    pub const AMOUNT: f64 = 11.0;         // H열: 공급가액
    pub const REMARK: f64 = 8.0;          // I열: 비고

    /// 모든 열 너비 배열 (9열)
    pub const ALL: [f64; 9] = [SECTION_TITLE, LABEL, PRODUCT, SPEC, PYEONG, QUANTITY, UNIT_PRICE, AMOUNT, REMARK];

    /// 월별 리포트용 열 너비 (9열)
    pub mod monthly {
        pub const MONTH: f64 = 5.0;
        pub const DAY: f64 = 5.0;
        pub const PRODUCT: f64 = 18.0;
        pub const SPEC: f64 = 11.0;
        pub const PYEONG: f64 = 6.0;
        pub const QUANTITY: f64 = 6.0;
        pub const UNIT_PRICE: f64 = 10.0;
        pub const AMOUNT: f64 = 13.0;    // 금액 (큰 숫자 표시용)
        pub const BALANCE: f64 = 13.0;   // 미수금 (큰 숫자 표시용)
    }
}

/// 행 높이 상수
pub mod rows {
    pub const TITLE: f64 = 30.0;
    pub const SECTION_TITLE: f64 = 22.0;
    pub const INFO: f64 = 20.0;
    pub const SPACER: f64 = 8.0;
    pub const TABLE_HEADER: f64 = 22.0;
    pub const DATA: f64 = 18.0;
    pub const TOTAL: f64 = 22.0;
    pub const MONTHLY_FINAL: f64 = 30.0;
}

/// 단일 거래명세서 섹션 위치
pub mod single_sections {
    /// 제목 행
    pub const TITLE_ROW: u32 = 0;

    /// 공급자 섹션 시작 행
    pub const SUPPLIER_START: u32 = 2;
    /// 공급자 섹션 행 수
    pub const SUPPLIER_ROWS: u32 = 3;

    /// 공급받는자 섹션 시작 행
    pub const RECEIVER_START: u32 = 6;
    /// 공급받는자 섹션 행 수
    pub const RECEIVER_ROWS: u32 = 3;

    /// 테이블 헤더 행
    pub const TABLE_HEADER_ROW: u32 = 10;

    /// 테이블 데이터 시작 행
    pub const TABLE_DATA_START: u32 = 11;

    /// 최소 데이터 행 수 (빈 행으로 채움)
    pub const MIN_DATA_ROWS: u32 = 10;
}

/// 테이블 헤더 텍스트
pub mod headers {
    pub const MONTH: &str = "월";
    pub const DAY: &str = "일";
    pub const PRODUCT: &str = "품  목";
    pub const SPEC: &str = "규  격";
    pub const PYEONG: &str = "평";
    pub const QUANTITY: &str = "수량";
    pub const UNIT_PRICE: &str = "단  가";
    pub const AMOUNT: &str = "공급가액";
    pub const REMARK: &str = "비고";
    pub const BALANCE: &str = "미수금";

    /// 단일 거래명세서 헤더 배열 (9열)
    pub const SINGLE: [&str; 9] = [MONTH, DAY, PRODUCT, SPEC, PYEONG, QUANTITY, UNIT_PRICE, AMOUNT, REMARK];

    /// 월별 리포트 헤더 배열 (9열)
    pub const MONTHLY: [&str; 9] = [MONTH, DAY, PRODUCT, SPEC, PYEONG, QUANTITY, UNIT_PRICE, "금액", BALANCE];
}

/// 레이블 텍스트
pub mod labels {
    pub const TITLE: &str = "거  래  명  세  서";
    pub const SUPPLIER: &str = "공  급  자";
    pub const RECEIVER: &str = "공 급 받 는 자";
    pub const BUSINESS_ID: &str = "등록번호";
    pub const COMPANY_NAME: &str = "상  호";
    pub const REPRESENTATIVE: &str = "성  명";
    pub const ADDRESS: &str = "주  소";
    pub const PHONE: &str = "전  화";
    pub const FAX: &str = "FAX";
    pub const TOTAL_AMOUNT: &str = "합계금액";
    pub const TOTAL: &str = "합        계";
    pub const DEAR: &str = "귀하";
}
