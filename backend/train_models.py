"""
Model Training and Validation Pipeline for MARITIME AI.
Validates datasets, runs chronological train/test validation on XGBoost models,
computes true evaluation metrics (MAE, RMSE, R2, MAPE), saves model artifacts,
and generates models/model_metadata.json.
"""
import os
import json
import pandas as pd
from datetime import datetime

from src.freight_model import FreightModel
from src.demand_model import DemandModel
from data.generate_datasets import generate_freight_data, generate_cargo_demand

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

FREIGHT_DATA_PATH = os.path.join(DATA_RAW_DIR, "freight_data.csv")
DEMAND_DATA_PATH = os.path.join(DATA_RAW_DIR, "cargo_demand.csv")

FREIGHT_MODEL_PATH = os.path.join(MODELS_DIR, "freight_model.pkl")
FREIGHT_PREPROC_PATH = os.path.join(MODELS_DIR, "freight_preprocessor.pkl")

DEMAND_MODEL_PATH = os.path.join(MODELS_DIR, "demand_model.pkl")
DEMAND_PREPROC_PATH = os.path.join(MODELS_DIR, "demand_preprocessor.pkl")

METADATA_PATH = os.path.join(MODELS_DIR, "model_metadata.json")


def run_pipeline():
    print("==================================================")
    print("      MARITIME AI - MODEL TRAINING PIPELINE       ")
    print("==================================================")

    # 1. Dataset Verification / Generation
    if not os.path.exists(FREIGHT_DATA_PATH) or not os.path.exists(DEMAND_DATA_PATH):
        print("Generating raw datasets...")
        generate_freight_data()
        generate_cargo_demand()

    # 2. Train Freight XGBoost Model
    print("\n[1/4] Loading and training Freight Forecast Model (XGBoost)...")
    freight_df = pd.read_csv(FREIGHT_DATA_PATH)
    freight_model = FreightModel()
    freight_metrics = freight_model.train(freight_df)
    freight_model.save(FREIGHT_MODEL_PATH, FREIGHT_PREPROC_PATH)
    print(f" -> Freight Model saved to {FREIGHT_MODEL_PATH}")

    # 3. Train Demand XGBoost Model
    print("\n[2/4] Loading and training Cargo Demand Model (XGBoost)...")
    demand_df = pd.read_csv(DEMAND_DATA_PATH)
    demand_model = DemandModel()
    demand_metrics = demand_model.train(demand_df)
    demand_model.save(DEMAND_MODEL_PATH, DEMAND_PREPROC_PATH)
    print(f" -> Demand Model saved to {DEMAND_MODEL_PATH}")

    # 4. Generate Model Metadata JSON
    print("\n[3/4] Generating models/model_metadata.json...")
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    metadata = {
        "freight_model": {
            "name": "XGBoost Regressor",
            "version": "1.0",
            "data_mode": "DEMO",
            "trained_at": now_str,
            "training_period": "2018-01 - 2025-12",
            "test_period": "2026-01 - 2026-09",
            "feature_count": 16,
            "features": [
                "bdi", "panamax_index", "capesize_index", "bunker_price",
                "crude_oil_price", "port_congestion", "vessel_availability",
                "commodity_price", "usd_inr", "cargo_volume", "month", "quarter",
                "origin", "destination", "cargo_type", "vessel_type"
            ],
            "mae": freight_metrics["mae"],
            "rmse": freight_metrics["rmse"],
            "r2": freight_metrics["r2"],
            "mape": freight_metrics["mape"],
            "residual_std": freight_metrics.get("residual_std", 1.2),
            "actual_vs_predicted": freight_metrics.get("actual_vs_predicted", [])
        },
        "demand_model": {
            "name": "XGBoost Regressor",
            "version": "1.0",
            "data_mode": "DEMO",
            "trained_at": now_str,
            "training_period": "2018-01 - 2025-12",
            "test_period": "2026-01 - 2026-09",
            "feature_count": 11,
            "features": [
                "historical_demand", "inventory", "import_volume", "commodity_price",
                "production_index", "seasonality", "port_traffic", "month", "quarter",
                "port", "cargo_type"
            ],
            "mae": demand_metrics["mae"],
            "rmse": demand_metrics["rmse"],
            "r2": demand_metrics["r2"],
            "mape": demand_metrics["mape"],
            "actual_vs_predicted": demand_metrics.get("actual_vs_predicted", [])
        }
    }

    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f" -> Model metadata saved to {METADATA_PATH}")

    # 5. Output Summary Report
    print("\n==================================================")
    print("           MODEL EVALUATION SUMMARY               ")
    print("==================================================")
    print("Freight Model (Target: freight_rate USD/MT):")
    print(f"  MAE:  {freight_metrics['mae']:.3f} USD/MT")
    print(f"  RMSE: {freight_metrics['rmse']:.3f} USD/MT")
    print(f"  R2:   {freight_metrics['r2']:.3f}")
    print(f"  MAPE: {freight_metrics['mape']:.2f}%")
    print(f"  Residual Std: {freight_metrics['residual_std']:.3f}")
    print("\nCargo Demand Model (Target: monthly demand MT):")
    print(f"  MAE:  {demand_metrics['mae']:.1f} MT")
    print(f"  RMSE: {demand_metrics['rmse']:.1f} MT")
    print(f"  R2:   {demand_metrics['r2']:.3f}")
    print(f"  MAPE: {demand_metrics['mape']:.2f}%")
    print("==================================================")
    print("Models saved successfully.")
    print("==================================================")


if __name__ == "__main__":
    run_pipeline()
