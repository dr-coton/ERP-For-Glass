use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

use crate::db::DbState;
use crate::error::{AppError, Result};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Customer {
    pub business_id: String,
    pub company_name: String,
    pub representative: String,
    pub address: String,
    pub phone: String,
}

#[tauri::command]
pub fn get_customers(app_handle: AppHandle) -> Result<Vec<Customer>> {
    let state = app_handle.state::<DbState>();
    let conn = state.0.lock().unwrap();

    let mut stmt = conn.prepare(
        "SELECT business_id, company_name, representative, address, phone
         FROM customers ORDER BY company_name"
    )?;

    let customers = stmt.query_map([], |row: &rusqlite::Row| {
        Ok(Customer {
            business_id: row.get(0)?,
            company_name: row.get(1)?,
            representative: row.get(2)?,
            address: row.get(3)?,
            phone: row.get(4)?,
        })
    })?
    .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(customers)
}

#[tauri::command]
pub fn create_customer(app_handle: AppHandle, customer: Customer) -> Result<()> {
    let state = app_handle.state::<DbState>();
    let conn = state.0.lock().unwrap();

    conn.execute(
        "INSERT INTO customers (business_id, company_name, representative, address, phone)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        (
            &customer.business_id,
            &customer.company_name,
            &customer.representative,
            &customer.address,
            &customer.phone,
        ),
    )?;

    Ok(())
}

#[tauri::command]
pub fn update_customer(app_handle: AppHandle, customer: Customer) -> Result<()> {
    let state = app_handle.state::<DbState>();
    let conn = state.0.lock().unwrap();

    let rows = conn.execute(
        "UPDATE customers
         SET company_name = ?1, representative = ?2, address = ?3, phone = ?4
         WHERE business_id = ?5",
        (
            &customer.company_name,
            &customer.representative,
            &customer.address,
            &customer.phone,
            &customer.business_id,
        ),
    )?;

    if rows == 0 {
        return Err(AppError::NotFound("Customer not found".to_string()));
    }

    Ok(())
}

#[tauri::command]
pub fn delete_customer(app_handle: AppHandle, business_id: String) -> Result<()> {
    let state = app_handle.state::<DbState>();
    let conn = state.0.lock().unwrap();

    let rows = conn.execute(
        "DELETE FROM customers WHERE business_id = ?1",
        [&business_id],
    )?;

    if rows == 0 {
        return Err(AppError::NotFound("Customer not found".to_string()));
    }

    Ok(())
}
