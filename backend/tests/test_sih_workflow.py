"""
SIH Problem Statement 26006 Test Suite.
Tests:
1. Cargo input validation (reject negative quantities, past dates, empty ports, negative prices).
2. Freight forecast response structure, metrics, baseline comparisons.
3. Missing historical data / illustrative data labeling.
4. Port constraint rejection (draft, DWT limits).
5. Landed-cost calculation (all 8 components, arithmetic correctness, assumptions).
6. Recommendation selection (immediate vs delayed, vessel classes).
7. Planning history retrieval.
"""
import os
import sys
import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app
from services.suitability_service import evaluate_vessel_suitability
from services.landed_cost_service import calculate_total_landed_cost
from services.forecasting_service import forecast_freight_rate

client = TestClient(app)


def test_cargo_input_validation_negative_quantity():
    future_date = (date.today() + timedelta(days=30)).isoformat()
    payload = {
        "cargo_type": "Coal",
        "cargo_quantity": -5000,  # Negative quantity should fail
        "origin": "Australia",
        "destination_port": "Visakhapatnam",
        "required_arrival_date": future_date,
        "maximum_budget": 5000000,
    }
    res = client.post("/api/v1/planning/cargo", json=payload)
    assert res.status_code == 422


def test_cargo_input_validation_past_date():
    past_date = (date.today() - timedelta(days=5)).isoformat()
    payload = {
        "cargo_type": "Coal",
        "cargo_quantity": 60000,
        "origin": "Australia",
        "destination_port": "Visakhapatnam",
        "required_arrival_date": past_date,  # Past date should fail
        "maximum_budget": 5000000,
    }
    res = client.post("/api/v1/planning/cargo", json=payload)
    assert res.status_code == 422


def test_cargo_input_validation_empty_port():
    future_date = (date.today() + timedelta(days=30)).isoformat()
    payload = {
        "cargo_type": "Coal",
        "cargo_quantity": 60000,
        "origin": "   ",  # Whitespace / empty origin should fail
        "destination_port": "Visakhapatnam",
        "required_arrival_date": future_date,
        "maximum_budget": 5000000,
    }
    res = client.post("/api/v1/planning/cargo", json=payload)
    assert res.status_code == 422


def test_cargo_input_validation_negative_price():
    future_date = (date.today() + timedelta(days=30)).isoformat()
    payload = {
        "cargo_type": "Coal",
        "cargo_quantity": 60000,
        "origin": "Australia",
        "destination_port": "Visakhapatnam",
        "required_arrival_date": future_date,
        "maximum_budget": 5000000,
        "supplier_price_per_tonne": -10.0  # Negative price should fail
    }
    res = client.post("/api/v1/planning/cargo", json=payload)
    assert res.status_code == 422


