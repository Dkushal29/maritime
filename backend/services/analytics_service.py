"""
Analytics service for model performance, feature importances, correlations, and routes.
"""
import os
import json
import pandas as pd
from typing import Dict, Any, List

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
METADATA_PATH = os.path.join(MODELS_DIR, "model_metadata.json")
FREIGHT_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "raw", "freight_data.csv")
ROUTES_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "raw", "routes.csv")


def get_model_metadata() -> Dict[str, Any]:
    from services.chronos_service import is_chronos_available

    chronos_avail = is_chronos_available()

    data: Dict[str, Any] = {}
    if os.path.exists(METADATA_PATH):
        with open(METADATA_PATH, "r") as f:
            data = json.load(f)
            for m_key in ["freight_model", "demand_model"]:
                if m_key in data:
                    data[m_key]["last_trained"] = data[m_key].get("trained_at", "2026-09-10")
                    data[m_key]["training_window"] = data[m_key].get("training_period", "2018 - 2025")

    if "freight_model" not in data:
        data["freight_model"] = {
            "name": "XGBoost Regressor",
            "version": "1.0",
            "mae": 0.888,
            "rmse": 1.136,
            "r2": 0.993,
            "mape": 3.0,
            "last_trained": "2026-09-10",
            "training_window": "2018 - 2025",
            "feature_count": 16,
            "data_mode": "DEMO",
            "status": "Available",
            "actual_vs_predicted": []
        }

    if "demand_model" not in data:
        data["demand_model"] = {
            "name": "XGBoost Regressor",
            "version": "1.0",
            "mae": 3210.0,
            "rmse": 4820.0,
            "r2": 0.912,
            "mape": 2.15,
            "last_trained": "2026-09-10",
            "training_window": "2018 - 2025",
            "feature_count": 11,
            "data_mode": "DEMO",
            "status": "Available",
            "actual_vs_predicted": []
        }

    data["chronos_model"] = {
        "name": "Chronos-Bolt Small",
        "model_id": "autogluon/chronos-bolt-small",
        "type": "Foundation Time-Series Sequence Model",
        "status": "Available" if chronos_avail else "Unavailable",
        "mae": 1.862,
        "rmse": 2.293,
        "mape": 4.59,
        "test_period": "2026-01 - 2026-09",
        "data_mode": "DEMO",
        "quantiles": ["P10", "P50", "P90"]
    }

    data["ensemble_model"] = {
        "name": "Multi-Model Ensemble",
        "status": "Active" if chronos_avail else "Fallback (XGBoost)",
        "components": ["XGBoost Covariate Regressor", "Chronos-Bolt Small Sequence Model"],
        "weights": {"xgboost": 0.6, "chronos": 0.4} if chronos_avail else {"xgboost": 1.0, "chronos": 0.0},
        "mae": 1.142,
        "rmse": 1.485,
        "mape": 3.12,
        "test_period": "2026-01 - 2026-09",
        "data_mode": "DEMO"
    }

    return data


def get_feature_correlations() -> Dict[str, Any]:
    """Computes empirical Pearson correlation matrix from freight data."""
    if os.path.exists(FREIGHT_DATA_PATH):
        df = pd.read_csv(FREIGHT_DATA_PATH)
        cols = [
            "freight_rate",
            "bunker_price",
            "port_congestion",
            "vessel_availability",
            "bdi",
            "commodity_price",
            "cargo_volume",
        ]
        numeric_cols = [c for c in cols if c in df.columns]
        corr_matrix = df[numeric_cols].corr().round(3).to_dict()
        return corr_matrix
    return {}


def get_routes() -> List[Dict[str, Any]]:
    """Loads and formats all routes with coordinates."""
    route_coords = {
        "Australia": [-20.3, 118.6],
        "Indonesia": [-5.5, 105.8],
        "Visakhapatnam": [17.68, 83.21],
        "Paradip": [20.31, 86.61],
        "Chennai": [13.08, 80.27],
        "Kamarajar": [13.26, 80.33],
        "Haldia": [22.02, 88.06]
    }

    if os.path.exists(ROUTES_DATA_PATH):
        df = pd.read_csv(ROUTES_DATA_PATH)
        routes = []
        for _, row in df.iterrows():
            orig = row["origin"]
            dest = row["destination"]
            routes.append({
                "id": str(row["route_id"]),
                "origin": orig,
                "destination": dest,
                "distance_nm": int(row["distance_nm"]),
                "transit_days": float(row["transit_days"]),
                "average_freight": float(row["average_freight"]),
                "port_congestion": str(row["port_congestion"]),
                "risk": str(row["risk"]),
                "landed_cost": float(row["landed_cost"]),
                "origin_coords": route_coords.get(orig, [0.0, 0.0]),
                "dest_coords": route_coords.get(dest, [0.0, 0.0]),
                "is_recommended": True if orig == "Australia" and dest == "Visakhapatnam" else False
            })
        return routes
    return []
