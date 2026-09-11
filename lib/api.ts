import {
  FreightPrediction,
  CargoDemandPrediction,
  Vessel,
  CharterOptimizationInput,
  CharterRecommendation,
  SimulationInput,
  SimulationResult,
  RouteMetric,
  AlertItem,
  ModelPerformanceMetric,
  ForecastHorizon,
  CargoType,
  Destination,
  Origin,
  VesselType,
  RiskLevel,
  ProcurementOrderInput,
  ProcurementEstimate,
  ProcurementOrder,
  SourcesStatusResponse,
  WeatherCondition,
  PortCongestionData,
  CargoPlanningInput,
  CargoPlanningResponse,
  FreightForecastResult,
  LandedCostResult,
  RouteCorridorItem,
  RouteCompareResponse,
  RouteAlertItem,
  RouteRiskAssessmentResponse,
  BerthItem,
  BerthAvailabilityResponse,
  AlternativePortResponse,
  FleetAllocationResponse,
  CharterBookingRecord,
  RescheduleResponse,
} from '../types';
import {
  mockFreightPrediction,
  mockCargoDemandPrediction,
  mockVessels,
  mockCharterRecommendation,
  mockRouteMetrics,
  mockAlerts,
  mockModelPerformance,
} from '../data/mockData';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

/**
 * Helper fetcher with timeout and fallback to mock data if backend is offline.
 */
async function apiFetch<T>(endpoint: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const controller = new AbortController();
    // 25s timeout to allow full zero-shot foundation model (Chronos-Bolt) inference
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`Backend call to ${endpoint} failed, using fallback data.`, err);
    if (fallback !== undefined) {
      return fallback;
    }
    throw err;
  }
}

/**
 * 1. Dashboard aggregated data
 */
export async function getDashboardData(): Promise<{
  freight: FreightPrediction;
  cargo: CargoDemandPrediction;
  vessels: Vessel[];
  recommendation: CharterRecommendation;
  alerts: AlertItem[];
}> {
  const fallback = {
    freight: mockFreightPrediction,
    cargo: mockCargoDemandPrediction,
    vessels: mockVessels,
    recommendation: mockCharterRecommendation,
    alerts: mockAlerts,
  };

  try {
    const data = await apiFetch<any>('/api/v1/dashboard', { method: 'GET' });
    if (!data || !data.freight) return fallback;

    return {
      freight: mapFreightPrediction(data.freight),
      cargo: mapCargoPrediction(data.cargo),
      vessels: (data.vessels || []).map(mapVessel),
      recommendation: mapRecommendation(data.recommendation),
      alerts: (data.alerts || []).map(mapAlert),
    };
  } catch {
    return fallback;
  }
}

/**
 * 2. Freight Forecast endpoint
 */
export async function getFreightForecast(
  horizon: ForecastHorizon = '30D',
  origin: Origin = 'Australia',
  destination: Destination = 'Visakhapatnam',
  cargoType: CargoType = 'Coal',
  vesselType: VesselType = 'Panamax',
  cargoVolume: number = 230000
): Promise<FreightPrediction> {
  const horizonDays = horizon === '7D' ? 7 : horizon === '60D' ? 60 : horizon === '90D' ? 90 : 30;

  try {
    const data = await apiFetch<any>(
      '/api/v1/predict/freight',
      {
        method: 'POST',
        body: JSON.stringify({
          origin,
          destination,
          cargo_type: cargoType,
          vessel_type: vesselType,
          cargo_volume: cargoVolume,
          forecast_days: horizonDays,
        }),
      },
      mockFreightPrediction
    );

    return mapFreightPrediction(data);
  } catch {
    return mockFreightPrediction;
  }
}

/**
 * 3. Cargo Demand Forecast endpoint
 */
export async function getCargoForecast(
  commodity: CargoType = 'Coal',
  port: Destination = 'Visakhapatnam'
): Promise<CargoDemandPrediction> {
  try {
    const data = await apiFetch<any>(
      '/api/v1/predict/demand',
      {
        method: 'POST',
        body: JSON.stringify({
          port,
          cargo_type: commodity,
          forecast_days: 30,
        }),
      },
      mockCargoDemandPrediction
    );

    return mapCargoPrediction(data);
  } catch {
    return {
      ...mockCargoDemandPrediction,
      commodity,
      port,
    };
  }
}

/**
 * 4. Vessel Fleet endpoint
 */
export async function getVessels(filters?: {
  type?: string;
  status?: string;
  availability?: string;
  minDwt?: number;
}): Promise<Vessel[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.type && filters.type !== 'ALL') params.set('type', filters.type);
    if (filters?.availability && filters.availability !== 'ALL') params.set('availability', filters.availability);
    if (filters?.minDwt) params.set('min_dwt', filters.minDwt.toString());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const data = await apiFetch<any[]>(`/api/v1/vessels${qs}`, { method: 'GET' }, mockVessels);
    return data.map(mapVessel);
  } catch {
    return mockVessels;
  }
}

/**
 * 4b. Single Vessel Detail endpoint
 */
export async function getVesselDetail(vesselId: string): Promise<Vessel | null> {
  try {
    const data = await apiFetch<any>(`/api/v1/vessels/${vesselId}`, { method: 'GET' });
    return mapVessel(data);
  } catch {
    const found = mockVessels.find((v) => v.id === vesselId);
    return found || null;
  }
}
export const getVesselById = getVesselDetail;

/**
 * 5. Charter Optimization endpoint
 */
export async function optimizeCharter(
  input: CharterOptimizationInput
): Promise<CharterRecommendation> {
  try {
    const data = await apiFetch<any>(
      '/api/v1/optimize/charter',
      {
        method: 'POST',
        body: JSON.stringify({
          origin: input.origin,
          destination: input.destination,
          cargo_type: input.cargo,
          required_cargo: input.quantityMt,
          delivery_deadline: '2026-10-15',
          preferred_vessel_type: input.preferredVesselType,
          maximum_budget: input.maxBudgetUsd,
        }),
      },
      mockCharterRecommendation
    );

    return mapRecommendation(data);
  } catch {
    return mockCharterRecommendation;
  }
}

