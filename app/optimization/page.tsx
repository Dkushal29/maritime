'use client';

import React, { useState } from 'react';
import GlobalFilterBar from '@/components/GlobalFilterBar';
import { Sparkles, Ship, DollarSign, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Layers, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { optimizeCharter } from '@/lib/api';
import { CharterRecommendation, Origin, Destination, CargoType, VesselType } from '@/types';
import { formatCurrency } from '@/lib/utils';

const steps = [
  'Analyzing XGBoost freight forecast...',
  'Evaluating vessel availability in Indo-Pacific basin...',
  'Calculating voyage bunker and port draft expenses...',
  'Executing Mixed-Integer Linear Programming (MILP) solver...',
  'Generating optimal charter recommendation...',
];

export default function OptimizationPage() {
  const { origin, destination, cargo, vesselType } = useAppStore();

  const [quantity, setQuantity] = useState(230000);
  const [deadline, setDeadline] = useState(30);
  const [maxBudget, setMaxBudget] = useState(8500000);

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [result, setResult] = useState<CharterRecommendation | null>(null);

  const handleRunOptimization = async () => {
    setIsProcessing(true);
    setResult(null);
    setCurrentStepIdx(0);

    for (let i = 0; i < steps.length; i++) {
      setCurrentStepIdx(i);
      await new Promise((res) => setTimeout(res, 500));
    }

    const res = await optimizeCharter({
      origin,
      destination,
      cargo,
      quantityMt: quantity,
      deliveryDeadlineDays: deadline,
      preferredVesselType: vesselType,
      maxBudgetUsd: maxBudget,
    });

    setResult(res);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      <GlobalFilterBar />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Controls Form */}
        <div className="lg:col-span-1 p-5 bg-[#131C31] border border-[#1E293B] rounded-xl shadow-md space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1E293B] pb-3">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase font-mono">
              MILP Optimization Inputs
            </h2>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunOptimization();
            }}
            className="space-y-4 text-xs font-sans"
          >
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                Required Cargo Volume (MT)
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-[#1E293B] text-slate-100 font-mono font-bold outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                Delivery Window (Days)
              </label>
              <input
                type="number"
                value={deadline}
                onChange={(e) => setDeadline(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-[#1E293B] text-slate-100 font-mono font-bold outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                Max Charter Budget (USD)
              </label>
              <input
                type="number"
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-[#1E293B] text-slate-100 font-mono font-bold outline-none focus:border-cyan-500/50"
              />
            </div>

            <div className="p-3 rounded-lg bg-[#0B1120] border border-[#1E293B] space-y-1 font-mono text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Origin → Dest:</span>
                <span className="text-cyan-400 font-bold">{origin} → {destination}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Commodity:</span>
                <span className="text-slate-200">{cargo}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Vessel Type:</span>
                <span className="text-slate-200">{vesselType}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Running MILP Solver...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Optimize Charter Plan</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Framer Motion Multi-Step Animated Processing State */}
          {isProcessing && (
            <div className="p-8 bg-[#131C31] border border-[#1E293B] rounded-xl flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-3 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
              <h3 className="text-base font-bold text-slate-100">MARITIME Optimization Engine Active</h3>

              <div className="w-full max-w-md space-y-2">
                {steps.map((step, idx) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: idx <= currentStepIdx ? 1 : 0.3, y: 0 }}
                    className={`flex items-center gap-2 text-xs font-mono text-left p-2 rounded-md ${
                      idx === currentStepIdx ? 'bg-cyan-500/10 text-cyan-300 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {idx <= currentStepIdx ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />
                    )}
                    <span>{step}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Result Panel — Recommended Charter Plan */}
          {!isProcessing && result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Primary Recommended Plan Card */}
              <div className="p-6 bg-gradient-to-br from-[#131C31] via-[#10182A] to-[#0D1424] border border-cyan-500/40 rounded-xl shadow-xl border-l-4 border-l-cyan-400 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E293B] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase">
                      MILP OPTIMAL SOLUTION
                    </span>
                    <span className="text-xs font-mono text-slate-400">87% Model Confidence</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold">
                    {result.risk} RISK
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-mono text-slate-400 uppercase">Recommended Action</span>
                  <h2 className="text-2xl font-bold text-slate-100">{result.action}</h2>
                </div>

                {/* Key Plan Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#0B1120] border border-[#1E293B] font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Expected Freight</span>
                    <span className="text-lg font-bold text-cyan-400">${result.expectedFreightRatePerMt}/MT</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Total Charter Cost</span>
                    <span className="text-lg font-bold text-slate-100">{formatCurrency(result.estimatedCharterCost)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Expected Savings</span>
                    <span className="text-lg font-bold text-emerald-400">{formatCurrency(result.expectedSavings)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Tonnage Capacity</span>
                    <span className="text-lg font-bold text-slate-100">{result.totalCapacityMt.toLocaleString()} MT</span>
                  </div>
                </div>

                {/* Supporting Reasons */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold text-slate-300 uppercase">Engine Decision Rationale</h4>
                  {result.supportingReasons.map((reason, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>

                {/* Recommended Vessels allocated */}
                <div className="space-y-2 pt-2 border-t border-[#1E293B]">
                  <h4 className="text-xs font-mono font-bold text-slate-300 uppercase">Allocated Vessel Candidates</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.vessels.map((v) => (
                      <div key={v.id} className="p-3 rounded-lg bg-[#0B1120] border border-[#1E293B] flex justify-between items-center">
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">{v.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{v.type} · {v.dwt.toLocaleString()} DWT</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-cyan-400">{v.fitScore}% Fit</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => alert('Charter recommendation accepted! Sent booking request to Vizag Desk.')}
                    className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-md text-center"
                  >
                    Accept Recommendation
                  </button>
                </div>
              </div>

              {/* Alternatives Comparison Cards */}
              <div className="space-y-3">
                <h3 className="text-sm font-mono font-bold text-slate-300 uppercase">
                  Alternative Charter Timing Comparison
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {result.alternatives.map((alt) => (
                    <div
                      key={alt.id}
                      className={`p-4 rounded-xl border transition-all ${
                        alt.isRecommended
                          ? 'bg-[#131C31] border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                          : 'bg-[#0B1120] border-[#1E293B]'
                      }`}
                    >
                      {alt.isRecommended && (
                        <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase block w-fit mb-2">
                          AI RECOMMENDED
                        </span>
                      )}
                      <h4 className="text-xs font-bold text-slate-100">{alt.title}</h4>
                      <div className="text-xl font-extrabold font-mono text-slate-100 mt-1">
                        {formatCurrency(alt.totalCost)}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mb-3">
                        ${alt.expectedRatePerMt}/MT · {alt.timing}
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-300 font-mono pt-2 border-t border-[#1E293B]">
                        <div className="flex justify-between">
                          <span>Risk:</span>
                          <span className={alt.risk === 'LOW' ? 'text-emerald-400' : alt.risk === 'MEDIUM' ? 'text-amber-400' : 'text-red-400'}>
                            {alt.risk}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Savings vs Late:</span>
                          <span className="text-emerald-400">{formatCurrency(alt.savings)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {!isProcessing && !result && (
            <div className="p-12 bg-[#131C31] border border-[#1E293B] rounded-xl text-center space-y-3">
              <Sparkles className="w-10 h-10 text-cyan-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-100">Ready to Optimize Vessel Chartering</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Configure your cargo volume, delivery target, and maximum budget, then click &quot;Optimize Charter Plan&quot; to execute the MILP solver.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
