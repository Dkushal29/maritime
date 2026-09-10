"""
Pydantic schemas for Vessel endpoints and suitability breakdown.
"""
from pydantic import BaseModel
from typing import List, Optional


class VesselSuitabilityBreakdown(BaseModel):
    capacity_fit: int
    route_fit: int
    cost_efficiency: int
    availability: int
    eta_compatibility: int


class VesselItem(BaseModel):
    id: str
    name: str
    imo: str
    type: str
    dwt: int
    built_year: int
    current_position: str
    lat: float
    lng: float
    eta: str
    charter_rate: int
    charter_rate_per_day: int
    fuel_consumption: float
    availability: str
    route: str
    port_compatibility: List[str]
    score: int
    breakdown: VesselSuitabilityBreakdown
    status: str
