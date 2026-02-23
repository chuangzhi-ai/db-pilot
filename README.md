# DB Pilot - Navicat Alternative

A database GUI tool built with Tauri + Rust + React.

## Features

- Connect to MySQL, PostgreSQL, SQLite
- SQL query editor
- Results table view
- Save connection profiles
- Dark theme UI

## Tech Stack

- **Frontend**: React + TypeScript + TailwindCSS + shadcn/ui
- **Backend**: Rust + Tauri 2 + SQLx
- **Database**: MySQL, PostgreSQL, SQLite

## Build

```bash
# Install dependencies
cd frontend && npm install

# Run dev
npm run dev

# Build
npm run build

# Rust build
cd .. && cargo build --release
```

## License

MIT