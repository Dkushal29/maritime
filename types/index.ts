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
  lat: number;
  lng: number;
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
