'use client';

import React, { useEffect, useState } from 'react';
import ValueChainBanner from '@/components/ValueChainBanner';
import GlobalFilterBar from '@/components/GlobalFilterBar';
import KPICard from '@/components/KPICard';
import AIRecommendationCard from '@/components/AIRecommendationCard';
import {
  DollarSign,
  TrendingUp,
  Boxes,
  Ship,
  Sparkles,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { getDashboardData } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import {
  FreightPrediction,
  CargoDemandPrediction,
  Vessel,
  CharterRecommendation,
} from '@/types';

export default function DashboardPage() {
  const { origin, destination, cargo, vesselType, dateRange } = useAppStore();
  const [data, setData] = useState<{
    freight: FreightPrediction;
    cargo: CargoDemandPrediction;
    vessels: Vessel[];
    recommendation: CharterRecommendation;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getDashboardData().then((res) => {
      setData(res);
      setIsLoading(false);
    });
  }, [origin, destination, cargo, vesselType, dateRange]);

  if (isLoading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-14 bg-[#131C31] rounded-xl" />
        <div className="h-12 bg-[#131C31] rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-[#131C31] rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-[#131C31] rounded-xl" />
        <div className="h-64 bg-[#131C31] rounded-xl" />
      </div>
    );
  }

  const { freight, cargo: cargoData, vessels, recommendation } = data;

  const sparklineData = [
    { value: 30.5 },
    { value: 31.0 },
    { value: 31.3 },
    { value: 31.5 },
    { value: 31.8 },
    { value: 33.1 },
    { value: 35.4 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Value Chain Navigation Visual */}
      <ValueChainBanner />

      {/* Global Persistence Filters */}
      <GlobalFilterBar />

      {/* 6 Key Enterprise KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1: Current Freight */}
        <KPICard
          title="Current Freight"
          value={`$${freight.currentRate}`}
          unit="/ MT"
          change="↓ 3.2% vs prior week"
          changeType="positive"
          subtitle={`${origin} → ${destination}`}
          icon={DollarSign}
          sparklineData={sparklineData.slice(0, 5)}
          sparklineColor="#10B981"
        />

        {/* KPI 2: Forecast Freight */}
        <KPICard
          title="Forecast Freight"
          value={`$${freight.predicted30dRate}`}
          unit="/ MT"
          change={`↑ +${freight.changePercent}% 30-day`}
          changeType="negative"
          subtitle={`${freight.confidence}% AI Model Confidence`}
          icon={TrendingUp}
          sparklineData={sparklineData}
          sparklineColor="#06B6D4"
        />

        {/* KPI 3: Cargo Requirement */}
        <KPICard
          title="Cargo Requirement"
          value={cargoData.expected30dDemand.toLocaleString()}
          unit="MT"
          change="↑ +8.4% projected demand"
          changeType="neutral"
          subtitle={`${cargoData.inventoryCoverageDays} days stock left`}
          icon={Boxes}
          sparklineData={[{ value: 72 }, { value: 76 }, { value: 81 }, { value: 95 }, { value: 124 }, { value: 230 }]}
          sparklineColor="#3B82F6"
        />

        {/* KPI 4: Available Vessels */}
        <KPICard
          title="Available Vessels"
          value={vessels.length.toString()}
          unit="open"
          change="4 recommended fit"
          changeType="positive"
          subtitle={`${vesselType} tonnage in basin`}
          icon={Ship}
          sparklineData={[{ value: 16 }, { value: 14 }, { value: 13 }, { value: 12 }]}
          sparklineColor="#818CF8"
        />

        {/* KPI 5: Estimated Charter Cost */}
        <KPICard
          title="Estimated Charter"
          value={`$${(recommendation.estimatedCharterCost / 1_000_000).toFixed(2)}M`}
          change={`$${(recommendation.expectedSavings / 1000).toFixed(0)}K potential saving`}
          changeType="positive"
          subtitle="Optimal 7-day window"
          icon={Sparkles}
          sparklineData={[{ value: 7.8 }, { value: 7.36 }, { value: 8.04 }]}
          sparklineColor="#10B981"
        />

        {/* KPI 6: Market Risk */}
        <KPICard
          title="Market Risk"
          value="MEDIUM"
          change="Bunker & Congestion"
          changeType="negative"
          subtitle="East Coast Port Delay 3.8d"
          icon={AlertTriangle}
          badgeColor="text-amber-400"
        />
      </div>

      {/* Main Freight Forecast Chart Section */}
      <div className="p-5 bg-[#131C31] border border-[#1E293B] rounded-xl shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Freight Rate Forecast ({origin} → {destination})
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Historical Spot (Solid) vs XGBoost Prediction (Dashed) with 95% Confidence Band
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" /> Actual Rate
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-cyan-400 inline-block border-b border-dashed" /> Forecast Rate
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-cyan-500/20 rounded inline-block border border-cyan-500/30" /> 95% Band
            </span>
          </div>
        </div>

        {/* Recharts Chart */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={freight.predictions} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis
                domain={['auto', 'auto']}
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="p-3 bg-[#0B1120] border border-[#1E293B] rounded-lg shadow-xl text-xs space-y-1 font-mono">
                        <p className="font-bold text-slate-200">{label}</p>
                        {d.actual !== undefined && (
                          <p className="text-emerald-400">Actual Rate: ${d.actual}/MT</p>
                        )}
                        <p className="text-cyan-400">Predicted Rate: ${d.predicted}/MT</p>
                        <p className="text-slate-400 text-[10px]">
                          Range: ${d.lowerBound} - ${d.upperBound}/MT
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Confidence Band Area */}
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="none"
                fill="#06B6D4"
                fillOpacity={0.12}
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                stroke="none"
                fill="#0B1120"
                fillOpacity={1.0}
              />
              {/* Actual Line */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#10B981"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#10B981' }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
              {/* Forecast Line */}
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#06B6D4"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#06B6D4' }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
              {/* Today Marker */}
              <ReferenceLine x="Sep 01" stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'TODAY', fill: '#EF4444', fontSize: 10, position: 'top' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* AI Insight Line */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#0B1120] border border-cyan-500/20 text-xs text-slate-300">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-sans">
            <span className="font-bold text-cyan-400">AI Model Insight: </span>
            {freight.aiInsight}
          </p>
        </div>
      </div>

      {/* Key AI Recommendation Card */}
      <AIRecommendationCard
        title="AI CHARTER & PROCUREMENT RECOMMENDATION"
        recommendation={recommendation.action}
        confidence={recommendation.confidence}
        reasons={recommendation.supportingReasons}
        estimatedSavings={recommendation.expectedSavings}
        risk={recommendation.risk}
      />
    </div>
  );
}
