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
        <div className="flex flex-wrap gap-1.5 p-1 bg-[#102235] rounded-md border border-[#294154]">
          {COMMODITIES.map((c) => (
            <button
              key={c}
              onClick={() => setCargo(c as any)}
              className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
                cargo.toLowerCase().includes(c.toLowerCase())
                  ? 'bg-[#162C40] text-[#35B8A6] border border-[#35B8A6]/40'
                  : 'text-[#91A6B8] hover:text-[#E8F0F5] hover:bg-[#162C40]'
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
            className="bg-[#0B1726] border border-[#294154] rounded-md px-3 py-1.5 text-xs text-[#E8F0F5] outline-none font-mono"
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
            className="bg-[#0B1726] border border-[#294154] rounded-md px-3 py-1.5 text-xs text-[#E8F0F5] outline-none font-mono"
          >
            <option value="30D">30 Days</option>
            <option value="60D">60 Days</option>
            <option value="90D">90 Days</option>
          </select>
        </div>
      </div>

      {/* 4 Procurement Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
        <div className="bg-[#102235] rounded-lg p-4 border border-[#294154]">
          <div className="text-[10px] text-[#91A6B8] uppercase tracking-wider mb-1">Current Stock Inventory</div>
          <div className="text-2xl font-bold text-[#35B8A6]">{currentInv.toLocaleString()} <span className="text-xs text-[#91A6B8] font-normal">MT</span></div>
          <div className="text-[10px] text-[#91A6B8] mt-1">Safety buffer: 15,000 MT</div>
        </div>

        <div className="bg-[#102235] rounded-lg p-4 border border-[#294154]">
          <div className="text-[10px] text-[#91A6B8] uppercase tracking-wider mb-1">Forecast Demand ({horizon})</div>
          <div className="text-2xl font-bold text-[#5D9BC4]">{projDemand.toLocaleString()} <span className="text-xs text-[#91A6B8] font-normal">MT</span></div>
          <div className="text-[10px] text-[#6DAF91] mt-1">+6.2% seasonal surge</div>
        </div>

        <div className="bg-[#102235] rounded-lg p-4 border border-[#294154]">
          <div className="text-[10px] text-[#91A6B8] uppercase tracking-wider mb-1">Recommended Procurement</div>
          <div className="text-2xl font-bold text-[#D6A24A]">{procReq.toLocaleString()} <span className="text-xs text-[#91A6B8] font-normal">MT</span></div>
          <div className="text-[10px] text-[#D6A24A] mt-1">Procure within 10 days</div>
        </div>

        <div className="bg-[#102235] rounded-lg p-4 border border-[#294154]">
          <div className="text-[10px] text-[#91A6B8] uppercase tracking-wider mb-1">Inventory Coverage</div>
          <div className="text-2xl font-bold text-[#6DAF91]">{covDays} <span className="text-xs text-[#91A6B8] font-normal">Days</span></div>
          <div className="text-[10px] text-[#91A6B8] mt-1">Daily burn ~7.4k MT/d</div>
        </div>
      </div>

      {/* Main Chart + Recommendation Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Inventory vs Demand Curve */}
        <div className="lg:col-span-8 bg-[#102235] rounded-lg p-6 border border-[#294154] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-base text-[#E8F0F5] m-0">
                {cargo} Stock Depletion & Projected Demand Curve
              </h3>
              <p className="text-xs text-[#91A6B8] mt-0.5">
                {destination} plant storage vs consumption rate
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D6A24A]/15 text-[#D6A24A] border border-[#D6A24A]/30 font-semibold">
              URGENCY: {urgency}
            </span>
          </div>

          <CargoDemandChart data={chartData} />
        </div>

        {/* Procurement Recommendation & Insight */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="rounded-lg p-6 bg-[#102235] border border-[#294154]">
            <div className="text-[10px] text-[#35B8A6] font-mono tracking-wider uppercase mb-1 font-semibold">
              AI PROCUREMENT RECOMMENDATION
            </div>
            <h3 className="font-display font-bold text-lg text-[#E8F0F5] mb-2">
              Procure {procReq.toLocaleString()} MT within 10 Days
            </h3>
            <p className="text-xs text-[#91A6B8] leading-relaxed mb-4">
              Current inventory of {currentInv.toLocaleString()} MT will fall below the safety threshold in {covDays} days at projected consumption rates. Early chartering preserves stock coverage through upcoming peak demand.
            </p>

            <div className="rounded-md p-3 bg-[#0B1726] border border-[#294154] text-xs font-mono mb-4">
              <div className="flex justify-between py-1 border-b border-[#294154]">
                <span className="text-[#91A6B8]">Recommended Cargo:</span>
                <span className="text-[#35B8A6] font-bold">{cargo}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#294154]">
                <span className="text-[#91A6B8]">Target Port:</span>
                <span className="text-[#E8F0F5]">{destination}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#91A6B8]">Procurement Window:</span>
                <span className="text-[#D6A24A] font-bold">Next 7–10 Days</span>
              </div>
            </div>

            <button
              onClick={() => window.location.href = '/optimization'}
              className="w-full py-2.5 rounded-md bg-[#35B8A6] hover:bg-[#35B8A6]/90 text-[#0B1726] text-xs font-bold transition-colors cursor-pointer"
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
