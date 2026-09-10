"""
Integration tests for FastAPI endpoints using TestClient.
"""
import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "data_mode" in data


def test_predict_freight_endpoint():
    payload = {
        "origin": "Australia",
        "destination": "Visakhapatnam",
        "cargo_type": "Coal",
        "vessel_type": "Panamax",
        "cargo_volume": 230000,
        "forecast_days": 30
    }
    res = client.post("/api/v1/predict/freight", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "current_rate" in data
    assert "forecast" in data
    assert len(data["forecast"]) > 0


def test_predict_demand_endpoint():
    payload = {
        "port": "Visakhapatnam",
        "cargo_type": "Coal",
        "forecast_days": 30
    }
    res = client.post("/api/v1/predict/demand", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["port"] == "Visakhapatnam"
    assert data["current_inventory"] == 82000
    assert data["forecast_demand"] > 0


def test_vessels_endpoint():
    res = client.get("/api/v1/vessels?type=Panamax")
    assert res.status_code == 200
    vessels = res.json()
    assert isinstance(vessels, list)
    assert len(vessels) > 0
    assert vessels[0]["type"] == "Panamax"


def test_optimize_charter_endpoint():
    payload = {
        "origin": "Australia",
        "destination": "Visakhapatnam",
        "cargo_type": "Coal",
        "required_cargo": 230000,
        "delivery_deadline": "2026-10-15",
        "preferred_vessel_type": "Panamax",
        "maximum_budget": 10000000
    }
    res = client.post("/api/v1/optimize/charter", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["feasible"] is True
    assert data["total_capacity"] >= 230000


def test_simulate_endpoint():
    payload = {
        "bunker_price": 720.0,
        "port_congestion": "High",
        "cargo_demand": 230000,
        "vessel_availability": "Low",
        "commodity_price": 130.0
    }
    res = client.post("/api/v1/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["simulated_freight_rate"] > data["current_freight_rate"]
    assert data["cost_change"] > 0


def test_copilot_endpoint():
    payload = {
        "message": "Should I charter now?",
        "context": {"origin": "Australia", "destination": "Visakhapatnam"}
    }
    res = client.post("/api/v1/copilot", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "text" in data
    assert "7 days" in data["text"]
