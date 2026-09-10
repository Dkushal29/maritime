"""
Pydantic schemas for Cargo demand prediction endpoints.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any


class DemandForecastPoint(BaseModel):
    date: str
    predicted: int
    lower_bound: int
    upper_bound: int


class ProcurementRecommendation(BaseModel):
    title: str
    quantity: int
    window_days: int
    reasons: List[str]


class DemandPredictionRequest(BaseModel):
    port: str = Field(default="Visakhapatnam", description="Destination port")
    cargo_type: str = Field(default="Coal", description="Commodity type")
    forecast_days: int = Field(default=30, ge=1, le=90, description="Forecast horizon days")


class DemandPredictionResponse(BaseModel):
    port: str
    cargo_type: str
    current_inventory: int
    forecast_demand: int
    procurement_requirement: int
    inventory_coverage_days: int
    forecast: List[DemandForecastPoint]
    recommendation: ProcurementRecommendation
    data_mode: str = "DEMO"
