#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use sqlx::{MySqlPool, PgPool, SqlitePool};
use std::collections::HashMap;

struct DbConnections {
    mysql: Option<MySqlPool>,
    postgres: Option<PgPool>,
    sqlite: Option<SqlitePool>,
}

impl DbConnections {
    fn new() -> Self {
        Self {
            mysql: None,
            postgres: None,
            sqlite: None,
        }
    }
}

#[tauri::command]
async fn connect_mysql(connections: tauri::State<'_, DbConnections>,
                       host: String, port: u16, user: String,
                       password: String, database: String) -> Result<String, String> {
    let url = format!("mysql://{}:{}@{}:{}/{}", user, password, host, port, database);
    let pool = MySqlPool::connect(&url).await
        .map_err(|e| format!("Failed to connect: {}", e))?;

    let mut conn = connections.0.lock().unwrap();
    conn.mysql = Some(pool);
    Ok("Connected to MySQL".to_string())
}

#[tauri::command]
async fn connect_postgres(connections: tauri::State<'_, DbConnections>,
                          host: String, port: u16, user: String,
                          password: String, database: String) -> Result<String, String> {
    let url = format!("postgres://{}:{}@{}:{}/{}", user, password, host, port, database);
    let pool = PgPool::connect(&url).await
        .map_err(|e| format!("Failed to connect: {}", e))?;

    let mut conn = connections.0.lock().unwrap();
    conn.postgres = Some(pool);
    Ok("Connected to PostgreSQL".to_string())
}

#[tauri::command]
async fn connect_sqlite(connections: tauri::State<'_, DbConnections>,
                        path: String) -> Result<String, String> {
    let pool = SqlitePool::connect(&path).await
        .map_err(|e| format!("Failed to connect: {}", e))?;

    let mut conn = connections.0.lock().unwrap();
    conn.sqlite = Some(pool);
    Ok("Connected to SQLite".to_string())
}

#[tauri::command]
async fn query_mysql(connections: tauri::State<'_, DbConnections>,
                     query: String) -> Result<Vec<HashMap<String, serde_json::Value>>, String> {
    let pool = {
        let conn = connections.0.lock().unwrap();
        conn.mysql.clone()
    }.ok_or("Not connected to MySQL")?;

    let rows = sqlx::query(&query).fetch_all(&pool).await
        .map_err(|e| format!("Query failed: {}", e))?;

    let mut results = Vec::new();
    for row in rows {
        let mut map = HashMap::new();
        for (i, col) in row.columns().iter().enumerate() {
            let val = row.try_get::<serde_json::Value, _>(i)
                .unwrap_or(serde_json::Value::Null);
            map.insert(col.name().to_string(), val);
        }
        results.push(map);
    }
    Ok(results)
}

#[tauri::command]
async fn execute_sql(connections: tauri::State<'_, DbConnections>,
                     query: String) -> Result<String, String> {
    let pool = {
        let conn = connections.0.lock().unwrap();
        match &conn.mysql {
            Some(p) => Ok(p.clone()),
            None => match &conn.postgres {
                Some(p) => Ok(p.clone()),
                None => match &conn.sqlite {
                    Some(p) => Ok(p.clone()),
                    None => Err("No database connected")
                }
            }
        }?
    };

    sqlx::query(&query).execute(&pool).await
        .map(|r| format!("Affected rows: {}", r.rows_affected()))
        .map_err(|e| format!("Execute failed: {}", e))
}

fn main() {
    tauri::Builder::default()
        .manage(DbConnections::new())
        .invoke_handler(tauri::generate_handler![
            connect_mysql, connect_postgres, connect_sqlite,
            query_mysql, execute_sql
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}