'use client';

import React, { useState, useEffect } from 'react';
import GlobalFilterBar from '@/components/GlobalFilterBar';
import { Sliders, RefreshCw, AlertTriangle, ArrowRight, ShieldAlert, Sparkles, DollarSign } from 'lucide-react';
import { runSimulation } from '@/lib/api';
import { SimulationResult, RiskLevel } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function SimulatorPage() {
  const [bunkerPrice, setBunkerPrice] = useState(620);
  const [portCongestion, setPortCongestion] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [cargoDemand, setCargoDemand] = useState(230000);
  const [vesselAvailability, setVesselAvailability] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [commodityPrice, setCommodityPrice] = useState(120);

  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = async () => {
    setIsSimulating(true);
    const res = await runSimulation({
      bunkerPriceUsd: bunkerPrice,
      portCongestion,
      cargoDemandMt: cargoDemand,
      vesselAvailability,
      commodityPriceUsd: commodityPrice,
    });
    setSimulation(res);
    setIsSimulating(false);
  };

  // Recalculate whenever sliders change
  useEffect(() => {
    handleSimulate();
  }, [bunkerPrice, portCongestion, cargoDemand, vesselAvailability, commodityPrice]);

  return (
    <div className="space-y-6">
      <GlobalFilterBar />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-1 p-5 bg-[#131C31] border border-[#1E293B] rounded-xl shadow-md space-y-5">
          <div className="flex items-center gap-2 border-b border-[#1E293B] pb-3">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase font-mono">
              Market Shock Controls
            </h2>
          </div>

          {/* Slider 1: Bunker Price */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Bunker Fuel (VLSFO)</span>
              <span className="font-bold text-cyan-400">${bunkerPrice}/MT</span>
            </div>
            <input
              type="range"
              min="500"
              max="800"
              step="5"
              value={bunkerPrice}
              onChange={(e) => setBunkerPrice(Number(e.target.value))}
              className="w-full h-1.5 bg-[#0B1120] rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>$500</span>
              <span>$620 (Base)</span>
              <span>$800</span>
            </div>
          </div>

          {/* Selector 2: Port Congestion */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-300 block">East Coast Port Congestion</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Low', 'Medium', 'High'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setPortCongestion(lvl)}
                  className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                    portCongestion === lvl
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-[#0B1120] text-slate-400 border-[#1E293B]'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Slider 3: Cargo Demand Volume */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Regional Cargo Demand</span>
              <span className="font-bold text-cyan-400">{(cargoDemand / 1000).toFixed(0)}k MT</span>
            </div>
            <input
              type="range"
              min="150000"
              max="350000"
              step="5000"
              value={cargoDemand}
              onChange={(e) => setCargoDemand(Number(e.target.value))}
              className="w-full h-1.5 bg-[#0B1120] rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Selector 4: Vessel Availability */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-300 block">Indo-Pacific Vessel Supply</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Low', 'Medium', 'High'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setVesselAvailability(lvl)}
                  className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                    vesselAvailability === lvl
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-[#0B1120] text-slate-400 border-[#1E293B]'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Slider 5: Commodity Spot Price */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Coal Spot Price (FOB)</span>
              <span className="font-bold text-cyan-400">${commodityPrice}/MT</span>
            </div>
            <input
              type="range"
              min="80"
              max="180"
              step="2"
              value={commodityPrice}
              onChange={(e) => setCommodityPrice(Number(e.target.value))}
              className="w-full h-1.5 bg-[#0B1120] rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <button
            onClick={handleSimulate}
            className="w-full py-2.5 rounded-lg bg-[#0B1120] border border-[#1E293B] text-slate-300 hover:text-slate-100 font-mono text-xs flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>Recalculate Stress Test</span>
          </button>
        </div>

        {/* Comparison Output Column */}
        <div className="lg:col-span-2 space-y-6">
          {simulation && (
            <>
              {/* Avoided Cost Callout Banner */}
              <div className="p-5 bg-gradient-to-r from-[#131C31] via-[#162544] to-[#131C31] border border-cyan-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-cyan-400">
                      POTENTIAL COST IMPACT
                    </span>
                    <h3 className="text-lg font-bold text-slate-100">
                      {simulation.costDifference > 0 ? (
                        <>
                          Projected Cost Escalation: <span className="text-red-400 font-mono">+{formatCurrency(simulation.costDifference)}</span>
                        </>
                      ) : (
                        <>
                          Projected Cost Reduction: <span className="text-emerald-400 font-mono">{formatCurrency(simulation.costDifference)}</span>
                        </>
                      )}
                    </h3>
                  </div>
                </div>

                <div className="px-4 py-2 rounded-lg bg-[#0B1120] border border-[#1E293B] text-right font-mono">
                  <span className="text-[10px] text-slate-400 uppercase block">Additional Cost Avoided</span>
                  <span className="text-xl font-extrabold text-emerald-400">
                    {formatCurrency(simulation.additionalCostAvoided)}
                  </span>
                </div>
              </div>

              {/* Side-by-side comparison cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Baseline Scenario */}
                <div className="p-5 bg-[#131C31] border border-[#1E293B] rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase">Current Scenario (Base)</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold">
                      {simulation.currentRisk} RISK
                    </span>
                  </div>

                  <div className="space-y-2 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Freight Rate</span>
                      <div className="text-2xl font-extrabold text-slate-100">${simulation.currentFreightRate}/MT</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Estimated Total Cost</span>
                      <div className="text-xl font-bold text-slate-300">{formatCurrency(simulation.currentTotalCost)}</div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 pt-2 border-t border-[#1E293B]">
                    Based on standard market parameters ($620 bunker, medium port delays).
                  </div>
                </div>

                {/* Simulated Scenario */}
                <div className="p-5 bg-[#131C31] border border-cyan-500/40 rounded-xl space-y-4 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                  <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 uppercase">Simulated Scenario (Stress Test)</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        simulation.simulatedRisk === 'HIGH'
                          ? 'bg-red-500/10 text-red-400 border-red-500/30'
                          : simulation.simulatedRisk === 'MEDIUM'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {simulation.simulatedRisk} RISK
                    </span>
                  </div>

                  <div className="space-y-2 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Simulated Freight Rate</span>
                      <div className="text-2xl font-extrabold text-cyan-400">${simulation.simulatedFreightRate}/MT</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Simulated Total Cost</span>
                      <div className="text-xl font-bold text-slate-100">{formatCurrency(simulation.simulatedTotalCost)}</div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-300 pt-2 border-t border-[#1E293B]">
                    <span className="font-bold text-cyan-400">AI Recommendation: </span>
                    {simulation.aiRecommendation}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
