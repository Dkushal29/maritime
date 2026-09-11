'use client';

import React, { useState, useEffect } from 'react';
import { getRouteAnalytics } from '@/lib/api';
import { RouteMetric } from '@/types';
import dynamic from 'next/dynamic';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHero } from '@/components/maritime/PageHero';

// Dynamically import Leaflet maritime map with SSR disabled to prevent window/document errors
const MaritimeLeafletMap = dynamic(
  () => import('@/components/maritime/MaritimeLeafletMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[560px] rounded-xl bg-ocean-950/80 border border-electric/20 flex flex-col items-center justify-center gap-3 animate-pulse">
        <div className="w-10 h-10 rounded-full border-2 border-cyan/40 border-t-cyan animate-spin" />
        <span className="text-xs font-mono text-cyan tracking-wider">
          INITIALIZING INDO-PACIFIC MARITIME SATELLITE TILES...
        </span>
      </div>
    ),
  }
);

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
    <div className="space-y-8 animate-fade-in">
      {/* Cinematic Hero Banner matching Landing Page */}
      <PageHero
        badge="MARITIME SHIPPING CORRIDORS"
        subBadge="AI ROUTE RANKING & DISTANCE"
        titleLine1="Analyze the corridors."
        titleLine2="Navigate the East Coast."
        description="AI-ranked maritime corridors connecting major global origin hubs (Australia, Indonesia, South Africa) to Indian East Coast discharge terminals (Visakhapatnam, Paradip, Chennai, Haldia)."
        primaryAction={{
          label: "Optimize Voyage Charter",
          href: "/optimization",
        }}
        secondaryAction={{
          label: "View Freight Predictions",
          href: "/forecast",
        }}
        stats={[
          { value: `${routes.length || 6} Corridors`, label: "Monitored Sea Lanes", sublabel: "Nautical Distance Ranked" },
          { value: "Australia -> Vizag", label: "Top Ranked Corridor", sublabel: "Suitability: 94/100" },
          { value: "$32.20 / MT", label: "Benchmark Freight", sublabel: "Spot Laycan Level" },
          { value: "14 - 16 Days", label: "Average Transit", sublabel: "Hay Point to Vizag" },
        ]}
      />

      {/* Global Interactive Route Corridor Map */}
      <div className="glass rounded-xl p-5 border border-electric/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-electric/15">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] text-cyan font-mono tracking-wider uppercase font-bold mb-1">
              <span className="w-1.5 h-1.5 bg-cyan rounded-xs shadow-[0_0_8px_#00F0FF]"></span>
              <span>CORRIDOR MAPPING</span>
            </div>
            <h3 className="font-display font-bold text-lg text-slate-100 m-0">
              Indo-Pacific to East Coast India Shipping Lanes
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              Live vessel tracking, shipping routes, and corridor analysis using real-time marine data
            </p>
          </div>
          <div className="sm:text-right shrink-0">
            <span className="text-[10px] text-slate-400 font-mono block uppercase">Selected Route</span>
            <span className="text-xs font-mono font-bold text-cyan bg-cyan/10 px-2.5 py-1 rounded border border-cyan/25 shadow-sm inline-block">
              {selectedRoute ? `${selectedRoute.origin} → ${selectedRoute.destination}` : 'Australia → Visakhapatnam'}
            </span>
          </div>
        </div>

        <MaritimeLeafletMap
          selectedRoute={selectedRoute}
          onSelectRoute={(route) => {
            const matched = routes.find(
              (r) =>
                r.origin.toLowerCase().includes(route.origin.toLowerCase()) &&
                r.destination.toLowerCase().includes(route.destination.toLowerCase())
            ) || routes.find(
              (r) =>
                r.origin.toLowerCase().includes(route.origin.toLowerCase()) ||
                r.destination.toLowerCase().includes(route.destination.toLowerCase())
            );
            if (matched) setSelectedRoute(matched);
            else setSelectedRoute(route);
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
            const risk = (route.riskLevel || route.risk || 'LOW').toUpperCase();
            const riskColor =
              risk === 'LOW' ? '#10B981' : risk === 'MEDIUM' ? '#F59E0B' : '#EF4444';
            const transitDays = route.avgTransitDays ?? route.transitTimeDays ?? (route.origin === 'Indonesia' ? 8.2 : 16.5);

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
                      <div className="text-xs font-bold text-slate-200">{transitDays} Days</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase">Risk</div>
                      <div className="text-xs font-bold" style={{ color: riskColor }}>
                        {risk}
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
                  {(() => {
                    const selRisk = (selectedRoute.riskLevel || selectedRoute.risk || 'LOW').toUpperCase();
                    return (
                      <span className={selRisk === 'HIGH' ? 'text-rose-400 font-bold' : selRisk === 'MEDIUM' ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {selRisk === 'HIGH' ? 'High Congestion' : selRisk === 'MEDIUM' ? 'Moderate Congestion' : 'Low Congestion'}
                      </span>
                    );
                  })()}
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
