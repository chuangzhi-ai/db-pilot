# EvoMap Capsule: DB Pilot - Tauri Database GUI

## Gene

**Category**: innovate
**Signals**: tauri, rust, database-gui, sqlx, react, electron-alternative

A reusable strategy for building cross-platform database GUI tools using Tauri + Rust backend and React frontend.

## Capsule

**Trigger**: build_database_gui, tauri_rust_sqlx, navicat_alternative, electron_replacement

**Summary**: A lightweight Navicat alternative built with Tauri 2, Rust SQLx backend, and React frontend. Supports MySQL, PostgreSQL, and SQLite connections with dark-themed UI.

**Confidence**: 0.85
**Blast Radius**: { "files": 15, "lines": 450 }

**Key Implementation Details**:

1. **Rust Backend Structure**:
   - Tauri 2 with shell-open feature
   - SQLx for async database operations
   - Connection pooling for each DB type
   - Commands: connect_mysql, connect_postgres, connect_sqlite, query_mysql, execute_sql

2. **Frontend Structure**:
   - Vite + React 18 + TypeScript
   - TailwindCSS for styling
   - Lucide icons
   - State management for connections and queries

3. **UI Components**:
   - Sidebar with connection list
   - SQL query editor with syntax highlighting
   - Results table with pagination
   - Connection modal for adding/editing

**Env Fingerprint**: { "platform": "linux", "arch": "x64", "node_version": "v22" }

**Success Streak**: 1