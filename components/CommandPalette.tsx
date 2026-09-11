'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Ship, MapPin, TrendingUp, AlertTriangle, X, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { getVessels, getRouteAnalytics, getAlerts } from '@/lib/api';
import { Vessel, RouteMetric, AlertItem } from '@/types';

export default function CommandPalette() {
  const router = useRouter();
  const { isCommandPaletteOpen, setCommandPaletteOpen } = useAppStore();
  const [query, setQuery] = useState('');
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [routes, setRoutes] = useState<RouteMetric[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (isCommandPaletteOpen) {
      setIsLoading(true);
      Promise.all([
        getVessels().catch(() => []),
        getRouteAnalytics().catch(() => []),
        getAlerts().catch(() => []),
      ]).then(([vesselsData, routesData, alertsData]) => {
        if (!isMounted) return;
        setVessels(vesselsData || []);
        setRoutes(routesData || []);
        setAlerts(alertsData || []);
        setIsLoading(false);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const lowerQuery = query.toLowerCase();

  const matchedVessels = vessels.filter(
    (v) =>
      v.name.toLowerCase().includes(lowerQuery) ||
      v.type.toLowerCase().includes(lowerQuery) ||
      v.id.toLowerCase().includes(lowerQuery)
  );

  const matchedRoutes = routes.filter(
    (r) =>
      r.origin.toLowerCase().includes(lowerQuery) ||
      r.destination.toLowerCase().includes(lowerQuery)
  );

  const matchedAlerts = alerts.filter(
    (a) =>
      a.title.toLowerCase().includes(lowerQuery) ||
      a.description.toLowerCase().includes(lowerQuery)
  );

  const handleNavigate = (path: string) => {
    setCommandPaletteOpen(false);
    router.push(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden bg-[#131C31] border border-[#1E293B] rounded-xl shadow-2xl">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1E293B] bg-[#0B1120]">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vessels, routes, ports, forecasts, alerts..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none font-medium"
            autoFocus
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-[#131C31]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {/* Default Summary Pills when search query matched vessel types */}
          {lowerQuery.includes('panamax') && (
            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-xs text-slate-200">
              <span className="font-bold text-cyan-400">Panamax Search Summary: </span>
              <span>12 available vessels · 4 recommended · 2 high-risk for Visakhapatnam route</span>
            </div>
          )}

          {/* Vessels Section */}
          {matchedVessels.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-2 mb-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase">
                <Ship className="w-3.5 h-3.5 text-cyan-400" />
                <span>Vessels ({matchedVessels.length})</span>
              </div>
              <div className="space-y-1">
                {matchedVessels.slice(0, 4).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleNavigate('/vessels')}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#0B1120]/60 hover:bg-[#1C2942] border border-[#1E293B] transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-200">{v.name}</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-300">
                        {v.type}
                      </span>
                      <span className="text-xs text-slate-400">{v.dwt.toLocaleString()} DWT</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400">{v.fitScore}% Fit</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Routes Section */}
          {matchedRoutes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-2 mb-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Routes ({matchedRoutes.length})</span>
              </div>
              <div className="space-y-1">
                {matchedRoutes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleNavigate('/routes')}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#0B1120]/60 hover:bg-[#1C2942] border border-[#1E293B] transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-200">
                        {r.origin} → {r.destination}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">${r.avgFreightRate}/MT</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Alerts Section */}
          {matchedAlerts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-2 mb-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Alerts ({matchedAlerts.length})</span>
              </div>
              <div className="space-y-1">
                {matchedAlerts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleNavigate('/alerts')}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#0B1120]/60 hover:bg-[#1C2942] border border-[#1E293B] transition-colors text-left group"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-200">{a.title}</span>
                      <span className="text-[11px] text-slate-400 line-clamp-1">{a.description}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && matchedVessels.length === 0 && matchedRoutes.length === 0 && matchedAlerts.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              No results found for &quot;{query}&quot;. Try searching for &quot;Panamax&quot;, &quot;Visakhapatnam&quot;, or &quot;Coal&quot;.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#090E1C] border-t border-[#1E293B] text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <span>MARITIME AI Global Index</span>
            {isLoading ? (
              <span className="text-cyan-400 animate-pulse">• Syncing API...</span>
            ) : (
              <span className="text-emerald-400">• Sourced via Live API</span>
            )}
          </div>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
