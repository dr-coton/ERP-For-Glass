use serde::{Deserialize, Serialize};
use tauri::State;

use crate::db::DbState;
use crate::error::Result;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SupplierSettings {
    pub business_id: String,
    pub company_name: String,
    pub representative: String,
    pub address: String,
    pub phone: String,
    pub fax: String,
}

impl Default for SupplierSettings {
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

#[tauri::command]
pub fn get_supplier_settings(db: State<DbState>) -> Result<SupplierSettings> {
    let conn = db.0.lock().unwrap();

    let mut stmt = conn.prepare(
        "SELECT business_id, company_name, representative, address, phone, fax
         FROM supplier_settings
         WHERE id = 1"
    )?;

    let result = stmt.query_row([], |row| {
        Ok(SupplierSettings {
            business_id: row.get(0)?,
            company_name: row.get(1)?,
            representative: row.get(2)?,
            address: row.get(3)?,
            phone: row.get(4)?,
            fax: row.get::<_, Option<String>>(5)?.unwrap_or_default(),
        })
    });

    match result {
        Ok(settings) => Ok(settings),
        Err(_) => Ok(SupplierSettings::default()),
    }
}

#[tauri::command]
pub fn update_supplier_settings(
    db: State<DbState>,
    settings: SupplierSettings,
) -> Result<()> {
    let conn = db.0.lock().unwrap();

    conn.execute(
        "INSERT INTO supplier_settings (id, business_id, company_name, representative, address, phone, fax)
         VALUES (1, ?1, ?2, ?3, ?4, ?5, ?6)
         ON CONFLICT(id) DO UPDATE SET
            business_id = excluded.business_id,
            company_name = excluded.company_name,
            representative = excluded.representative,
            address = excluded.address,
            phone = excluded.phone,
            fax = excluded.fax",
        (
            &settings.business_id,
            &settings.company_name,
            &settings.representative,
            &settings.address,
            &settings.phone,
            &settings.fax,
        ),
    )?;

    Ok(())
}
