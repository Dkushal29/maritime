"""
Pydantic schemas for Vessel endpoints, suitability breakdown, and live AIS position telemetry.
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
    mmsi: Optional[str] = None
    type: str
    dwt: int
    built_year: int
    current_position: str
    lat: Optional[float] = None
    lng: Optional[float] = None
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
    # Live AIS Telemetry Extensions
    data_status: Optional[str] = "LIVE"
    data_source: Optional[str] = "AIS Provider"
    speed_knots: Optional[float] = None
    course_degrees: Optional[float] = None
    heading_degrees: Optional[float] = None
    draught_meters: Optional[float] = None
    position_available: Optional[bool] = True
    last_updated: Optional[str] = None


class VesselPositionResponse(BaseModel):
    vessel_id: str
    vessel_name: str
    imo: Optional[str] = None
    mmsi: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    position_available: bool
    speed_knots: Optional[float] = None
    course_degrees: Optional[float] = None
    heading_degrees: Optional[float] = None
    draught_meters: Optional[float] = None
    destination: Optional[str] = None
    eta: Optional[str] = None
    navigation_status: str
    data_source: str
    data_status: str
    last_updated: str


class VesselFleetStatusResponse(BaseModel):
    total_vessels: int
    active_tracked: int
    underway_count: int
    anchored_count: int
    position_available_count: int
    position_unavailable_count: int
    data_source: str
    data_status: str
    last_sync: str
