"""
Unit tests for OR-Tools MILP Charter Optimizer and Vessel Suitability.
"""
import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
from services.vessel_service import get_all_vessels, get_vessel_by_id, calculate_suitability_score
from services.optimization_service import run_charter_optimization


def test_vessel_filtering_and_scoring():
    vessels = get_all_vessels()
    assert len(vessels) >= 15
    for v in vessels:
        assert "score" in v
        assert 0 <= v["score"] <= 100
        assert "breakdown" in v
        assert "capacity_fit" in v["breakdown"]
        assert "route_fit" in v["breakdown"]
        assert "cost_efficiency" in v["breakdown"]


def test_vessel_by_id():
    v = get_vessel_by_id("V001")
    assert v is not None
    assert v["name"] == "MV Ocean Star"
    assert v["type"] == "Panamax"


def test_charter_optimizer_milp():
    res = run_charter_optimization(
        origin="Australia",
        destination="Visakhapatnam",
        cargo_type="Coal",
        required_cargo=230000,
        delivery_deadline="2026-10-15",
        preferred_vessel_type="Panamax",
        maximum_budget=10000000.0
    )
    assert res["feasible"] is True
    assert res["total_capacity"] >= 230000
    assert len(res["recommended_vessels"]) > 0
    assert len(res["alternatives"]) >= 2
    assert res["savings"] > 0