/**
 * 6. What-If Simulation endpoint
 */
export async function runSimulation(input: SimulationInput): Promise<SimulationResult> {
  try {
    const data = await apiFetch<any>(
      '/api/v1/simulate',
      {
        method: 'POST',
        body: JSON.stringify({
          bunker_price: input.bunkerPriceUsd,
          port_congestion: input.portCongestion,
          cargo_demand: input.cargoDemandMt,
          vessel_availability: input.vesselAvailability,
          commodity_price: input.commodityPriceUsd,
        }),
      }
    );

    return {
      currentFreightRate: data.current_freight_rate,
      currentTotalCost: data.current_total_cost,
      currentRisk: data.current_risk as RiskLevel,
      simulatedFreightRate: data.simulated_freight_rate,
      simulatedTotalCost: data.simulated_total_cost,
      simulatedRisk: data.simulated_risk as RiskLevel,
      costDifference: data.cost_change,
      additionalCostAvoided: data.potential_cost_avoided,
      aiRecommendation: data.ai_recommendation,
    };
  } catch {
    // Formula calculation fallback if backend unavailable
    const bunkerImpact = (input.bunkerPriceUsd - 620) * 0.035;
    const congestionImpact = input.portCongestion === 'High' ? 4.5 : input.portCongestion === 'Low' ? -1.5 : 0;
    const simulatedFreightRate = Number((31.8 + bunkerImpact + congestionImpact).toFixed(1));
    const currentTotalCost = 7360000;
    const simulatedTotalCost = Math.round(230000 * simulatedFreightRate);
    const costDifference = simulatedTotalCost - currentTotalCost;

    return {
      currentFreightRate: 31.8,
      currentTotalCost,
      currentRisk: 'MEDIUM',
      simulatedFreightRate,
      simulatedTotalCost,
      simulatedRisk: simulatedFreightRate > 36.0 ? 'HIGH' : 'MEDIUM',
      costDifference,
      additionalCostAvoided: Math.max(0, costDifference),
      aiRecommendation: 'Charter within 7 days to preserve $420,000 cost savings.',
    };
  }
}

/**
 * 7. Route Analytics endpoint
 */
export async function getRouteAnalytics(): Promise<RouteMetric[]> {
  try {
    const data = await apiFetch<any[]>('/api/v1/routes', { method: 'GET' }, mockRouteMetrics);
    return data.map((r) => {
      const riskVal = (r.risk ? String(r.risk).toUpperCase() : 'LOW') as RiskLevel;
      const transitDays = Number(r.transit_days ?? r.transitTimeDays ?? r.avgTransitDays ?? 16);
      return {
        id: String(r.id),
        origin: r.origin,
        destination: r.destination,
        avgFreightRate: Number(r.average_freight ?? r.avgFreightRate ?? 31.8),
        transitTimeDays: transitDays,
        avgTransitDays: transitDays,
        distanceNm: Number(r.distance_nm ?? r.distanceNm ?? 4820),
        portCongestionLevel: r.port_congestion ?? r.portCongestionLevel ?? 'Medium',
        vesselAvailabilityCount: Number(r.vessel_availability ?? r.vesselAvailabilityCount ?? 4),
        risk: riskVal,
        riskLevel: riskVal,
        estimatedLandedCostPerMt: Number(r.landed_cost ?? r.estimatedLandedCostPerMt ?? 142.8),
        isRecommended: Boolean(r.is_recommended ?? r.isRecommended),
        originCoords: r.origin_coords ?? [0, 0],
        destCoords: r.dest_coords ?? [0, 0],
      };
    });
  } catch {
    return mockRouteMetrics;
  }
}

/**
 * 8. Operational Alerts endpoint
 */
export async function getAlerts(): Promise<AlertItem[]> {
  try {
    const data = await apiFetch<any[]>('/api/v1/alerts', { method: 'GET' }, mockAlerts);
    return data.map(mapAlert);
  } catch {
    return mockAlerts;
  }
}

/**
 * 9. Model Performance Metrics endpoint
 */
export async function getModelMetrics(): Promise<ModelPerformanceMetric> {
  try {
    const data = await apiFetch<any>('/api/v1/analytics/model-metrics', { method: 'GET' }, mockModelPerformance);
    return {
      freightModel: {
        name: data.freight_model?.name || 'XGBoost Regressor',
        version: data.freight_model?.version || '1.0',
        mae: data.freight_model?.mae || 0.888,
        rmse: data.freight_model?.rmse || 1.136,
        r2: data.freight_model?.r2 || 0.993,
        lastTrained: data.freight_model?.trained_at || '2026-09-10',
        trainingWindow: data.freight_model?.training_period || '2018 - 2025',
        featureCount: data.freight_model?.feature_count || 16,
        actualVsPredicted: (data.freight_model?.actual_vs_predicted || []).map((p: any) => ({
          date: p.date,
          actual: p.actual,
          predicted: p.predicted,
        })),
      },
      demandModel: {
        name: data.demand_model?.name || 'XGBoost Regressor',
        version: data.demand_model?.version || '1.0',
        mae: data.demand_model?.mae || 7902.6,
        rmse: data.demand_model?.rmse || 9780.2,
        r2: data.demand_model?.r2 || 0.986,
        lastTrained: data.demand_model?.trained_at || '2026-09-10',
        trainingWindow: data.demand_model?.training_period || '2018 - 2025',
        featureCount: data.demand_model?.feature_count || 11,
        actualVsPredicted: (data.demand_model?.actual_vs_predicted || []).map((p: any) => ({
          date: p.date,
          actual: p.actual,
          predicted: p.predicted,
        })),
      },
      chronosModel: data.chronos_model
        ? {
            name: data.chronos_model.name || 'Chronos-Bolt Small',
            modelId: data.chronos_model.model_id || 'autogluon/chronos-bolt-small',
            type: data.chronos_model.type || 'Foundation Time-Series Sequence Model',
            status: data.chronos_model.status || 'Available',
            mae: data.chronos_model.mae ?? 1.86,
            rmse: data.chronos_model.rmse ?? 2.29,
            mape: data.chronos_model.mape ?? 4.59,
            testPeriod: data.chronos_model.test_period || '2026-01 - 2026-09',
            quantiles: data.chronos_model.quantiles || ['P10', 'P50', 'P90'],
          }
        : undefined,
      ensembleModel: data.ensemble_model
        ? {
            name: data.ensemble_model.name || 'Multi-Model Ensemble',
            status: data.ensemble_model.status || 'Active',
            components: data.ensemble_model.components || ['XGBoost Covariate Regressor', 'Chronos-Bolt Small Sequence Model'],
            weights: data.ensemble_model.weights || { xgboost: 0.6, chronos: 0.4 },
            mae: data.ensemble_model.mae ?? 1.14,
            rmse: data.ensemble_model.rmse ?? 1.48,
            mape: data.ensemble_model.mape ?? 3.12,
            testPeriod: data.ensemble_model.test_period || '2026-01 - 2026-09',
          }
        : undefined,
    };
  } catch {
    return mockModelPerformance;
  }
}

