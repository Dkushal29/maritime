"""
Pydantic schemas for Freight prediction endpoints.
Supports XGBoost, Chronos-Bolt Small, and Ensemble forecasts.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class FreightForecastPoint(BaseModel):
    date: str
    predicted_rate: float
    lower_bound: float
    upper_bound: float


class FreightDriver(BaseModel):
    feature: str
    importance: float
    direction: str
    impact: str
    description: str


class SubModelForecast(BaseModel):
    prediction: Optional[float] = None
    lower: Optional[float] = None
    upper: Optional[float] = None
    status: Optional[str] = "available"


class EnsembleInfo(BaseModel):
    prediction: float
    lower: Optional[float] = None
    upper: Optional[float] = None
    weights: Optional[Dict[str, float]] = None


class UncertaintyRange(BaseModel):
    lower: float
    upper: float
    span: float


class FreightPredictionRequest(BaseModel):
    origin: str = Field(default="Australia", description="Cargo loading origin country")
    destination: str = Field(default="Visakhapatnam", description="Discharge port in India")
    cargo_type: str = Field(default="Coal", description="Bulk cargo commodity")
    vessel_type: str = Field(default="Panamax", description="Vessel class")
    cargo_volume: int = Field(default=230000, gt=0, description="Volume in Metric Tonnes")
    forecast_days: int = Field(default=30, ge=1, le=90, description="Forecast horizon days")


class FreightPredictionResponse(BaseModel):
    # Core backward-compatible fields
    current_rate: float
    predicted_30d_rate: float
    change_percent: float
    forecast: List[FreightForecastPoint]
    confidence: int
    drivers: List[FreightDriver]
    ai_insight: str
    data_mode: str = "DEMO"

    # Multi-model and ensemble extensions
    xgboost: Optional[SubModelForecast] = None
    chronos: Optional[SubModelForecast] = None
    ensemble: Optional[EnsembleInfo] = None
    uncertainty_range: Optional[UncertaintyRange] = None
    forecast_mode: Optional[str] = "ensemble"
    model_components: Optional[List[str]] = Field(default_factory=lambda: ["XGBoost", "Chronos-Bolt Small"])
    horizon_days: Optional[int] = 30
    historical: Optional[List[Dict[str, Any]]] = None
