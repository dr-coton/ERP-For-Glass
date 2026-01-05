use std::fs;
use tauri::{AppHandle, Manager};

use crate::db::DbState;
use crate::error::Result;

#[tauri::command]
pub fn export_database(app_handle: AppHandle, path: String) -> Result<()> {
    let db_path = crate::db::connection::get_db_path(&app_handle)?;
    fs::copy(&db_path, &path)?;
    Ok(())
}

#[tauri::command]
pub fn import_database(app_handle: AppHandle, path: String) -> Result<()> {
    let db_path = crate::db::connection::get_db_path(&app_handle)?;

    // 현재 연결 해제를 위해 새 연결 생성
    {
        let state = app_handle.state::<DbState>();
        let _conn = state.0.lock().unwrap();
        // lock 해제됨
    }

    // 파일 복사
    fs::copy(&path, &db_path)?;

    // 새 연결로 상태 업데이트 (앱 재시작 필요)
    Ok(())
}

#[tauri::command]
pub fn get_database_path(app_handle: AppHandle) -> Result<String> {
    let db_path = crate::db::connection::get_db_path(&app_handle)?;
    Ok(db_path.to_string_lossy().to_string())
}
