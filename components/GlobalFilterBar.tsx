'use client';

import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Origin, Destination, CargoType, VesselType, ForecastHorizon } from '@/types';

const origins: Origin[] = ['Australia', 'Indonesia', 'South Africa', 'USA', 'Russia'];
const destinations: Destination[] = ['Visakhapatnam', 'Paradip', 'Chennai', 'Kamarajar', 'Haldia'];
const commodities: CargoType[] = ['Coal', 'Iron Ore', 'Limestone', 'Fertilizer', 'Grain'];
const vesselTypes: VesselType[] = ['Panamax', 'Supramax', 'Capesize', 'Handymax'];
const horizons: ForecastHorizon[] = ['7D', '30D', '60D', '90D'];

export default function GlobalFilterBar() {
  const {
    origin,
    destination,
    cargo,
    vesselType,
    dateRange,
    setOrigin,
    setDestination,
    setCargo,
    setVesselType,
    setDateRange,
    resetFilters,
  } = useAppStore();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#102235] border border-[#294154] rounded-lg shadow-sm mb-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-[#E8F0F5]">
        <Filter className="w-4 h-4 text-[#35B8A6]" />
        <span className="uppercase font-mono text-[11px] text-[#91A6B8]">Global Filters:</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Origin */}
        <div className="flex items-center gap-1.5 bg-[#0B1726] border border-[#294154] rounded-md px-2.5 py-1">
          <label className="text-[10px] font-mono text-[#91A6B8] uppercase">Origin:</label>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value as Origin)}
            className="bg-transparent text-xs font-semibold text-[#E8F0F5] outline-none cursor-pointer"
          >
            {origins.map((o) => (
              <option key={o} value={o} className="bg-[#102235] text-[#E8F0F5]">
                {o}
              </option>
            ))}
          </select>
        </div>

        {/* Destination */}
        <div className="flex items-center gap-1.5 bg-[#0B1726] border border-[#294154] rounded-md px-2.5 py-1">
          <label className="text-[10px] font-mono text-[#91A6B8] uppercase">Dest:</label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value as Destination)}
            className="bg-transparent text-xs font-semibold text-[#E8F0F5] outline-none cursor-pointer"
          >
            {destinations.map((d) => (
              <option key={d} value={d} className="bg-[#102235] text-[#E8F0F5]">
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Cargo */}
        <div className="flex items-center gap-1.5 bg-[#0B1726] border border-[#294154] rounded-md px-2.5 py-1">
          <label className="text-[10px] font-mono text-[#91A6B8] uppercase">Cargo:</label>
          <select
            value={cargo}
            onChange={(e) => setCargo(e.target.value as CargoType)}
            className="bg-transparent text-xs font-semibold text-[#E8F0F5] outline-none cursor-pointer"
          >
            {commodities.map((c) => (
              <option key={c} value={c} className="bg-[#102235] text-[#E8F0F5]">
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Vessel Type */}
        <div className="flex items-center gap-1.5 bg-[#0B1726] border border-[#294154] rounded-md px-2.5 py-1">
          <label className="text-[10px] font-mono text-[#91A6B8] uppercase">Vessel:</label>
          <select
            value={vesselType}
            onChange={(e) => setVesselType(e.target.value as VesselType)}
            className="bg-transparent text-xs font-semibold text-[#E8F0F5] outline-none cursor-pointer"
          >
            {vesselTypes.map((v) => (
              <option key={v} value={v} className="bg-[#102235] text-[#E8F0F5]">
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* Horizon */}
        <div className="flex items-center gap-1 bg-[#0B1726] border border-[#294154] rounded-md p-0.5">
          {horizons.map((h) => (
            <button
              key={h}
              onClick={() => setDateRange(h)}
              className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded transition-colors ${
                dateRange === h
                  ? 'bg-[#162C40] text-[#35B8A6] border border-[#35B8A6]/40'
                  : 'text-[#91A6B8] hover:text-[#E8F0F5]'
              }`}
            >
              {h}
            </button>
          ))}
        </div>

        {/* Reset Button */}
        <button
          onClick={resetFilters}
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#91A6B8] hover:text-[#E8F0F5] bg-[#0B1726] border border-[#294154] rounded-md transition-colors cursor-pointer"
          title="Reset to default demo scenario"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="text-[11px]">Reset</span>
        </button>
      </div>
    </div>
  );
}
