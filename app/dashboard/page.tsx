'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { getDashboardData, getFreightForecast } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { KPIStatCard } from '@/components/maritime/KPIStatCard';
import { RouteMap } from '@/components/maritime/RouteMap';
import { PortCard } from '@/components/maritime/PortCard';
import { RecommendationCard } from '@/components/maritime/RecommendationCard';
import { AlertCard } from '@/components/maritime/AlertCard';
import { PageHero } from '@/components/maritime/PageHero';
import { FreightPrediction, CargoDemandPrediction, Vessel, CharterRecommendation, AlertItem } from '@/types';

const PORTS = [
  { name: 'PARADIP', freight: '$30.2/MT', congestion: '22%', risk: 'Low' as const, vessels: 'High' },
  { name: 'VIZAG', freight: '$31.8/MT', congestion: '18%', risk: 'Low' as const, vessels: 'High' },
  { name: 'CHENNAI', freight: '$32.4/MT', congestion: '28%', risk: 'Medium' as const, vessels: 'Medium' },
  { name: 'KAMARAJAR', freight: '$32.1/MT', congestion: '25%', risk: 'Medium' as const, vessels: 'High' },
  { name: 'HALDIA', freight: '$33.0/MT', congestion: '31%', risk: 'High' as const, vessels: 'Low' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { origin, destination, cargo, vesselType } = useAppStore();
  const [data, setData] = useState<{
    freight: FreightPrediction;
    cargo: CargoDemandPrediction;
    vessels: Vessel[];
    recommendation: CharterRecommendation;
    alerts: AlertItem[];
  } | null>(null);
  const [forecast30d, setForecast30d] = useState<FreightPrediction | null>(null);
  const [selectedPort, setSelectedPort] = useState('VIZAG');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      getDashboardData(),
      getFreightForecast('30D'),
    ])
      .then(([dashRes, forecastRes]) => {
        setData(dashRes);
        setForecast30d(forecastRes);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Dashboard load error:', err);
        setIsLoading(false);
      });
  }, [origin, destination, cargo, vesselType]);

  if (isLoading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-72 bg-ocean-900 rounded-2xl border border-electric/15" />
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-ocean-900 rounded-xl border border-electric/15" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-ocean-900 rounded-xl border border-electric/15" />
          <div className="h-96 bg-ocean-900 rounded-xl border border-electric/15" />
        </div>
      </div>
    );
  }

  const { freight, cargo: cargoData, recommendation, alerts } = data;

  const kpis = [
    {
      label: 'Freight Rate',
      value: `$${freight.currentRate.toFixed(1)}`,
      unit: '/MT',
      trend: '+11.3%',
      isPositive: false,
      color: '#22D3EE',
      sparkline: [28, 29, 30, 28.5, 31, 30.5, freight.currentRate],
    },
    {
      label: '30D Forecast',
      value: `$${freight.predicted30dRate.toFixed(1)}`,
      unit: '/MT',
      trend: `Range $${(freight.uncertaintyRange?.lower ?? freight.predicted30dRate * 0.92).toFixed(1)}-$${(freight.uncertaintyRange?.upper ?? freight.predicted30dRate * 1.08).toFixed(1)}`,
      isPositive: false,
      color: '#1683FF',
      sparkline: [31.8, 32.2, 32.8, 33.5, 34.2, 34.8, freight.predicted30dRate],
    },
    {
      label: 'Cargo Demand',
      value: `${((cargoData.projectedDemand ?? cargoData.expected30dDemand) / 1000).toFixed(0)}k`,
      unit: ' MT',
      trend: `${(cargoData.demandTrendPercent ?? 8.4) > 0 ? '+' : ''}${(cargoData.demandTrendPercent ?? 8.4).toFixed(1)}%`,
      isPositive: true,
      color: '#8B5CF6',
      sparkline: [120, 140, 160, 185, 200, 215, (cargoData.projectedDemand ?? cargoData.expected30dDemand) / 1000],
    },
    {
      label: 'Inv. Coverage',
      value: `${cargoData.inventoryCoverageDays}`,
      unit: ' Days',
      trend: cargoData.inventoryCoverageDays < 15 ? 'Alert' : 'Stable',
      isPositive: cargoData.inventoryCoverageDays >= 15,
      color: cargoData.inventoryCoverageDays < 15 ? '#F59E0B' : '#10B981',
      sparkline: [25, 22, 18, 16, 14, 12, cargoData.inventoryCoverageDays],
    },
    {
      label: 'Optimal Charter',
      value: `$${(recommendation.estimatedCharterCost / 1000000).toFixed(2)}M`,
      unit: '',
      trend: 'Min Cost',
      isPositive: true,
      color: '#10B981',
      sparkline: [8.2, 8.0, 7.8, 7.6, 7.5, 7.4, recommendation.estimatedCharterCost / 1000000],
    },
    {
      label: 'Est. Savings',
      value: `$${(recommendation.expectedSavings / 1000).toFixed(0)}k`,
      unit: '',
      trend: '87% Conf.',
      isPositive: true,
      color: '#10B981',
      sparkline: [180, 240, 310, 350, 380, 400, recommendation.expectedSavings / 1000],
    },
  ];

  // Freight mini chart points from API predictions
  const miniChartData = (forecast30d?.predictions || []).slice(0, 12).map((p) => ({
    d: p.date,
    val: p.predicted ?? p.actual ?? 31.8,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Showcase Banner matching Landing Page */}
      <PageHero
        badge="GLOBAL MARITIME DECISION SUPPORT SYSTEM"
        subBadge="XGBOOST + CHRONOS-BOLT ENSEMBLE"
        titleLine1="Predict the market."
        titleLine2="Optimize the fleet."
        description="Enterprise AI decision support platform for bulk-cargo importers. Powered by XGBoost freight & demand forecasting, Chronos-Bolt Small sequence modeling, and OR-Tools MILP charter optimization."
        primaryAction={{
          label: "Explore Forecast Intelligence",
          href: "/forecast",
        }}
        secondaryAction={{
          label: "Run MILP Optimization",
          href: "/optimization",
        }}
        stats={[
          { value: "99.3%", label: "Freight Model R² Score", sublabel: "2026 Out-of-Sample" },
          { value: "$420K", label: "Avg. Charter Savings", sublabel: "Per 230k MT Laycan" },
          { value: "320+", label: "Vessel-Route Combos", sublabel: "Real-time Matrix" },
          { value: "-18%", label: "CO₂ Emissions Reduction", sublabel: "IMO CII Optimality" },
        ]}
      />

      {/* 6 Key Enterprise KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {kpis.map((kpi) => (
          <KPIStatCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Main Grid: Left (Map + East Coast Ports) | Right (AI Recommendation + Mini Trend + Alerts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Global Trade Network Map */}
          <div className="glass rounded-xl p-5 border border-electric/15">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] text-cyan font-mono tracking-wider uppercase mb-0.5 font-bold">
                  ◆ LIVE TRACKING & CORRIDORS
                </div>
                <h3 className="font-display font-bold text-base text-slate-100 m-0">
                  Global Trade Network — East Coast India Shipping Lanes
                </h3>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan" /> Active Route
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Safe Port
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Medium Congestion
                </span>
              </div>
            </div>

            <RouteMap
              highlightPort={selectedPort}
              onSelectPort={(p) => setSelectedPort(p)}
            />
          </div>

          {/* East Coast Maritime Pulse */}
          <div className="glass rounded-xl p-5 border border-electric/15">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] text-cyan font-mono tracking-wider uppercase mb-0.5 font-bold">
                  ◆ EAST COAST INDIA FOCUS
                </div>
                <h3 className="font-display font-bold text-base text-slate-100 m-0">
                  East Coast Maritime Terminal Pulse
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Selected: <strong className="text-cyan">{selectedPort}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {PORTS.map((port) => (
                <PortCard
                  key={port.name}
                  name={port.name}
                  freight={port.freight}
                  congestion={port.congestion}
                  vessels={port.vessels}
                  risk={port.risk}
                  selected={selectedPort === port.name}
                  onClick={() => setSelectedPort(port.name)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* AI Recommendation Card */}
          <RecommendationCard
            action={recommendation.action}
            reasons={
              recommendation.supportingReasons.length > 0
                ? recommendation.supportingReasons
                : [
                    'Freight projected to increase 11.3% over 30 days',
                    'Vessel availability declining across Indian Ocean',
                    'Cargo demand rising ahead of monsoon lull',
                    'Early charter locks in optimal landed margin',
                  ]
            }
            expectedSavings={`$${(recommendation.expectedSavings / 1000).toFixed(0)}K`}
            confidence={`${recommendation.confidence}%`}
            onPrimaryClick={() => router.push('/optimization')}
            onSecondaryClick={() => router.push('/simulator')}
            primaryLabel="View Optimization"
            secondaryLabel="Stress Test"
          />

          {/* Quick Freight Trend Mini Chart */}
          <div className="glass rounded-xl p-5 border border-electric/15">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[10px] text-cyan font-mono tracking-wider uppercase font-bold">
                  ◆ PREDICTIVE TREND
                </div>
                <h4 className="font-display font-bold text-sm text-slate-100 m-0">
                  30D Freight Rate Curve
                </h4>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-ai/20 text-purple-ai border border-purple-ai/30">
                XGBoost + Chronos Ensemble
              </span>
            </div>

            <div className="h-28 w-full mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={miniChartData.length > 0 ? miniChartData : [{ d: 'Day 1', val: 31.8 }, { d: 'Day 15', val: 33.5 }, { d: 'Day 30', val: 35.4 }]}>
                  <defs>
                    <linearGradient id="miniFg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="val"
                    stroke="#22D3EE"
                    strokeWidth={2}
                    fill="url(#miniFg)"
                    dot={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(11, 31, 54, 0.95)',
                      border: '1px solid rgba(22, 131, 255, 0.25)',
                      borderRadius: 6,
                      fontSize: 11,
                      fontFamily: 'JetBrains Mono',
                    }}
                    formatter={(v: any) => [`$${v}/MT`, 'Freight']}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-electric/10 font-mono text-center">
              <div>
                <div className="text-[9px] text-slate-500 uppercase">Spot Rate</div>
                <div className="text-xs font-bold text-cyan">${freight.currentRate.toFixed(1)}/MT</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-500 uppercase">Ensemble</div>
                <div className="text-xs font-bold text-emerald-400">${freight.predicted30dRate.toFixed(1)}/MT</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-500 uppercase">P10-P90 Range</div>
                <div className="text-[10px] font-bold text-slate-300">
                  ${(freight.uncertaintyRange?.lower ?? freight.predicted30dRate * 0.92).toFixed(1)}-${(freight.uncertaintyRange?.upper ?? freight.predicted30dRate * 1.08).toFixed(1)}
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push('/forecast')}
              className="w-full mt-3 py-2 text-xs font-mono text-slate-300 hover:text-cyan bg-electric/5 hover:bg-electric/10 rounded-lg border border-electric/15 transition-all text-center"
            >
              Open Full Forecast Workspace →
            </button>
          </div>

          {/* Active Alerts Summary */}
          <div className="glass rounded-xl p-5 border border-electric/15">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] text-cyan font-mono tracking-wider uppercase font-bold">
                ◆ ACTIVE ALERTS ({alerts.length})
              </div>
              <Link href="/alerts" className="text-[11px] font-mono text-cyan hover:underline">
                View All →
              </Link>
            </div>

            <div className="flex flex-col gap-2.5">
              {alerts.slice(0, 3).map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
