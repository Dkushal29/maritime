"""
Unit tests for Freight Forecasting Model and Feature Engineering.
"""
import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
import pandas as pd
from src.feature_engineering import engineer_freight_features
from src.preprocessing import create_freight_preprocessor
from services.freight_service import predict_freight


def test_engineer_freight_features():
    df = pd.DataFrame([{
        "date": "2026-09-10",
        "origin": "Australia",
        "destination": "Visakhapatnam",
        "cargo_type": "Coal",
        "vessel_type": "Panamax",
    }])
    engineered = engineer_freight_features(df)
    assert "month" in engineered.columns
    assert "quarter" in engineered.columns
    assert engineered["month"].iloc[0] == 9
    assert engineered["quarter"].iloc[0] == 3


def test_predict_freight_service():
    res = predict_freight(
        origin="Australia",
        destination="Visakhapatnam",
        cargo_type="Coal",
        vessel_type="Panamax",
        cargo_volume=230000,
        forecast_days=30
    )
    assert "current_rate" in res
    assert "predicted_30d_rate" in res
    assert "forecast" in res
    assert len(res["forecast"]) > 0
    assert res["current_rate"] > 0
    assert "drivers" in res
    assert len(res["drivers"]) >= 3
