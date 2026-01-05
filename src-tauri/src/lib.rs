pub mod commands;
pub mod db;
pub mod error;
pub mod services;

use std::sync::Mutex;

use db::{get_connection, init_db, DbState};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // 데이터베이스 초기화
            let conn = get_connection(app.handle())?;
            init_db(&conn)?;

            // 상태 관리
            app.manage(DbState(Mutex::new(conn)));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Customers
            commands::get_customers,
            commands::create_customer,
            commands::update_customer,
            commands::delete_customer,
            // Products
            commands::get_products,
            commands::get_product_by_name,
            commands::create_product,
            commands::update_product,
            commands::delete_product,
            commands::import_products_csv,
            commands::export_products_csv,
            // Transactions
            commands::get_transactions,
            commands::get_transaction,
            commands::create_transaction,
            commands::update_transaction,
            commands::delete_transaction,
            commands::get_available_months,
            commands::download_monthly_excel,
            commands::download_transaction_excel,
            // Database
            commands::export_database,
            commands::import_database,
            commands::get_database_path,
            // Settings
            commands::get_supplier_settings,
            commands::update_supplier_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
