use serde::{Deserialize, Serialize};
use std::io::{BufRead, BufReader, Write};
use tauri::{AppHandle, Manager};

use crate::db::DbState;
use crate::error::{AppError, Result};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Product {
    pub id: Option<i64>,
    pub name: String,
    pub production_price: i64,
    pub single_side_price: i64,
    pub double_side_price: i64,
    pub direct_price: i64,
}

#[tauri::command]
pub fn get_products(app_handle: AppHandle) -> Result<Vec<Product>> {
    let state = app_handle.state::<DbState>();
    let conn = state.0.lock().unwrap();

    let mut stmt = conn.prepare(
        "SELECT id, name, production_price, single_side_price, double_side_price, direct_price
         FROM products ORDER BY name"
    )?;

    let products = stmt.query_map([], |row: &rusqlite::Row| {
        Ok(Product {
            id: Some(row.get(0)?),
            name: row.get(1)?,
            production_price: row.get(2)?,
            single_side_price: row.get(3)?,
            double_side_price: row.get(4)?,
            direct_price: row.get(5)?,
        })
    })?
    .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(products)
}

#[tauri::command]
pub fn get_product_by_name(app_handle: AppHandle, name: String) -> Result<Product> {
    let state = app_handle.state::<DbState>();
    let conn = state.0.lock().unwrap();

    let product = conn.query_row(
        "SELECT id, name, production_price, single_side_price, double_side_price, direct_price
         FROM products WHERE name = ?1",
        [&name],
        |row| {
            Ok(Product {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                production_price: row.get(2)?,
                single_side_price: row.get(3)?,
                double_side_price: row.get(4)?,
                direct_price: row.get(5)?,
            })
        },
    )?;

    Ok(product)
}

#[tauri::command]
pub fn create_product(app_handle: AppHandle, product: Product) -> Result<i64> {
    let state = app_handle.state::<DbState>();
    let conn = state.0.lock().unwrap();

    conn.execute(
        "INSERT INTO products (name, production_price, single_side_price, double_side_price, direct_price)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        (
            &product.name,
            product.production_price,
            product.single_side_price,
            product.double_side_price,
            product.direct_price,
        ),
    )?;

    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn update_product(app_handle: AppHandle, product: Product) -> Result<()> {
    let state = app_handle.state::<DbState>();
    let conn = state.0.lock().unwrap();

    let rows = conn.execute(
        "UPDATE products
         SET production_price = ?1, single_side_price = ?2, double_side_price = ?3, direct_price = ?4
         WHERE name = ?5",
        (
            product.production_price,
            product.single_side_price,
            product.double_side_price,
            product.direct_price,
            &product.name,
        ),
    )?;

    if rows == 0 {
        return Err(AppError::NotFound("Product not found".to_string()));
    }

    Ok(())
}

#[tauri::command]
pub fn delete_product(app_handle: AppHandle, name: String) -> Result<()> {
    let state = app_handle.state::<DbState>();
    let conn = state.0.lock().unwrap();

    let rows = conn.execute("DELETE FROM products WHERE name = ?1", [&name])?;

    if rows == 0 {
        return Err(AppError::NotFound("Product not found".to_string()));
    }

    Ok(())
}

#[tauri::command]
pub fn import_products_csv(app_handle: AppHandle, path: String) -> Result<i64> {
    let state = app_handle.state::<DbState>();
    let mut conn = state.0.lock().unwrap();

    let file = std::fs::File::open(&path)?;
    let reader = BufReader::new(file);

    let tx = conn.transaction()?;
    let mut count = 0i64;

    for (i, line) in reader.lines().enumerate() {
        let line = line?;

        // 헤더 스킵
        if i == 0 {
            continue;
        }

        let parts: Vec<&str> = line.split(',').collect();
        if parts.len() >= 5 {
            let name = parts[0].trim();
            let production_price: i64 = parts[1].trim().parse().unwrap_or(0);
            let single_side_price: i64 = parts[2].trim().parse().unwrap_or(0);
            let double_side_price: i64 = parts[3].trim().parse().unwrap_or(0);
            let direct_price: i64 = parts[4].trim().parse().unwrap_or(0);

            tx.execute(
                "INSERT OR REPLACE INTO products
                 (name, production_price, single_side_price, double_side_price, direct_price)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                (name, production_price, single_side_price, double_side_price, direct_price),
            )?;
            count += 1;
        }
    }

    tx.commit()?;
    Ok(count)
}

#[tauri::command]
pub fn export_products_csv(app_handle: AppHandle, path: String) -> Result<()> {
    let state = app_handle.state::<DbState>();
    let conn = state.0.lock().unwrap();

    let mut stmt = conn.prepare(
        "SELECT name, production_price, single_side_price, double_side_price, direct_price
         FROM products ORDER BY name"
    )?;

    let mut file = std::fs::File::create(&path)?;

    // 헤더 작성
    writeln!(file, "name,production_price,single_side_price,double_side_price,direct_price")?;

    let rows = stmt.query_map([], |row: &rusqlite::Row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, i64>(1)?,
            row.get::<_, i64>(2)?,
            row.get::<_, i64>(3)?,
            row.get::<_, i64>(4)?,
        ))
    })?;

    for row in rows {
        let (name, pp, ssp, dsp, dp) = row?;
        writeln!(file, "{},{},{},{},{}", name, pp, ssp, dsp, dp)?;
    }

    Ok(())
}
