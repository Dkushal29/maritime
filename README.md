# MARITIME AI

## Intelligent Freight Forecasting and Vessel Charter Optimization

MARITIME AI is a full-stack AI-powered maritime logistics decision-support platform for forecasting freight rates and bulk-cargo demand, optimizing vessel chartering, and visualizing overseas shipping corridors to the East Coast of India.

### SIH Problem Statement

**Problem Statement ID: 26006**

> Intelligent Freight Forecasting Model for Optimized Vessel Chartering & Bulk Cargo Procurement (Overseas to East Coast of India).

## What the project does

- Forecasts future maritime freight rates.
- Forecasts bulk-cargo demand.
- Recommends suitable vessels for a cargo requirement.
- Optimizes chartering decisions using cost and operational constraints.
- Visualizes maritime routes and vessel locations on an interactive map.
- Provides what-if simulation for changing market and operational conditions.
- Displays model metrics, feature importance, and correlations.
- Shows operational alerts and risk indicators.
- Provides an AI Copilot endpoint for maritime decision support.

## Main modules

- **Dashboard:** Overall freight, demand, vessel, route, and risk overview.
- **Freight Forecast:** Route-level freight-rate prediction.
- **Cargo Forecast:** Future bulk-cargo demand and procurement planning.
- **Vessels:** Vessel details, capacity, availability, and location.
- **Optimization:** Vessel charter recommendations using OR-Tools/MILP.
- **Simulator:** What-if analysis for fuel prices, freight rates, congestion, demand, and availability.
- **Routes:** Interactive Leaflet.js map with ports, corridors, vessel markers, popups, and route selection.
- **Analytics:** Model metrics, feature importance, and correlation analysis.
- **Alerts:** Freight, demand, vessel, port, and delivery-risk notifications.
- **Sources:** Data-source and reference information.

## Technology stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Leaflet.js

### Backend

- Python
- FastAPI
- REST APIs

### Machine learning

- XGBoost for freight and demand forecasting
- Chronos-Bolt Small for complementary historical time-series forecasting
- Feature engineering and ensemble/fallback prediction logic

### Optimization

- Google OR-Tools
- Mixed-Integer Linear Programming (MILP)

## Application routes

```text
/dashboard
/forecast
/cargo
/vessels
/optimization
/simulator
/routes
/analytics
/alerts
/sources
```

## API endpoints

```text
GET  /api/v1/dashboard
POST /api/v1/predict/freight
POST /api/v1/predict/demand
GET  /api/v1/vessels
GET  /api/v1/vessels/{id}
POST /api/v1/optimize/charter
POST /api/v1/simulate
GET  /api/v1/routes
GET  /api/v1/analytics/model-metrics
GET  /api/v1/analytics/feature-importance
GET  /api/v1/analytics/correlation
GET  /api/v1/alerts
POST /api/v1/copilot
```

## Shipping corridors included

- Australia → Visakhapatnam
- Australia → Paradip
- Australia → Chennai
- Indonesia → Visakhapatnam
- Indonesia → Paradip
- Middle East → East Coast India
- South Africa → East Coast India

## Running the project locally

### Start the backend

```powershell
cd C:\Maritime\backend
.\venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Backend URLs:

- API: `http://127.0.0.1:8000`
- Swagger documentation: `http://127.0.0.1:8000/docs`

### Start the frontend

Open a second terminal:

```powershell
cd C:\Maritime
npm.cmd run dev
```

Frontend URL:

```text
http://localhost:3000
```

## Example use case

A user can enter a cargo requirement such as:

```text
Commodity: Coal
Quantity: 50 tons
Origin: Australia
Destination: Visakhapatnam
Delivery deadline: 30 days
```

The platform can generate a procurement and logistics recommendation. For a small requirement such as 50 tons, the system should normally recommend a small-lot, local, truck, warehouse, or consolidated-shipment option rather than a large bulk carrier.

## Current scope

MARITIME AI is currently a forecasting, optimization, simulation, and decision-support platform. It does not yet execute real purchases, process payments, connect directly to verified coal suppliers, or create legally binding purchase orders. Real procurement would require supplier integrations and an order-management workflow.

## Validation completed

- TypeScript validation
- Next.js production build
- Python compilation
- Backend API checks
- Pytest checks
- Chronos model import check
- Main-page HTTP checks

## Repository

GitHub: https://github.com/Dkushal29/maritime

## Project status

The current version includes the full dashboard experience, forecasting modules, vessel optimization, interactive Leaflet route map, simulator, analytics, alerts, and backend API layer.
