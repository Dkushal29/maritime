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
  RiskLevel,
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

// Utility helper to simulate network latency
const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 1:1 FastAPI Contract Mock API Service Layer
 */
export async function getDashboardData(): Promise<{
  freight: FreightPrediction;
  cargo: CargoDemandPrediction;
  vessels: Vessel[];
  recommendation: CharterRecommendation;
  alerts: AlertItem[];
}> {
  await delay(180);
  return {
    freight: mockFreightPrediction,
    cargo: mockCargoDemandPrediction,
    vessels: mockVessels,
    recommendation: mockCharterRecommendation,
    alerts: mockAlerts,
  };
}

export async function getFreightForecast(horizon: ForecastHorizon = '30D'): Promise<FreightPrediction> {
  await delay(220);
  let predictions = [...mockFreightPrediction.predictions];

  if (horizon === '7D') {
    predictions = predictions.slice(0, 6);
  } else if (horizon === '60D') {
    // extend 60 days
    predictions = [
      ...predictions,
      { date: 'Oct 10', predicted: 36.1, lowerBound: 34.0, upperBound: 38.2 },
      { date: 'Oct 20', predicted: 36.8, lowerBound: 34.5, upperBound: 39.1 },
      { date: 'Oct 30', predicted: 37.2, lowerBound: 34.8, upperBound: 39.6 },
    ];
  } else if (horizon === '90D') {
    predictions = [
      ...predictions,
      { date: 'Oct 15', predicted: 36.5, lowerBound: 34.2, upperBound: 38.8 },
      { date: 'Nov 01', predicted: 37.5, lowerBound: 34.9, upperBound: 40.1 },
      { date: 'Nov 15', predicted: 38.1, lowerBound: 35.2, upperBound: 41.0 },
      { date: 'Nov 30', predicted: 38.6, lowerBound: 35.5, upperBound: 41.8 },
    ];
  }

  return {
    ...mockFreightPrediction,
    predictions,
  };
}

export async function getCargoForecast(
  commodity: CargoType = 'Coal',
  port: Destination = 'Visakhapatnam'
): Promise<CargoDemandPrediction> {
  await delay(200);
  return {
    ...mockCargoDemandPrediction,
    commodity,
    port,
  };
}

export async function getVessels(filters?: {
  type?: string;
  status?: string;
  availability?: string;
  minDwt?: number;
}): Promise<Vessel[]> {
  await delay(150);
  let list = [...mockVessels];

  if (filters?.type && filters.type !== 'ALL') {
    list = list.filter((v) => v.type.toLowerCase() === filters.type?.toLowerCase());
  }
  if (filters?.availability && filters.availability !== 'ALL') {
    list = list.filter((v) => v.availability.toLowerCase() === filters.availability?.toLowerCase());
  }
  if (filters?.minDwt) {
    list = list.filter((v) => v.dwt >= (filters.minDwt || 0));
  }

  return list;
}

export async function optimizeCharter(
  input: CharterOptimizationInput
): Promise<CharterRecommendation> {
  await delay(400); // simulate optimization processing engine latency

  const baseCapacity = input.quantityMt;
  const rateMultiplier = input.cargo === 'Coal' ? 1.0 : 1.08;
  const expectedRate = Number((32.4 * rateMultiplier).toFixed(1));
  const estimatedCost = Math.round(baseCapacity * expectedRate);
  const potentialSavings = Math.round(estimatedCost * 0.054);

  return {
    ...mockCharterRecommendation,
    totalCapacityMt: baseCapacity,
    expectedFreightRatePerMt: expectedRate,
    estimatedCharterCost: estimatedCost,
    expectedSavings: potentialSavings,
    supportingReasons: [
      `Locking in vessel allocation for ${input.quantityMt.toLocaleString()} MT of ${input.cargo} on ${input.origin} → ${input.destination} within 7 days.`,
      `Optimal match with Panamax tonnage avoiding predicted 11.3% freight escalation over 30 days.`,
      `Secures cost avoidance of approx $${potentialSavings.toLocaleString()} compared to 30-day delayed spot chartering.`,
    ],
  };
}

export async function runSimulation(input: SimulationInput): Promise<SimulationResult> {
  await delay(300);

  // Responsive formula calculation based on user sliders/inputs
  const bunkerImpact = (input.bunkerPriceUsd - 620) * 0.035; // $10 increase in bunker adds ~$0.35/MT
  const congestionImpact =
    input.portCongestion === 'High' ? 4.5 : input.portCongestion === 'Low' ? -1.5 : 0;
  const demandImpact = (input.cargoDemandMt - 230000) * 0.00002;
  const availImpact =
    input.vesselAvailability === 'Low' ? 3.2 : input.vesselAvailability === 'High' ? -2.0 : 0;
  const commodityImpact = (input.commodityPriceUsd - 120) * 0.015;

  const currentFreightRate = 31.8;
  const simulatedFreightRate = Number(
    Math.max(
      22.0,
      currentFreightRate + bunkerImpact + congestionImpact + demandImpact + availImpact + commodityImpact
    ).toFixed(1)
  );

  const cargoQuantity = 230000;
  const currentTotalCost = Math.round(cargoQuantity * 32.0); // ~$7.36M
  const simulatedTotalCost = Math.round(cargoQuantity * simulatedFreightRate);
  const costDifference = simulatedTotalCost - currentTotalCost;
  const additionalCostAvoided = Math.max(0, costDifference);

  let simulatedRisk: RiskLevel = 'MEDIUM';
  if (simulatedFreightRate > 37.0 || input.portCongestion === 'High') {
    simulatedRisk = 'HIGH';
  } else if (simulatedFreightRate < 31.0 && input.portCongestion === 'Low') {
    simulatedRisk = 'LOW';
  }

  let aiRecommendation = 'Charter within 7 days to maintain base rate of $32.4/MT.';
  if (simulatedFreightRate > 36.0) {
    aiRecommendation = 'Charter immediately! High risk of freight cost explosion under current simulated parameters.';
  } else if (simulatedFreightRate < 30.0) {
    aiRecommendation = 'Consider waiting 10-14 days as market softening indicates favorable spot rates ahead.';
  }

  return {
    currentFreightRate,
    currentTotalCost,
    currentRisk: 'MEDIUM',
    simulatedFreightRate,
    simulatedTotalCost,
    simulatedRisk,
    costDifference,
    additionalCostAvoided,
    aiRecommendation,
  };
}

export async function getRouteAnalytics(): Promise<RouteMetric[]> {
  await delay(180);
  return mockRouteMetrics;
}

export async function getAlerts(): Promise<AlertItem[]> {
  await delay(120);
  return mockAlerts;
}

export async function getModelMetrics(): Promise<ModelPerformanceMetric> {
  await delay(150);
  return mockModelPerformance;
}
