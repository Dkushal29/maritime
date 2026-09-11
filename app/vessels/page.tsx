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
          <div className="text-[11px] text-[#35B8A6] font-mono tracking-wider uppercase mb-1 font-semibold">
            ◆ FLEET FILTERING & DIRECTORY
          </div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-[#E8F0F5] m-0">
            Active Vessel Registry
          </h2>
          <p className="text-xs text-[#91A6B8] mt-1">
            Filter by vessel class, deployment status, and cargo suitability.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-[#102235] rounded-md border border-[#294154] shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded transition-colors cursor-pointer ${
              viewMode === 'grid' ? 'bg-[#162C40] text-[#35B8A6] border border-[#35B8A6]/40' : 'text-[#91A6B8] hover:text-[#E8F0F5]'
            }`}
            title="Card Grid"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded transition-colors cursor-pointer ${
              viewMode === 'table' ? 'bg-[#162C40] text-[#35B8A6] border border-[#35B8A6]/40' : 'text-[#91A6B8] hover:text-[#E8F0F5]'
            }`}
            title="Dense Table"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#102235] rounded-lg p-4 border border-[#294154] flex flex-wrap items-center justify-between gap-4">
        {/* Type Filter Buttons */}
        <div className="flex flex-wrap gap-1.5">
          {VESSEL_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                typeFilter === t
                  ? 'bg-[#162C40] text-[#35B8A6] border border-[#35B8A6]/50 font-semibold'
                  : 'text-[#91A6B8] hover:text-[#E8F0F5] hover:bg-[#162C40] border border-transparent'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0B1726] border border-[#294154] text-xs">
            <Search className="w-3.5 h-3.5 text-[#91A6B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by vessel or IMO..."
              className="bg-transparent text-[#E8F0F5] placeholder-[#91A6B8] outline-none w-44 text-xs font-mono"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0B1726] border border-[#294154] rounded-md px-3 py-1.5 text-xs text-[#E8F0F5] outline-none font-mono cursor-pointer"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Statuses' : s}
              </option>
            ))}
          </select>

          <span className="text-xs font-mono text-[#91A6B8] pl-2">
            <strong className="text-[#35B8A6]">{filtered.length}</strong> vessels found
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
        <div className="bg-[#102235] rounded-lg p-4 border border-[#294154] overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-[#294154] text-[#91A6B8] text-[10px] font-mono uppercase">
                <th className="pb-3 px-3">Vessel</th>
                <th className="pb-3 px-3">Type</th>
                <th className="pb-3 px-3">DWT</th>
                <th className="pb-3 px-3">Location</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">Charter Rate</th>
                <th className="pb-3 px-3 text-right">AI Suitability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#294154] font-mono">
              {filtered.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => handleSelectVessel(v)}
                  className="hover:bg-[#162C40] cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3 font-display font-bold text-[#E8F0F5]">
                    {v.name}
                  </td>
                  <td className="py-3 px-3 text-[#91A6B8]">{v.type}</td>
                  <td className="py-3 px-3 text-[#91A6B8]">{v.dwt.toLocaleString()}</td>
                  <td className="py-3 px-3 text-[#91A6B8]">{v.currentPosition}</td>
                  <td className="py-3 px-3">
                    <VesselStatus status={v.availability || 'Available'} size="sm" />
                  </td>
                  <td className="py-3 px-3 text-[#35B8A6] font-bold">
                    ${v.charterRatePerDay.toLocaleString()}/d
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#6DAF91]">
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
            <Ship className="w-4 h-4 text-[#35B8A6]" />
            <span className="font-display font-bold text-sm text-[#E8F0F5]">
              {activeVessel?.name}
            </span>
          </div>
        }
      >
        {activeVessel && (
          <div className="space-y-6 text-xs font-mono">
            {/* Header Specs */}
            <div className="p-4 rounded-lg bg-[#102235] border border-[#294154] space-y-2">
              <div className="flex justify-between">
                <span className="text-[#91A6B8]">Vessel Class:</span>
                <span className="text-[#E8F0F5] font-bold">{activeVessel.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#91A6B8]">Deadweight Tonnage:</span>
                <span className="text-[#35B8A6] font-bold">{activeVessel.dwt.toLocaleString()} MT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#91A6B8]">IMO Identifier:</span>
                <span className="text-[#E8F0F5]">{activeVessel.imoNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#91A6B8]">Current Position:</span>
                <span className="text-[#E8F0F5]">{activeVessel.currentPosition}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#91A6B8]">Daily Charter Rate:</span>
                <span className="text-[#35B8A6] font-bold">${activeVessel.charterRatePerDay.toLocaleString()}/day</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-[#294154]">
                <span className="text-[#91A6B8]">Availability:</span>
                <VesselStatus status={activeVessel.availability || 'Available'} size="sm" />
              </div>
            </div>

            {/* Suitability Breakdown */}
            <div>
              <div className="text-[10px] text-[#35B8A6] uppercase tracking-wider mb-2 font-semibold">
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
                      <span className="text-[#91A6B8]">{item.label}</span>
                      <span className="text-[#35B8A6] font-bold">{item.score}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#0B1726] overflow-hidden border border-[#294154]">
                      <div
                        className="h-full bg-[#35B8A6] rounded-full"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Port Compatibility */}
            <div>
              <div className="text-[10px] text-[#35B8A6] uppercase tracking-wider mb-2 font-semibold">
                PORT COMPATIBILITY
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(activeVessel.portCompatibility || ['Visakhapatnam', 'Paradip', 'Chennai']).map((port) => (
                  <span
                    key={port}
                    className="px-2.5 py-1 rounded bg-[#102235] border border-[#294154] text-[#E8F0F5] text-[11px]"
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
              className="w-full py-2.5 rounded-md bg-[#35B8A6] hover:bg-[#35B8A6]/90 text-[#0B1726] font-bold text-xs transition-colors cursor-pointer"
            >
              Include in Charter Optimization →
            </button>
          </div>
        )}
      </Drawer>
    </div>
  );
}
