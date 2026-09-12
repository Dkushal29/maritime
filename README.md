# MARITIME AI

## Intelligent Freight Forecasting and Vessel Charter Optimization

> 🌐 **Live Web Application:** [https://maritime-k4ca.vercel.app/](https://maritime-k4ca.vercel.app/)  
> 📦 **GitHub Repository:** [https://github.com/Dkushal29/maritime](https://github.com/Dkushal29/maritime)  
> 🗄️ **Database:** PostgreSQL (Neon Serverless) with SQLAlchemy 2.0 & Alembic  
> ⚡ **Frontend Hosting:** Vercel (Next.js 16 + React 19 + Turbopack)  

MARITIME AI is a full-stack AI-powered maritime logistics decision-support platform for forecasting freight rates and bulk-cargo demand, optimizing vessel chartering, and visualizing overseas shipping corridors to the East Coast of India.

---

### SIH Problem Statement

**Problem Statement ID: 26006**

> Intelligent Freight Forecasting Model for Optimized Vessel Chartering & Bulk Cargo Procurement (Overseas to East Coast of India).

---

## Live Links & Quick Access

- **Live Application:** [https://maritime-k4ca.vercel.app/](https://maritime-k4ca.vercel.app/)
- **Deployment Guide:** [VERCEL_NEON_DEPLOYMENT.md](VERCEL_NEON_DEPLOYMENT.md)
- **PostgreSQL Setup & Migrations:** [POSTGRESQL_SETUP.md](POSTGRESQL_SETUP.md)
- **Backend Architecture & ML Engine:** [backend/README.md](backend/README.md)

---

## What the Project Does

- **Forecasts future maritime freight rates** using a dual-engine ML ensemble (XGBoost macroeconomic regression + Chronos-Bolt Small foundation model).
- **Forecasts bulk-cargo demand** to anticipate supply shortages and optimal procurement windows.
- **Recommends suitable vessels** for specific cargo fixtures with draft, deadweight tonnage (DWT), and port compatibility constraints.
- **Optimizes chartering decisions** using Google OR-Tools Mixed-Integer Linear Programming (MILP).
- **Visualizes maritime routes & vessel telemetry** on an interactive Leaflet.js map with live AIS coordinates, waypoints, and weather risk overlays.
- **Provides What-If market simulation** for dynamic stress-testing of bunker fuel price shocks, port congestion, vessel supply scarcity, and commodity prices.
- **Displays model explainability & metrics**, including SHAP/feature importance, confidence intervals (P10–P90), MAE, RMSE, and correlation matrices.
- **Issues proactive operational alerts** for corridor weather hazards, demurrage risk, and price spikes.
- **Persists all domain fixtures** across 22 PostgreSQL tables hosted on **Neon DB**.

---

## Main Modules

- **Dashboard (`/dashboard`):** Unified situational overview of freight benchmarks, demand indicators, vessel readiness, and risk alerts.
- **Planning (`/planning`):** End-to-end cargo planning, landed-cost breakdowns, freight rate predictions, and PostgreSQL-persisted fixtures.
- **Freight Forecast (`/forecast`):** Dual-engine freight rate predictions across 30–90 day horizons with P10–P90 uncertainty intervals.
- **Cargo Forecast (`/cargo`):** Bulk-cargo demand projections and seasonal procurement planning.
- **Vessels Catalog (`/vessels`):** Fleet specifications, DWT, age, fuel burn rate, charter rates, and real-time status.
- **Charter Optimization (`/optimization`):** OR-Tools MILP engine recommending optimal charter timing (Now vs. +7d vs. +15d).
- **Simulator (`/simulator`):** Real-time What-If scenario sandbox with interactive sliders for fuel prices, congestion, and demand.
- **Routes & Corridors (`/routes`):** Interactive Leaflet.js nautical map displaying 8 verified corridors, vessel markers, route alerts, and alternative port analysis.
- **Analytics (`/analytics`):** Cross-validation metrics, feature importance rankings, and macroeconomic correlation matrices.
- **Alerts (`/alerts`):** Real-time corridor hazards, congestion warnings, and market volatility notices.
- **Sources (`/sources`):** Integration status of live feeds (AISStream, Open-Meteo, FRED, EIA).

---

## Technology Stack

### Frontend
- **Framework:** Next.js 16.3 (Turbopack, App Router)
- **UI Library:** React 19
- **Language:** TypeScript 5.7
- **Styling:** Tailwind CSS, Framer Motion, Lucide Icons
- **Mapping:** Leaflet.js with custom maritime vessel & corridor overlays
- **Charts:** Recharts
- **Hosting:** Vercel ([https://maritime-k4ca.vercel.app/](https://maritime-k4ca.vercel.app/))

### Backend & Machine Learning
- **Framework:** Python 3.11 / 3.14, FastAPI, Uvicorn, Pydantic v2
- **Database / ORM:** PostgreSQL 18 (Neon Serverless), Psycopg 3, SQLAlchemy 2.0, Alembic
- **Machine Learning:** XGBoost (Gradient Boosted Regressor), Chronos-Bolt Small (Zero-shot Foundation Transformer)
- **Mathematical Optimization:** Google OR-Tools (Mixed-Integer Linear Programming - MILP)
- **Data Science:** Pandas, NumPy, Scikit-learn
- **Telemetry Feeds:** AISStream.io (WebSocket), Open-Meteo Marine API, FRED, EIA

---

## Shipping Corridors Included

- Australia (Hay Point / Newcastle / Dampier) → Visakhapatnam Port
- Australia → Paradip Port
- Australia → Chennai Port / Kamarajar
- Indonesia (Tanjung Priok / Samarinda) → Visakhapatnam Port
- Indonesia → Paradip Port
- Indonesia → Haldia Port
- Middle East (Ras Laffan / Fujairah) → East Coast of India
- South Africa (Richards Bay) → East Coast of India

---

## Running the Project Locally

### 1. Database Configuration
Configure `backend/.env` with your Neon or local PostgreSQL database connection string:

```env
DATABASE_URL=postgresql+psycopg://neondb_owner:YOUR_PASSWORD@ep-snowy-pine-ae8ojpf0-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Run the automated setup and seeding script:
```powershell
.\python.cmd backend\db\setup_neon.py
```

### 2. Start the Backend API
```powershell
cd backend
..\python.cmd -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
- API Base: `http://127.0.0.1:8000`
- Swagger Docs: `http://127.0.0.1:8000/docs`

### 3. Start the Frontend
In a second terminal:
```powershell
npm.cmd run dev
```
- Frontend UI: `http://localhost:3000`

---

## Automated Verification & Test Suite

The project includes an end-to-end automated test suite and strict type checking:

```powershell
# Type checking
npx.cmd tsc --noEmit

# Production Next.js build
npm.cmd run build

# Pytest suite (70 tests covering ML, OR-Tools, APIs, and PostgreSQL persistence)
.\pytest.cmd -q
```

All 70 test suites pass with 100% test coverage across core domain modules.

---

## Repository & Deployment

- **GitHub Repository:** [https://github.com/Dkushal29/maritime](https://github.com/Dkushal29/maritime)
- **Live Production App:** [https://maritime-k4ca.vercel.app/](https://maritime-k4ca.vercel.app/)
- **License:** ISC
