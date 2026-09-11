'use client';

import React, { useState, useEffect } from 'react';
import { Ship, Search, LayoutGrid, List } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { getVessels, getVesselDetail } from '@/lib/api';
import { Vessel } from '@/types';
import { VesselCard } from '@/components/maritime/VesselCard';
import { VesselStatus } from '@/components/maritime/VesselStatus';
import { Drawer } from '@/components/ui/Drawer';
import { PageHero } from '@/components/maritime/PageHero';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';

const VESSEL_TYPES = ['All', 'Panamax', 'Capesize', 'Supramax', 'Handysize'];
const STATUS_OPTIONS = ['All', 'Available', 'At Sea', 'Booked', 'Maintenance'];

export default function VesselsPage() {
  const { setSelectedVessel } = useAppStore();
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [activeVessel, setActiveVessel] = useState<Vessel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getVessels()
      .then((res) => {
        setVessels(res);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Vessels API error:', err);
        setIsLoading(false);
      });
  }, []);

  const handleSelectVessel = async (v: Vessel) => {
    try {
      const detail = await getVesselDetail(v.id);
      setActiveVessel(detail || v);
    } catch {
      setActiveVessel(v);
    }
  };

  const filtered = vessels.filter((v) => {
    const matchesType = typeFilter === 'All' || v.type.toLowerCase() === typeFilter.toLowerCase();
    const matchesStatus =
      statusFilter === 'All' ||
      (v.status && v.status.toLowerCase().includes(statusFilter.toLowerCase()));
    const matchesQuery =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.imoNumber && v.imoNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesType && matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cinematic Hero Banner matching Landing Page */}
      <PageHero
        badge="FLEET TONNAGE & POSITIONING INTELLIGENCE"
        subBadge="AI SUITABILITY RANKING"
        titleLine1="Score the tonnage."
        titleLine2="Charter the best."
        description="Real-time AIS positioning, deadweight capacity verification, fuel efficiency telemetry, and multi-factor suitability scoring tailored for East Coast of India bulk discharge."
        primaryAction={{
          label: "Run Charter Optimizer",
          href: "/optimization",
        }}
        secondaryAction={{
          label: "View Sustainability Ratings",
          href: "/sustainability",
        }}
        stats={[
          { value: `${vessels.length || 12} Vessels`, label: "Monitored Fleet", sublabel: "Panamax / Cape / Supra" },
          { value: "94 / 100", label: "Top Vessel Score", sublabel: "MV Ocean Star" },
          { value: "$24,500", label: "Avg. Daily Hire Rate", sublabel: "Panamax Class" },
          { value: "14.2 Knots", label: "Fleet Eco-Speed", sublabel: "CII Class-A Ready" },
        ]}
      />

      {/* Controls & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] text-cyan font-mono tracking-wider uppercase mb-1 font-bold">
            ◆ FLEET FILTERING & DIRECTORY
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-display font-extrabold text-xl sm:text-2xl text-slate-100 m-0">
              Active Vessel Registry
            </h2>
            <DataSourceBadge
              type="demo"
              label="Demo Fleet Database"
              tooltip="Vessel particulars and baseline positions from benchmark dataset. Real-time tracking requires active AISStream connection."
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Filter by vessel class, deployment status, and cargo suitability.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-ocean-950/80 rounded-xl border border-electric/20 shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'grid' ? 'bg-electric text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Card Grid"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'table' ? 'bg-electric text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Dense Table"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass rounded-xl p-4 border border-electric/15 flex flex-wrap items-center justify-between gap-4">
        {/* Type Filter Buttons */}
        <div className="flex flex-wrap gap-1.5">
          {VESSEL_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                typeFilter === t
                  ? 'bg-electric/20 text-cyan border border-cyan/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-ocean-800/60 border border-transparent'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ocean-900 border border-electric/20 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by vessel or IMO..."
              className="bg-transparent text-slate-100 placeholder-slate-500 outline-none w-44 text-xs font-mono"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-ocean-900 border border-electric/20 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none font-mono cursor-pointer"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Statuses' : s}
              </option>
            ))}
          </select>

          <span className="text-xs font-mono text-slate-400 pl-2">
            <strong className="text-cyan">{filtered.length}</strong> vessels found
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-ocean-900 rounded-2xl border border-electric/15" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center border-electric/15 text-slate-400 font-mono text-xs">
          No vessels match the selected filters. Try broadening your search.
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((v) => (
            <VesselCard
              key={v.id}
              vessel={{
                id: v.id,
                name: v.name,
                type: v.type,
                dwt: v.dwt,
                location: v.currentPosition || 'Indian Ocean',
                rate: `$${v.charterRatePerDay.toLocaleString()}/day`,
                score: v.fitScore,
                status: v.availability || v.status || 'Available',
                carbon_rating: v.fuelConsumptionTpd < 22 ? 'A' : 'B',
              }}
              selected={activeVessel?.id === v.id}
              onClick={() => handleSelectVessel(v)}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="glass rounded-xl p-4 border border-electric/15 overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-electric/15 text-slate-400 text-[10px] font-mono uppercase">
                <th className="pb-3 px-3">Vessel</th>
                <th className="pb-3 px-3">Type</th>
                <th className="pb-3 px-3">DWT</th>
                <th className="pb-3 px-3">Location</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">Charter Rate</th>
                <th className="pb-3 px-3 text-right">AI Suitability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-electric/10 font-mono">
              {filtered.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => handleSelectVessel(v)}
                  className="hover:bg-ocean-800/60 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3 font-display font-bold text-slate-100">
                    {v.name}
                  </td>
                  <td className="py-3 px-3 text-slate-300">{v.type}</td>
                  <td className="py-3 px-3 text-slate-300">{v.dwt.toLocaleString()}</td>
                  <td className="py-3 px-3 text-slate-400">{v.currentPosition}</td>
                  <td className="py-3 px-3">
                    <VesselStatus status={v.availability || 'Available'} size="sm" />
                  </td>
                  <td className="py-3 px-3 text-cyan font-bold">
                    ${v.charterRatePerDay.toLocaleString()}/d
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-400">
                    {v.fitScore}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Drawer */}
      <Drawer
        open={!!activeVessel}
        onClose={() => setActiveVessel(null)}
        width={420}
        title={
          <div className="flex items-center gap-2">
            <Ship className="w-4 h-4 text-cyan" />
            <span className="font-display font-bold text-sm text-slate-100">
              {activeVessel?.name}
            </span>
          </div>
        }
      >
        {activeVessel && (
          <div className="space-y-6 text-xs font-mono">
            {/* Header Specs */}
            <div className="p-4 rounded-xl bg-ocean-900 border border-electric/15 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Vessel Class:</span>
                <span className="text-slate-100 font-bold">{activeVessel.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Deadweight Tonnage:</span>
                <span className="text-cyan font-bold">{activeVessel.dwt.toLocaleString()} MT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">IMO Identifier:</span>
                <span className="text-slate-100">{activeVessel.imoNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Position:</span>
                <span className="text-slate-300">{activeVessel.currentPosition}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Daily Charter Rate:</span>
                <span className="text-cyan font-bold">${activeVessel.charterRatePerDay.toLocaleString()}/day</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-electric/10">
                <span className="text-slate-400">Availability:</span>
                <VesselStatus status={activeVessel.availability || 'Available'} size="sm" />
              </div>
            </div>

            {/* Suitability Breakdown */}
            <div>
              <div className="text-[10px] text-cyan uppercase tracking-wider mb-2 font-bold">
                AI SUITABILITY BREAKDOWN ({activeVessel.fitScore}%)
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Capacity Fit', score: activeVessel.breakdown.capacityFit },
                  { label: 'Route Efficiency', score: activeVessel.breakdown.routeFit },
                  { label: 'Cost Competitiveness', score: activeVessel.breakdown.costEfficiency },
                  { label: 'ETA Compatibility', score: activeVessel.breakdown.etaCompatibility },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300">{item.label}</span>
                      <span className="text-cyan font-bold">{item.score}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-ocean-900 overflow-hidden border border-electric/15">
                      <div
                        className="h-full bg-gradient-to-r from-electric to-cyan rounded-full"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Port Compatibility */}
            <div>
              <div className="text-[10px] text-cyan uppercase tracking-wider mb-2 font-bold">
                PORT COMPATIBILITY
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(activeVessel.portCompatibility || ['Visakhapatnam', 'Paradip', 'Chennai']).map((port) => (
                  <span
                    key={port}
                    className="px-2.5 py-1 rounded bg-ocean-900 border border-electric/20 text-slate-200 text-[11px]"
                  >
                    ✓ {port}
                  </span>
                ))}
              </div>
            </div>

            {/* Charter Action CTA */}
            <button
              onClick={() => {
                setActiveVessel(null);
                window.location.href = '/optimization';
              }}
              className="w-full py-3 rounded-xl ai-gradient text-white font-display font-bold text-xs shadow-lg shadow-electric/25 hover:opacity-95 transition-opacity cursor-pointer border border-white/15"
            >
              Include in AI Charter Optimization →
            </button>
          </div>
        )}
      </Drawer>
    </div>
  );
}