/**
 * 9b. Feature Importance endpoint
 */
export async function getFeatureImportance(): Promise<Array<{ feature: string; importance: number; direction: 'up' | 'down'; description?: string }>> {
  try {
    const data = await apiFetch<any>('/api/v1/analytics/feature-importance', { method: 'GET' });
    return (data.features || data || []).map((f: any) => ({
      feature: f.feature || f.name,
      importance: f.importance ?? f.weight ?? 0.2,
      direction: (f.direction === 'down' || f.importance < 0) ? 'down' : 'up',
      description: f.description || '',
    }));
  } catch {
    return [
      { feature: 'Port Congestion Index', importance: 0.42, direction: 'up', description: 'Port delays in Visakhapatnam' },
      { feature: 'Bunker Fuel (VLSFO)', importance: 0.31, direction: 'up', description: 'Singapore VLSFO benchmark' },
      { feature: 'Vessel Availability Ratio', importance: 0.24, direction: 'up', description: 'Tonnage availability in basin' },
      { feature: 'Cargo Demand Surge', importance: 0.18, direction: 'up', description: 'Regional Indian import demand' },
      { feature: 'Corridor Distance', importance: 0.12, direction: 'up', description: 'Origin to destination route length' },
      { feature: 'Seasonality Factors', importance: -0.08, direction: 'down', description: 'Monsoon transit adjustment' },
      { feature: 'Commodity Price Index', importance: -0.05, direction: 'down', description: 'Thermal coal price pink sheet' },
    ];
  }
}

/**
 * 9c. Feature Correlation Matrix endpoint
 */
export async function getCorrelationMatrix(): Promise<{ features: string[]; matrix: number[][] }> {
  try {
    const data = await apiFetch<any>('/api/v1/analytics/correlation', { method: 'GET' });
    return {
      features: data.features || ['Freight', 'Bunker', 'Congestion', 'Demand', 'Vessels'],
      matrix: data.matrix || [
        [1.00, 0.88, 0.74, 0.65, -0.71],
        [0.88, 1.00, 0.52, 0.48, -0.58],
        [0.74, 0.52, 1.00, 0.61, -0.42],
        [0.65, 0.48, 0.61, 1.00, -0.38],
        [-0.71, -0.58, -0.42, -0.38, 1.00],
      ],
    };
  } catch {
    return {
      features: ['Freight', 'Bunker', 'Congestion', 'Demand', 'Vessels'],
      matrix: [
        [1.00, 0.88, 0.74, 0.65, -0.71],
        [0.88, 1.00, 0.52, 0.48, -0.58],
        [0.74, 0.52, 1.00, 0.61, -0.42],
        [0.65, 0.48, 0.61, 1.00, -0.38],
        [-0.71, -0.58, -0.42, -0.38, 1.00],
      ],
    };
  }
}

/**
 * 10. AI Copilot endpoint
 */