def test_freight_forecast_benchmarked_route():
    payload = {
        "origin": "Australia",
        "destination": "Visakhapatnam",
        "cargo_type": "Coal",
        "vessel_class": "Panamax",
        "forecast_days": 30
    }
    res = client.post("/api/v1/forecast/freight", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["data_status"] == "historical"
    assert data["predicted_rate_per_tonne"] > 0
    assert data["forecast_direction"] in ["increasing", "stable", "decreasing"]
    assert data["confidence"] in ["low", "medium", "high"]
    assert "metrics" in data
    assert "mae" in data["metrics"]
    assert "rmse" in data["metrics"]
    assert "mape" in data["metrics"]
    assert "baseline_mae" in data["metrics"]
    assert "baseline_rmse" in data["metrics"]
    assert "baseline_mape" in data["metrics"]
    # XGBoost should demonstrate lower error than simple baseline
    assert data["metrics"]["mae"] < data["metrics"]["baseline_mae"]


def test_freight_forecast_illustrative_labeling():
    # Limestone from UAE to Visakhapatnam is unbenchmarked in Baltic dry index
    payload = {
        "origin": "United Arab Emirates",
        "destination": "Visakhapatnam",
        "cargo_type": "Limestone",
        "vessel_class": "Supramax",
        "forecast_days": 30
    }
    res = client.post("/api/v1/forecast/freight", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["data_status"] == "illustrative"
    assert data["confidence"] == "low"
    assert len(data["limitations"]) > 0
    assert any("illustrative" in l.lower() or "proxy" in l.lower() for l in data["limitations"])


def test_port_constraint_rejection_haldia():
    """Haldia max draft is 12.5m and max DWT is 45,000. Capesize and Panamax must be rejected."""
    future_date = (date.today() + timedelta(days=35)).isoformat()
    evaluations = evaluate_vessel_suitability(
        cargo_quantity_tonnes=75000,
        origin="Australia",
        destination_port="Haldia",
        required_arrival_date=future_date
    )
    assert len(evaluations) > 0
    for v in evaluations:
        if v.vessel_class in ("Capesize", "Panamax"):
            assert not v.is_suitable
            assert v.suitability_status == "Unsuitable"
            assert len(v.unsuitability_reasons) > 0
            # Must mention draft or DWT limits
            reason_text = " ".join(v.unsuitability_reasons).lower()
            assert "draft" in reason_text or "deadweight" in reason_text or "capacity" in reason_text


def test_vessel_suitability_explanations():
    """Every vessel must have a descriptive explanation for recommendation or rejection."""
    future_date = (date.today() + timedelta(days=35)).isoformat()
    evaluations = evaluate_vessel_suitability(
        cargo_quantity_tonnes=60000,
        origin="Indonesia",
        destination_port="Visakhapatnam",
        required_arrival_date=future_date
    )
    for v in evaluations:
        if v.is_suitable:
            assert len(v.reasons) > 0
            assert any("compliant" in r.lower() or "matches" in r.lower() or "utilization" in r.lower() for r in v.reasons)
        else:
            assert len(v.unsuitability_reasons) > 0


def test_total_landed_cost_calculation():
    """Verifies all 8 components are present, transparent, and correctly summed."""
    payload = {
        "cargo_type": "Coal",
        "cargo_quantity": 75000,
        "origin": "Australia",
        "destination_port": "Visakhapatnam",
        "supplier_price_per_tonne": 110.0,
        "freight_rate_per_tonne": 32.5,
        "vessel_class": "Panamax"
    }
    res = client.post("/api/v1/optimization/landed-cost", json=payload)
    assert res.status_code == 200
    data = res.json()
    b = data["breakdown"]

    # Verify all 8 components exist
    assert "cargo_purchase_cost" in b
    assert "ocean_freight" in b
    assert "port_charges" in b
    assert "loading_cost" in b
    assert "unloading_cost" in b
    assert "fuel_related_cost" in b
    assert "expected_demurrage" in b
    assert "other_logistics_costs" in b

    # Verify sum
    expected_sum = round(
        b["cargo_purchase_cost"]
        + b["ocean_freight"]
        + b["port_charges"]
        + b["loading_cost"]
        + b["unloading_cost"]
        + b["fuel_related_cost"]
        + b["expected_demurrage"]
        + b["other_logistics_costs"],
        2
    )
    assert abs(data["total_cost"] - expected_sum) < 0.05
    assert round(data["total_cost"] / 75000, 2) == round(data["cost_per_tonne"], 2)
    assert len(data["assumptions"]) >= 5


def test_full_cargo_planning_workflow():
    """Full end-to-end SIH 26006 workflow integration test."""
    future_date = (date.today() + timedelta(days=28)).isoformat()
    payload = {
        "cargo_type": "Coal",
        "cargo_quantity": 75000,
        "origin": "Australia",
        "destination_port": "Visakhapatnam",
        "required_arrival_date": future_date,
        "maximum_budget": 15000000,
        "preferred_vessel_class": "Panamax",
        "supplier_price_per_tonne": 112.50
    }
    res = client.post("/api/v1/planning/cargo", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "plan_id" in data
    assert data["cargo_requirement"]["cargo_quantity"] == 75000
    assert "freight_forecast" in data
    assert "vessel_evaluations" in data
    assert len(data["vessel_evaluations"]) > 0
    assert "landed_cost" in data
    assert "recommended_plan" in data
    assert data["recommended_plan"]["decision"] in ["charter_now", "charter_delayed", "split_shipment"]
    assert len(data["reasons"]) > 0
    assert len(data["alternatives"]) >= 2


def test_planning_history_endpoint():
    res = client.get("/api/v1/planning/history")
    assert res.status_code == 200
    data = res.json()
    assert "plans" in data
    assert isinstance(data["plans"], list)
