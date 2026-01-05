use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

use crate::error::Result;

pub struct DbState(pub Mutex<Connection>);

pub fn get_db_path(app_handle: &AppHandle) -> Result<PathBuf> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .expect("Failed to get app data dir");

    std::fs::create_dir_all(&app_data_dir)?;

    Ok(app_data_dir.join("database.db"))
}

pub fn get_connection(app_handle: &AppHandle) -> Result<Connection> {
    let db_path = get_db_path(app_handle)?;
    let conn = Connection::open(&db_path)?;
    Ok(conn)
}