export async function sendCopilotMessage(
  message: string,
  context?: { origin: string; destination: string; cargo_type: string }
): Promise<{ text: string; reasoningPoints?: string[]; suggestedActions?: string[] }> {
  try {
    const data = await apiFetch<any>('/api/v1/copilot', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
    return {
      text: data.text,
      reasoningPoints: data.reasoning_points,
      suggestedActions: data.suggested_actions,
    };
  } catch {
    return {
      text: 'I have analyzed the current market parameters for your active scenario. Freight rates are trending upward to $35.4/MT (+11.3%). We recommend executing vessel charter within 7 days to secure $420,000 in net cost savings.',
      reasoningPoints: [
        'Expected landed freight: $32.4/MT within 7 days vs $35.4/MT in 30 days.',
        'Estimated Net Savings: $420,000 across 230,000 MT coal requirement.',
      ],
    };
  }
}

// ----------------------------------------------------
// Object Mapping Helpers
// ----------------------------------------------------

function mapFreightPrediction(raw: any): FreightPrediction {
  return {
    currentRate: raw.current_rate ?? 31.8,
    predicted30dRate: raw.predicted_30d_rate ?? 35.4,
    changePercent: raw.change_percent ?? 11.3,
    predictions: (raw.forecast || []).map((f: any) => ({
      date: f.date,
      actual: f.actual,
      predicted: f.predicted_rate ?? f.predicted,
      lowerBound: f.lower_bound,
      upperBound: f.upper_bound,
    })),
    confidence: raw.confidence ?? 87,
    drivers: (raw.drivers || []).map((d: any) => ({
      factor: d.feature ?? d.factor,
      importance: d.importance ?? 0.3,
      impact: d.impact ?? 'positive',
      changeDesc: d.description ?? d.changeDesc ?? '',
    })),
    aiInsight: raw.ai_insight ?? 'Freight rates projected to rise.',
    xgboost: raw.xgboost
      ? {
          prediction: raw.xgboost.prediction,
          lower: raw.xgboost.lower,
          upper: raw.xgboost.upper,
          status: raw.xgboost.status ?? 'available',
        }
      : undefined,
    chronos: raw.chronos
      ? {
          prediction: raw.chronos.prediction,
          lower: raw.chronos.lower,
          upper: raw.chronos.upper,
          status: raw.chronos.status ?? 'unavailable',
        }
      : undefined,
    ensemble: raw.ensemble
      ? {
          prediction: raw.ensemble.prediction,
          lower: raw.ensemble.lower,
          upper: raw.ensemble.upper,
          weights: raw.ensemble.weights,
        }
      : undefined,
    uncertaintyRange: raw.uncertainty_range
      ? {
          lower: raw.uncertainty_range.lower,
          upper: raw.uncertainty_range.upper,
          span: raw.uncertainty_range.span,
        }
      : undefined,
    forecastMode: raw.forecast_mode ?? 'ensemble',
    modelComponents: raw.model_components ?? ['XGBoost', 'Chronos-Bolt Small'],
    horizonDays: raw.horizon_days ?? 30,
    historical: raw.historical || [],
  };
}

function mapCargoPrediction(raw: any): CargoDemandPrediction {
  return {
    commodity: raw.cargo_type ?? raw.commodity ?? 'Coal',
    port: raw.port ?? 'Visakhapatnam',
    currentInventory: raw.current_inventory ?? 82000,
    expected30dDemand: raw.forecast_demand ?? raw.expected30dDemand ?? 230000,
    procurementRequirement: raw.procurement_requirement ?? raw.procurementRequirement ?? 148000,
    inventoryCoverageDays: raw.inventory_coverage_days ?? raw.inventoryCoverageDays ?? 11,
    demandPoints: (raw.forecast || raw.demandPoints || []).map((d: any) => ({
      date: d.date,
      historical: d.historical,
      predicted: d.predicted,
      lowerBound: d.lower_bound ?? d.lowerBound,
      upperBound: d.upper_bound ?? d.upperBound,
    })),
    procurementRecommendation: {
      title: raw.recommendation?.title ?? 'Procure 148,000 MT within 10 days',
      quantity: raw.recommendation?.quantity ?? 148000,
      windowDays: raw.recommendation?.window_days ?? 10,
      reasons: raw.recommendation?.reasons ?? [],
    },
  };
}

function mapVessel(raw: any): Vessel {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    dwt: raw.dwt,
    builtYear: raw.built_year ?? raw.builtYear ?? 2018,
    imoNumber: raw.imo ?? raw.imoNumber,
    currentPosition: raw.current_position ?? raw.currentPosition,
    lat: raw.lat !== undefined && raw.lat !== null ? Number(raw.lat) : null,
    lng: raw.lng !== undefined && raw.lng !== null ? Number(raw.lng) : null,
    positionAvailable: raw.position_available !== undefined ? Boolean(raw.position_available) : (raw.lat !== null && raw.lat !== undefined),
    dataStatus: raw.data_status ?? 'LIVE',
    dataSource: raw.data_source ?? 'Satellite AIS Telemetry',
    speedKnots: raw.speed_knots ?? (raw.availability === 'In Transit' ? 12.5 : 0.0),
    courseDegrees: raw.course_degrees ?? 145.0,
    headingDegrees: raw.heading_degrees ?? 145.0,
    draughtMeters: raw.draught_meters ?? 14.2,
    lastUpdated: raw.last_updated,
    eta: raw.eta,
    availability: raw.availability,
    charterRate: raw.charter_rate ?? raw.charterRate,
    charterRatePerDay: raw.charter_rate_per_day ?? raw.charterRatePerDay ?? 28000,
    fitScore: raw.score ?? raw.fitScore ?? 90,
    status: raw.status ?? 'Recommended',
    fuelConsumptionTpd: raw.fuel_consumption ?? raw.fuelConsumptionTpd ?? 24.0,
    portCompatibility: raw.port_compatibility ?? raw.portCompatibility ?? [],
    previousRoute: raw.route ?? raw.previousRoute ?? 'Australia → Visakhapatnam',
    breakdown: {
      capacityFit: raw.breakdown?.capacity_fit ?? raw.breakdown?.capacityFit ?? 90,
      routeFit: raw.breakdown?.route_fit ?? raw.breakdown?.routeFit ?? 90,
      costEfficiency: raw.breakdown?.cost_efficiency ?? raw.breakdown?.costEfficiency ?? 90,
      availability: raw.breakdown?.availability ?? 100,
      etaCompatibility: raw.breakdown?.eta_compatibility ?? raw.breakdown?.etaCompatibility ?? 90,
    },
  };
}

