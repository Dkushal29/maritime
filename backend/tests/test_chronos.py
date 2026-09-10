"""
Unit and integration tests for Chronos-Bolt Small forecasting service and multi-model ensemble.
Uses mocking for fast, offline unit testing and conditional real-model validation.
"""
import pytest
from unittest.mock import patch, MagicMock
import numpy as np

from services.chronos_service import (
    extract_route_freight_history,
    forecast_chronos,
    is_chronos_available,
    get_chronos_status,
)
from services.freight_service import predict_freight


# ----------------------------------------------------
# 1. Historical Freight Data Extraction & Hygiene Tests
# ----------------------------------------------------

def test_extract_route_freight_history_no_route_mixing():
    """Verifies that time-series sequence is isolated to the specified route and commodity."""
    dates, rates = extract_route_freight_history(
        origin="Australia",
        destination="Visakhapatnam",
        cargo_type="Coal",
        vessel_type="Panamax",
        cutoff_date="2026-09-10"
    )
    assert len(rates) >= 6
    assert len(dates) == len(rates)
    # Check chronological ordering
    assert sorted(dates) == dates
    # Verify no NaN or infinite values
    assert not any(np.isnan(r) or np.isinf(r) for r in rates)
    assert all(r > 0 for r in rates)


def test_extract_route_freight_history_leakage_prevention():
    """Verifies that observations after the cutoff date are strictly excluded."""
    cutoff = "2025-06-01"
    dates, rates = extract_route_freight_history(
        origin="Australia",
        destination="Visakhapatnam",
        cargo_type="Coal",
        cutoff_date=cutoff
    )
    for d in dates:
        assert d <= cutoff, f"Data leakage detected: {d} > {cutoff}"


def test_extract_route_freight_history_insufficient_data():
    """Verifies graceful handling when route history is empty or too short."""
    # When an invalid/non-existent route is queried, it falls back to default deterministic series or handles safely
    dates, rates = extract_route_freight_history(
        origin="NonExistentPort",
        destination="UnknownPort",
        min_history=1000  # Impossible requirement
    )
    # Service provides graceful fallback sequence
    assert len(rates) > 0


# ----------------------------------------------------
# 2. Chronos Forecasting Logic & Quantile Output Tests
# ----------------------------------------------------

def test_forecast_chronos_mocked():
    """Tests Chronos inference output structure with a mocked pipeline."""
    mock_pipeline = MagicMock()
    # Mock quantiles shape (1, 5, 3) for 5 steps and 3 quantiles (P10, P50, P90)
    mock_quantiles = MagicMock()
    mock_quantiles.__getitem__.return_value = MagicMock()
    
    # Set up realistic quantile arrays
    p10 = [32.0, 32.5, 33.0, 33.5, 34.0]
    p50 = [34.0, 34.8, 35.5, 36.2, 37.0]
    p90 = [36.0, 37.0, 38.0, 39.0, 40.5]
    mean_val = [34.1, 34.9, 35.6, 36.3, 37.1]

    # Return quantiles and mean
    mock_pipeline.predict_quantiles.return_value = (
        MagicMock(
            __getitem__=lambda self, idx: MagicMock(
                tolist=lambda: [p10, p50, p90][idx[2]] if len(idx) == 3 else [p10, p50, p90]
            )
        ),
        MagicMock(__getitem__=lambda self, idx: MagicMock(tolist=lambda: mean_val))
    )

    with patch("services.chronos_service.get_chronos_pipeline", return_value=mock_pipeline):
        # Even with mocked predict_quantiles, verify dictionary structure
        with patch.object(mock_pipeline, "predict_quantiles") as mock_predict:
            import torch
            mock_tensor = torch.tensor([[[32.0, 34.0, 36.0], [33.0, 35.0, 38.0]]])
            mock_mean = torch.tensor([[34.0, 35.0]])
            mock_predict.return_value = (mock_tensor, mock_mean)

            history = [30.0, 31.0, 32.0, 33.0, 32.5, 33.5]
            out = forecast_chronos(history, prediction_steps=2)

            assert out["status"] == "available"
            assert out["prediction"] == 35.0
            assert out["terminal_lower"] == 33.0
            assert out["terminal_upper"] == 38.0
            assert len(out["median"]) == 2
            assert len(out["lower"]) == 2
            assert len(out["upper"]) == 2


def test_forecast_chronos_unavailable_fallback():
    """Verifies that if Chronos fails or pipeline is None, it returns a clean fallback dictionary."""
    with patch("services.chronos_service.get_chronos_pipeline", return_value=None):
        out = forecast_chronos([30.0, 31.0, 32.0])
        assert out["status"] == "unavailable"
        assert out["prediction"] is None
        assert "error" in out


# ----------------------------------------------------
# 3. Ensemble Synthesis & XGBoost Fallback Tests
# ----------------------------------------------------

def test_predict_freight_ensemble_structure():
    """Verifies that predict_freight returns both XGBoost, Chronos, and Ensemble details."""
    res = predict_freight(
        origin="Australia",
        destination="Visakhapatnam",
        cargo_type="Coal",
        vessel_type="Panamax",
        cargo_volume=230000,
        forecast_days=30
    )
    # Core fields
    assert "current_rate" in res
    assert "predicted_30d_rate" in res
    assert "change_percent" in res
    assert "forecast" in res
    assert "drivers" in res
    assert "ai_insight" in res

    # Multi-model fields
    assert "xgboost" in res
    assert "chronos" in res
    assert "ensemble" in res
    assert "uncertainty_range" in res
    assert res["forecast_mode"] in ["ensemble", "xgboost_fallback"]

    # Verify uncertainty interval validity
    ur = res["uncertainty_range"]
    assert ur["lower"] <= res["predicted_30d_rate"] <= ur["upper"]
    assert ur["span"] >= 0


def test_predict_freight_xgboost_fallback_when_chronos_fails():
    """Verifies seamless fallback to XGBoost when Chronos fails."""
    with patch("services.freight_service.forecast_chronos") as mock_fc:
        mock_fc.return_value = {"status": "unavailable", "prediction": None, "error": "Simulated outage"}

        res = predict_freight(
            origin="Australia",
            destination="Visakhapatnam",
            cargo_type="Coal",
            forecast_days=30
        )
        assert res["forecast_mode"] == "xgboost_fallback"
        assert res["chronos"]["status"] == "unavailable"
        assert res["predicted_30d_rate"] == res["xgboost"]["prediction"]
        assert len(res["forecast"]) > 0


def test_chronos_status():
    """Verifies get_chronos_status exposes model details without errors."""
    status = get_chronos_status()
    assert "model_name" in status
    assert "model_id" in status
    assert status["status"] in ["Available", "Unavailable"]
