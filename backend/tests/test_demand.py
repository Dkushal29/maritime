"""
Unit tests for Cargo Demand Forecasting Model and Service.
"""
import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
from services.demand_service import predict_demand


def test_predict_demand_service():
    res = predict_demand(
        port="Visakhapatnam",
        cargo_type="Coal",
        forecast_days=30,
        current_inventory=82000
    )
    assert res["port"] == "Visakhapatnam"
    assert res["cargo_type"] == "Coal"
    assert res["current_inventory"] == 82000
    assert res["forecast_demand"] > 0
    assert res["inventory_coverage_days"] > 0
    assert len(res["forecast"]) > 0
    assert "recommendation" in res
    assert res["recommendation"]["quantity"] > 0
