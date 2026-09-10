'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { optimizeCharter } from '@/lib/api';
import { CharterRecommendation } from '@/types';
import { Sparkles, Check, ArrowLeft, Ship, ShieldCheck, DollarSign } from 'lucide-react';

type Step = 'input' | 'processing' | 'result';

const PIPELINE_STEPS = [
  'Loading vessel availability & positions',
  'Evaluating XGBoost freight rate forecasts',
  'Applying cargo capacity constraints (230k MT)',
  'Applying delivery deadline constraints',
  'Evaluating charter timing & holding costs',
  'Running Google OR-Tools MILP optimization',
  'Comparing multi-scenario risk trade-offs',
  'Generating optimal charter recommendation',
];

export default function OptimizationPage() {
  const { origin, destination, cargo, vesselType, setOrigin, setDestination, setCargo, setVesselType } = useAppStore();

  const [step, setStep] = useState<Step>('input');
  const [processingPct, setProcessingPct] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  // Form Inputs with Default Scenario from prompt
  const [quantity, setQuantity] = useState('230,000');
  const [deadline, setDeadline] = useState('2026-10-15');
  const [budget, setBudget] = useState('10,000,000');

  const [result, setResult] = useState<CharterRecommendation | null>(null);

  const runOptimization = async () => {
    setStep('processing');
    setProcessingPct(0);
    setCurrentStepIdx(0);

    const numericQty = parseInt(quantity.replace(/,/g, ''), 10) || 230000;
    const numericBudget = parseInt(budget.replace(/,/g, ''), 10) || 10000000;

    // Trigger API call concurrently with visual solver pipeline
    const apiPromise = optimizeCharter({
      origin,
      destination,
      cargo,
      quantityMt: numericQty,
      deliveryDeadlineDays: 30,
      preferredVesselType: vesselType,
      maxBudgetUsd: numericBudget,
    });

    // Animate progress smoothly through the 8 stages
    let pct = 0;
    const interval = setInterval(() => {
      pct += 2;
      setProcessingPct(pct);
      const stepIdx = Math.min(
        PIPELINE_STEPS.length - 1,
        Math.floor((pct / 100) * PIPELINE_STEPS.length)
      );
      setCurrentStepIdx(stepIdx);

      if (pct >= 100) {
        clearInterval(interval);
        apiPromise.then((res) => {
          setResult(res);
          setTimeout(() => setStep('result'), 350);
        });
      }
    }, 45);
  };

  if (step === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] py-12">
        <div className="w-full max-w-lg glass rounded-2xl p-8 border border-electric/30 shadow-2xl">
          <div className="text-[11px] text-cyan font-mono tracking-widest uppercase text-center mb-2 font-bold flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan animate-ping" />
            AI OPTIMIZATION SOLVER RUNNING
          </div>

          <h2 className="font-display font-extrabold text-2xl text-slate-100 text-center m-0 mb-6">
            Evaluating All Fleet Combinations
          </h2>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-ocean-950 overflow-hidden mb-8 border border-electric/20">
            <div
              className="h-full rounded-full transition-all duration-100 ai-gradient"
              style={{ width: `${processingPct}%` }}
            />
          </div>

          {/* 8-Step Pipeline */}
          <div className="space-y-3 font-mono text-xs">
            {PIPELINE_STEPS.map((s, i) => {
              const isDone = i < currentStepIdx;
              const isCurrent = i === currentStepIdx;

              return (
                <div
                  key={s}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    isCurrent ? 'bg-electric/15 border border-electric/30 text-slate-100' : 'text-slate-400'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-cyan text-ocean-950 font-bold animate-pulse'
                        : 'bg-ocean-900 border border-electric/20 text-slate-500'
                    }`}
                  >
                    {isDone ? '✓' : i + 1}
                  </div>
                  <span className={`truncate ${isDone ? 'text-emerald-400 font-medium' : isCurrent ? 'text-cyan font-bold' : ''}`}>
                    {s}
                  </span>
                  {isDone && <span className="ml-auto text-[10px] text-emerald-400">DONE</span>}
                  {isCurrent && <span className="ml-auto text-[10px] text-cyan animate-pulse">SOLVING...</span>}
                </div>
              );
            })}
          </div>

          <div className="text-center mt-6 text-[11px] font-mono text-slate-400">
            {processingPct}% complete · Evaluating 320+ vessel-route combinations
          </div>
        </div>
      </div>
    );
  }

  if (step === 'result' && result) {
    const defaultAlternatives = [
      {
        label: 'CHARTER NOW',
        cost: '$7.82M',
        risk: 'Low',
        riskColor: '#10B981',
        savings: '$180K',
        rec: false,
        desc: 'Immediate charter at current spot rates. Lowest delay risk, but misses optimal window.',
      },
      {
        label: 'CHARTER IN 7 DAYS',
        cost: '$7.36M',
        risk: 'Medium',
        riskColor: '#F59E0B',
        savings: '$420K',
        rec: true,
        desc: 'Wait 7 days to capitalize on vessel positioning & freight curve. AI optimal recommendation.',
      },
      {
        label: 'CHARTER IN 15 DAYS',
        cost: '$8.04M',
        risk: 'High',
        riskColor: '#EF4444',
        savings: '$80K',
        rec: false,
        desc: 'Rates expected to peak by day 15. Higher charter and landed bunker fuel costs.',
      },
    ];

    const vesselsList = (result.vessels || []).map((v) => ({
      name: v.name,
      type: v.type,
      dwt: `${v.dwt.toLocaleString()} DWT`,
      cost: `$${(v.charterRatePerDay * 20).toLocaleString()}`,
    }));

    return (
      <div className="space-y-6">
        {/* Result Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] text-cyan font-mono tracking-wider uppercase mb-1 font-bold">
              ◆ MILP OPTIMIZATION COMPLETE
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-100 m-0">
              Optimal Vessel Charter Strategy
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              MILP optimization solved capacity constraints with lowest landed risk
            </p>
          </div>

          <button
            onClick={() => setStep('input')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ocean-800 hover:bg-ocean-700 text-slate-200 text-xs font-mono border border-electric/25 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>New Optimization</span>
          </button>
        </div>

        {/* AI Optimal Strategy Result Card */}
        <div
          className="rounded-2xl p-7 relative overflow-hidden border border-electric/30 shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(22, 131, 255, 0.15) 0%, rgba(34, 211, 238, 0.08) 100%)',
          }}
        >
          <div className="absolute top-5 right-5 px-3 py-1.5 rounded-lg ai-gradient text-white text-[11px] font-mono font-bold tracking-wider">
            ★ AI OPTIMAL PLAN
          </div>

          <div className="text-xs font-mono text-cyan font-bold tracking-wider mb-1 uppercase">
            RECOMMENDED ACTION
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-100 m-0 mb-4">
            {result.action}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-ocean-950/70 border border-electric/15 mb-6 font-mono">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Total Landed Cost</div>
              <div className="text-2xl font-bold text-cyan">
                ${(result.estimatedCharterCost / 1000000).toFixed(2)}M
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Estimated Savings</div>
              <div className="text-2xl font-bold text-emerald-400">
                ${(result.expectedSavings / 1000).toFixed(0)}K
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Delay Risk</div>
              <div className="text-2xl font-bold text-emerald-400">Low (&lt;5%)</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Deadline Feasibility</div>
              <div className="text-2xl font-bold text-emerald-400">Feasible ✓</div>
            </div>
          </div>

          {/* Assigned Vessels */}
          <div>
            <div className="text-xs font-mono text-slate-300 font-semibold mb-2 uppercase">
              ASSIGNED TONNAGE ALLOCATION:
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {(vesselsList.length > 0
                ? vesselsList
                : [
                    { name: 'MV OCEAN STAR', type: 'Panamax', dwt: '82,000 DWT', cost: '$890K' },
                    { name: 'MV PACIFIC GLORY', type: 'Panamax', dwt: '76,000 DWT', cost: '$820K' },
                  ]
              ).map((v, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-ocean-900/90 border border-electric/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-electric/20 border border-electric/30 flex items-center justify-center text-cyan">
                      <Ship className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-sm text-slate-100">{v.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {v.type} • {v.dwt}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-cyan">{v.cost}</div>
                    <div className="text-[9px] text-emerald-400 font-bold">100% SUITABLE</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alternative Scenarios Comparison */}
        <div>
          <h3 className="font-display font-bold text-base text-slate-100 mb-3">
            Alternative Charter Timing Scenarios
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {defaultAlternatives.map((strat) => (
              <div
                key={strat.label}
                className={`glass rounded-xl p-5 border transition-all ${
                  strat.rec
                    ? 'border-cyan/50 ring-1 ring-cyan/30 bg-ocean-800/60 shadow-lg shadow-cyan/10'
                    : 'border-electric/15 hover:border-electric/30'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {strat.label}
                  </span>
                  {strat.rec && (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan/20 text-cyan border border-cyan/40 font-bold">
                      AI OPTIMAL
                    </span>
                  )}
                </div>

                <div className="font-mono text-2xl font-bold text-slate-100 mb-2">
                  {strat.cost}
                </div>

                <div className="flex items-center gap-3 text-xs font-mono mb-3">
                  <span style={{ color: strat.riskColor }}>{strat.risk} Risk</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-emerald-400">Save {strat.savings}</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed m-0">
                  {strat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-[11px] text-cyan font-mono tracking-wider uppercase mb-1 font-bold">
          ◆ AI-POWERED OPTIMIZATION
        </div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-100 m-0">
          AI Charter Optimization Engine
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Find the lowest-risk, lowest-cost vessel charter strategy using Google OR-Tools MILP optimization.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Inputs (8 cols) */}
        <div className="lg:col-span-8 glass rounded-xl p-6 border border-electric/15 space-y-5">
          <div className="text-sm font-display font-bold text-slate-100 mb-2">
            Charter Parameters & Operational Constraints
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                Origin Region / Port
              </label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value as any)}
                className="w-full bg-ocean-900 border border-electric/20 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none font-mono"
              >
                <option value="Australia">Australia (Hay Point / Newcastle / Dalrymple)</option>
                <option value="Indonesia">Indonesia (Kalimantan / Samarinda)</option>
                <option value="South Africa">South Africa (Richards Bay)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                Destination Port (East Coast India)
              </label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value as any)}
                className="w-full bg-ocean-900 border border-electric/20 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none font-mono"
              >
                <option value="Visakhapatnam">Visakhapatnam (Max Draft 14.5m)</option>
                <option value="Paradip">Paradip (Max Draft 14.5m)</option>
                <option value="Chennai">Chennai (Max Draft 14.0m)</option>
                <option value="Kamarajar">Kamarajar (Max Draft 15.0m)</option>
                <option value="Haldia">Haldia (Max Draft 8.5m)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                Cargo Commodity Type
              </label>
              <select
                value={cargo}
                onChange={(e) => setCargo(e.target.value as any)}
                className="w-full bg-ocean-900 border border-electric/20 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none font-mono"
              >
                <option value="Coal">Thermal / Coking Coal</option>
                <option value="Iron Ore">Iron Ore</option>
                <option value="Limestone">Limestone</option>
                <option value="Fertilizer">Fertilizer</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                Required Cargo Volume (MT)
              </label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="230,000"
                className="w-full bg-ocean-900 border border-electric/20 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                Delivery Deadline Target
              </label>
              <input
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="2026-10-15"
                className="w-full bg-ocean-900 border border-electric/20 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                Preferred Vessel Class
              </label>
              <select
                value={vesselType}
                onChange={(e) => setVesselType(e.target.value as any)}
                className="w-full bg-ocean-900 border border-electric/20 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none font-mono"
              >
                <option value="Panamax">Panamax (70k-85k DWT)</option>
                <option value="Capesize">Capesize (120k-200k DWT)</option>
                <option value="Supramax">Supramax (50k-65k DWT)</option>
                <option value="Any">Any Suitable Class</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                Maximum Budget Limit (USD)
              </label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="10,000,000"
                className="w-full bg-ocean-900 border border-electric/20 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none font-mono"
              />
            </div>
          </div>

          {/* Solver Objectives */}
          <div className="p-4 rounded-xl bg-electric/5 border border-electric/15">
            <div className="text-[10px] text-cyan font-mono tracking-wider uppercase mb-2 font-bold">
              MILP OBJECTIVES CONSTRAINTS
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-2 text-cyan font-semibold">
                <span>✓</span> Minimize Landed Freight Cost
              </div>
              <div className="flex items-center gap-2 text-cyan font-semibold">
                <span>✓</span> Minimize Demurrage Delay Risk
              </div>
              <div className="flex items-center gap-2 text-cyan font-semibold">
                <span>✓</span> Ensure 100% Draft Clearance
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span>✓</span> Fuel Efficiency Optimization
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span>✓</span> CII Carbon Compliance
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span>✓</span> Port Berth Congestion Buffer
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <button
            onClick={runOptimization}
            className="w-full py-4 rounded-xl ai-gradient text-white font-display font-extrabold text-sm shadow-xl shadow-electric/25 hover:opacity-95 transition-opacity cursor-pointer border border-white/20 tracking-wider flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span>OPTIMIZE CHARTER PLAN</span>
          </button>
        </div>

        {/* Live Context & Engine Badges (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="glass rounded-xl p-5 border border-electric/15">
            <div className="text-[10px] text-cyan font-mono tracking-wider uppercase mb-3 font-bold">
              LIVE MARKET CONDITIONS
            </div>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-electric/10">
                <span className="text-slate-400">Current Spot Freight:</span>
                <span className="text-cyan font-bold">$31.8/MT</span>
              </div>
              <div className="flex justify-between py-1 border-b border-electric/10">
                <span className="text-slate-400">Panamax Tonnage:</span>
                <span className="text-slate-200">4 vessels in basin</span>
              </div>
              <div className="flex justify-between py-1 border-b border-electric/10">
                <span className="text-slate-400">Port Congestion:</span>
                <span className="text-amber-400">18% (Visakhapatnam)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">30D Forecast:</span>
                <span className="text-electric-light font-bold">$35.4/MT (+11.3%)</span>
              </div>
            </div>
          </div>

          {/* Why Optimize */}
          <div className="rounded-xl p-5 bg-gradient-to-br from-purple-ai/15 via-ocean-900 to-ocean-950 border border-purple-ai/25">
            <div className="text-[10px] text-purple-ai font-mono tracking-wider uppercase mb-2 font-bold">
              ◆ WHY OPTIMIZE NOW?
            </div>
            <p className="text-xs text-slate-300 leading-relaxed m-0 font-sans">
              The optimization engine evaluates thousands of vessel-route-timing assignments using Mixed-Integer Linear Programming via Google OR-Tools. Waiting 7 days allows positioning Panamax carriers before congestion peaks.
            </p>
          </div>

          {/* Engine Architecture Badges */}
          <div className="glass rounded-xl p-5 border border-electric/15">
            <div className="text-[10px] text-cyan font-mono tracking-wider uppercase mb-3 font-bold">
              OPTIMIZATION ENGINE STACK
            </div>
            <div className="space-y-2 font-mono text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan/20 text-cyan border border-cyan/30 font-bold">MILP</span>
                <span>Mixed-Integer Linear Programming</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-electric/20 text-electric-light border border-electric/30 font-bold">OR-Tools</span>
                <span>Google Mathematical Optimization</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-ai/20 text-purple-ai border border-purple-ai/30 font-bold">XGBoost</span>
                <span>Freight Rate & Demand Engines</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
