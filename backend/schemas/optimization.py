"""
Pydantic schemas for Charter Optimization endpoints.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from .vessel import VesselItem


class AlternativeStrategy(BaseModel):
    id: str
    title: str
    timing: str
    total_cost: int
    expected_rate_per_mt: float
    risk: str
    savings: int
    vessels: List[VesselItem]
    tradeoffs: List[str]


class OptimizationRequest(BaseModel):
    origin: str = Field(default="Australia")
    destination: str = Field(default="Visakhapatnam")
    cargo_type: str = Field(default="Coal")
    required_cargo: int = Field(default=230000, gt=0)
    delivery_deadline: str = Field(default="2026-10-15")
    preferred_vessel_type: str = Field(default="Panamax")
    maximum_budget: float = Field(default=10000000, gt=0)


class OptimizationResponse(BaseModel):
    feasible: bool
    recommended_action: str
    recommended_vessels: List[VesselItem]
    vessel_count: int
    total_capacity: int
    expected_freight: float
    charter_cost: int
    freight_cost: int
    total_cost: int
    savings: int
    risk: str
    confidence: int
    supporting_reasons: List[str]
    alternatives: List[AlternativeStrategy]
    data_mode: str = "DEMO"