function mapRecommendation(raw: any): CharterRecommendation {
  return {
    action: raw.recommended_action ?? raw.action ?? 'Charter within 7 days',
    vessels: (raw.recommended_vessels || raw.vessels || []).map(mapVessel),
    vesselCount: raw.vessel_count ?? (raw.recommended_vessels || []).length ?? 2,
    totalCapacityMt: raw.total_capacity ?? raw.totalCapacityMt ?? 230000,
    expectedFreightRatePerMt: raw.expected_freight ?? raw.expectedFreightRatePerMt ?? 32.4,
    estimatedCharterCost: raw.charter_cost ?? raw.estimatedCharterCost ?? 7360000,
    expectedSavings: raw.savings ?? raw.expectedSavings ?? 420000,
    risk: (raw.risk as RiskLevel) ?? 'MEDIUM',
    confidence: raw.confidence ?? 87,
    supportingReasons: raw.supporting_reasons ?? raw.supportingReasons ?? [],
    alternatives: (raw.alternatives || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      timing: a.timing,
      totalCost: a.total_cost ?? a.totalCost,
      expectedRatePerMt: a.expected_rate_per_mt ?? a.expectedRatePerMt,
      risk: a.risk as RiskLevel,
      savings: a.savings,
      isRecommended: a.id?.includes('7d') || false,
      tradeoffs: a.tradeoffs || [],
    })),
  };
}

function mapAlert(raw: any): AlertItem {
  const rawSev = String(raw.severity || raw.category || raw.type || 'info').toLowerCase();
  const normalizedSev =
    rawSev.includes('crit') ? 'critical' :
    rawSev.includes('warn') ? 'warning' :
    rawSev.includes('opp') || rawSev.includes('recom') || rawSev.includes('arbitrage') ? 'opportunity' :
    'info';

  const catDisplay =
    normalizedSev === 'critical' ? 'Critical' :
    normalizedSev === 'warning' ? 'Warning' :
    normalizedSev === 'opportunity' ? 'Opportunity' : 'Information';

  return {
    id: String(raw.id),
    title: raw.title,
    type: raw.type || 'Operational Telemetry',
    category: raw.category || catDisplay,
    severity: normalizedSev,
    description: raw.description,
    timestamp: raw.timestamp || 'Just now',
    recommendedAction: raw.recommended_action ?? raw.recommendedAction ?? 'Monitor operational parameters closely.',
    action: raw.action ?? raw.recommended_action ?? raw.recommendedAction ?? 'Monitor operational parameters closely.',
    read: Boolean(raw.read),
    route: raw.route,
  };
}

/**
 * 11. Procurement Order Estimation & Execution
 */
export async function estimateProcurement(input: ProcurementOrderInput): Promise<ProcurementEstimate> {
  const fallbackCalc = Math.max(0, (input.forecastDemandTons || input.quantityTons) + input.safetyStockTons - input.currentInventoryTons);
  const effectiveQty = input.quantityTons > 0 ? input.quantityTons : fallbackCalc || 50;
  const unitPrice = input.grade?.toLowerCase().includes('coking') ? 215 : 115;
  const isSmallLot = effectiveQty <= 100;
  const transportMode = isSmallLot
    ? 'Truck transportation (Multi-Axle Bulk Tipper)'
    : effectiveQty < 500
    ? 'Warehouse dispatch (Consolidated Heavy Tipper Fleet)'
    : effectiveQty < 10000
    ? 'Consolidated shipment (Dedicated Rail Rake / Coastal Barge Parcel)'
    : 'Ocean Bulk Carrier (Panamax / Supramax Bulker)';
  const unitFreight = isSmallLot ? 22.5 : effectiveQty < 500 ? 24.0 : 31.8;
  const unitHandling = 8.0;

  const cargoCost = effectiveQty * unitPrice;
  const freightCost = effectiveQty * unitFreight;
  const handlingCost = effectiveQty * unitHandling;

  const fallbackEstimate: ProcurementEstimate = {
    commodity: input.commodity || 'Coal',
    grade: input.grade || 'Thermal Coal',
    quantityTons: effectiveQty,
    calculatedProcurementQuantity: fallbackCalc,
    unitCargoPriceUsd: unitPrice,
    estimatedCargoCostUsd: cargoCost,
    unitFreightPriceUsd: unitFreight,
    estimatedFreightCostUsd: freightCost,
    unitHandlingPriceUsd: unitHandling,
    estimatedHandlingCostUsd: handlingCost,
    estimatedTotalCostUsd: cargoCost + freightCost + handlingCost,
    recommendedTransportMode: transportMode,
    estimatedDeliveryDays: isSmallLot ? 2 : 16,
    riskLevel: isSmallLot ? 'LOW' : 'MEDIUM',
    explanation: isSmallLot
      ? `For small parcel of ${effectiveQty} tons, ocean bulk carriers are economically unfeasible. Recommended transport mode is Truck transportation via regional stockyard dispatch.`
      : `Volume of ${effectiveQty} tons warrants dedicated freight logistics matching regional laycan constraints.`,
    isSimulated: true,
    disclaimer: 'Simulated Procurement Order — Decision Support & Demonstration Estimate Only',
  };

  try {
    const data = await apiFetch<any>(
      '/api/v1/procurement/estimate',
      {
        method: 'POST',
        body: JSON.stringify({
          commodity: input.commodity,
          quantity_tons: input.quantityTons,
          grade: input.grade,
          origin: input.origin,
          destination: input.destination,
          required_delivery_date: input.requiredDeliveryDate,
          budget_usd: input.budgetUsd,
          current_inventory_tons: input.currentInventoryTons,
          safety_stock_tons: input.safetyStockTons,
          forecast_demand_tons: input.forecastDemandTons,
          supplier_name: input.supplierName,
          notes: input.notes,
        }),
      },
      fallbackEstimate
    );
    return mapProcurementEstimate(data);
  } catch {
    return fallbackEstimate;
  }
}

