export type Origin = 'Australia' | 'Indonesia' | 'South Africa' | 'USA' | 'Russia';
export type Destination = 'Visakhapatnam' | 'Paradip' | 'Chennai' | 'Kamarajar' | 'Haldia';
export type CargoType = 'Coal' | 'Iron Ore' | 'Limestone' | 'Fertilizer' | 'Grain';
export type VesselType = 'Panamax' | 'Supramax' | 'Capesize' | 'Handymax';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ForecastHorizon = '7D' | '30D' | '60D' | '90D';

export interface ForecastPoint {
  date: string;
  actual?: number;
  predicted: number;
  lowerBound: number;
  upperBound: number;
}

export interface ForecastDriver {
  factor: string;
  importance: number; // 0-1
  impact: 'positive' | 'negative' | string;
  changeDesc: string;
  name?: string;
  direction?: 'up' | 'down';
}

export interface SubModelForecast {
  prediction: number;
  lower?: number;
  upper?: number;
  status: 'available' | 'unavailable' | string;
}

export interface EnsembleInfo {
  prediction: number;
  lower?: number;
  upper?: number;
  weights?: { xgboost: number; chronos: number };
}

export interface UncertaintyRange {
  lower: number;
  upper: number;
  span: number;
}

export interface FreightPrediction {
  currentRate: number; // 31.8
  predicted30dRate: number; // 35.4
  changePercent: number; // +11.3
  predictions: ForecastPoint[];
  confidence: number; // 87
  drivers: ForecastDriver[];
  aiInsight: string;
  xgboost?: SubModelForecast;
  chronos?: SubModelForecast;
  ensemble?: EnsembleInfo;
  uncertaintyRange?: UncertaintyRange;
  forecastMode?: 'ensemble' | 'xgboost_fallback' | string;
  modelComponents?: string[];
  horizonDays?: number;
  historical?: Array<{ date: string; rate: number }>;
}

export interface CargoDemandPoint {
  date: string;
  historical?: number;
  predicted: number;
  lowerBound: number;
  upperBound: number;
}

export interface CargoDemandPrediction {
  commodity: CargoType;
  port: Destination;
  currentInventory: number;
  expected30dDemand: number;
  procurementRequirement: number;
  inventoryCoverageDays: number;
  demandPoints: CargoDemandPoint[];
  projectedDemand?: number;
  demandTrendPercent?: number;
  demandTimeline?: Array<{ date: string; inventory: number; demand: number; procurement?: number }>;
  procurementRecommendation: {
    title: string;
    quantity: number;
    windowDays: number;
    reasons: string[];
  };
}

export interface Vessel {
  id: string;
  name: string;
  type: VesselType;
  dwt: number;
  builtYear: number;
  imoNumber: string;
  currentPosition: string;
  lat: number | null;
  lng: number | null;
  positionAvailable?: boolean;
  dataStatus?: 'LIVE' | 'HISTORICAL' | 'CACHED' | 'SIMULATED' | 'UNAVAILABLE' | string;
  dataSource?: string;
  speedKnots?: number;
  courseDegrees?: number;
  headingDegrees?: number;
  draughtMeters?: number;
  lastUpdated?: string;
  eta: string;
  availability: 'Available' | 'Reserved' | 'In Transit' | 'Unavailable';
  charterRate: number;
  charterRatePerDay: number;
  fitScore: number;
  status: 'Recommended' | 'Standard' | 'High Cost' | 'Busy';
  fuelConsumptionTpd: number;
  portCompatibility: string[];
  previousRoute: string;
  breakdown: {
    capacityFit: number;
    routeFit: number;
    costEfficiency: number;
    availability: number;
    etaCompatibility: number;
  };
}

export interface CharterOptimizationInput {
  origin: Origin;
  destination: Destination;
  cargo: CargoType;
  quantityMt: number;
  deliveryDeadlineDays: number;
  preferredVesselType: VesselType;
  maxBudgetUsd: number;
}

export interface AlternativePlan {
  id: string;
  title: string;
  timing: string;
  totalCost: number;
  expectedRatePerMt: number;
  risk: RiskLevel;
  savings: number;
  isRecommended: boolean;
  tradeoffs: string[];
}

export interface CharterRecommendation {
  action: string;
  vessels: Vessel[];
  vesselCount: number;
  totalCapacityMt: number;
  expectedFreightRatePerMt: number;
  estimatedCharterCost: number;
  expectedSavings: number;
  risk: RiskLevel;
  confidence: number;
  supportingReasons: string[];
  alternatives: AlternativePlan[];
}

