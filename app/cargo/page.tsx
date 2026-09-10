'use client';

import React, { useState, useEffect } from 'react';
import GlobalFilterBar from '@/components/GlobalFilterBar';
import AIRecommendationCard from '@/components/AIRecommendationCard';
import { Boxes, Calendar, AlertTriangle, ShieldCheck, Download, Layers } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useAppStore } from '@/lib/store';
import { getCargoForecast } from '@/lib/api';
import { CargoDemandPrediction } from '@/types';

export default function CargoPage() {
  const { cargo, destination } = useAppStore();
  const [cargoData, setCargoData] = useState<CargoDemandPrediction | null>(null);

  useEffect(() => {
    getCargoForecast(cargo, destination).then(setCargoData);
  }, [cargo, destination]);

  if (!cargoData) {
    return <div className="p-8 text-center text-slate-400">Loading cargo demand models...</div>;
  }

  const rec = cargoData.procurementRecommendation;

  return (
    <div className="space-y-6">
      <GlobalFilterBar />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#131C31] border border-[#1E293B] rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400">Current Stock Inventory</span>
            <div className="text-2xl font-extrabold text-slate-100 font-mono mt-1">
              {cargoData.currentInventory.toLocaleString()} <span className="text-xs font-normal text-slate-400">MT</span>
            </div>
            <span className="text-[11px] text-amber-400 font-medium">Safety threshold: 65k MT</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-[#131C31] border border-[#1E293B] rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400">Expected 30D Demand</span>
            <div className="text-2xl font-extrabold text-cyan-400 font-mono mt-1">
              {cargoData.expected30dDemand.toLocaleString()} <span className="text-xs font-normal text-slate-400">MT</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium">+8.4% projected demand</span>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-[#131C31] border border-[#1E293B] rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400">Procurement Requirement</span>
            <div className="text-2xl font-extrabold text-amber-400 font-mono mt-1">
              {cargoData.procurementRequirement.toLocaleString()} <span className="text-xs font-normal text-slate-400">MT</span>
            </div>
            <span className="text-[11px] text-slate-400">Target window: 10 days</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-[#131C31] border border-[#1E293B] rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400">Inventory Coverage</span>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
              {cargoData.inventoryCoverageDays} <span className="text-xs font-normal text-slate-400">Days</span>
            </div>
            <span className="text-[11px] text-slate-400">Daily burn ~7.4k MT/day</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Demand Timeline Chart */}
      <div className="p-5 bg-[#131C31] border border-[#1E293B] rounded-xl shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              Bulk Cargo Consumption &amp; Import Demand Trajectory
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Port: <span className="text-cyan-400 font-bold">{destination}</span> | Commodity: <span className="text-cyan-400 font-bold">{cargo}</span>
          </span>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={cargoData.demandPoints} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis
                domain={['auto', 'auto']}
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="p-3 bg-[#0B1120] border border-[#1E293B] rounded-lg shadow-xl text-xs space-y-1 font-mono">
                        <p className="font-bold text-slate-200">{label}</p>
                        {d.historical !== undefined && (
                          <p className="text-blue-400">Historical Consumption: {d.historical.toLocaleString()} MT</p>
                        )}
                        <p className="text-cyan-400">Predicted Demand: {d.predicted.toLocaleString()} MT</p>
                        <p className="text-slate-400 text-[10px]">
                          Range: {d.lowerBound.toLocaleString()} - {d.upperBound.toLocaleString()} MT
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="upperBound" stroke="none" fill="#06B6D4" fillOpacity={0.12} />
              <Area type="monotone" dataKey="lowerBound" stroke="none" fill="#0B1120" fillOpacity={1.0} />
              <Line
                type="monotone"
                dataKey="historical"
                stroke="#3B82F6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#3B82F6' }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#06B6D4"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 4, fill: '#06B6D4' }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Procurement Recommendation Card */}
      <AIRecommendationCard
        title="AI CARGO PROCUREMENT RECOMMENDATION"
        recommendation={rec.title}
        confidence={87}
        reasons={rec.reasons}
        estimatedSavings={420000}
        risk="MEDIUM"
      />
    </div>
  );
}
