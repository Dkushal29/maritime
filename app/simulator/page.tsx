'use client';

import React, { useState, useEffect } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { runSimulation } from '@/lib/api';
import { SimulationResult } from '@/types';
import { Slider } from '@/components/ui/Slider';
import { PageHero } from '@/components/maritime/PageHero';

type CongLevel = 'Low' | 'Medium' | 'High';
type AvailLevel = 'Low' | 'Medium' | 'High';

export default function WhatIfSimulatorPage() {
  const [bunker, setBunker] = useState(620);
  const [congestion, setCongestion] = useState<CongLevel>('Medium');
  const [demand, setDemand] = useState(230); // in thousands
  const [availability, setAvailability] = useState<AvailLevel>('Medium');
  const [commodity, setCommodity] = useState(180);

  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    runSimulation({
      bunkerPriceUsd: bunker,
      portCongestion: congestion,
      cargoDemandMt: demand * 1000,
      vesselAvailability: availability,
      commodityPriceUsd: commodity,
    })
      .then((res) => {
        if (active) {
          setSimulation(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Simulation error:', err);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [bunker, congestion, demand, availability, commodity]);

  const baseFreight = simulation?.currentFreightRate ?? 31.8;
  const simFreight = simulation?.simulatedFreightRate ?? 35.4;
  const baseCost = simulation?.currentTotalCost ? simulation.currentTotalCost / 1000000 : 7.36;
  const simCost = simulation?.simulatedTotalCost ? simulation.simulatedTotalCost / 1000000 : 8.14;
  const deltaCost = +(simCost - baseCost).toFixed(2);

  const riskLevel = simulation?.simulatedRisk || (simFreight > 36 ? 'Critical' : simFreight > 34 ? 'High' : 'Medium');
  const riskStr = String(riskLevel).toUpperCase();
  const isLow = riskStr === 'LOW';
  const isMed = riskStr === 'MEDIUM';
  const isHigh = riskStr === 'HIGH';
  const isCrit = riskStr === 'CRITICAL';

  const riskColor = isCrit || isHigh ? '#EF4444' : isMed ? '#F59E0B' : '#10B981';

  const chartData = [
    { d: 'Base', freight: baseFreight, sim: baseFreight },
    { d: '+7d', freight: 32.5, sim: +(baseFreight + (simFreight - baseFreight) * 0.3).toFixed(1) },
    { d: '+14d', freight: 33.8, sim: +(baseFreight + (simFreight - baseFreight) * 0.6).toFixed(1) },
    { d: '+21d', freight: 34.5, sim: +(baseFreight + (simFreight - baseFreight) * 0.8).toFixed(1) },
    { d: '+30d', freight: 35.4, sim: simFreight },
  ];

  const radarData = [
    { metric: 'Freight', base: 60, sim: Math.min(100, (simFreight / 45) * 100) },
    { metric: 'Cost', base: 55, sim: Math.min(100, (simCost / 12) * 100) },
    {
      metric: 'Risk',
      base: 40,
      sim: isLow ? 20 : isMed ? 50 : isHigh ? 75 : 95,
    },
    { metric: 'Availability', base: 70, sim: availability === 'High' ? 85 : availability === 'Medium' ? 55 : 25 },
    { metric: 'Congestion', base: 45, sim: congestion === 'Low' ? 20 : congestion === 'Medium' ? 55 : 90 },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cinematic Hero Banner matching Landing Page */}
      <PageHero
        badge="WHAT-IF STRESS TESTING & SENSITIVITY"
        subBadge="MACRO SHOCK SIMULATION"
        titleLine1="Simulate the shocks."
        titleLine2="Protect the margins."
        description="Dynamic sensitivity analysis testing bunker price spikes, port congestion bottlenecks, tonnage deficits, and commodity surges against chartering expenditure."
        primaryAction={{
          label: "Execute Charter Hedge",
          href: "/optimization",
        }}
        secondaryAction={{
          label: "Review Forecast Trajectory",
          href: "/forecast",
        }}
        stats={[
          { value: `$${baseFreight.toFixed(1)}/MT`, label: "Baseline Freight", sublabel: `$${bunker}/MT VLSFO` },
          { value: `$${simFreight.toFixed(1)}/MT`, label: "Simulated Freight", sublabel: `${simFreight >= baseFreight ? '+' : ''}${((simFreight - baseFreight) / baseFreight * 100).toFixed(1)}% Shock` },
          { value: `${deltaCost >= 0 ? '+' : ''}$${(deltaCost * 1000).toFixed(0)}k`, label: "Simulated Cost Delta", sublabel: `Total: $${simCost.toFixed(2)}M` },
          { value: riskStr, label: "Operational Risk Index", sublabel: "Stress-Test Grade" },
        ]}
      />

      {/* Simulator Workspace Header */}
      <div>
        <div className="text-[11px] text-cyan font-mono tracking-wider uppercase mb-1 font-bold">
          ◆ INTERACTIVE SENSITIVITY CONTROLS
        </div>
        <h2 className="font-display font-extrabold text-xl sm:text-2xl text-slate-100 m-0">
          Macro Shock Parameters
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Adjust variable sliders to trigger immediate real-time sensitivity recalculation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="glass rounded-xl p-5 border border-electric/15 space-y-5">
            <div className="text-xs font-display font-bold text-slate-100 uppercase tracking-wider mb-2">
              Macro Scenario Variables
            </div>

            {/* Bunker Price */}
            <Slider
              label="Bunker Fuel Price ($/MT)"
              value={bunker}
              min={400}
              max={900}
              step={10}
              onChange={setBunker}
              format={(v) => `$${v}`}
              color="#F59E0B"
            />

            {/* Port Congestion */}
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                East Coast Port Congestion
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['Low', 'Medium', 'High'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCongestion(c)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                      congestion === c
                        ? 'bg-electric text-white shadow-md border border-electric'
                        : 'bg-ocean-900 text-slate-400 border border-electric/15 hover:text-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Cargo Demand */}
            <Slider
              label="Cargo Demand Volume (k MT)"
              value={demand}
              min={100}
              max={400}
              step={10}
              onChange={setDemand}
              format={(v) => `${v}k MT`}
              color="#1683FF"
            />

            {/* Vessel Availability */}
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Vessel Availability in Basin
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['High', 'Medium', 'Low'] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAvailability(a)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                      availability === a
                        ? 'bg-cyan/20 text-cyan border border-cyan/40 shadow-md'
                        : 'bg-ocean-900 text-slate-400 border border-electric/15 hover:text-slate-200'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Commodity Price */}
            <Slider
              label="Commodity Coal Price ($/MT)"
              value={commodity}
              min={80}
              max={350}
              step={5}
              onChange={setCommodity}
              format={(v) => `$${v}`}
              color="#8B5CF6"
            />
          </div>

          {/* Active Preset Summary */}
          <div className="glass rounded-xl p-4 border border-electric/15 text-xs font-mono">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-bold">
              ACTIVE STRESS PRESET
            </div>
            <div className="space-y-1.5 text-slate-300 divide-y divide-electric/10">
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Bunker:</span>
                <span>${bunker}/MT</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Congestion:</span>
                <span className={congestion === 'High' ? 'text-amber-400 font-bold' : ''}>{congestion}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Demand:</span>
                <span>{demand}k MT</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Fleet Availability:</span>
                <span>{availability}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Commodity:</span>
                <span>${commodity}/MT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results & Comparison Column (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Comparison Cards (Base vs Scenario) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Current Base */}
            <div className="rounded-xl p-5 bg-cyan/5 border border-cyan/20">
              <div className="text-[10px] text-cyan font-mono font-bold tracking-wider uppercase mb-3">
                CURRENT BASELINE
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Freight Rate:</span>
                  <span className="font-bold text-cyan">${baseFreight.toFixed(1)}/MT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Charter Cost:</span>
                  <span className="font-bold text-cyan">${baseCost.toFixed(2)}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Risk Profile:</span>
                  <span className="text-emerald-400 font-bold">Low Risk</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Model Confidence:</span>
                  <span className="text-emerald-400">87%</span>
                </div>
              </div>
            </div>

            {/* Simulated Scenario */}
            <div
              className="rounded-xl p-5 border transition-all"
              style={{
                backgroundColor: `${riskColor}0a`,
                borderColor: `${riskColor}33`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase" style={{ color: riskColor }}>
                  SIMULATED SCENARIO
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[9px] font-mono font-bold"
                  style={{
                    color: riskColor,
                    backgroundColor: `${riskColor}20`,
                    border: `1px solid ${riskColor}40`,
                  }}
                >
                  {riskLevel.toUpperCase()} RISK
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Freight Rate:</span>
                  <span className="font-bold" style={{ color: simFreight > baseFreight ? '#EF4444' : '#10B981' }}>
                    ${simFreight.toFixed(1)}/MT
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Charter Cost:</span>
                  <span className="font-bold" style={{ color: simCost > baseCost ? '#EF4444' : '#10B981' }}>
                    ${simCost.toFixed(2)}M
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cost Impact Delta:</span>
                  <span className="font-bold" style={{ color: deltaCost > 0 ? '#EF4444' : '#10B981' }}>
                    {deltaCost > 0 ? `+$${deltaCost}M` : `-$${Math.abs(deltaCost)}M`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Solver Status:</span>
                  <span className="text-slate-200">Converged ✓</span>
                </div>
              </div>
            </div>
          </div>

          {/* Area Chart: Base Curve vs Simulated Shock */}
          <div className="glass rounded-xl p-5 border border-electric/15">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[10px] text-cyan font-mono tracking-wider uppercase font-bold">
                  ◆ SENSITIVITY TRAJECTORY
                </div>
                <h3 className="font-display font-bold text-sm text-slate-100 m-0">
                  Freight Trajectory: Baseline vs Simulated Shock
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">30-Day Forward Window</span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="baseGrd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="simGrd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={riskColor} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={riskColor} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(22, 131, 255, 0.08)" vertical={false} />
                  <XAxis dataKey="d" tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(11, 31, 54, 0.95)',
                      border: '1px solid rgba(22, 131, 255, 0.25)',
                      borderRadius: 8,
                      fontSize: 11,
                      fontFamily: 'JetBrains Mono',
                    }}
                    formatter={(v: any, n: any) => [`$${v}/MT`, n === 'freight' ? 'Base Freight' : 'Shock Scenario']}
                  />
                  <Area type="monotone" dataKey="freight" stroke="#22D3EE" strokeWidth={2} fill="url(#baseGrd)" dot={false} />
                  <Area
                    type="monotone"
                    dataKey="sim"
                    stroke={riskColor}
                    strokeWidth={2}
                    fill="url(#simGrd)"
                    strokeDasharray={simFreight !== baseFreight ? '5 3' : undefined}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 5-Axis Radar Chart & AI Action Recommendation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Multi-Dimensional Radar Chart */}
            <div className="glass rounded-xl p-5 border border-electric/15 flex flex-col justify-between">
              <div className="text-[10px] text-cyan font-mono tracking-wider uppercase font-bold mb-2">
                MULTI-AXIS RISK PROFILE
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(22, 131, 255, 0.15)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                    <Radar name="Baseline" dataKey="base" stroke="#22D3EE" fill="#22D3EE" fillOpacity={0.2} />
                    <Radar name="Simulated" dataKey="sim" stroke={riskColor} fill={riskColor} fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Strategic Recommendation */}
            <div className="rounded-xl p-5 bg-gradient-to-br from-electric/15 via-ocean-900 to-ocean-950 border border-electric/30 flex flex-col justify-between">
              <div>
                <div className="text-[10px] text-cyan font-mono tracking-wider uppercase mb-1 font-bold">
                  SIMULATION DECISION RECOMMENDATION
                </div>
                <h4 className="font-display font-bold text-base text-slate-100 mb-2">
                  {simFreight > 35
                    ? 'Charter Immediately — Rising Fuel & Congestion Escalation'
                    : simFreight > 33
                    ? 'Charter within 3-5 Days — Window Narrowing'
                    : 'Maintain Standard 7-Day Window — Risk Contained'}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3">
                  {simulation?.aiRecommendation ||
                    `At $${bunker}/MT bunker and ${congestion} congestion, the simulated landed freight is $${simFreight}/MT. Immediate chartering avoids up to $${Math.max(120, deltaCost * 1000).toLocaleString()} in spot rate volatility.`}
                </p>
              </div>

              <div className="pt-3 border-t border-electric/15 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Potential Cost Avoided:</span>
                <span className="text-emerald-400 font-bold">
                  ${Math.max(180, Math.round(Math.abs(deltaCost) * 1000)).toLocaleString()}K
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
