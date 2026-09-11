# MARITIME AI — Enterprise Backend

> **Tagline:** Predict. Optimize. Charter Smarter.

MARITIME AI is a production-quality decision-support platform designed for bulk-cargo importers (Australia & South-East Asia → East Coast of India). It delivers freight forecasting, vessel chartering optimization, cargo procurement decision support, What-If simulation, and explainable AI insights powered by machine learning and mathematical programming.

---

## 1. Architectural Value Chain

```
DATA (CSV / Database Ready)
       ↓
DATA PROCESSING & FEATURE ENGINEERING
       ↓
┌──────────────────────────────────────┐
│ XGBoost Freight Model (Multi-horizon)│
│ XGBoost Cargo Demand Model           │
│ Vessel Data Engine & Suitability     │
└──────────────────────────────────────┘
       ↓
RISK ENGINE & EXPLAINABILITY (Feature Importance)
       ↓
OR-TOOLS MILP OPTIMIZATION ENGINE (Now / +7d / +15d)
       ↓
FASTAPI REST LAYER (Pydantic schemas, Dependency Injection, CORS, Docs)
       ↓
NEXT.JS 14+ FRONTEND (lib/api.ts connected to NEXT_PUBLIC_API_URL)
```

Core product philosophy: **PREDICT → UNDERSTAND → OPTIMIZE → RECOMMEND**

---

## 2. Technology Stack

- **Backend:** Python 3.11+ / 3.14
- **API Framework:** FastAPI, Uvicorn, Pydantic v2
- **Data & Math:** Pandas, NumPy, Scikit-learn
- **Machine Learning:** XGBoost (XGBRegressor with chronological validation & residual-based confidence intervals)
- **Optimization:** Google OR-Tools (Mixed-Integer Linear Programming - MILP)
- **Testing:** Pytest, HTTPX TestClient
- **Environment:** Python-dotenv

---

## 3. Demo Data Disclaimer

> [!NOTE]
> **DEMO DATA:** The default datasets included in `data/raw/` are synthetic, non-random benchmark datasets reflecting real-world macroeconomic elasticities (bunker fuel sensitivity, port congestion bottlenecks, vessel availability scarcity, and seasonal industrial demand). All responses include `"data_mode": "DEMO"`.
> 
> To connect production live feeds, replace CSVs or connect PostgreSQL/API connectors to Baltic Exchange, Indian Ports Authority, UN Comtrade, and World Bank, and update `DATA_MODE=PRODUCTION` in `.env`.

---

## 4. Primary Business Scenario

The application is anchored around an active enterprise bulk import scenario:
- **Origin:** Australia
- **Destination:** Visakhapatnam Port
- **Cargo:** Coal
- **Required Quantity:** 230,000 MT
- **Preferred Vessel Class:** Panamax
- **Delivery Deadline:** 2026-10-15
- **Forecast Horizon:** 30 days
- **Benchmark Freight Rate:** $31.8/MT rising to $35.4/MT (+11.3%)
- **AI Recommendation:** "Charter within 7 days" securing **$420,000** in cost savings

---

## 5. Dual-Engine Forecasting Architecture (XGBoost + Chronos-Bolt Small)

MARITIME AI uses a dual-engine architecture combining structured macroeconomic regression with foundation time-series sequence modeling:

```
Historical Freight Data
        ↓
 ┌───────────────┐
 │ XGBoost       │ (Structured Covariates: BDI, VLSFO Bunker, Congestion, Availability)
 └───────┬───────┘
         │
         │
 ┌───────▼───────┐
 │ Chronos-Bolt  │ (autogluon/chronos-bolt-small via chronos-forecasting)
 └───────┬───────┘
         │
         ▼
   Forecast Ensemble (60% XGBoost + 40% Chronos-Bolt)
         │
         ▼
   Forecast + Range (Median Forecast with P10 — P90 Uncertainty Interval)
         │
         ▼
   Google OR-Tools MILP Optimization
         │
         ▼
   Optimal Charter Recommendation
```

### Models Overview

1. **XGBoost Covariate Regressor:**
   - **Type:** Gradient boosted tree regressor on macroeconomic and corridor features.
   - **Features (16):** BDI, Panamax Index, Capesize Index, VLSFO Bunker Fuel Price, Crude Oil, Port Congestion Days, Vessel Availability Ratio, Commodity Price Index, USD/INR rate, Cargo Volume, Month, Quarter, Origin, Destination, Cargo Type, Vessel Class.
   - **Uncertainty:** Empirical residual-based bounds: $\pm (1.96 \times \text{std} \times \sqrt{1 + t/30})$.
   - **Validation Metrics (2026 test set):** MAE = $0.888/MT, RMSE = $1.136/MT, R² = 0.993, MAPE = 3.00%.

2. **Chronos-Bolt Small (Foundation Model):**
   - **Model:** `autogluon/chronos-bolt-small`
   - **Library:** `chronos-forecasting`
   - **Type:** Pretrained zero-shot univariate time-series sequence foundation model based on the T5 transformer architecture.
   - **Input Protocol:** Strict route-isolated freight sequence without cross-corridor or cross-commodity leakage. Filtered strictly by `(origin, destination, cargo_type, vessel_type)` with chronological sorting and validation of minimum sequence length ($\ge 6$ points).
   - **Uncertainty & Quantiles:** Generates probabilistic forecasts directly exposing P10 (lower), P50 (median point forecast), and P90 (upper) prediction intervals.
   - **Model Loading:** Loaded once at application startup as a thread-safe singleton (`get_chronos_pipeline()`); cached locally in standard Hugging Face hub cache (`~/.cache/huggingface/hub`). Runs on CPU by default with automatic CUDA detection.
   - **Validation Metrics (2026 test set):** MAE = $1.862/MT, RMSE = $2.293/MT, MAPE = 4.59%.

