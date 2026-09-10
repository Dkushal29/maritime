'use client';

import React from 'react';
import { X, Ship, MapPin, Calendar, Fuel, DollarSign, Award, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { cn, formatCurrency } from '@/lib/utils';

export default function VesselDetailDrawer() {
  const { selectedVessel, setSelectedVessel } = useAppStore();

  if (!selectedVessel) return null;

  const v = selectedVessel;
  const b = v.breakdown;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-[#131C31] border-l border-[#1E293B] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-[#0B1120] border-b border-[#1E293B]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
            <Ship className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">{v.name}</h2>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span>{v.imoNumber}</span>
              <span>·</span>
              <span className="text-cyan-400">{v.type}</span>
              <span>·</span>
              <span>Built {v.builtYear}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setSelectedVessel(null)}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-[#131C31]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Stream */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* AI Suitability Score Card */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#0B1120] to-[#10182A] border border-cyan-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 uppercase">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>AI Suitability Score</span>
            </div>
            <div className="text-2xl font-extrabold font-mono text-cyan-300">
              {v.fitScore}<span className="text-xs text-slate-400 font-normal">/100</span>
            </div>
          </div>

          {/* Fit Score Breakdown Bars */}
          <div className="space-y-2.5 pt-2 border-t border-[#1E293B]">
            {[
              { label: 'Capacity Fit', val: b.capacityFit },
              { label: 'Route & Draft Fit', val: b.routeFit },
              { label: 'Cost Efficiency', val: b.costEfficiency },
              { label: 'Availability Timing', val: b.availability },
              { label: 'ETA Compatibility', val: b.etaCompatibility },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300 font-medium">{item.label}</span>
                  <span className="font-mono text-cyan-400 font-bold">{item.val}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#1E293B] overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${item.val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Commercial & Operational Specs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-[#0B1120] border border-[#1E293B]">
            <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Charter Rate</span>
            <span className="text-base font-bold font-mono text-emerald-400">
              {formatCurrency(v.charterRate)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">${v.charterRatePerDay.toLocaleString()}/day</span>
          </div>

          <div className="p-3 rounded-lg bg-[#0B1120] border border-[#1E293B]">
            <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Deadweight Tonnage</span>
            <span className="text-base font-bold font-mono text-slate-100">
              {v.dwt.toLocaleString()} <span className="text-xs text-slate-400 font-normal">DWT</span>
            </span>
          </div>
        </div>

        {/* Detailed Spec List */}
        <div className="space-y-3 p-4 rounded-xl bg-[#0B1120] border border-[#1E293B]">
          <h4 className="text-xs font-mono font-bold text-slate-300 uppercase">Operational Telemetry</h4>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-medium text-slate-400">Current Position:</span>
            <span className="font-mono text-slate-200">{v.currentPosition}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="font-medium text-slate-400">ETA Discharge Port:</span>
            <span className="font-mono text-slate-200">{v.eta}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Fuel className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-medium text-slate-400">Fuel Consumption:</span>
            <span className="font-mono text-slate-200">{v.fuelConsumptionTpd} MT VLSFO/day</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Ship className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-medium text-slate-400">Previous Voyage:</span>
            <span className="font-mono text-slate-200 truncate">{v.previousRoute}</span>
          </div>
        </div>

        {/* Port Compatibility Badges */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono font-bold text-slate-300 uppercase">Port Draft Compatibility</h4>
          <div className="flex flex-wrap gap-1.5">
            {v.portCompatibility.map((port) => (
              <span
                key={port}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0B1120] border border-[#1E293B] text-xs font-medium text-slate-200"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>{port}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-[#0B1120] border-t border-[#1E293B] flex items-center gap-3">
        <button
          onClick={() => setSelectedVessel(null)}
          className="flex-1 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-[0_0_12px_rgba(6,182,212,0.3)] text-center"
        >
          Select for Optimization
        </button>
      </div>
    </div>
  );
}