export interface SimulationInput {
  bunkerPriceUsd: number;
  portCongestion: 'Low' | 'Medium' | 'High';
  cargoDemandMt: number;
  vesselAvailability: 'Low' | 'Medium' | 'High';
  commodityPriceUsd: number;
}

export interface SimulationResult {
  currentFreightRate: number;
  currentTotalCost: number;
  currentRisk: RiskLevel;
  simulatedFreightRate: number;
  simulatedTotalCost: number;
  simulatedRisk: RiskLevel;
  costDifference: number;
  additionalCostAvoided: number;
  aiRecommendation: string;
}

export interface RouteMetric {
  id: string;
  origin: Origin;
  destination: Destination;
  avgFreightRate: number;
  transitTimeDays: number;
  portCongestionLevel: 'Low' | 'Medium' | 'High';
  vesselAvailabilityCount: number;
  risk: RiskLevel;
  riskLevel?: RiskLevel;
  avgTransitDays?: number;
  distanceNm?: number;
  estimatedLandedCostPerMt: number;
  isRecommended: boolean;
  originCoords: [number, number];
  destCoords: [number, number];
}

export interface AlertItem {
  id: string;
  title: string;
  type: string;
  category: string;
  severity?: 'critical' | 'warning' | 'opportunity' | 'info' | string;
  description: string;
  timestamp: string;
  recommendedAction: string;
  action?: string;
  read: boolean;
  route?: string;
}

export interface ModelPerformanceMetric {
  freightModel: {
    name: string;
    version: string;
    mae: number;
    rmse: number;
    r2: number;
    lastTrained: string;
    trainingWindow: string;
    featureCount: number;
    actualVsPredicted: { date: string; actual: number; predicted: number }[];
  };
  demandModel: {
    name: string;
    version: string;
    mae: number;
    rmse: number;
    r2: number;
    lastTrained: string;
    trainingWindow: string;
    featureCount: number;
    actualVsPredicted: { date: string; actual: number; predicted: number }[];
  };
  chronosModel?: {
    name: string;
    modelId: string;
    type: string;
    status: string;
    mae: number;
    rmse: number;
    mape: number;
    testPeriod: string;
    quantiles: string[];
  };
  ensembleModel?: {
    name: string;
    status: string;
    components: string[];
    weights: { xgboost: number; chronos: number };
    mae: number;
    rmse: number;
    mape: number;
    testPeriod: string;
  };
}

export interface SHAPContribution {
  feature: string;
  impactValue: number;
  impactPercentage: number;
  direction: 'positive' | 'negative';
  description: string;
}

export interface DataSource {
  id: string;
  name: string;
  dataType: string;
  updateCadence: string;
  status: 'Connected' | 'Degraded' | 'Offline';
  lastSync: string;
  reliabilityScore: number;
}

export interface GlobalFilterState {
  origin: Origin;
  destination: Destination;
  cargo: CargoType;
  vesselType: VesselType;
  dateRange: ForecastHorizon;
}

export interface ProcurementOrderInput {
  commodity: string;
  quantityTons: number;
  grade?: string;
  origin: string;
  destination: string;
  requiredDeliveryDate: string;
  budgetUsd?: number;
  currentInventoryTons: number;
  safetyStockTons: number;
  forecastDemandTons?: number;
  supplierName?: string;
  notes?: string;
}

export interface ProcurementEstimate {
  commodity: string;
  grade: string;
  quantityTons: number;
  calculatedProcurementQuantity: number;
  unitCargoPriceUsd: number;
  estimatedCargoCostUsd: number;
  unitFreightPriceUsd: number;
  estimatedFreightCostUsd: number;
  unitHandlingPriceUsd: number;
  estimatedHandlingCostUsd: number;
  estimatedTotalCostUsd: number;
  recommendedTransportMode: string;
  estimatedDeliveryDays: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
  isSimulated: boolean;
  disclaimer: string;
}

export interface ProcurementOrder {
  orderId: string;
  orderStatus: 'Draft' | 'Submitted' | 'Supplier Confirmation Pending' | 'Approved' | 'Dispatched' | 'Delivered' | 'Cancelled';
  commodity: string;
  grade: string;
  quantityTons: number;
  calculatedProcurementQuantity: number;
  origin: string;
  destination: string;
  requiredDeliveryDate: string;
  budgetUsd?: number;
  supplierName?: string;
  estimatedCargoCostUsd: number;
  estimatedFreightCostUsd: number;
  estimatedHandlingCostUsd: number;
  estimatedTotalCostUsd: number;
  recommendedTransportMode: string;
  estimatedDeliveryDays: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
  notes?: string;
  createdTimestamp: string;
  isSimulated: boolean;
  disclaimer: string;
}