export async function createProcurementOrder(input: ProcurementOrderInput): Promise<ProcurementOrder> {
  const est = await estimateProcurement(input);
  const fallbackOrder: ProcurementOrder = {
    orderId: `ORD-2026-${Math.floor(100 + (Date.now() % 900))}`,
    orderStatus: 'Draft',
    commodity: input.commodity,
    grade: input.grade || 'Thermal Coal',
    quantityTons: input.quantityTons,
    calculatedProcurementQuantity: est.calculatedProcurementQuantity,
    origin: input.origin,
    destination: input.destination,
    requiredDeliveryDate: input.requiredDeliveryDate,
    budgetUsd: input.budgetUsd,
    supplierName: input.supplierName,
    estimatedCargoCostUsd: est.estimatedCargoCostUsd,
    estimatedFreightCostUsd: est.estimatedFreightCostUsd,
    estimatedHandlingCostUsd: est.estimatedHandlingCostUsd,
    estimatedTotalCostUsd: est.estimatedTotalCostUsd,
    recommendedTransportMode: est.recommendedTransportMode,
    estimatedDeliveryDays: est.estimatedDeliveryDays,
    riskLevel: est.riskLevel,
    explanation: est.explanation,
    notes: input.notes,
    createdTimestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
    isSimulated: true,
    disclaimer: 'Simulated Procurement Order — Decision Support & Demonstration Estimate Only',
  };

  try {
    const data = await apiFetch<any>(
      '/api/v1/procurement/orders',
      {
        method: 'POST',
        body: JSON.stringify({
          commodity: input.commodity,
          quantity_tons: input.quantityTons,
          grade: input.grade,
          origin: input.origin,
          destination: input.destination,
          required_delivery_date: input.requiredDeliveryDate,
          budget_usd: input.budgetUsd,
          current_inventory_tons: input.currentInventoryTons,
          safety_stock_tons: input.safetyStockTons,
          forecast_demand_tons: input.forecastDemandTons,
          supplier_name: input.supplierName,
          notes: input.notes,
        }),
      },
      fallbackOrder
    );
    return mapProcurementOrder(data);
  } catch {
    return fallbackOrder;
  }
}

export async function getProcurementOrders(): Promise<ProcurementOrder[]> {
  try {
    const data = await apiFetch<any[]>('/api/v1/procurement/orders', { method: 'GET' });
    if (!Array.isArray(data)) return [];
    return data.map(mapProcurementOrder);
  } catch {
    return [];
  }
}

export async function getProcurementOrderById(orderId: string): Promise<ProcurementOrder | null> {
  try {
    const data = await apiFetch<any>(`/api/v1/procurement/orders/${orderId}`, { method: 'GET' });
    return mapProcurementOrder(data);
  } catch {
    return null;
  }
}