3. **Multi-Model Ensemble Synthesis:**
   - **Formula:** $\hat{y}_{\text{ensemble}} = w_{\text{xgb}} \cdot \hat{y}_{\text{xgb}} + w_{\text{chronos}} \cdot \hat{y}_{\text{chronos}}$
   - **Default Weights:** 60% XGBoost ($w_{\text{xgb}} = 0.60$), 40% Chronos-Bolt ($w_{\text{chronos}} = 0.40$). Configurable via `ENSEMBLE_XGB_WEIGHT` and `ENSEMBLE_CHRONOS_WEIGHT` environment variables.
   - **Validation Metrics (2026 test set):** MAE = $1.142/MT, RMSE = $1.485/MT, MAPE = 3.12%.
   - **Graceful Fallback:** If Chronos encounters an unrecoverable exception or missing weights, the pipeline catches it, logs a warning, sets `"forecast_mode": "xgboost_fallback"`, and continues serving XGBoost forecasts without crashing the API.

---

## 6. Directory Structure

```
backend/
├── main.py                     # FastAPI application & route declarations
├── train_models.py             # Chronological validation & training script
├── requirements.txt            # Dependency requirements
├── .env.example                # Configuration template
├── README.md                   # This documentation
│
├── data/
│   ├── raw/
│   │   ├── freight_data.csv    # Historical & macro freight series (2018-2026)
│   │   ├── cargo_demand.csv    # Port-level bulk demand & inventory series
│   │   ├── vessels.csv         # 22 bulk carriers (Panamax, Supramax, Capesize)
│   │   ├── routes.csv          # 5 core bilateral routes with distances & costs
│   │   └── port_data.csv       # Draft limits & waiting delays
│   └── generate_datasets.py    # Synthetic dataset generator
│
├── models/
│   ├── freight_model.pkl       # Trained XGBoost freight regressor
│   ├── freight_preprocessor.pkl# Fitted ColumnTransformer (Scalers + Encoders)
│   ├── demand_model.pkl        # Trained XGBoost demand regressor
│   ├── demand_preprocessor.pkl # Fitted ColumnTransformer
│   └── model_metadata.json     # True performance metrics & metadata
│
├── src/
│   ├── preprocessing.py        # ColumnTransformer builders
│   ├── feature_engineering.py  # Temporal & domain indicators
│   ├── freight_model.py        # Multi-horizon forecast & residual intervals
│   ├── demand_model.py         # Port demand & inventory coverage
│   ├── optimizer.py            # Google OR-Tools MILP solver
│   ├── risk_engine.py          # Deterministic risk assessment (0-100)
│   └── explainability.py       # Feature importance & driver direction
│
├── services/
│   ├── freight_service.py      # Freight prediction orchestration
│   ├── demand_service.py       # Demand prediction orchestration
│   ├── vessel_service.py       # Vessel filtering & suitability scoring (0-100)
│   ├── optimization_service.py # Charter optimization across timing scenarios
│   ├── simulation_service.py   # What-If scenario recalculation
│   ├── analytics_service.py    # Metadata, correlation, & route metrics
│   └── alert_service.py        # Threshold-based operational alert engine
│
├── schemas/                    # Pydantic v2 validation models
│   ├── freight.py
│   ├── demand.py
│   ├── vessel.py
│   ├── optimization.py
│   ├── simulation.py
│   ├── route.py
│   └── analytics.py
│
└── tests/                      # Automated test suite
    ├── test_freight.py
    ├── test_demand.py
    ├── test_optimizer.py
    └── test_api.py
```

---

## 6. Installation & Setup

### Prerequisites
- Python 3.11+ installed

### Step-by-Step
```powershell
# Navigate to backend
cd C:\Maritime\backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
venv\Scripts\Activate.ps1
# Windows Command Prompt:
venv\Scripts\activate.bat

# Install dependencies
pip install -r requirements.txt
```

---

## 7. Model Training & Evaluation

Execute the chronological training pipeline:
```powershell
python train_models.py
```

The script:
1. Validates and loads `freight_data.csv` and `cargo_demand.csv`.
2. Applies `engineer_freight_features` and `engineer_demand_features`.
3. Splits chronologically (2018–2025 for training, 2026 for testing).
4. Fits `XGBRegressor` pipelines with `ColumnTransformer`.
5. Evaluates and prints true metrics: **MAE, RMSE, R², MAPE**.
6. Serializes model artifacts (`.pkl`) and writes `models/model_metadata.json`.

---

## 8. Starting the FastAPI Server

```powershell
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

- **Root:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## 9. Running Automated Tests

```powershell
pytest
```
All unit and integration tests verify:
- Feature extraction and preprocessing pipelines.
- Multi-horizon freight forecasts and residual-based confidence intervals.
- Cargo demand predictions and inventory coverage calculations.
- OR-Tools MILP optimization and vessel suitability scoring.
- FastAPI endpoint responses and error status codes.

---

## 10. Frontend Integration

The Next.js 14 frontend in `C:\Maritime` communicates directly with this API through `lib/api.ts`:
- Environment variable: `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`
- To run the frontend concurrently:
  ```powershell
  cd C:\Maritime
  npm run dev
  ```
  Access the web app at [http://localhost:3000](http://localhost:3000).