export type DataStatus = 'LIVE' | 'HISTORICAL' | 'FORECAST' | 'CACHED' | 'SIMULATED' | 'UNAVAILABLE';

export interface SourceStatusItem {
  name: string;
  category: string;
  provider: string;
  status: DataStatus;
  freq: string;
  last_updated?: string | null;
  latency_ms?: number | null;
  error_message?: string | null;
  quota_used?: number | null;
  quota_total?: number | null;
  coverage: string[];
  is_healthy: boolean;
}

export interface SourcesStatusResponse {
  sources: SourceStatusItem[];
  overall_data_mode: string;
  mock_fallback_enabled: boolean;
  timestamp: string;
}

export interface WeatherCondition {
  latitude: number;
  longitude: number;
  time: string;
  wave_height_meters?: number | null;
  wave_direction_degrees?: number | null;
  wind_speed_knots?: number | null;
  ocean_current_velocity_knots?: number | null;
  weather_condition: string;
  weather_risk: 'LOW' | 'MEDIUM' | 'HIGH';
  speed_reduction_knots: number;
  estimated_delay_hours: number;
  fuel_consumption_penalty_pct: number;
  data_source: string;
  data_status: DataStatus;
  disclaimer: string;
}

export interface PortCongestionData {
  port_id: string;
  port_name: string;
  country: string;
  latitude: number;
  longitude: number;
  congestion_level?: string | null;
  congestion_index?: number | null;
  avg_waiting_days?: number | null;
  operational_status: string;
  vessels_in_queue?: number | null;
  last_updated: string;
  data_source: string;
  data_status: DataStatus;
}

// SIH 26006 Planning Workflow Types
export interface CargoPlanningInput {
  cargo_type: string;
  cargo_quantity: number;
  origin: string;
  destination_port: string;
  required_arrival_date: string;
  maximum_budget: number;
  preferred_vessel_class?: string;
  supplier_price_per_tonne?: number;
}

export interface ModelEvaluationMetrics {
  mae: number;
  rmse: number;
  mape: number;
  r2?: number;
  baseline_mae?: number;
  baseline_rmse?: number;
  baseline_mape?: number;
  baseline_model?: string;
}

export interface ForecastTrajectoryPoint {
  date: string;
  predicted_rate: number;
  lower_bound: number;
  upper_bound: number;
}

export interface FreightForecastResult {
  status: string;
  data_status: 'live' | 'historical' | 'illustrative' | 'unavailable';
  route: { origin: string; destination: string };
  cargo_type: string;
  vessel_class: string;
  predicted_rate_per_tonne: number;
  current_rate_per_tonne: number;
  forecast_direction: 'increasing' | 'stable' | 'decreasing';
  confidence: 'low' | 'medium' | 'high';
  metrics: ModelEvaluationMetrics;
  limitations: string[];
  model_name?: string;
  forecast_trajectory?: ForecastTrajectoryPoint[];
}

export interface VesselSuitabilityItem {
  vessel_id: string;
  vessel_name: string;
  vessel_class: string;
  capacity_dwt: number;
  draft_meters: number;
  length_meters?: number;
  beam_meters?: number;
  current_position?: string;
  lat?: number;
  lng?: number;
  eta?: string;
  is_suitable: boolean;
  suitability_status: 'Recommended' | 'Suitable' | 'Unsuitable' | 'Conditional';
  suitability_score: number;
  reasons: string[];
  unsuitability_reasons: string[];
  estimated_voyage_days: number;
  estimated_freight_cost: number;
  daily_charter_rate: number;
  weather_risk?: string;
  data_status: string;
}

export interface LandedCostBreakdown {
  cargo_purchase_cost: number;
  ocean_freight: number;
  port_charges: number;
  loading_cost: number;
  unloading_cost: number;
  fuel_related_cost: number;
  expected_demurrage: number;
  other_logistics_costs: number;
}

export interface LandedCostResult {
  cost_per_tonne: number;
  total_cost: number;
  breakdown: LandedCostBreakdown;
  assumptions: string[];
  data_status: 'live' | 'historical' | 'illustrative' | 'mixed';
  missing_data_warnings: string[];
}

