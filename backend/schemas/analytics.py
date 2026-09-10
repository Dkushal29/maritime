"""
Pydantic schemas for Model Metrics, Correlation, Alerts, and Copilot endpoints.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class ModelPerformanceMetrics(BaseModel):
    name: str
    version: str
    mae: float
    rmse: float
    r2: float
    mape: float
    last_trained: Optional[str] = None
    trained_at: Optional[str] = None
    training_window: Optional[str] = None
    training_period: Optional[str] = None
    feature_count: int
    data_mode: str = "DEMO"
    actual_vs_predicted: List[Dict[str, Any]] = []


class OverallModelMetricsResponse(BaseModel):
    freight_model: ModelPerformanceMetrics
    demand_model: ModelPerformanceMetrics
    chronos_model: Optional[Dict[str, Any]] = None
    ensemble_model: Optional[Dict[str, Any]] = None


class AlertItemSchema(BaseModel):
    id: str
    title: str
    type: str
    category: str
    description: str
    timestamp: str
    recommended_action: str
    read: bool
    route: Optional[str] = None


class CopilotRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None


class CopilotResponse(BaseModel):
    text: str
    reasoning_points: Optional[List[str]] = None
    suggested_actions: Optional[List[str]] = None
