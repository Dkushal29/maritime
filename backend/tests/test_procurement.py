"""
Unit and integration tests for Simulated Procurement Order module.
"""
import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
from fastapi.testclient import TestClient
from main import app
from services.procurement_service import (
    calculate_procurement_quantity,
    evaluate_procurement_estimate,
)

client = TestClient(app)


def test_calculate_procurement_quantity_formula():
    """Verifies Procurement Quantity = Forecast Demand + Safety Stock - Current Inventory (non-negative)."""
    # Standard formula: 40 + 30 - 20 = 50
    assert calculate_procurement_quantity(forecast_demand=40.0, safety_stock=30.0, current_inventory=20.0) == 50.0

    # Surplus inventory case: should clamp to 0, no negative procurement
    assert calculate_procurement_quantity(forecast_demand=10.0, safety_stock=10.0, current_inventory=50.0) == 0.0

    # Zero inventory: 100 + 50 - 0 = 150
    assert calculate_procurement_quantity(forecast_demand=100.0, safety_stock=50.0, current_inventory=0.0) == 150.0


def test_small_parcel_50_tons_coal_recommends_truck():
    """Verifies that 50 tons of coal recommends truck / local transport, NOT large ocean bulker."""
    est = evaluate_procurement_estimate(
        commodity="Coal",
        grade="Thermal Coal",
        quantity_tons=50.0,
        forecast_demand=40.0,
        safety_stock=30.0,
        current_inventory=20.0,
    )
    assert est["quantity_tons"] == 50.0
    assert "Truck" in est["recommended_transport_mode"] or "Warehouse" in est["recommended_transport_mode"]
    assert "Panamax" not in est["recommended_transport_mode"]
    assert "Capesize" not in est["recommended_transport_mode"]
    assert est["risk_level"] == "LOW"
    assert est["estimated_delivery_days"] <= 3
    assert est["estimated_total_cost_usd"] > 0
    assert est["is_simulated"] is True


def test_large_parcel_ocean_bulker():
    """Verifies that large bulk volume (>= 60,000 MT) recommends ocean bulk carrier."""
    est = evaluate_procurement_estimate(
        commodity="Coal",
        grade="Coking Coal",
        quantity_tons=75000.0,
    )
    assert "Ocean Bulk Carrier" in est["recommended_transport_mode"]
    assert "Panamax" in est["recommended_transport_mode"]
    assert est["estimated_delivery_days"] >= 14


def test_create_procurement_order_endpoint():
    """Tests POST /api/v1/procurement/orders with a 50-ton coal request."""
    payload = {
        "commodity": "Coal",
        "quantity_tons": 50.0,
        "grade": "Thermal Coal",
        "origin": "Local Regional Depot (Visakhapatnam)",
        "destination": "Visakhapatnam Steel Complex",
        "required_delivery_date": "2026-09-25",
        "budget_usd": 10000.0,
        "current_inventory_tons": 20.0,
        "safety_stock_tons": 30.0,
        "forecast_demand_tons": 40.0,
        "supplier_name": "East Coast Coal Terminal",
        "notes": "Fast-track 50-ton test order"
    }

    res = client.post("/api/v1/procurement/orders", json=payload)
    assert res.status_code == 201
    data = res.json()

    assert "order_id" in data
    assert data["order_id"].startswith("ORD-2026-")
    assert data["commodity"] == "Coal"
    assert data["quantity_tons"] == 50.0
    assert data["order_status"] == "Draft"
    assert "Truck" in data["recommended_transport_mode"] or "Warehouse" in data["recommended_transport_mode"]
    assert data["estimated_total_cost_usd"] > 0
    assert data["is_simulated"] is True
    assert "Simulated Procurement Order" in data["disclaimer"]

    # Test GET by ID
    order_id = data["order_id"]
    get_res = client.get(f"/api/v1/procurement/orders/{order_id}")
    assert get_res.status_code == 200
    assert get_res.json()["order_id"] == order_id


def test_list_procurement_orders_endpoint():
    """Tests GET /api/v1/procurement/orders returns order list."""
    res = client.get("/api/v1/procurement/orders")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    for order in data:
        assert "order_id" in order
        assert "order_status" in order
        assert "commodity" in order
        assert "quantity_tons" in order


def test_estimate_endpoint():
    """Tests POST /api/v1/procurement/estimate for real-time live preview."""
    payload = {
        "commodity": "Coal",
        "quantity_tons": 50.0,
        "grade": "Thermal Coal",
        "origin": "Local Regional Depot",
        "destination": "Visakhapatnam Plant",
        "required_delivery_date": "2026-09-25",
        "current_inventory_tons": 20.0,
        "safety_stock_tons": 30.0,
        "forecast_demand_tons": 40.0,
    }
    res = client.post("/api/v1/procurement/estimate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["calculated_procurement_quantity"] == 50.0
    assert data["estimated_total_cost_usd"] > 0
    assert "recommended_transport_mode" in data