export interface CharterPlanItem {
  plan_id: string;
  title: string;
  vessel_class: string;
  vessel_count: number;
  vessels: any[];
  decision: 'charter_now' | 'charter_delayed' | 'alternative_class' | 'split_shipment';
  timing: string;
  estimated_total_cost: number;
  estimated_cost_per_tonne: number;
  potential_savings: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
  warnings: string[];
  feasibility: boolean;
}

export interface CargoPlanningResponse {
  plan_id: string;
  status: string;
  cargo_requirement: CargoPlanningInput;
  freight_forecast: FreightForecastResult;
  vessel_evaluations: VesselSuitabilityItem[];
  landed_cost: LandedCostResult;
  recommended_plan: CharterPlanItem;
  alternatives: CharterPlanItem[];
  reasons: string[];
  warnings: string[];
  data_status: 'live' | 'historical' | 'illustrative' | 'mixed';
  limitations: string[];
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Maritime Route Planning, Berth Availability, Fleet Allotment & Booking
// ─────────────────────────────────────────────────────────────────────────────

export interface CostDriversBreakdown {
  fuel_pct: number;
  port_charges_pct: number;
  vessel_operating_pct: number;
  canal_transit_pct: number;
  demurrage_risk_pct: number;
}

export interface RouteOptionItem {
  option_key: 'shortest' | 'lowest_cost' | string;
  option_name: string;
  route_id: string;
  origin: string;
  destination: string;
  waypoints: [number, number][];
  distance_nm: number;
  speed_knots: number;
  sailing_days: number;
  estimated_departure: string;
  estimated_arrival: string;
  total_cost_usd: number;
  cost_per_ton_usd: number;
  fuel_cost_usd: number;
  port_charges_usd: number;
  transit_charges_usd: number;
  demurrage_risk_usd: number;
  operating_cost_usd: number;
  cost_savings_usd: number;
  cost_drivers: CostDriversBreakdown;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  weather_impact: string;
  tradeoff_explanation: string;
  data_source: string;
  data_confidence: number;
  data_status: 'live' | 'historical' | 'estimated' | 'simulated' | 'unavailable';
  navigation_disclaimer: string;
}

export interface RouteCompareResponse {
  origin: string;
  destination: string;
  cargo_type: string;
  cargo_quantity: number;
  vessel_class: string;
  shortest_route: RouteOptionItem;
  lowest_cost_route: RouteOptionItem;
  recommended_option: 'shortest' | 'lowest_cost' | string;
  recommendation_rationale: string;
  tradeoff_summary: string;
  disclaimer: string;
  data_status: string;
  generated_at: string;
}

export interface RouteCorridorItem {
  corridor_id: string;
  origin_port: string;
  origin_country: string;
  origin_coords: [number, number];
  destination_port: string;
  destination_country: string;
  dest_coords: [number, number];
  cargo_type: string;
  typical_vessel_classes: string[];
  approximate_corridor: string;
  waypoints: [number, number][];
  estimated_distance_nm: number;
  typical_sailing_days: number;
  seasonal_risk_areas: string[];
  port_restrictions: Record<string, any>;
  data_source: string;
  data_confidence: number;
  is_verified_nautical: boolean;
  data_status: string;
  label: string;
}

export interface RouteAlertItem {
  alert_id: string;
  severity: 'INFO' | 'CAUTION' | 'WARNING' | 'CRITICAL';
  area: string;
  coordinates?: [number, number];
  radius_nm?: number;
  start_time?: string;
  end_time?: string;
  affected_route: string;
  description: string;
  source: string;
  last_checked: string;
  recommended_action?: string;
  confidence: number;
  data_status: string;
}

export interface RouteRiskAssessmentResponse {
  route: string;
  overall_risk_score: number;
  overall_risk_level: string;
  active_alerts: RouteAlertItem[];
  cyclone_risk: string;
  monsoon_impact: string;
  chokepoint_status: string;
  port_weather_risk: string;
  data_status: string;
}

export interface BerthItem {
  berth_id: string;
  terminal_id?: string;
  port_id: string;
  berth_name: string;
  length_meters: number;
  draft_meters: number;
  max_dwt: number;
  equipment: string[];
  operating_hours: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESTRICTED' | string;
}

export interface BerthBookingSlot {
  booking_id?: string;
  vessel_id: string;
  vessel_name?: string;
  arrival_time: string;
  departure_time: string;
  status: string;
  cargo_type?: string;
  cargo_quantity?: number;
}

export interface BerthAvailabilityWindow {
  berth_id: string;
  berth_name: string;
  draft_meters: number;
  max_dwt: number;
  status: 'Available' | 'Partially available' | 'Occupied' | 'Maintenance' | 'Restricted';
  conflict_reason?: string;
  existing_assignments: BerthBookingSlot[];
  available_start?: string;
  available_end?: string;
  suggested_arrival_date?: string;
}

export interface BerthAvailabilityResponse {
  port_id: string;
  port_name: string;
  requested_arrival: string;
  requested_departure: string;
  buffer_hours: number;
  is_preferred_berth_available: boolean;
  preferred_berth_id?: string;
  berths: BerthAvailabilityWindow[];
  recommendation: string;
  alternative_dates: string[];
  alternative_ports: string[];
  data_status: string;
  evaluated_at: string;
}

export interface AlternativePortOption {
  port_id: string;
  port_name: string;
  distance_difference_nm: number;
  sailing_time_difference_days: number;
  additional_fuel_cost_usd: number;
  port_charges_usd: number;
  inland_freight_cost_usd: number;
  handling_cost_usd: number;
  demurrage_risk_usd: number;
  total_landed_cost_usd: number;
  cost_difference_usd: number;
  berth_availability_status: string;
  vessel_compatible: boolean;
  incompatibility_reason?: string;
  feasibility_score: number;
  recommendation: string;
}

export interface AlternativePortResponse {
  original_port: string;
  cargo_quantity: number;
  cargo_type: string;
  options: AlternativePortOption[];
  best_alternative_port?: string;
  strategic_recommendation: string;
  data_status: string;
  generated_at: string;
}

export interface FleetCandidateItem {
  vessel_id: string;
  vessel_name: string;
  vessel_class: string;
  dwt: number;
  draft_meters: number;
  fuel_consumption: number;
  charter_rate_per_day: number;
  availability_status: string;
  port_compatibility: string[];
  is_suitable: boolean;
  rejection_reason?: string;
  suitability_score: number;
  estimated_voyage_cost: number;
}

export interface FleetScenarioOption {
  scenario_id: string;
  title: string;
  vessel_ids: string[];
  vessel_names: string[];
  vessel_classes: string[];
  total_dwt_allocated: number;
  cargo_coverage_pct: number;
  timing_offset_days: number;
  laycan_window: string;
  freight_cost_usd: number;
  fuel_cost_usd: number;
  port_charges_usd: number;
  total_cost_usd: number;
  cost_per_ton_usd: number;
  cost_variance_vs_baseline_pct: number;
  demurrage_risk_level: string;
  is_budget_compliant: boolean;
  is_deadline_compliant: boolean;
  recommendation_rank: number;
}

export interface FleetAllocationResponse {
  cargo_quantity: number;
  cargo_type: string;
  origin: string;
  destination: string;
  delivery_deadline: string;
  maximum_budget: number;
  candidate_vessels_evaluated: number;
  suitable_vessels_count: number;
  rejected_vessels_count: number;
  scenarios: FleetScenarioOption[];
  recommended_scenario_id: string;
  recommendation_rationale: string;
  candidate_details: FleetCandidateItem[];
  data_status: string;
  evaluated_at: string;
}

export interface CharterBookingRecord {
  booking_id: string;
  cargo_plan_id?: string;
  vessel_id: string;
  vessel_name?: string;
  origin_port: string;
  destination_port: string;
  selected_route_type: string;
  selected_berth_id?: string;
  planned_departure: string;
  planned_arrival: string;
  berthing_start?: string;
  berthing_end?: string;
  cargo_quantity: number;
  cargo_type: string;
  estimated_total_cost: number;
  cost_per_ton: number;
  booking_status: 'DRAFT' | 'PENDING_VALIDATION' | 'AWAITING_BERTH' | 'CONFIRMED' | 'RESCHEDULE_REQUIRED' | 'CANCELLED' | 'COMPLETED' | string;
  risk_status: string;
  data_status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RescheduleOptionItem {
  option_type: 'DATE_SHIFT' | 'ALT_PORT' | 'ALT_VESSEL' | string;
  proposed_port?: string;
  proposed_vessel_id?: string;
  proposed_arrival_date?: string;
  proposed_berth_id?: string;
  additional_cost_usd: number;
  cost_variance_pct: number;
  delay_days_saved: number;
  feasibility_score: number;
  rationale: string;
}

export interface RescheduleResponse {
  booking_id: string;
  current_status: string;
  requires_user_confirmation: boolean;
  rescheduling_options: RescheduleOptionItem[];
  applied_changes?: Record<string, any>;
  message: string;
  data_status: string;
  updated_at: string;
}