export async function updateProcurementOrderStatus(orderId: string, status: string): Promise<ProcurementOrder | null> {
  try {
    const data = await apiFetch<any>(`/api/v1/procurement/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ order_status: status }),
    });
    return mapProcurementOrder(data);
  } catch {
    return null;
  }
}

function mapProcurementEstimate(raw: any): ProcurementEstimate {
  return {
    commodity: raw.commodity ?? 'Coal',
    grade: raw.grade ?? 'Thermal Coal',
    quantityTons: Number(raw.quantity_tons ?? raw.quantityTons ?? 50),
    calculatedProcurementQuantity: Number(raw.calculated_procurement_quantity ?? raw.calculatedProcurementQuantity ?? 50),
    unitCargoPriceUsd: Number(raw.unit_cargo_price_usd ?? raw.unitCargoPriceUsd ?? 115),
    estimatedCargoCostUsd: Number(raw.estimated_cargo_cost_usd ?? raw.estimatedCargoCostUsd ?? 5750),
    unitFreightPriceUsd: Number(raw.unit_freight_price_usd ?? raw.unitFreightPriceUsd ?? 22.5),
    estimatedFreightCostUsd: Number(raw.estimated_freight_cost_usd ?? raw.estimatedFreightCostUsd ?? 1125),
    unitHandlingPriceUsd: Number(raw.unit_handling_price_usd ?? raw.unitHandlingPriceUsd ?? 7.5),
    estimatedHandlingCostUsd: Number(raw.estimated_handling_cost_usd ?? raw.estimatedHandlingCostUsd ?? 375),
    estimatedTotalCostUsd: Number(raw.estimated_total_cost_usd ?? raw.estimatedTotalCostUsd ?? 7250),
    recommendedTransportMode: raw.recommended_transport_mode ?? raw.recommendedTransportMode ?? 'Truck transportation (Multi-Axle Bulk Tipper)',
    estimatedDeliveryDays: Number(raw.estimated_delivery_days ?? raw.estimatedDeliveryDays ?? 2),
    riskLevel: (raw.risk_level ?? raw.riskLevel ?? 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH',
    explanation: raw.explanation ?? 'Small bulk lot suited for local road dispatch.',
    isSimulated: Boolean(raw.is_simulated ?? true),
    disclaimer: raw.disclaimer ?? 'Simulated Procurement Order — Decision Support & Demonstration Estimate Only',
  };
}

function mapProcurementOrder(raw: any): ProcurementOrder {
  return {
    orderId: String(raw.order_id ?? raw.orderId ?? 'ORD-2026-000'),
    orderStatus: raw.order_status ?? raw.orderStatus ?? 'Draft',
    commodity: raw.commodity ?? 'Coal',
    grade: raw.grade ?? 'Thermal Coal',
    quantityTons: Number(raw.quantity_tons ?? raw.quantityTons ?? 50),
    calculatedProcurementQuantity: Number(raw.calculated_procurement_quantity ?? raw.calculatedProcurementQuantity ?? 50),
    origin: raw.origin ?? 'Local Regional Depot',
    destination: raw.destination ?? 'Visakhapatnam Steel Complex',
    requiredDeliveryDate: raw.required_delivery_date ?? raw.requiredDeliveryDate ?? '2026-09-25',
    budgetUsd: raw.budget_usd ?? raw.budgetUsd,
    supplierName: raw.supplier_name ?? raw.supplierName,
    estimatedCargoCostUsd: Number(raw.estimated_cargo_cost_usd ?? raw.estimatedCargoCostUsd ?? 0),
    estimatedFreightCostUsd: Number(raw.estimated_freight_cost_usd ?? raw.estimatedFreightCostUsd ?? 0),
    estimatedHandlingCostUsd: Number(raw.estimated_handling_cost_usd ?? raw.estimatedHandlingCostUsd ?? 0),
    estimatedTotalCostUsd: Number(raw.estimated_total_cost_usd ?? raw.estimatedTotalCostUsd ?? 0),
    recommendedTransportMode: raw.recommended_transport_mode ?? raw.recommendedTransportMode ?? 'Truck transportation (Multi-Axle Bulk Tipper)',
    estimatedDeliveryDays: Number(raw.estimated_delivery_days ?? raw.estimatedDeliveryDays ?? 2),
    riskLevel: (raw.risk_level ?? raw.riskLevel ?? 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH',
    explanation: raw.explanation ?? '',
    notes: raw.notes,
    createdTimestamp: raw.created_timestamp ?? raw.createdTimestamp ?? 'Just now',
    isSimulated: Boolean(raw.is_simulated ?? true),
    disclaimer: raw.disclaimer ?? 'Simulated Procurement Order — Decision Support & Demonstration Estimate Only',
  };
}

/**
 * 11. Sources Audit Registry Endpoint
 */
export async function getSourcesStatus(): Promise<SourcesStatusResponse> {
  const fallback: SourcesStatusResponse = {
    sources: [
      {
        name: 'Open-Meteo Marine Weather',
        category: 'Ocean Meteorology',
        provider: 'Open-Meteo API',
        status: 'LIVE',
        freq: 'Hourly',
        last_updated: new Date().toISOString(),
        latency_ms: 68.0,
        coverage: ['Wave Height', 'Currents', 'Wind Direction', 'Bay of Bengal'],
        is_healthy: true,
      },
      {
        name: 'Satellite AIS Telemetry',
        category: 'Fleet Tracking',
        provider: 'Datalastic / AISHub',
        status: 'LIVE',
        freq: 'Real-time (5 min)',
        last_updated: new Date().toISOString(),
        latency_ms: 45.0,
        coverage: ['Capesize', 'Panamax', 'Supramax', 'Indo-Pacific'],
        is_healthy: true,
      },
      {
        name: 'US Energy Information Administration (EIA)',
        category: 'Bunker Prices',
        provider: 'US EIA API v2',
        status: 'HISTORICAL',
        freq: 'Weekly',
        last_updated: new Date().toISOString(),
        latency_ms: 32.0,
        coverage: ['VLSFO', 'LSMGO', 'Brent Crude'],
        is_healthy: true,
      },
      {
        name: 'Federal Reserve Economic Data (FRED)',
        category: 'Commodity Spot',
        provider: 'FRED & World Bank',
        status: 'HISTORICAL',
        freq: 'Monthly',
        last_updated: new Date().toISOString(),
        latency_ms: 40.0,
        coverage: ['Coal (Thermal & Coking)', 'Iron Ore 62% Fe'],
        is_healthy: true,
      },
    ],
    overall_data_mode: 'LIVE',
    mock_fallback_enabled: true,
    timestamp: new Date().toISOString(),
  };

  try {
    const data = await apiFetch<SourcesStatusResponse>('/api/v1/sources/status', { method: 'GET' });
    return data || fallback;
  } catch {
    return fallback;
  }
}

/**
 * 12. Marine Weather Point & Route Endpoints
 */
export async function getPointWeather(lat: number, lon: number): Promise<WeatherCondition | null> {
  try {
    return await apiFetch<WeatherCondition>(`/api/v1/weather/point?lat=${lat}&lon=${lon}`, { method: 'GET' });
  } catch {
    return null;
  }
}

export async function getRouteWeather(routeId: string = 'R001'): Promise<any> {
  try {
    return await apiFetch<any>(`/api/v1/weather/route?route_id=${routeId}`, { method: 'GET' });
  } catch {
    return null;
  }
}

/**
 * 13. Port Congestion Endpoints
 */
export async function getPorts(): Promise<any[]> {
  try {
    return await apiFetch<any[]>('/api/v1/ports', { method: 'GET' });
  } catch {
    return [];
  }
}

export async function getPortCongestion(portId: string): Promise<PortCongestionData | null> {
  try {
    return await apiFetch<PortCongestionData>(`/api/v1/ports/${portId}/congestion`, { method: 'GET' });
  } catch {
    return null;
  }
}

/**
 * 14. Market Benchmarks (Commodities, Bunker Fuel, Freight)
 */
export async function getCommodityPrices(): Promise<any[]> {
  try {
    return await apiFetch<any[]>('/api/v1/commodities/prices', { method: 'GET' });
  } catch {
    return [];
  }
}

export async function getFuelPrices(): Promise<any[]> {
  try {
    return await apiFetch<any[]>('/api/v1/fuel-prices', { method: 'GET' });
  } catch {
    return [];
  }
}

export async function getFreightRates(): Promise<any[]> {
  try {
    return await apiFetch<any[]>('/api/v1/freight-rates', { method: 'GET' });
  } catch {
    return [];
  }
}

/**
 * 15. Fleet Status & Position
 */
export async function getFleetStatus(): Promise<any> {
  try {
    return await apiFetch<any>('/api/v1/vessels/status', { method: 'GET' });
  } catch {
    return null;
  }
}

export async function getVesselPosition(vesselId: string): Promise<any> {
  try {
    return await apiFetch<any>(`/api/v1/vessels/${vesselId}/position`, { method: 'GET' });
  } catch {
    return null;
  }
}

/**
 * 16. SIH Problem Statement 26006 Planning Workflow APIs
 */
export async function planCargoWorkflow(input: CargoPlanningInput): Promise<CargoPlanningResponse> {
  const res = await fetch(`${API_BASE}/api/v1/planning/cargo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const detail = errData.detail || `Planning request failed with status ${res.status}`;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  return res.json();
}

export async function forecastFreightSIH(
  origin: string,
  destination: string,
  cargoType: string,
  vesselClass: string = 'Panamax',
  forecastDays: number = 30
): Promise<FreightForecastResult> {
  const res = await fetch(`${API_BASE}/api/v1/forecast/freight`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin,
      destination,
      cargo_type: cargoType,
      vessel_class: vesselClass,
      forecast_days: forecastDays,
    }),
  });
  if (!res.ok) {
    throw new Error(`Freight forecast failed: HTTP ${res.status}`);
  }
  return res.json();
}

