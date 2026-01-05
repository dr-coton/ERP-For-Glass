use rust_xlsxwriter::Worksheet;

use crate::error::Result;
use super::builder::TransactionSheetBuilder;
use super::types::{SingleTransactionRequest, SupplierInfo, ReceiverInfo, TransactionItemData};

/// 단일 거래명세서 생성
///
/// 새로운 빌더 패턴을 사용하여 대한민국 표준 거래명세서 양식으로 생성
pub fn write_single_transaction(
    worksheet: &mut Worksheet,
    request: &SingleTransactionRequest,
) -> Result<()> {
    TransactionSheetBuilder::new(worksheet)
        .setup_columns()?
        .write_title()?
        .write_supplier_info(&request.supplier)?
        .write_receiver_info(&request.receiver, request.total_amount)?
        .write_table_header()?
        .write_items(&request.items)?
        .fill_empty_rows()?
        .write_total()?
        .set_print_area()
}

/// 기존 API 호환용 래퍼 함수
///
/// 기존 transactions.rs에서 호출하는 시그니처를 유지하면서
/// 내부적으로는 새로운 빌더를 사용
pub fn write_single_transaction_legacy(
    worksheet: &mut Worksheet,
    _transaction_id: i64,
    customer_name: &str,
    customer_business_id: Option<&str>,
    customer_representative: Option<&str>,
    customer_address: &str,
    customer_phone: &str,
    total_amount: i64,
    items: &[TransactionItemData],
    supplier: Option<SupplierInfo>,
) -> Result<()> {
    let request = SingleTransactionRequest {
        supplier: supplier.unwrap_or_default(),
        receiver: ReceiverInfo {
            business_id: customer_business_id.map(String::from),
            company_name: customer_name.to_string(),
            representative: customer_representative.map(String::from),
            address: customer_address.to_string(),
            phone: customer_phone.to_string(),
        },
        items: items.to_vec(),
        total_amount,
    };

    write_single_transaction(worksheet, &request)
}
