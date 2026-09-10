"""
Cargo demand prediction service calling trained XGBoost demand model.
"""
import os
from typing import Dict, Any, Optional
from src.demand_model import DemandModel

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "demand_model.pkl")
PREPROCESSOR_PATH = os.path.join(MODEL_DIR, "demand_preprocessor.pkl")

_demand_model_instance: Optional[DemandModel] = None


def get_demand_model() -> DemandModel:
    global _demand_model_instance
    if _demand_model_instance is None:
        if os.path.exists(MODEL_PATH) and os.path.exists(PREPROCESSOR_PATH):
            _demand_model_instance = DemandModel.load(MODEL_PATH, PREPROCESSOR_PATH)
        else:
            _demand_model_instance = DemandModel()
    return _demand_model_instance


def predict_demand(
    port: str = "Visakhapatnam",
    cargo_type: str = "Coal",
    forecast_days: int = 30,
    current_inventory: int = 82000
) -> Dict[str, Any]:
    model = get_demand_model()
    if model.model is None:
        # Grounded default scenario values
        return {
            "port": port,
            "cargo_type": cargo_type,
            "current_inventory": current_inventory,
            "forecast_demand": 230000,
            "procurement_requirement": 148000,
            "inventory_coverage_days": 11,
            "forecast": [
                {"date": "2026-09-10", "predicted": 38000, "lower_bound": 35000, "upper_bound": 41000},
                {"date": "2026-09-15", "predicted": 41000, "lower_bound": 38000, "upper_bound": 44000},
                {"date": "2026-09-20", "predicted": 39500, "lower_bound": 36500, "upper_bound": 42500},
                {"date": "2026-09-25", "predicted": 42000, "lower_bound": 39000, "upper_bound": 45000},
                {"date": "2026-09-30", "predicted": 43500, "lower_bound": 40000, "upper_bound": 47000},
                {"date": "2026-10-05", "predicted": 44000, "lower_bound": 41000, "upper_bound": 47500},
            ],
            "recommendation": {
                "title": "Procure 148,000 MT within 10 days",
                "quantity": 148000,
                "window_days": 10,
                "reasons": [
                    "Current stock at Visakhapatnam (82,000 MT) provides only 11 days of plant coverage.",
                    "Projected 30-day demand reaches 230,000 MT driven by peak regional steel mill capacity.",
                    "Procurement timing avoids the late-month $35.4/MT freight rate escalation."
                ]
            },
            "data_mode": "DEMO"
        }

    res = model.forecast(
        port=port,
        cargo_type=cargo_type,
        forecast_days=forecast_days,
        current_inventory=current_inventory
    )
    res["data_mode"] = "DEMO"
    return res
