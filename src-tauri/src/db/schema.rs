use rusqlite::Connection;
use crate::error::Result;

pub fn init_db(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS customers (
            business_id TEXT PRIMARY KEY,
            company_name TEXT NOT NULL,
            representative TEXT NOT NULL,
            address TEXT NOT NULL,
            phone TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            production_price INTEGER NOT NULL,
            single_side_price INTEGER NOT NULL,
            double_side_price INTEGER NOT NULL,
            direct_price INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            total_amount INTEGER NOT NULL,
            memo TEXT,
            created_at DATETIME NOT NULL
        );

        CREATE TABLE IF NOT EXISTS transaction_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            product TEXT NOT NULL,
            price_type TEXT NOT NULL,
            width INTEGER NOT NULL,
            height INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price INTEGER NOT NULL,
            supply_price INTEGER NOT NULL,
            FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id
        ON transaction_items(transaction_id);

        CREATE INDEX IF NOT EXISTS idx_transactions_customer_name
        ON transactions(customer_name);

        CREATE INDEX IF NOT EXISTS idx_transactions_created_at
        ON transactions(created_at);

        -- 공급자(판매자) 설정 테이블
        CREATE TABLE IF NOT EXISTS supplier_settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            business_id TEXT NOT NULL DEFAULT '',
            company_name TEXT NOT NULL DEFAULT '',
            representative TEXT NOT NULL DEFAULT '',
            address TEXT NOT NULL DEFAULT '',
            phone TEXT NOT NULL DEFAULT '',
            fax TEXT DEFAULT ''
        );

        -- 기본 공급자 설정 삽입 (없을 경우에만)
        INSERT OR IGNORE INTO supplier_settings (id, business_id, company_name, representative, address, phone, fax)
        VALUES (1, '', '', '', '', '', '');
        "
    )?;

    Ok(())
}
