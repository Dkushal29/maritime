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