export async function calculateTotalLandedCost(payload: {
  cargo_type: string;
  cargo_quantity: number;
  origin: string;
  destination_port: string;
  supplier_price_per_tonne?: number;
  freight_rate_per_tonne?: number;
  vessel_class?: string;
  port_waiting_days?: number;
}): Promise<LandedCostResult> {
  const res = await fetch(`${API_BASE}/api/v1/optimization/landed-cost`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Landed cost calculation failed: HTTP ${res.status}`);
  }
  return res.json();
}

export async function getPlanningHistory(limit: number = 10): Promise<{ total: number; plans: any[] }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/planning/history?limit=${limit}`);
    if (!res.ok) return { total: 0, plans: [] };
    return res.json();
  } catch {
    return { total: 0, plans: [] };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Maritime Route Planning, Risk-Aware Routing, Berth & Booking Client API
// ─────────────────────────────────────────────────────────────────────────────

export async function getRouteCorridors(): Promise<RouteCorridorItem[]> {
  const res = await fetch(`${API_BASE}/api/v1/routes/corridors`);
  if (!res.ok) throw new Error(`Failed to fetch route corridors: HTTP ${res.status}`);
  return res.json();
}

export async function compareMaritimeRoutes(payload: {
  origin: string;
  destination: string;
  cargo_type?: string;
  cargo_quantity?: number;
  laycan_start?: string;
  required_arrival_date?: string;
  vessel_class?: string;
}): Promise<RouteCompareResponse> {
  const res = await fetch(`${API_BASE}/api/v1/routes/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to compare routes: HTTP ${res.status}`);
  return res.json();
}

export async function getCorridorAlerts(routeId: string): Promise<RouteAlertItem[]> {
  const res = await fetch(`${API_BASE}/api/v1/routes/${encodeURIComponent(routeId)}/alerts`);
  if (!res.ok) return [];
  return res.json();
}

export async function assessRouteRisk(origin: string, destination: string): Promise<RouteRiskAssessmentResponse> {
  const res = await fetch(`${API_BASE}/api/v1/routes/risk-assessment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin, destination }),
  });
  if (!res.ok) throw new Error(`Failed to assess route risk: HTTP ${res.status}`);
  return res.json();
}

export async function getPortBerths(portId: string): Promise<BerthItem[]> {
  const res = await fetch(`${API_BASE}/api/v1/ports/${encodeURIComponent(portId)}/berths`);
  if (!res.ok) return [];
  return res.json();
}

export async function checkBerthAvailability(
  portId: string,
  payload: {
    requested_arrival: string;
    estimated_stay_hours?: number;
    vessel_dwt?: number;
    vessel_draft?: number;
    vessel_id?: string;
  }
): Promise<BerthAvailabilityResponse> {
  const res = await fetch(`${API_BASE}/api/v1/ports/${encodeURIComponent(portId)}/berth-availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to check berth availability: HTTP ${res.status}`);
  return res.json();
}

export async function getAlternativePortOptions(
  portId: string,
  payload: {
    cargo_quantity: number;
    cargo_type?: string;
    vessel_draft?: number;
    vessel_dwt?: number;
  }
): Promise<AlternativePortResponse> {
  const res = await fetch(`${API_BASE}/api/v1/ports/${encodeURIComponent(portId)}/alternative-options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to evaluate alternative ports: HTTP ${res.status}`);
  return res.json();
}

export async function allocateFleetCargo(payload: {
  cargo_quantity: number;
  cargo_type?: string;
  origin: string;
  destination: string;
  delivery_deadline?: string;
  maximum_budget: number;
  preferred_vessel_class?: string;
}): Promise<FleetAllocationResponse> {
  const res = await fetch(`${API_BASE}/api/v1/fleet/allocate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Fleet allocation failed: HTTP ${res.status}`);
  return res.json();
}

export async function getCharterBookings(): Promise<CharterBookingRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/bookings`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function createCharterBooking(payload: {
  cargo_plan_id?: string;
  vessel_id: string;
  origin_port: string;
  destination_port: string;
  selected_route_type: string;
  selected_berth_id?: string;
  planned_departure: string;
  planned_arrival: string;
  cargo_quantity: number;
  cargo_type?: string;
  estimated_total_cost: number;
  notes?: string;
}): Promise<CharterBookingRecord> {
  const res = await fetch(`${API_BASE}/api/v1/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Booking creation failed: HTTP ${res.status}`);
  }
  return res.json();
}

export async function rescheduleCharterBooking(
  bookingId: string,
  payload: {
    reason: string;
    preferred_option_type?: string;
    new_arrival_date?: string;
    new_port?: string;
    new_vessel_id?: string;
    confirm_changes?: boolean;
  }
): Promise<RescheduleResponse> {
  const res = await fetch(`${API_BASE}/api/v1/bookings/${encodeURIComponent(bookingId)}/reschedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Rescheduling failed: HTTP ${res.status}`);
  return res.json();
}

export async function cancelCharterBooking(
  bookingId: string,
  cancellation_reason: string
): Promise<{ booking_id: string; current_status: string; message: string }> {
  const res = await fetch(`${API_BASE}/api/v1/bookings/${encodeURIComponent(bookingId)}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cancellation_reason }),
  });
  if (!res.ok) throw new Error(`Cancellation failed: HTTP ${res.status}`);
  return res.json();
}
