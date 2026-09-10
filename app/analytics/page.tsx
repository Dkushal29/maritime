'use client';

import React, { useState, useEffect } from 'react';
import GlobalFilterBar from '@/components/GlobalFilterBar';
import { BarChart3, TrendingUp, Cpu, Activity, Info, CheckCircle2, Sliders } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { getModelMetrics } from '@/lib/api';
import { mockSHAPContributions } from '@/data/mockData';
import { ModelPerformanceMetric } from '@/types';

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<ModelPerformanceMetric | null>(null);
  const [activeTab, setActiveTab] = useState<'trends' | 'correlation' | 'performance' | 'explainability'>('trends');

  useEffect(() => {
    getModelMetrics().then(setMetrics);
  }, []);

  if (!metrics) {
    return <div className="p-8 text-center text-slate-400">Loading model performance telemetries...</div>;
  }

  const { freightModel, demandModel } = metrics;

  return (
    <div className="space-y-6">
      <GlobalFilterBar />

      {/* Tabs Navigation Header */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#131C31] border border-[#1E293B] rounded-xl">
        {[
          { id: 'trends', label: '1. Trend Explorer', icon: TrendingUp },
          { id: 'correlation', label: '2. Correlation Matrix', icon: Activity },
          { id: 'performance', label: '3. Model Performance', icon: Cpu },
          { id: 'explainability', label: '4. SHAP Explainability', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-bold transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0B1120]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Section 1: Trend Explorer */}
      {(activeTab === 'trends' || activeTab === ('all' as any)) && (
        <div className="p-5 bg-[#131C31] border border-[#1E293B] rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-slate-100 font-mono">
                Multi-Metric Trend Explorer (Historical 2026)
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">Bunker vs Freight Rate Co-Movement</span>
          </div>

          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[
                  { date: 'May', freight: 28.4, bunker: 580, demand: 195 },
                  { date: 'Jun', freight: 29.8, bunker: 595, demand: 210 },
                  { date: 'Jul', freight: 31.2, bunker: 610, demand: 205 },
                  { date: 'Aug', freight: 30.5, bunker: 605, demand: 220 },
                  { date: 'Sep', freight: 31.8, bunker: 620, demand: 230 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="p-3 bg-[#0B1120] border border-[#1E293B] rounded-lg shadow-xl text-xs space-y-1 font-mono">
                          <p className="font-bold text-slate-200">{label} 2026</p>
                          <p className="text-cyan-400">Freight Rate: ${d.freight}/MT</p>
                          <p className="text-amber-400">Bunker VLSFO: ${d.bunker}/MT</p>
                          <p className="text-blue-400">Cargo Demand: {d.demand}k MT</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="freight" stroke="#06B6D4" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="bunker" stroke="#F59E0B" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Section 2: Correlation Matrix */}
      {activeTab === 'correlation' && (
        <div className="p-5 bg-[#131C31] border border-[#1E293B] rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-slate-100 font-mono">
              Feature Correlation Matrix (Pearson r Coefficient)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
            <div className="p-4 rounded-xl bg-[#0B1120] border border-[#1E293B] space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Bunker Price ↔ Freight</span>
                <span className="font-bold text-emerald-400">+0.82</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: '82%' }} />
              </div>
              <p className="text-[10px] text-slate-400">Strong positive linear correlation.</p>
            </div>

            <div className="p-4 rounded-xl bg-[#0B1120] border border-[#1E293B] space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Port Congestion ↔ Freight</span>
                <span className="font-bold text-emerald-400">+0.76</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: '76%' }} />
              </div>
              <p className="text-[10px] text-slate-400">High turnaround delay sensitivity.</p>
            </div>

            <div className="p-4 rounded-xl bg-[#0B1120] border border-[#1E293B] space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Vessel Supply ↔ Freight</span>
                <span className="font-bold text-red-400">-0.68</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800">
                <div className="h-full bg-red-400 rounded-full" style={{ width: '68%' }} />
              </div>
              <p className="text-[10px] text-slate-400">Inverse relationship with open tonnage.</p>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Model Performance Metrics */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Freight XGBoost */}
            <div className="p-5 bg-[#131C31] border border-[#1E293B] rounded-xl space-y-3">
              <div className="flex justify-between items-center border-b border-[#1E293B] pb-2">
                <h3 className="text-sm font-bold text-slate-100 font-mono">{freightModel.name}</h3>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold">
                  {freightModel.version}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-center p-3 rounded-lg bg-[#0B1120]">
                <div>
                  <span className="text-[10px] text-slate-400 block">MAE</span>
                  <span className="text-base font-bold text-slate-100">${freightModel.mae}/MT</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">RMSE</span>
                  <span className="text-base font-bold text-slate-100">${freightModel.rmse}/MT</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">R² Score</span>
                  <span className="text-base font-bold text-cyan-400">{freightModel.r2}</span>
                </div>
              </div>

              <div className="h-48 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={freightModel.actualVsPredicted}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="date" stroke="#64748B" fontSize={10} />
                    <YAxis stroke="#64748B" fontSize={10} domain={['auto', 'auto']} />
                    <Tooltip />
                    <Line type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={2} name="Actual" />
                    <Line type="monotone" dataKey="predicted" stroke="#06B6D4" strokeDasharray="3 3" name="Predicted" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Demand XGBoost */}
            <div className="p-5 bg-[#131C31] border border-[#1E293B] rounded-xl space-y-3">
              <div className="flex justify-between items-center border-b border-[#1E293B] pb-2">
                <h3 className="text-sm font-bold text-slate-100 font-mono">{demandModel.name}</h3>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold">
                  {demandModel.version}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-center p-3 rounded-lg bg-[#0B1120]">
                <div>
                  <span className="text-[10px] text-slate-400 block">MAE</span>
                  <span className="text-base font-bold text-slate-100">{(demandModel.mae / 1000).toFixed(1)}k MT</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">RMSE</span>
                  <span className="text-base font-bold text-slate-100">{(demandModel.rmse / 1000).toFixed(1)}k MT</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">R² Score</span>
                  <span className="text-base font-bold text-blue-400">{demandModel.r2}</span>
                </div>
              </div>

              <div className="h-48 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={demandModel.actualVsPredicted}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="date" stroke="#64748B" fontSize={10} />
                    <YAxis stroke="#64748B" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip />
                    <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={2} name="Actual" />
                    <Line type="monotone" dataKey="predicted" stroke="#60A5FA" strokeDasharray="3 3" name="Predicted" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#0B1120] border border-[#1E293B] rounded-lg text-center font-mono text-[11px] text-slate-400">
            Last trained: {freightModel.lastTrained} · Training window: {freightModel.trainingWindow} · {freightModel.featureCount} hyper-parameters
          </div>
        </div>
      )}

      {/* Section 4: Model Explainability (SHAP-Style) */}
      {activeTab === 'explainability' && (
        <div className="p-5 bg-[#131C31] border border-[#1E293B] rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100 font-mono">
              SHAP Explainability (Feature Force Breakdown for $35.4/MT Forecast)
            </h2>
          </div>

          <div className="space-y-3 pt-2">
            {mockSHAPContributions.map((item) => (
              <div key={item.feature} className="p-3 rounded-lg bg-[#0B1120] border border-[#1E293B] space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200">{item.feature}</span>
                  <span
                    className={`font-mono font-extrabold ${
                      item.direction === 'positive' ? 'text-cyan-400' : 'text-slate-400'
                    }`}
                  >
                    {item.direction === 'positive' ? `+${item.impactValue}%` : `${item.impactValue}%`}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.direction === 'positive' ? 'bg-cyan-400' : 'bg-slate-500'
                    }`}
                    style={{ width: `${Math.abs(item.impactValue) * 15}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-mono">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
