'use client';

import React, { useState, useEffect } from 'react';
import GlobalFilterBar from '@/components/GlobalFilterBar';
import { Ship, Filter, Search, Award, CheckCircle2, AlertCircle, ArrowUpDown, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { getVessels } from '@/lib/api';
import { Vessel } from '@/types';

export default function VesselsPage() {
  const { setSelectedVessel } = useAppStore();
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [filterType, setFilterType] = useState('ALL');
  const [filterAvailability, setFilterAvailability] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getVessels({ type: filterType, availability: filterAvailability }).then((res) => {
      setVessels(res);
      setIsLoading(false);
    });
  }, [filterType, filterAvailability]);

  const filteredVessels = vessels.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.imoNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <GlobalFilterBar />

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#131C31] border border-[#1E293B] rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <Ship className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-100 uppercase font-mono">
            Vessel Intelligence Terminal ({filteredVessels.length} Tonnage Items)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B1120] border border-[#1E293B] text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by vessel name, IMO..."
              className="bg-transparent text-slate-100 placeholder-slate-500 outline-none w-44 font-medium"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1120] border border-[#1E293B] text-xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer font-medium"
            >
              <option value="ALL" className="bg-[#131C31]">All Tonnage Types</option>
              <option value="Panamax" className="bg-[#131C31]">Panamax</option>
              <option value="Supramax" className="bg-[#131C31]">Supramax</option>
              <option value="Capesize" className="bg-[#131C31]">Capesize</option>
              <option value="Handymax" className="bg-[#131C31]">Handymax</option>
            </select>
          </div>

          {/* Availability Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1120] border border-[#1E293B] text-xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Status:</span>
            <select
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer font-medium"
            >
              <option value="ALL" className="bg-[#131C31]">All Statuses</option>
              <option value="Available" className="bg-[#131C31]">Available</option>
              <option value="In Transit" className="bg-[#131C31]">In Transit</option>
              <option value="Reserved" className="bg-[#131C31]">Reserved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Vessels Table */}
      <div className="p-4 bg-[#131C31] border border-[#1E293B] rounded-xl shadow-md overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 font-mono text-xs">Querying vessel telemetry database...</div>
        ) : filteredVessels.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-[#1E293B] text-slate-400 text-[10px] font-mono uppercase">
                  <th className="py-3 px-3">Vessel ID &amp; Name</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">DWT</th>
                  <th className="py-3 px-3">Current Location</th>
                  <th className="py-3 px-3">ETA</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Charter Rate</th>
                  <th className="py-3 px-3">AI Fit Score</th>
                  <th className="py-3 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {filteredVessels.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setSelectedVessel(v)}
                    className="hover:bg-[#1C2942] transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                          {v.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{v.imoNumber}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-semibold text-slate-300">{v.type}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-300">{v.dwt.toLocaleString()} MT</td>
                    <td className="py-3.5 px-3 text-slate-400 truncate max-w-[180px]">{v.currentPosition}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-300">{v.eta}</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                          v.availability === 'Available'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : v.availability === 'In Transit'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {v.availability}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-emerald-400">
                      ${(v.charterRate / 1000).toFixed(0)}K
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-cyan-400">{v.fitScore}%</span>
                        {v.fitScore >= 90 && (
                          <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded bg-cyan-500/20 text-cyan-300">
                            TOP FIT
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 inline-block" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State Handler */
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-3 rounded-full bg-[#0B1120] border border-[#1E293B] text-slate-400">
              <AlertCircle className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">No vessels match your current filters</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Try adjusting your DWT range, tonnage category, or availability status filters to view open fleet candidates.
            </p>
            <button
              onClick={() => {
                setFilterType('ALL');
                setFilterAvailability('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:bg-cyan-500/20 transition-colors"
            >
              Clear All Vessel Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
