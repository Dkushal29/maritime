"""
Feature engineering functions for Freight and Cargo Demand data.
"""
import pandas as pd
import numpy as np


def engineer_freight_features(df: pd.DataFrame) -> pd.DataFrame:
    """Extracts date features and domain-specific ratios for freight prediction."""
    data = df.copy()
    if "date" in data.columns:
        data["date"] = pd.to_datetime(data["date"])
        data["month"] = data["date"].dt.month
        data["quarter"] = data["date"].dt.quarter
    elif "month" not in data.columns:
        data["month"] = 9  # default current month
        data["quarter"] = 3

    # Additional macro features if missing
    if "bdi" not in data.columns:
        data["bdi"] = 1550
    if "panamax_index" not in data.columns:
        data["panamax_index"] = 1480
    if "capesize_index" not in data.columns:
        data["capesize_index"] = 1750
    if "bunker_price" not in data.columns:
        data["bunker_price"] = 620.0
    if "crude_oil_price" not in data.columns:
        data["crude_oil_price"] = 82.0
    if "port_congestion" not in data.columns:
        data["port_congestion"] = 3.8
    if "vessel_availability" not in data.columns:
        data["vessel_availability"] = 0.65
    if "commodity_price" not in data.columns:
        data["commodity_price"] = 135.0
    if "usd_inr" not in data.columns:
        data["usd_inr"] = 83.5
    if "cargo_volume" not in data.columns:
        data["cargo_volume"] = 230000

    return data


def engineer_demand_features(df: pd.DataFrame) -> pd.DataFrame:
    """Extracts date features and domain indicators for demand prediction."""
    data = df.copy()
    if "date" in data.columns:
        data["date"] = pd.to_datetime(data["date"])
        data["month"] = data["date"].dt.month
        data["quarter"] = data["date"].dt.quarter
    elif "month" not in data.columns:
        data["month"] = 9
        data["quarter"] = 3

    if "historical_demand" not in data.columns:
        data["historical_demand"] = 210000
    if "inventory" not in data.columns:
        data["inventory"] = 82000
    if "import_volume" not in data.columns:
        data["import_volume"] = 195000
    if "commodity_price" not in data.columns:
        data["commodity_price"] = 135.0
    if "production_index" not in data.columns:
        data["production_index"] = 128.0
    if "seasonality" not in data.columns:
        data["seasonality"] = 1.08
    if "port_traffic" not in data.columns:
        data["port_traffic"] = 48

    return data
