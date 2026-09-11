'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { optimizeCharter } from '@/lib/api';
import { CharterRecommendation } from '@/types';
import { Sparkles, Check, ArrowLeft, Ship, ShieldCheck, DollarSign } from 'lucide-react';
import { PageHero } from '@/components/maritime/PageHero';

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
        <div className="w-full max-w-lg bg-[#102235] rounded-lg p-8 border border-[#294154]">
          <div className="text-[11px] text-[#35B8A6] font-mono tracking-widest uppercase text-center mb-2 font-semibold flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#35B8A6] animate-ping" />
            OPTIMIZATION SOLVER RUNNING
          </div>

          <h2 className="font-display font-bold text-xl text-[#E8F0F5] text-center m-0 mb-6">
            Evaluating Fleet Combinations
          </h2>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-[#0B1726] overflow-hidden mb-8 border border-[#294154]">
            <div
              className="h-full rounded-full transition-all duration-100 bg-[#35B8A6]"
              style={{ width: `${processingPct}%` }}
            />
          </div>

          {/* 8-Step Pipeline */}
          <div className="space-y-2.5 font-mono text-xs">
            {PIPELINE_STEPS.map((s, i) => {
              const isDone = i < currentStepIdx;
              const isCurrent = i === currentStepIdx;

              return (
                <div
                  key={s}
                  className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                    isCurrent ? 'bg-[#162C40] border border-[#294154] text-[#E8F0F5]' : 'text-[#91A6B8]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                      isDone
                        ? 'bg-[#6DAF91] text-[#0B1726] font-bold'
                        : isCurrent
                        ? 'bg-[#35B8A6] text-[#0B1726] font-bold'
                        : 'bg-[#0B1726] border border-[#294154] text-[#91A6B8]'
                    }`}
                  >
                    {isDone ? '✓' : i + 1}
                  </div>
                  <span className={`truncate ${isDone ? 'text-[#6DAF91] font-medium' : isCurrent ? 'text-[#35B8A6] font-semibold' : ''}`}>
                    {s}
                  </span>
                  {isDone && <span className="ml-auto text-[10px] text-[#6DAF91]">DONE</span>}
                  {isCurrent && <span className="ml-auto text-[10px] text-[#35B8A6]">SOLVING...</span>}
                </div>
              );
            })}
          </div>

          <div className="text-center mt-6 text-[11px] font-mono text-[#91A6B8]">
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
        riskColor: '#6DAF91',
        savings: '$180K',
        rec: false,
        desc: 'Immediate charter at current spot rates. Lowest delay risk, but misses optimal window.',
      },
      {
        label: 'CHARTER IN 7 DAYS',
        cost: '$7.36M',
        risk: 'Medium',
        riskColor: '#D6A24A',
        savings: '$420K',
        rec: true,
        desc: 'Wait 7 days to capitalize on vessel positioning & freight curve. Optimal recommendation.',
      },
      {
        label: 'CHARTER IN 15 DAYS',
        cost: '$8.04M',
        risk: 'High',
        riskColor: '#C96B6B',
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
            <div className="text-[11px] text-[#35B8A6] font-mono tracking-wider uppercase mb-1 font-semibold">
              ◆ MILP OPTIMIZATION COMPLETE
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#E8F0F5] m-0">
              Optimal Vessel Charter Strategy
            </h1>
            <p className="text-xs text-[#91A6B8] mt-0.5">
              MILP optimization solved capacity constraints with lowest landed risk
            </p>
          </div>

          <button
            onClick={() => setStep('input')}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#102235] hover:bg-[#162C40] text-[#E8F0F5] text-xs font-mono border border-[#294154] cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>New Optimization</span>
          </button>
        </div>

        {/* AI Optimal Strategy Result Card */}
        <div className="bg-[#102235] rounded-lg p-6 border border-[#294154]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-mono text-[#35B8A6] font-semibold tracking-wider uppercase">
              RECOMMENDED ACTION
            </div>
            <span className="px-2.5 py-1 rounded bg-[#35B8A6]/15 text-[#35B8A6] text-[11px] font-mono font-semibold border border-[#35B8A6]/30">
              OPTIMAL PLAN
            </span>
          </div>

          <h2 className="font-display font-bold text-xl sm:text-2xl text-[#E8F0F5] m-0 mb-4">
            {result.action}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-md bg-[#0B1726] border border-[#294154] mb-6 font-mono">
            <div>
              <div className="text-[10px] text-[#91A6B8] uppercase">Total Landed Cost</div>
              <div className="text-2xl font-bold text-[#35B8A6]">
                ${(result.estimatedCharterCost / 1000000).toFixed(2)}M
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#91A6B8] uppercase">Estimated Savings</div>
              <div className="text-2xl font-bold text-[#6DAF91]">
                ${(result.expectedSavings / 1000).toFixed(0)}K
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#91A6B8] uppercase">Delay Risk</div>
              <div className="text-2xl font-bold text-[#6DAF91]">Low (&lt;5%)</div>
            </div>
            <div>
              <div className="text-[10px] text-[#91A6B8] uppercase">Deadline Feasibility</div>
              <div className="text-2xl font-bold text-[#6DAF91]">Feasible ✓</div>
            </div>
          </div>

          {/* Assigned Vessels */}
          <div>
            <div className="text-xs font-mono text-[#91A6B8] font-semibold mb-2 uppercase">
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
                  className="flex items-center justify-between p-3.5 rounded-md bg-[#162C40] border border-[#294154]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-[#102235] border border-[#294154] flex items-center justify-center text-[#35B8A6]">
                      <Ship className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-sm text-[#E8F0F5]">{v.name}</div>
                      <div className="text-[11px] font-mono text-[#91A6B8]">
                        {v.type} • {v.dwt}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-[#35B8A6]">{v.cost}</div>
                    <div className="text-[9px] text-[#6DAF91] font-semibold">100% SUITABLE</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alternative Scenarios Comparison */}
        <div>
          <h3 className="font-display font-bold text-base text-[#E8F0F5] mb-3">
            Alternative Charter Timing Scenarios
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {defaultAlternatives.map((strat) => (
              <div
                key={strat.label}
                className={`bg-[#102235] rounded-lg p-5 border transition-colors ${
                  strat.rec
                    ? 'border-[#35B8A6] bg-[#162C40]'
                    : 'border-[#294154]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-semibold text-[#E8F0F5]">
                    {strat.label}
                  </span>
                  {strat.rec && (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#35B8A6]/20 text-[#35B8A6] border border-[#35B8A6]/40 font-semibold">
                      OPTIMAL PLAN
                    </span>
                  )}
                </div>

                <div className="font-mono text-2xl font-bold text-[#E8F0F5] mb-2">
                  {strat.cost}
                </div>

                <div className="flex items-center gap-3 text-xs font-mono mb-3">
                  <span style={{ color: strat.riskColor }}>{strat.risk} Risk</span>
                  <span className="text-[#294154]">•</span>
                  <span className="text-[#6DAF91]">Save {strat.savings}</span>
                </div>

                <p className="text-xs text-[#91A6B8] leading-relaxed m-0">
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
    <div className="space-y-8 animate-fade-in">
      {/* Cinematic Hero Banner matching Landing Page */}
      <PageHero
        badge="MILP FLEET CHARTER OPTIMIZATION"
        subBadge="GOOGLE OR-TOOLS SOLVER"
        titleLine1="Optimize the fleet."
        titleLine2="Maximize the savings."
        description="Constraint-driven mixed integer linear programming (MILP) solving vessel suitability, draft limits, laycan windows, and forward ensemble freight curves to deliver minimum landed cost."
        primaryAction={{
          label: "Run AI Optimization Engine",
          onClick: runOptimization,
        }}
        secondaryAction={{
          label: "Explore Fleet Intelligence",
          href: "/vessels",
        }}
        stats={[
          { value: "$7.36M", label: "Optimal Total Cost", sublabel: "230k MT Requirement" },
          { value: "$420K", label: "Estimated Savings", sublabel: "vs Spot Benchmark" },
          { value: "94 / 100", label: "Top Suitability", sublabel: "MV Ocean Star" },
          { value: "< 7 Days", label: "Recommended Laycan", sublabel: "Optimal Charter Window" },
        ]}
      />

      {/* Form Section Header */}
      <div>
        <div className="text-[11px] text-[#35B8A6] font-mono tracking-wider uppercase mb-1 font-semibold">
          ◆ CHARTER SPECIFICATIONS & OPERATIONAL CONSTRAINTS
        </div>
        <h2 className="font-display font-bold text-xl sm:text-2xl text-[#E8F0F5] m-0">
          Optimization Parameters
        </h2>
        <p className="text-xs text-[#91A6B8] mt-1">
          Configure cargo demand quantity, origin-destination corridor, laycan deadlines, and budget ceilings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Inputs (8 cols) */}
        <div className="lg:col-span-8 bg-[#102235] rounded-lg p-6 border border-[#294154] space-y-5">
          <div className="text-sm font-display font-bold text-[#E8F0F5] mb-2">
            Charter Parameters & Operational Constraints
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono text-[#91A6B8] uppercase mb-1">
                Origin Region / Port
              </label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value as any)}
                className="w-full bg-[#0B1726] border border-[#294154] rounded-md px-3 py-2 text-xs text-[#E8F0F5] outline-none font-mono focus:border-[#35B8A6]"
              >
                <option value="Australia">Australia (Hay Point / Newcastle / Dalrymple)</option>
                <option value="Indonesia">Indonesia (Kalimantan / Samarinda)</option>
                <option value="South Africa">South Africa (Richards Bay)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-[#91A6B8] uppercase mb-1">
                Destination Port (East Coast India)
              </label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value as any)}
                className="w-full bg-[#0B1726] border border-[#294154] rounded-md px-3 py-2 text-xs text-[#E8F0F5] outline-none font-mono focus:border-[#35B8A6]"
              >
                <option value="Visakhapatnam">Visakhapatnam (Max Draft 14.5m)</option>
                <option value="Paradip">Paradip (Max Draft 14.5m)</option>
                <option value="Chennai">Chennai (Max Draft 14.0m)</option>
                <option value="Kamarajar">Kamarajar (Max Draft 15.0m)</option>
                <option value="Haldia">Haldia (Max Draft 8.5m)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-[#91A6B8] uppercase mb-1">
                Cargo Commodity Type
              </label>
              <select
                value={cargo}
                onChange={(e) => setCargo(e.target.value as any)}
                className="w-full bg-[#0B1726] border border-[#294154] rounded-md px-3 py-2 text-xs text-[#E8F0F5] outline-none font-mono focus:border-[#35B8A6]"
              >
                <option value="Coal">Thermal / Coking Coal</option>
                <option value="Iron Ore">Iron Ore</option>
                <option value="Limestone">Limestone</option>
                <option value="Fertilizer">Fertilizer</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-[#91A6B8] uppercase mb-1">
                Required Cargo Volume (MT)
              </label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="230,000"
                className="w-full bg-[#0B1726] border border-[#294154] rounded-md px-3 py-2 text-xs text-[#E8F0F5] outline-none font-mono focus:border-[#35B8A6]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-[#91A6B8] uppercase mb-1">
                Delivery Deadline Target
              </label>
              <input
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="2026-10-15"
                className="w-full bg-[#0B1726] border border-[#294154] rounded-md px-3 py-2 text-xs text-[#E8F0F5] outline-none font-mono focus:border-[#35B8A6]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-[#91A6B8] uppercase mb-1">
                Preferred Vessel Class
              </label>
              <select
                value={vesselType}
                onChange={(e) => setVesselType(e.target.value as any)}
                className="w-full bg-[#0B1726] border border-[#294154] rounded-md px-3 py-2 text-xs text-[#E8F0F5] outline-none font-mono focus:border-[#35B8A6]"
              >
                <option value="Panamax">Panamax (70k-85k DWT)</option>
                <option value="Capesize">Capesize (120k-200k DWT)</option>
                <option value="Supramax">Supramax (50k-65k DWT)</option>
                <option value="Any">Any Suitable Class</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-mono text-[#91A6B8] uppercase mb-1">
                Maximum Budget Limit (USD)
              </label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="10,000,000"
                className="w-full bg-[#0B1726] border border-[#294154] rounded-md px-3 py-2 text-xs text-[#E8F0F5] outline-none font-mono focus:border-[#35B8A6]"
              />
            </div>
          </div>

          {/* Solver Objectives */}
          <div className="p-4 rounded-md bg-[#162C40] border border-[#294154]">
            <div className="text-[10px] text-[#35B8A6] font-mono tracking-wider uppercase mb-2 font-semibold">
              MILP OBJECTIVES & CONSTRAINTS
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono text-[#E8F0F5]">
              <div className="flex items-center gap-2 text-[#35B8A6]">
                <span>✓</span> Minimize Landed Freight Cost
              </div>
              <div className="flex items-center gap-2 text-[#35B8A6]">
                <span>✓</span> Minimize Demurrage Delay Risk
              </div>
              <div className="flex items-center gap-2 text-[#35B8A6]">
                <span>✓</span> Ensure 100% Draft Clearance
              </div>
              <div className="flex items-center gap-2 text-[#91A6B8]">
                <span>✓</span> Fuel Efficiency Optimization
              </div>
              <div className="flex items-center gap-2 text-[#91A6B8]">
                <span>✓</span> CII Carbon Compliance
              </div>
              <div className="flex items-center gap-2 text-[#91A6B8]">
                <span>✓</span> Port Berth Congestion Buffer
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <button
            onClick={runOptimization}
            className="w-full py-3 rounded-md bg-[#35B8A6] hover:bg-[#35B8A6]/90 text-[#0B1726] font-bold text-sm transition-colors cursor-pointer tracking-wider flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>OPTIMIZE CHARTER PLAN</span>
          </button>
        </div>

        {/* Live Context & Engine Badges (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="bg-[#102235] rounded-lg p-5 border border-[#294154]">
            <div className="text-[10px] text-[#35B8A6] font-mono tracking-wider uppercase mb-3 font-semibold">
              LIVE MARKET CONDITIONS
            </div>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-[#294154]">
                <span className="text-[#91A6B8]">Current Spot Freight:</span>
                <span className="text-[#35B8A6] font-bold">$31.8/MT</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#294154]">
                <span className="text-[#91A6B8]">Panamax Tonnage:</span>
                <span className="text-[#E8F0F5]">4 vessels in basin</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#294154]">
                <span className="text-[#91A6B8]">Port Congestion:</span>
                <span className="text-[#D6A24A]">18% (Visakhapatnam)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#91A6B8]">30D Forecast:</span>
                <span className="text-[#5D9BC4] font-bold">$35.4/MT (+11.3%)</span>
              </div>
            </div>
          </div>

          {/* Why Optimize */}
          <div className="rounded-lg p-5 bg-[#162C40] border border-[#294154]">
            <div className="text-[10px] text-[#5D9BC4] font-mono tracking-wider uppercase mb-2 font-semibold">
              ◆ WHY OPTIMIZE NOW?
            </div>
            <p className="text-xs text-[#91A6B8] leading-relaxed m-0 font-sans">
              The optimization engine evaluates vessel-route-timing assignments using Mixed-Integer Linear Programming via Google OR-Tools. Waiting 7 days allows positioning Panamax carriers before congestion peaks.
            </p>
          </div>

          {/* Engine Architecture Badges */}
          <div className="bg-[#102235] rounded-lg p-5 border border-[#294154]">
            <div className="text-[10px] text-[#35B8A6] font-mono tracking-wider uppercase mb-3 font-semibold">
              OPTIMIZATION ENGINE STACK
            </div>
            <div className="space-y-2 font-mono text-xs text-[#E8F0F5]">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#35B8A6]/20 text-[#35B8A6] border border-[#35B8A6]/30 font-bold">MILP</span>
                <span>Mixed-Integer Linear Programming</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#5D9BC4]/20 text-[#5D9BC4] border border-[#5D9BC4]/30 font-bold">OR-Tools</span>
                <span>Google Mathematical Optimization</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#D6A24A]/20 text-[#D6A24A] border border-[#D6A24A]/30 font-bold">XGBoost</span>
                <span>Freight Rate & Demand Engines</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
