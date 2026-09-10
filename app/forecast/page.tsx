'use client';

import React, { useState, useEffect } from 'react';
import GlobalFilterBar from '@/components/GlobalFilterBar';
import {
  TrendingUp,
  Download,
  BarChart2,
  ShieldCheck,
  Info,
  Calendar,
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
import { useAppStore } from '@/lib/store';
import { getFreightForecast } from '@/lib/api';
import { FreightPrediction } from '@/types';

export default function ForecastPage() {
  const { origin, destination, cargo, vesselType, dateRange } = useAppStore();
  const [forecast, setForecast] = useState<FreightPrediction | null>(null);

  useEffect(() => {
    getFreightForecast(dateRange).then(setForecast);
  }, [dateRange, origin, destination, cargo, vesselType]);

  if (!forecast) {
    return <div className="p-8 text-center text-slate-400">Loading freight forecast models...</div>;
  }

  return (
    <div className="space-y-6">
      <GlobalFilterBar />

      {/* Header Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: 30D Forecast Summary */}
        <div className="p-4 bg-[#131C31] border border-[#1E293B] rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400">Predicted 30D Rate</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-cyan-400 font-mono">
                ${forecast.predicted30dRate}
              </span>
              <span className="text-xs font-semibold text-red-400">
                (+{forecast.changePercent}%)
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Current spot: ${forecast.currentRate}/MT</span>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Confidence Gauge */}
        <div className="p-4 bg-[#131C31] border border-[#1E293B] rounded-xl flex items-center justify-between">
          <div className="flex-1 pr-4">
            <span className="text-[10px] font-mono uppercase text-slate-400">Model Confidence</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold text-slate-100 font-mono">
                {forecast.confidence}%
              </span>
              <span className="text-xs text-slate-400 font-mono">XGBoost v1.0</span>
            </div>
            {/* Visual Gauge Progress Bar */}
            <div className="w-full h-2 rounded-full bg-[#0B1120] mt-2 overflow-hidden border border-[#1E293B]">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${forecast.confidence}%` }}
              />
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Horizon & Route Spec */}
        <div className="p-4 bg-[#131C31] border border-[#1E293B] rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400">Active Horizon</span>
            <div className="text-2xl font-bold text-slate-100 font-mono mt-1">{dateRange} Projection</div>
            <span className="text-[11px] text-cyan-400 font-medium">
              {origin} → {destination}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Large Freight Forecast Chart */}
      <div className="p-5 bg-[#131C31] border border-[#1E293B] rounded-xl shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              Freight Forecast &amp; Uncertainty Envelope
            </h2>
          </div>
        </div>

        <div className="h-96 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecast.predictions} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
                          Lower Bound: ${d.lowerBound} | Upper Bound: ${d.upperBound}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="upperBound" stroke="none" fill="#06B6D4" fillOpacity={0.15} />
              <Area type="monotone" dataKey="lowerBound" stroke="none" fill="#0B1120" fillOpacity={1.0} />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#10B981"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#10B981' }}
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
              <ReferenceLine x="Sep 01" stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'TODAY', fill: '#EF4444', fontSize: 10, position: 'top' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Forecast Drivers + Forecast Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forecast Drivers Section */}
        <div className="p-5 bg-[#131C31] border border-[#1E293B] rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase font-mono">
              Forecast Drivers (Feature Importance)
            </h3>
          </div>

          <div className="space-y-3 pt-2">
            {forecast.drivers.map((driver) => {
              const pct = Math.round(driver.importance * 100);
              return (
                <div key={driver.factor} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-200">{driver.factor}</span>
                    <span className="font-mono text-cyan-400 font-bold">{pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#0B1120] overflow-hidden border border-[#1E293B]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        driver.impact === 'positive' ? 'bg-cyan-400' : 'bg-slate-500'
                      }`}
                      style={{ width: `${pct * 2.5}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">{driver.changeDesc}</p>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-lg bg-[#0B1120] border border-cyan-500/20 text-xs text-slate-300 flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <span className="font-bold text-cyan-400">Natural Language Summary: </span>
              Port Congestion is currently the strongest upward pressure on projected rates, followed by VLSFO bunker price movements in Singapore.
            </p>
          </div>
        </div>

        {/* Forecast Data Table */}
        <div className="p-5 bg-[#131C31] border border-[#1E293B] rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 uppercase font-mono">
              Daily Forecast Schedule
            </h3>
            <button
              onClick={() => alert('Exported daily forecast table to CSV')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0B1120] border border-[#1E293B] text-[11px] text-slate-300 hover:text-cyan-400 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1E293B] text-slate-400 text-[10px] uppercase">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Predicted Rate</th>
                  <th className="py-2 px-3">Lower Bound</th>
                  <th className="py-2 px-3">Upper Bound</th>
                  <th className="py-2 px-3">Change vs Today</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {forecast.predictions.map((row) => {
                  const diff = Number((row.predicted - forecast.currentRate).toFixed(1));
                  const isUp = diff > 0;
                  return (
                    <tr key={row.date} className="hover:bg-[#1C2942]/50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{row.date}</td>
                      <td className="py-2.5 px-3 text-cyan-400 font-bold">${row.predicted}/MT</td>
                      <td className="py-2.5 px-3 text-slate-400">${row.lowerBound}</td>
                      <td className="py-2.5 px-3 text-slate-400">${row.upperBound}</td>
                      <td className={`py-2.5 px-3 font-bold ${isUp ? 'text-red-400' : 'text-emerald-400'}`}>
                        {isUp ? `+$${diff}` : `$${diff}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
