# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ERP Glass (거래명세서 관리 시스템) - A Tauri desktop application for managing business transactions, customers, and products for a glass business. Korean language UI.

## Development Commands

```bash
# Start development (frontend + Tauri backend)
npm run tauri dev

# Build for production
npm run tauri build

# Frontend only (Vite dev server on port 1420)
npm run dev

# Type check and build frontend
npm run build
```

## Architecture

**Tauri + React + Rust** monorepo structure:

- `src/` - React TypeScript frontend
  - `components/` - UI organized by domain (customers, products, transactions, settings)
  - `stores/` - Zustand state management (transactionStore, customerStore, productStore)
  - `types/` - TypeScript interfaces
- `src-tauri/` - Rust backend
  - `commands/` - Tauri IPC command handlers (transactions, customers, products, database)
  - `db/` - SQLite connection and schema
  - `services/` - Business logic (Excel generation, pricing calculations)
  - `templates/` - Excel template bundled with app

**Data Flow:** React components → Zustand stores → Tauri invoke → Rust commands → SQLite

**Database:** SQLite with tables: customers, products, transactions, transaction_items

## Key Patterns

- Frontend-backend communication via `@tauri-apps/api` invoke calls
- Zustand stores wrap all Tauri commands and manage frontend state
- Rust error handling uses `thiserror` with custom `AppError` type
- Excel exports use `rust_xlsxwriter` with a template file
- Product pricing has 4 types: 제작가, 일면, 양면, 직매

## TypeScript Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json and vite.config.ts)
