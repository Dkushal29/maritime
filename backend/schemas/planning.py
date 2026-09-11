"""
Pydantic schemas for SIH Problem Statement 26006 workflow:
Cargo Planning, Freight Forecasting, Vessel Suitability Evaluation,
Total Landed Cost Calculation, and Chartering/Procurement Recommendations.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator
from datetime import datetime, date


SUPPORTED_CARGO_TYPES = ["Coal", "Iron ore", "Limestone", "Grain", "Fertilizer"]
SUPPORTED_VESSEL_CLASSES = ["Handysize", "Supramax", "Panamax", "Capesize", "Any"]


class CargoPlanningRequest(BaseModel):
    cargo_type: str = Field(..., description="Coal, Iron ore, Limestone, Grain, Fertilizer")
    cargo_quantity: float = Field(..., gt=0, description="Cargo quantity in tonnes (must be > 0)")
    origin: str = Field(..., min_length=2, description="Origin country or loading port")
    destination_port: str = Field(..., min_length=2, description="Destination port (e.g. Visakhapatnam, Paradip, Chennai, Haldia, Kamarajar)")
    required_arrival_date: str = Field(..., description="Required arrival date (YYYY-MM-DD)")
    maximum_budget: float = Field(..., gt=0, description="Maximum budget in USD (must be > 0)")
    preferred_vessel_class: Optional[str] = Field("Any", description="Handysize, Supramax, Panamax, Capesize, or Any")
    supplier_price_per_tonne: Optional[float] = Field(None, ge=0, description="Optional supplier price per tonne in USD")

    @field_validator("cargo_type")
    @classmethod
    def validate_cargo_type(cls, v: str) -> str:
        clean = v.strip().title()
        if clean.lower() == "iron ore":
            clean = "Iron Ore"
        if not any(clean.lower() == c.lower() for c in SUPPORTED_CARGO_TYPES):
            raise ValueError(f"Cargo type '{v}' unsupported. Supported: {', '.join(SUPPORTED_CARGO_TYPES)}")
        return clean

    @field_validator("origin", "destination_port")
    @classmethod
    def validate_non_empty_ports(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Port/Origin location cannot be empty or whitespace.")
        return v.strip()

    @field_validator("required_arrival_date")
    @classmethod
    def validate_arrival_date(cls, v: str) -> str:
        try:
            target_dt = datetime.strptime(v.strip(), "%Y-%m-%d").date()
        except ValueError:
            raise ValueError("required_arrival_date must be formatted as YYYY-MM-DD")
        
        today = date.today()
        if target_dt < today:
            raise ValueError(f"required_arrival_date {v} cannot be in the past (today is {today.isoformat()})")
        return v.strip()

    @field_validator("preferred_vessel_class")
    @classmethod
    def validate_vessel_class(cls, v: Optional[str]) -> str:
        if not v:
            return "Any"
        clean = v.strip().title()
        if clean not in SUPPORTED_VESSEL_CLASSES:
            raise ValueError(f"Preferred vessel class '{v}' unsupported. Supported: {', '.join(SUPPORTED_VESSEL_CLASSES)}")
        return clean


class FreightForecastRequest(BaseModel):
    origin: str = Field(..., min_length=2)
    destination: str = Field(..., min_length=2)
    cargo_type: str = Field("Coal")
    vessel_class: Optional[str] = Field("Panamax")
    forecast_days: int = Field(30, ge=1, le=180)


class ModelEvaluationMetrics(BaseModel):
    mae: float
    rmse: float
    mape: float
    r2: Optional[float] = None
    baseline_mae: Optional[float] = None
    baseline_rmse: Optional[float] = None
    baseline_mape: Optional[float] = None
    baseline_model: Optional[str] = "30-Day Moving Average"


class FreightForecastResponse(BaseModel):
    status: str = "success"
    data_status: str = Field(..., description="live | historical | illustrative | unavailable")
    route: Dict[str, str] = Field(..., description="{'origin': '...', 'destination': '...'}")
    cargo_type: str
    vessel_class: str
    predicted_rate_per_tonne: float
    current_rate_per_tonne: float
    forecast_direction: str = Field(..., description="increasing | stable | decreasing")
    confidence: str = Field(..., description="low | medium | high")
    metrics: ModelEvaluationMetrics
    limitations: List[str] = []
    forecast_trajectory: Optional[List[Dict[str, Any]]] = None


class VesselSuitabilityItem(BaseModel):
    vessel_id: str
    vessel_name: str
    vessel_class: str
    capacity_dwt: float
    draft_meters: float
    length_meters: Optional[float] = None
    beam_meters: Optional[float] = None
    current_position: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    eta: Optional[str] = None
    is_suitable: bool
    suitability_status: str = Field(..., description="Recommended | Suitable | Unsuitable | Conditional")
    suitability_score: int
    reasons: List[str]
    unsuitability_reasons: List[str]
    estimated_voyage_days: float
    estimated_freight_cost: float
    daily_charter_rate: float
    weather_risk: Optional[str] = "LOW"
    data_status: str = "LIVE"


class VesselEvaluationResponse(BaseModel):
    suitable_count: int
    unsuitable_count: int
    vessels: List[VesselSuitabilityItem]


class LandedCostBreakdown(BaseModel):
    cargo_purchase_cost: float
    ocean_freight: float
    port_charges: float
    loading_cost: float
    unloading_cost: float
    fuel_related_cost: float
    expected_demurrage: float
    other_logistics_costs: float


class LandedCostRequest(BaseModel):
    cargo_type: str = Field(...)
    cargo_quantity: float = Field(..., gt=0)
    origin: str = Field(...)
    destination_port: str = Field(...)
    supplier_price_per_tonne: Optional[float] = Field(None, ge=0)
    freight_rate_per_tonne: Optional[float] = Field(None, gt=0)
    vessel_class: Optional[str] = Field("Panamax")
    port_waiting_days: Optional[float] = Field(None, ge=0)


class LandedCostResponse(BaseModel):
    cost_per_tonne: float
    total_cost: float
    breakdown: LandedCostBreakdown
    assumptions: List[str]
    data_status: str = Field("historical", description="live | historical | illustrative | mixed")
    missing_data_warnings: List[str] = []


class CharterPlanItem(BaseModel):
    plan_id: str
    title: str
    vessel_class: str
    vessel_count: int
    vessels: List[Dict[str, Any]]
    decision: str = Field(..., description="charter_now | charter_delayed | alternative_class | split_shipment")
    timing: str
    estimated_total_cost: float
    estimated_cost_per_tonne: float
    potential_savings: float
    risk: str = Field("LOW", description="LOW | MEDIUM | HIGH")
    reasons: List[str]
    warnings: List[str] = []
    feasibility: bool = True


class CargoPlanningResponse(BaseModel):
    plan_id: str
    status: str = "success"
    cargo_requirement: CargoPlanningRequest
    freight_forecast: FreightForecastResponse
    vessel_evaluations: List[VesselSuitabilityItem]
    landed_cost: LandedCostResponse
    recommended_plan: CharterPlanItem
    alternatives: List[CharterPlanItem]
    reasons: List[str]
    warnings: List[str]
    data_status: str = Field(..., description="live | historical | illustrative | mixed")
    limitations: List[str]
    created_at: str
