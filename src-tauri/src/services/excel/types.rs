use serde::{Deserialize, Serialize};

/// 공급자 정보 (거래명세서 출력용)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SupplierInfo {
    pub business_id: String,
    pub company_name: String,
    pub representative: String,
    pub address: String,
    pub phone: String,
    pub fax: String,
}

impl Default for SupplierInfo {
    fn default() -> Self {
        Self {
            business_id: String::new(),
            company_name: String::new(),
            representative: String::new(),
            address: String::new(),
            phone: String::new(),
            fax: String::new(),
        }
    }
}

/// 공급받는자 정보 (거래명세서 출력용)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReceiverInfo {
    pub business_id: Option<String>,
    pub company_name: String,
    pub representative: Option<String>,
    pub address: String,
    pub phone: String,
}

/// 거래 항목 데이터
#[derive(Debug, Clone)]
pub struct TransactionItemData {
    pub date: String,
    pub product: String,
    pub width: i64,
    pub height: i64,
    pub quantity: i64,
    pub unit_price: i64,
    pub supply_price: i64,
}

/// 거래 데이터 (월별 리포트용)
#[derive(Debug)]
pub struct TransactionData {
    pub memo: Option<String>,
    pub items: Vec<TransactionItemData>,
}

/// 단일 거래명세서 생성 요청
#[derive(Debug)]
pub struct SingleTransactionRequest {
    pub supplier: SupplierInfo,
    pub receiver: ReceiverInfo,
    pub items: Vec<TransactionItemData>,
    pub total_amount: i64,
}
