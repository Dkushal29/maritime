"""
Pydantic schemas for the Dynamic Maritime Route Planning, Risk-Aware Routing,
Berth Availability, Fleet Allotment, and Booking System.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime


class Waypoint(BaseModel):
    name: Optional[str] = None
    lat: float
    lng: float
    description: Optional[str] = None


class RouteCorridorItem(BaseModel):
    corridor_id: str
    origin_port: str
    origin_country: str
    origin_coords: List[float]
    destination_port: str
    destination_country: str = "India"
    dest_coords: List[float]
    cargo_type: str
    typical_vessel_classes: List[str]
    approximate_corridor: str
    waypoints: List[List[float]]
    estimated_distance_nm: int
    typical_sailing_days: float
    seasonal_risk_areas: List[str] = Field(default_factory=list)
    port_restrictions: Dict[str, Any] = Field(default_factory=dict)
    data_source: str = "Admiralty / GEBCo Maritime Corridor Charts"
    data_confidence: float = 0.95
    is_verified_nautical: bool = False
    data_status: str = "estimated"
    label: str = "Estimated planning corridor — not for navigation"


class RouteCompareRequest(BaseModel):
    origin: str = Field(..., description="Overseas loading port or country, e.g. Port Hedland, Banjarmasin, Richards Bay")
    destination: str = Field(..., description="Indian East Coast discharge port, e.g. Visakhapatnam, Paradip, Chennai, Kamarajar, Haldia, Dhamra")
    cargo_type: str = Field("Coal", description="Dry bulk commodity type")
    cargo_quantity: float = Field(75000, gt=0, description="Cargo quantity in metric tonnes")
    laycan_start: Optional[str] = Field(None, description="Earliest departure date YYYY-MM-DD")
    required_arrival_date: Optional[str] = Field(None, description="Required arrival date YYYY-MM-DD")
    vessel_class: Optional[str] = Field("Panamax", description="Preferred vessel class: Handysize, Supramax, Panamax, Capesize")


class CostDrivers(BaseModel):
    fuel_pct: float
    port_charges_pct: float
    vessel_operating_pct: float
    canal_transit_pct: float
    demurrage_risk_pct: float


class RouteOptionItem(BaseModel):
    option_key: str = Field(..., description="'shortest' or 'lowest_cost'")
    option_name: str = Field(..., description="Shortest / Fastest Route or Lowest-Cost Route")
    route_id: str
    origin: str
    destination: str
    waypoints: List[List[float]]
    distance_nm: int
    speed_knots: float
    sailing_days: float
    estimated_departure: str
    estimated_arrival: str
    total_cost_usd: float
    cost_per_ton_usd: float
    fuel_cost_usd: float
    port_charges_usd: float
    transit_charges_usd: float
    demurrage_risk_usd: float
    operating_cost_usd: float
    cost_savings_usd: float = 0.0
    cost_drivers: CostDrivers
    risk_score: float = Field(..., ge=0, le=100)
    risk_level: str = Field(..., description="LOW, MEDIUM, HIGH, CRITICAL")
    weather_impact: str
    tradeoff_explanation: str
    data_source: str = "Maritime Hydrographic Routing Graph"
    data_confidence: float = 0.92
    data_status: str = "estimated"
    navigation_disclaimer: str = "Estimated planning corridor — not for navigation"


class RouteCompareResponse(BaseModel):
    origin: str
    destination: str
    cargo_type: str
    cargo_quantity: float
    vessel_class: str
    shortest_route: RouteOptionItem
    lowest_cost_route: RouteOptionItem
    recommended_option: str
    recommendation_rationale: str
    tradeoff_summary: str
    disclaimer: str = "Estimated planning corridor — not for navigation"
    data_status: str = "estimated"
    generated_at: str


class RouteAlertItem(BaseModel):
    alert_id: str
    severity: str = Field(..., description="INFO, CAUTION, WARNING, CRITICAL")
    area: str
    coordinates: Optional[List[float]] = None
    radius_nm: Optional[float] = 90.0
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    affected_route: str
    description: str
    source: str
    last_checked: str
    recommended_action: Optional[str] = None
    confidence: float
    data_status: str = "estimated"


class RouteRiskAssessmentRequest(BaseModel):
    origin: str
    destination: str
    travel_date: Optional[str] = None


class RouteRiskAssessmentResponse(BaseModel):
    route: str
    overall_risk_score: float
    overall_risk_level: str
    active_alerts: List[RouteAlertItem]
    cyclone_risk: str
    monsoon_impact: str
    chokepoint_status: str
    port_weather_risk: str
    data_status: str = "estimated"
    last_updated: str


class BerthItem(BaseModel):
    berth_id: str
    terminal_id: Optional[str] = None
    port_id: str
    berth_name: str
    length_meters: float
    draft_meters: float
    max_dwt: float
    equipment: List[str] = Field(default_factory=list)
    operating_hours: str = "24/7"
    status: str = Field(..., description="AVAILABLE, OCCUPIED, MAINTENANCE, RESTRICTED")


class BerthBookingSlot(BaseModel):
    booking_id: Optional[str] = None
    vessel_id: str
    vessel_name: Optional[str] = None
    arrival_time: str
    departure_time: str
    status: str
    cargo_type: Optional[str] = None
    cargo_quantity: Optional[float] = None


class BerthAvailabilityRequest(BaseModel):
    port_id: Optional[str] = None
    requested_arrival: str
    estimated_stay_hours: float = 48.0
    vessel_dwt: float = 75000.0
    vessel_draft: float = 14.2
    vessel_id: Optional[str] = None


class BerthAvailabilityWindow(BaseModel):
    berth_id: str
    berth_name: str
    draft_meters: float
    max_dwt: float
    status: str = Field(..., description="Available, Partially available, Occupied, Maintenance, Restricted")
    conflict_reason: Optional[str] = None
    existing_assignments: List[BerthBookingSlot] = Field(default_factory=list)
    available_start: Optional[str] = None
    available_end: Optional[str] = None
    suggested_arrival_date: Optional[str] = None


class BerthAvailabilityResponse(BaseModel):
    port_id: str
    port_name: str
    requested_arrival: str
    requested_departure: str
    buffer_hours: float = 6.0
    is_preferred_berth_available: bool
    preferred_berth_id: Optional[str] = None
    berths: List[BerthAvailabilityWindow]
    recommendation: str
    alternative_dates: List[str] = Field(default_factory=list)
    alternative_ports: List[str] = Field(default_factory=list)
    data_status: str = "simulated"
    evaluated_at: str


class BerthBookingCreateRequest(BaseModel):
    port_id: str
    berth_id: str
    vessel_id: str
    arrival_time: str
    departure_time: str
    cargo_plan_id: Optional[str] = None
    notes: Optional[str] = None


class BerthBookingResponse(BaseModel):
    success: bool
    booking_id: str
    port_id: str
    berth_id: str
    vessel_id: str
    arrival_time: str
    departure_time: str
    status: str
    conflict_detected: bool = False
    message: str
    data_status: str = "simulated"
    created_at: str


class AlternativePortRequest(BaseModel):
    cargo_quantity: float = Field(75000, gt=0)
    cargo_type: str = "Coal"
    vessel_draft: float = 14.2
    vessel_dwt: float = 82000.0


class AlternativePortOption(BaseModel):
    port_id: str
    port_name: str
    distance_difference_nm: int
    sailing_time_difference_days: float
    additional_fuel_cost_usd: float
    port_charges_usd: float
    inland_freight_cost_usd: float
    handling_cost_usd: float
    demurrage_risk_usd: float
    total_landed_cost_usd: float
    cost_difference_usd: float
    berth_availability_status: str
    vessel_compatible: bool
    incompatibility_reason: Optional[str] = None
    feasibility_score: float
    recommendation: str


class AlternativePortResponse(BaseModel):
    original_port: str
    cargo_quantity: float
    cargo_type: str
    options: List[AlternativePortOption]
    best_alternative_port: Optional[str] = None
    strategic_recommendation: str
    data_status: str = "estimated"
    generated_at: str


class FleetCandidateItem(BaseModel):
    vessel_id: str
    vessel_name: str
    vessel_class: str
    dwt: float
    draft_meters: float
    fuel_consumption: float
    charter_rate_per_day: float
    availability_status: str
    port_compatibility: List[str]
    is_suitable: bool
    rejection_reason: Optional[str] = None
    suitability_score: float
    estimated_voyage_cost: float


class FleetScenarioOption(BaseModel):
    scenario_id: str
    title: str
    vessel_ids: List[str]
    vessel_names: List[str]
    vessel_classes: List[str]
    total_dwt_allocated: float
    cargo_coverage_pct: float
    timing_offset_days: int
    laycan_window: str
    freight_cost_usd: float
    fuel_cost_usd: float
    port_charges_usd: float
    total_cost_usd: float
    cost_per_ton_usd: float
    cost_variance_vs_baseline_pct: float
    demurrage_risk_level: str
    is_budget_compliant: bool
    is_deadline_compliant: bool
    recommendation_rank: int


class FleetAllocationRequest(BaseModel):
    cargo_quantity: float = Field(..., gt=0)
    cargo_type: str = "Coal"
    origin: str = "Australia"
    destination: str = "Visakhapatnam"
    delivery_deadline: str
    maximum_budget: float = Field(..., gt=0)
    preferred_vessel_class: Optional[str] = "Panamax"


class FleetAllocationResponse(BaseModel):
    cargo_quantity: float
    cargo_type: str
    origin: str
    destination: str
    delivery_deadline: str
    maximum_budget: float
    candidate_vessels_evaluated: int
    suitable_vessels_count: int
    rejected_vessels_count: int
    scenarios: List[FleetScenarioOption]
    recommended_scenario_id: str
    recommendation_rationale: str
    candidate_details: List[FleetCandidateItem]
    data_status: str = "simulated"
    evaluated_at: str


class CharterBookingCreateRequest(BaseModel):
    cargo_plan_id: Optional[str] = None
    vessel_id: str
    origin_port: str
    destination_port: str
    selected_route_type: str = Field("shortest", description="'shortest' or 'lowest_cost'")
    selected_berth_id: Optional[str] = None
    planned_departure: str
    planned_arrival: str
    cargo_quantity: float = Field(..., gt=0)
    cargo_type: str = "Coal"
    estimated_total_cost: float = Field(..., gt=0)
    notes: Optional[str] = None


class CharterBookingRecord(BaseModel):
    booking_id: str
    cargo_plan_id: Optional[str] = None
    vessel_id: str
    vessel_name: Optional[str] = None
    origin_port: str
    destination_port: str
    selected_route_type: str
    selected_berth_id: Optional[str] = None
    planned_departure: str
    planned_arrival: str
    berthing_start: Optional[str] = None
    berthing_end: Optional[str] = None
    cargo_quantity: float
    cargo_type: str
    estimated_total_cost: float
    cost_per_ton: float
    booking_status: str = Field(..., description="DRAFT, PENDING_VALIDATION, AWAITING_BERTH, CONFIRMED, RESCHEDULE_REQUIRED, CANCELLED, COMPLETED")
    risk_status: str
    data_status: str = "simulated"
    notes: Optional[str] = None
    created_at: str
    updated_at: str


class RescheduleOptionItem(BaseModel):
    option_type: str = Field(..., description="DATE_SHIFT, ALT_PORT, ALT_VESSEL")
    proposed_port: Optional[str] = None
    proposed_vessel_id: Optional[str] = None
    proposed_arrival_date: Optional[str] = None
    proposed_berth_id: Optional[str] = None
    additional_cost_usd: float = 0.0
    cost_variance_pct: float = 0.0
    delay_days_saved: float = 0.0
    feasibility_score: float
    rationale: str


class RescheduleRequest(BaseModel):
    booking_id: str
    reason: str
    preferred_option_type: Optional[str] = None
    new_arrival_date: Optional[str] = None
    new_port: Optional[str] = None
    new_vessel_id: Optional[str] = None
    confirm_changes: bool = False


class RescheduleResponse(BaseModel):
    booking_id: str
    current_status: str
    requires_user_confirmation: bool
    rescheduling_options: List[RescheduleOptionItem]
    applied_changes: Optional[Dict[str, Any]] = None
    message: str
    data_status: str = "simulated"
    updated_at: str


class CancelBookingRequest(BaseModel):
    booking_id: str
    cancellation_reason: str


class CancelBookingResponse(BaseModel):
    booking_id: str
    previous_status: str
    current_status: str = "CANCELLED"
    message: str
    cancelled_at: str
