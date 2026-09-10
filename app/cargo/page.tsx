'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { getCargoForecast } from '@/lib/api';
import { CargoDemandPrediction } from '@/types';
import { CargoDemandChart } from '@/components/maritime/CargoDemandChart';
import { AIInsight } from '@/components/maritime/AIInsight';
import { PageHero } from '@/components/maritime/PageHero';

const COMMODITIES = ['Coal', 'Iron Ore', 'Limestone', 'Fertilizer', 'Grain'];

export default function CargoPage() {
  const { cargo, destination, setCargo, setDestination } = useAppStore();
  const [cargoData, setCargoData] = useState<CargoDemandPrediction | null>(null);
  const [horizon, setHorizon] = useState<'30D' | '60D' | '90D'>('30D');
  const [isLoading, setIsLoading] = useState(true);

  const fetchDemand = () => {
    setIsLoading(true);
    getCargoForecast(cargo, destination)
      .then((res) => {
        setCargoData(res);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Demand API error:', err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchDemand();
  }, [cargo, destination, horizon]);

  // Transform timeline points for CargoDemandChart
  const chartData = (cargoData?.demandTimeline || [
    { date: 'Aug 1', inventory: 120, demand: 28 },
    { date: 'Aug 10', inventory: 105, demand: 30 },
    { date: 'Aug 20', inventory: 95, demand: 32 },
    { date: 'Sep 1', inventory: 82, demand: 35 },
    { date: 'Sep 10', inventory: 72, demand: 36 },
    { date: 'Sep 20', inventory: 58, demand: 38 },
    { date: 'Oct 1', inventory: 40, demand: 40 },
    { date: 'Oct 10', inventory: 20, demand: 42 },
  ]).map((pt) => ({
    date: pt.date,
    inventory: pt.inventory,
    demand: pt.demand,
  }));

  const currentInv = cargoData?.currentInventory ?? 82000;
  const projDemand = cargoData?.expected30dDemand ?? 230000;
  const procReq = cargoData?.procurementRequirement ?? 148000;
  const covDays = cargoData?.inventoryCoverageDays ?? 11;
  const urgency = covDays <= 10 ? 'HIGH' : covDays <= 15 ? 'MEDIUM' : 'NORMAL';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cinematic Hero Banner matching Landing Page */}
      <PageHero
        badge="BULK CARGO PROCUREMENT INTELLIGENCE"
        subBadge="XGBOOST DEMAND FORECASTER"
        titleLine1="Monitor the inventory."
        titleLine2="Prevent the stockout."
        description="Real-time industrial plant stockpile tracking, burn-rate telemetry, and XGBoost cargo demand forecasting for East Coast India discharge ports."
        primaryAction={{
          label: "Optimize Charter Allocation",
          href: "/optimization",
        }}
        secondaryAction={{
          label: "View Corridor Analytics",
          href: "/routes",
        }}
        stats={[
          { value: `${(currentInv / 1000).toFixed(0)}k MT`, label: "Current Stockpile", sublabel: `${destination}` },
          { value: `${(projDemand / 1000).toFixed(0)}k MT`, label: "30D Projected Demand", sublabel: `${cargo} Requirement` },
          { value: `${covDays} Days`, label: "Inventory Coverage", sublabel: covDays <= 15 ? "Stockout Alert Active" : "Adequate Buffer" },
          { value: `${(procReq / 1000).toFixed(0)}k MT`, label: "Procurement Target", sublabel: "Next Laycan Volume" },
        ]}
      />

      {/* Commodity Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 p-1 bg-ocean-950/80 rounded-xl border border-electric/15">
          {COMMODITIES.map((c) => (
            <button
              key={c}
              onClick={() => setCargo(c as any)}
              className={`px-4 py-2 rounded-lg text-xs font-display font-bold transition-all cursor-pointer ${
                cargo.toLowerCase().includes(c.toLowerCase())
                  ? 'bg-electric text-white shadow-md shadow-electric/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-ocean-800/60'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Port & Horizon Dropdowns */}
        <div className="flex items-center gap-3">
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value as any)}
            className="bg-ocean-900 border border-electric/20 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none font-mono"
          >
            <option value="Visakhapatnam">Visakhapatnam Port</option>
            <option value="Paradip">Paradip Port</option>
            <option value="Chennai">Chennai Port</option>
            <option value="Kamarajar">Kamarajar Port</option>
            <option value="Haldia">Haldia Port</option>
          </select>

          <select
            value={horizon}
            onChange={(e) => setHorizon(e.target.value as any)}
            className="bg-ocean-900 border border-electric/20 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none font-mono"
          >
            <option value="30D">30 Days</option>
            <option value="60D">60 Days</option>
            <option value="90D">90 Days</option>
          </select>
        </div>
      </div>

      {/* 4 Procurement Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
        <div className="glass rounded-xl p-4 border border-cyan/20">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Current Stock Inventory</div>
          <div className="text-2xl font-bold text-cyan">{currentInv.toLocaleString()} <span className="text-xs text-slate-400 font-normal">MT</span></div>
          <div className="text-[10px] text-slate-500 mt-1">Safety buffer: 15,000 MT</div>
        </div>

        <div className="glass rounded-xl p-4 border border-electric/20">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Forecast Demand ({horizon})</div>
          <div className="text-2xl font-bold text-electric-light">{projDemand.toLocaleString()} <span className="text-xs text-slate-400 font-normal">MT</span></div>
          <div className="text-[10px] text-emerald-400 mt-1">+6.2% seasonal surge</div>
        </div>

        <div className="glass rounded-xl p-4 border border-amber-500/20">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Recommended Procurement</div>
          <div className="text-2xl font-bold text-amber-400">{procReq.toLocaleString()} <span className="text-xs text-slate-400 font-normal">MT</span></div>
          <div className="text-[10px] text-amber-300 mt-1">Procure within 10 days</div>
        </div>

        <div className="glass rounded-xl p-4 border border-emerald-500/20">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Inventory Coverage</div>
          <div className="text-2xl font-bold text-emerald-400">{covDays} <span className="text-xs text-slate-400 font-normal">Days</span></div>
          <div className="text-[10px] text-slate-400 mt-1">Daily burn ~7.4k MT/d</div>
        </div>
      </div>

      {/* Main Chart + Recommendation Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Inventory vs Demand Curve */}
        <div className="lg:col-span-8 glass rounded-xl p-6 border border-electric/15 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-base text-slate-100 m-0">
                {cargo} Stock Depletion & Projected Demand Curve
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {destination} plant storage vs consumption rate
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
              URGENCY: {urgency}
            </span>
          </div>

          <CargoDemandChart data={chartData} />
        </div>

        {/* Procurement Recommendation & Insight */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="rounded-2xl p-6 bg-gradient-to-br from-electric/15 via-ocean-900 to-ocean-950 border border-electric/30">
            <div className="text-[10px] text-cyan font-mono tracking-wider uppercase mb-1 font-bold">
              AI PROCUREMENT RECOMMENDATION
            </div>
            <h3 className="font-display font-bold text-lg text-slate-100 mb-2">
              Procure {procReq.toLocaleString()} MT within 10 Days
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Current inventory of {currentInv.toLocaleString()} MT will fall below the safety threshold in {covDays} days at projected consumption rates. Early chartering preserves stock coverage through upcoming peak demand.
            </p>

            <div className="rounded-lg p-3 bg-ocean-950/70 border border-electric/20 text-xs font-mono mb-4">
              <div className="flex justify-between py-1 border-b border-electric/10">
                <span className="text-slate-400">Recommended Cargo:</span>
                <span className="text-cyan font-bold">{cargo}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-electric/10">
                <span className="text-slate-400">Target Port:</span>
                <span className="text-slate-200">{destination}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Procurement Window:</span>
                <span className="text-amber-400 font-bold">Next 7–10 Days</span>
              </div>
            </div>

            <button
              onClick={() => window.location.href = '/optimization'}
              className="w-full py-2.5 rounded-lg ai-gradient text-white text-xs font-display font-bold cursor-pointer hover:opacity-95 shadow-md shadow-electric/20 border border-white/15"
            >
              Optimize Charter Fleet for this Cargo →
            </button>
          </div>

          <AIInsight
            title="INVENTORY RISK INSIGHT"
            insight={`Plant capacity at ${destination} operates at 88% throughput. Delaying procurement past day 12 risks emergency spot charter premiums of up to +$4.20/MT.`}
            confidence={0.88}
          />
        </div>
      </div>
    </div>
  );
}
