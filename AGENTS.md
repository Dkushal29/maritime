# Maritime AI - Project Context

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Architecture
Bulk-cargo importer decision-support platform (Australia/SE Asia -> East Coast India).
- Frontend: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion, Leaflet, Recharts, Zustand.
- Backend: FastAPI, Python 3.11+, Pydantic v2, XGBoost, OR-Tools (MILP), Scikit-learn, Pandas, NumPy.
- Pipeline: Predict (XGBoost) -> Understand (Feature importance / Risk) -> Optimize (OR-Tools MILP) -> Recommend.

## Important Directories
- `app/`: Next.js 16 App Router pages (forecast, optimization, simulator, vessels, cargo, analytics, etc.)
- `components/`: UI and feature components (maps, charts, tables, forms)
- `lib/`: Shared utilities, API client (`lib/api.ts`)
- `types/`: TypeScript type definitions
- `backend/`: FastAPI application
  - `backend/main.py`: FastAPI entrypoint, endpoints, dependency injection
  - `backend/models/`: Saved models (.joblib) and inference modules
  - `backend/schemas/`: Pydantic request/response models
  - `backend/services/`: Core logic (optimization, prediction, simulation)
  - `backend/tests/`: Pytest suite
  - `backend/train_models.py`: Model training script

## Package Managers & Runtime
- Frontend: Node.js, `npm`
- Backend: Python 3.11+, `pip` / `requirements.txt`

## Database & Data
- In-memory CSV datasets / DataFrames, database-ready via `DATABASE_URL`

## Authentication
- None configured currently (internal analytics platform)

## API Structure
Base: `http://localhost:8000` (or `NEXT_PUBLIC_API_URL`)
- `/api/health`: Health status
- `/api/forecast`: Freight and cargo demand predictions (multi-horizon)
- `/api/optimize`: Chartering optimization engine (MILP)
- `/api/simulation`: What-If scenario simulations
- `/api/vessels`: Vessel fleet and suitability data
- `/api/explainability`: Feature importance and risk factors

## Environment Variables
Frontend:
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: `http://localhost:8000`)

Backend:
- `API_HOST`: Host to bind (default: `0.0.0.0`)
- `API_PORT`: Port to bind (default: `8000`)
- `FRONTEND_URL`: Allowed CORS origin (default: `http://localhost:3000`)
- `DATA_MODE`: Ingestion mode (default: `REALTIME_INFERENCE`)
- `DATABASE_URL`: Optional database connection string

## Commands
Frontend:
- Dev: `npm run dev`
- Build: `npm run build`
- Start: `npm run start`

Backend:
- Install: `pip install -r backend/requirements.txt`
- Run: `uvicorn backend.main:app --reload --port 8000`
- Train: `python backend/train_models.py`
- Test: `pytest backend/tests`

## Constraints & Rules
- Branch Safety: Dedicated branch `dev/agent-work`. Never push directly to `master`.
- Token-efficient workflow: targeted search -> inspect relevant section -> minimal change -> progressive verify.
