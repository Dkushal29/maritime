"""
Pydantic schemas for the Common Data-Source Layer and External Integration Status.
Provides uniform data provenance, status tracking, and metadata envelopes.
"""
from enum import Enum
from typing import List, Optional, Any, Generic, TypeVar, Dict
from pydantic import BaseModel, Field

T = TypeVar("T")


class DataStatusEnum(str, Enum):
    LIVE = "LIVE"
    HISTORICAL = "HISTORICAL"
    FORECAST = "FORECAST"
    CACHED = "CACHED"
    SIMULATED = "SIMULATED"
    UNAVAILABLE = "UNAVAILABLE"


class DataEnvelope(BaseModel, Generic[T]):
    """Standard envelope wrapping any data payload with data provenance."""
    data: T
    data_status: DataStatusEnum = DataStatusEnum.LIVE
    data_source: str = Field(..., description="Name of external provider or engine")
    last_updated: str = Field(..., description="ISO 8601 UTC timestamp")
    is_stale: bool = False
    error: Optional[str] = None


class SourceStatusItem(BaseModel):
    name: str
    category: str
    provider: str
    status: DataStatusEnum
    freq: str
    last_updated: Optional[str] = None
    latency_ms: Optional[float] = None
    error_message: Optional[str] = None
    quota_used: Optional[int] = None
    quota_total: Optional[int] = None
    coverage: List[str] = []
    is_healthy: bool = True


class SourcesStatusResponse(BaseModel):
    sources: List[SourceStatusItem]
    overall_data_mode: str
    mock_fallback_enabled: bool
    timestamp: str


class WeatherCondition(BaseModel):
    latitude: float
    longitude: float
    time: str
    wave_height_meters: Optional[float] = None
    wave_direction_degrees: Optional[float] = None
    wave_period_seconds: Optional[float] = None
    wind_speed_knots: Optional[float] = None
    wind_direction_degrees: Optional[float] = None
    ocean_current_velocity_knots: Optional[float] = None
    ocean_current_direction_degrees: Optional[float] = None
    sea_surface_temp_celsius: Optional[float] = None
    temperature_celsius: Optional[float] = None
    precipitation_mm: Optional[float] = None
    weather_condition: str = "Moderate"
    weather_risk: str = "LOW"  # LOW, MEDIUM, HIGH
    speed_reduction_knots: float = 0.0
    estimated_delay_hours: float = 0.0
    fuel_consumption_penalty_pct: float = 0.0
    data_source: str = "Open-Meteo Marine"
    data_status: DataStatusEnum = DataStatusEnum.LIVE
    disclaimer: str = "Estimated weather impact for simulation only. Not for navigation safety."


class WeatherRouteResponse(BaseModel):
    route_id: Optional[str] = None
    origin: str
    destination: str
    distance_nm: int
    waypoints_weather: List[WeatherCondition]
    overall_route_risk: str
    avg_speed_reduction_knots: float
    total_estimated_delay_hours: float
    bunker_penalty_pct: float
    data_status: DataStatusEnum = DataStatusEnum.LIVE


class PortCongestionResponse(BaseModel):
    port_id: str
    port_name: str
    country: str = "India"
    latitude: float
    longitude: float
    congestion_level: Optional[str] = None  # Low, Medium, High, or None
    congestion_index: Optional[float] = None  # 0.0 - 1.0
    avg_waiting_days: Optional[float] = None
    operational_status: str = "Operating"
    vessels_in_queue: Optional[int] = None
    last_updated: str
    data_source: str
    data_status: DataStatusEnum


class CommodityPriceItem(BaseModel):
    commodity: str
    market: str
    value: Optional[float] = None
    unit: str = "USD/metric_ton"
    currency: str = "USD"
    date: str
    change_pct: Optional[float] = None
    data_source: str
    data_status: DataStatusEnum


class FuelPriceItem(BaseModel):
    fuel_type: str  # VLSFO, MGO, Brent
    location: str   # Singapore, Fujairah, Global
    value: Optional[float] = None
    unit: str = "USD/metric_ton"
    currency: str = "USD"
    date: str
    data_source: str
    data_status: DataStatusEnum


class FreightRateItem(BaseModel):
    route_name: str
    vessel_class: str  # Capesize, Panamax, Supramax
    rate_usd_per_ton: Optional[float] = None
    daily_time_charter_usd: Optional[float] = None
    date: str
    data_source: str
    data_status: DataStatusEnum
