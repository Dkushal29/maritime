# PostgreSQL Integration & Migration Guide

This document outlines the complete setup, configuration, and verification process for connecting the **MARITIME AI** platform to the local PostgreSQL database (`maritime-ai`).

---

## 1. Database Connection Specifications

| Parameter | Value |
| :--- | :--- |
| **Host** | `localhost` (or `127.0.0.1`) |
| **Port** | `5432` |
| **Database** | `maritime-ai` |
| **User** | `postgres` |
| **Driver / Dialect** | `postgresql+psycopg` (Psycopg 3 with C binary extensions) |
| **ORM / Migration** | SQLAlchemy 2.0 & Alembic |

> [!IMPORTANT]
> - SQLite runtime fallback is **strictly disabled**.
> - The application requires a valid PostgreSQL connection string in `backend/.env`. If the connection string is missing or references SQLite, the backend immediately raises a `RuntimeError` at startup.

---

## 2. Environment Configuration

In `backend/.env`, configure the database connection URL:

```env
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/maritime-ai
```

*(Replace `YOUR_PASSWORD` with your PostgreSQL password. Never commit passwords to source control.)*

---

## 3. Package Dependencies

The following packages are installed inside the backend virtual environment:

```powershell
pip install "psycopg[binary]" sqlalchemy alembic
```

These dependencies are documented in `backend/requirements.txt`:
- `sqlalchemy>=2.0.0`
- `alembic>=1.13.0`
- `psycopg[binary]>=3.2.0`

---

## 4. Database Creation (if not already existing)

From PowerShell or PostgreSQL command prompt:

```sql
CREATE DATABASE "maritime-ai" OWNER postgres;
```

---

## 5. Running Alembic Migrations

To apply all database schema migrations to the `maritime-ai` PostgreSQL database:

```powershell
cd C:\Maritime\backend
venv\Scripts\alembic.exe upgrade head
```

Or from the workspace root:

```powershell
.\python.cmd -m alembic -c backend\alembic.ini upgrade head
```

### Generated Schema Tables in `public`

All 22 core domain tables plus Alembic version metadata are created under `public`:
1. `alembic_version`
2. `vessels`
3. `vessel_positions`
4. `ports`
5. `weather_observations`
6. `commodity_prices`
7. `fuel_prices`
8. `freight_rates`
9. `api_sync_logs`
10. `cargo_plans`
11. `freight_observations`
12. `freight_forecasts`
13. `vessel_options`
14. `optimization_runs`
15. `route_corridors`
16. `route_options`
17. `route_alerts`
18. `port_terminals`
19. `berths`
20. `berth_bookings`
21. `fleet_assignments`
22. `charter_bookings`
23. `rescheduling_options`

---

## 6. Seeding Reference Data & SQLite Migration

To populate baseline ports, terminals, berths, route corridors, vessels catalog, and transfer existing records from `maritime_live.db` into PostgreSQL:

```powershell
.\python.cmd backend\db\seed_data.py
```

This script also runs sequence synchronization (`sync_sequences()`) to ensure all PostgreSQL `SERIAL` primary key sequences align with the highest migrated IDs.

---

## 7. Verification Steps

### A. Connection Probe (SQLAlchemy 2.0)

Run the one-line connection verification:

```powershell
python -c "from sqlalchemy import text; from db.database import engine; print(engine.url.render_as_string(hide_password=True)); print(engine.connect().execute(text('SELECT 1')).scalar())"
```

Expected output:
```text
postgresql+psycopg://postgres:***@localhost:5432/maritime-ai
1
```

### B. Health Endpoint Check

Start the FastAPI application and query `/health`:

```powershell
.\python.cmd -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Querying `http://127.0.0.1:8000/health`:
```json
{
  "status": "ok",
  "database": "connected",
  "database_dialect": "postgresql",
  "models_loaded": true,
  "chronos_available": true,
  "optimizer_available": true,
  "data_mode": "LIVE"
}
```

### C. Automated Data Entity Verification

Run the storage and retrieval test suite covering all 10 domain entities:

```powershell
.\python.cmd backend\tests\test_postgres_storage.py
```

Output:
```text
[PASSED] ports                 : OK
[PASSED] berths                : OK
[PASSED] route corridors       : OK
[PASSED] cargo plans           : OK
[PASSED] forecasts             : OK
[PASSED] vessel options        : OK
[PASSED] freight observations  : OK
[PASSED] charter bookings      : OK
[PASSED] fleet allocations     : OK
[PASSED] rescheduling records  : OK
```

### D. Full Test Suite & Linters

```powershell
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd run build
.\pytest.cmd -q
git diff --check
```

---

## 8. pgAdmin Verification

In pgAdmin:
1. Open or connect to the server on `localhost:5432`.
2. Expand:
   ```text
   Servers
     → PostgreSQL 18 (or localhost)
       → Databases
         → maritime-ai
           → Schemas
             → public
               → Tables
   ```
3. Verify that all 23 tables are present and queryable (e.g. `SELECT * FROM cargo_plans LIMIT 10;`).
