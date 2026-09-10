'use client';

import React, { useState, useEffect } from 'react';
import { getRouteAnalytics } from '@/lib/api';
import { RouteMetric } from '@/types';
import { RouteMap } from '@/components/maritime/RouteMap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteMetric[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteMetric | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getRouteAnalytics()
      .then((res) => {
        setRoutes(res);
        if (res.length > 0) setSelectedRoute(res[0]);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Route API error:', err);
        setIsLoading(false);
      });
  }, []);

  const chartData = routes.map((r) => ({
    route: `${r.origin.slice(0, 3)}→${r.destination.slice(0, 3)}`,
    freight: r.avgFreightRate,
    score: r.isRecommended ? 94 : r.riskLevel === 'LOW' ? 89 : r.riskLevel === 'MEDIUM' ? 78 : 65,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-[11px] text-cyan font-mono tracking-wider uppercase mb-1 font-bold">
          ◆ ROUTE INTELLIGENCE & CORRIDORS
        </div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-100 m-0">
          Route Analytics & Major Maritime Corridors
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          AI-ranked shipping routes for bulk cargo delivery to India East Coast ports
        </p>
      </div>

      {/* Global Interactive Route Corridor Map */}
      <div className="glass rounded-xl p-5 border border-electric/15">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] text-cyan font-mono tracking-wider uppercase mb-0.5 font-bold">
              ◆ CORRIDOR MAPPING
            </div>
            <h3 className="font-display font-bold text-base text-slate-100 m-0">
              Indo-Pacific to East Coast India Shipping Lanes
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Selected: <strong className="text-cyan">{selectedRoute ? `${selectedRoute.origin} → ${selectedRoute.destination}` : 'Australia → Visakhapatnam'}</strong>
          </span>
        </div>

        <RouteMap
          highlightPort={selectedRoute?.destination.toUpperCase()}
          onSelectPort={(portName) => {
            const matched = routes.find((r) => r.destination.toUpperCase() === portName);
            if (matched) setSelectedRoute(matched);
          }}
        />
      </div>

      {/* Main Grid: Ranked Route Cards (8 cols) & Route Details (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ranked Route Cards */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {routes.map((route, idx) => {
            const isSelected = selectedRoute?.id === route.id;
            const isRec = route.isRecommended || idx === 0;
            const riskColor =
              route.riskLevel === 'LOW' ? '#10B981' : route.riskLevel === 'MEDIUM' ? '#F59E0B' : '#EF4444';

            return (
              <button
                key={route.id}
                onClick={() => setSelectedRoute(route)}
                className={`glass rounded-xl p-4 text-left transition-all border cursor-pointer ${
                  isSelected
                    ? 'border-cyan/50 ring-1 ring-cyan/30 bg-ocean-800/60 shadow-lg shadow-cyan/10'
                    : 'border-electric/15 hover:border-electric/30 hover:bg-ocean-800/40'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank Badge */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm shrink-0 ${
                      isRec
                        ? 'bg-cyan/20 text-cyan border border-cyan/40 shadow-md'
                        : 'bg-ocean-900 border border-electric/20 text-slate-400'
                    }`}
                  >
                    #{idx + 1}
                  </div>

                  {/* Route Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-display font-bold text-sm text-slate-100">
                        {route.origin}
                      </span>
                      <span className="text-cyan font-mono">→</span>
                      <span className="font-display font-bold text-sm text-cyan">
                        {route.destination}
                      </span>
                      {isRec && (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-electric text-white font-bold">
                          AI RECOMMENDED
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {route.origin === 'Australia'
                        ? 'Direct Panamax transit with low congestion and strong fleet availability.'
                        : 'Shorter transit route with competitive landed freight efficiency.'}
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-3 text-right font-mono shrink-0 hidden sm:grid">
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase">Freight</div>
                      <div className="text-xs font-bold text-cyan">${route.avgFreightRate}/MT</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase">Transit</div>
                      <div className="text-xs font-bold text-slate-200">{route.avgTransitDays} Days</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase">Risk</div>
                      <div className="text-xs font-bold" style={{ color: riskColor }}>
                        {route.riskLevel}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Route Analytics Detail */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {selectedRoute && (
            <div className="glass rounded-xl p-5 border border-electric/20 space-y-4 font-mono text-xs">
              <div className="text-[10px] text-cyan uppercase tracking-wider font-bold">
                CORRIDOR METRICS ANALYSIS
              </div>
              <h3 className="font-display font-bold text-base text-slate-100 m-0">
                {selectedRoute.origin} → {selectedRoute.destination}
              </h3>

              <div className="space-y-2 text-slate-300 divide-y divide-electric/10">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Transit Distance:</span>
                  <span>{(selectedRoute.distanceNm ?? 4820).toLocaleString()} Nautical Miles</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Average Transit Time:</span>
                  <span>{selectedRoute.avgTransitDays ?? selectedRoute.transitTimeDays ?? 16} Days (13.5 kts)</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Current Average Freight:</span>
                  <span className="text-cyan font-bold">${selectedRoute.avgFreightRate}/MT</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Est. Total Landed Cost:</span>
                  <span className="text-emerald-400 font-bold">
                    ${((selectedRoute.avgFreightRate * 230000) / 1000000).toFixed(2)}M
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Port Congestion Level:</span>
                  <span className={selectedRoute.riskLevel === 'HIGH' ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                    {selectedRoute.riskLevel === 'HIGH' ? 'High (31%)' : selectedRoute.riskLevel === 'MEDIUM' ? 'Moderate (25%)' : 'Low (18%)'}
                  </span>
                </div>
              </div>

              {/* Corridor Comparison Bar Chart */}
              <div className="pt-2">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">
                  Freight Rate Comparison ($/MT)
                </div>
                <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(22, 131, 255, 0.08)" vertical={false} />
                      <XAxis dataKey="route" tick={{ fill: '#64748B', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748B', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} domain={[20, 38]} />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(11, 31, 54, 0.95)',
                          border: '1px solid rgba(22, 131, 255, 0.25)',
                          borderRadius: 6,
                          fontSize: 11,
                          fontFamily: 'JetBrains Mono',
                        }}
                        formatter={(v: any) => [`$${v}/MT`, 'Rate']}
                      />
                      <Bar dataKey="freight" fill="#1683FF" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
