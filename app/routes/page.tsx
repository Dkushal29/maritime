'use client';

import React, { useState, useEffect } from 'react';
import GlobalFilterBar from '@/components/GlobalFilterBar';
import { Compass, MapPin, Ship, Info, Award, ArrowRight, ShieldCheck } from 'lucide-react';
import { getRouteAnalytics } from '@/lib/api';
import { RouteMetric } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteMetric[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteMetric | null>(null);

  useEffect(() => {
    getRouteAnalytics().then((res) => {
      setRoutes(res);
      if (res.length > 0) setSelectedRoute(res[0]);
    });
  }, []);

  return (
    <div className="space-y-6">
      <GlobalFilterBar />

      {/* Map Visualization Box */}
      <div className="p-5 bg-[#131C31] border border-[#1E293B] rounded-xl shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              Interactive Shipping Lanes &amp; Port Congestion Map
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Indo-Pacific &amp; East Coast India Corridor</span>
        </div>

        {/* Stylized SVG Map Container */}
        <div className="relative w-full h-80 bg-[#070C18] border border-[#1E293B] rounded-xl overflow-hidden flex items-center justify-center p-4">
          <svg className="w-full h-full" viewBox="0 0 800 400" fill="none">
            {/* Grid Lines */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E293B" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Coastline Stylized Shapes */}
            {/* India shape */}
            <path
              d="M 220 100 L 260 120 L 250 220 L 220 280 L 190 200 Z"
              fill="#131C31"
              stroke="#334155"
              strokeWidth="1.5"
            />
            {/* Australia shape */}
            <path
              d="M 520 250 L 680 240 L 720 340 L 560 360 Z"
              fill="#131C31"
              stroke="#334155"
              strokeWidth="1.5"
            />
            {/* Indonesia archipelago */}
            <path
              d="M 380 210 L 480 220 L 460 240 L 370 225 Z"
              fill="#131C31"
              stroke="#334155"
              strokeWidth="1.5"
            />

            {/* Shipping Lanes (Curved Animated Paths) */}
            {/* Australia -> Visakhapatnam */}
            <path
              d="M 580 260 Q 420 180 245 190"
              fill="none"
              stroke="#06B6D4"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              className="animate-pulse"
            />
            {/* Australia -> Paradip */}
            <path
              d="M 580 260 Q 430 160 255 160"
              fill="none"
              stroke="#10B981"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Indonesia -> Paradip */}
            <path
              d="M 410 215 Q 330 180 255 160"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Port Markers */}
            {/* Visakhapatnam */}
            <g transform="translate(245, 190)" className="cursor-pointer">
              <circle r="6" fill="#06B6D4" className="animate-ping opacity-75" />
              <circle r="4" fill="#06B6D4" />
              <text x="10" y="4" fill="#F8FAFC" fontSize="11" fontFamily="mono" fontWeight="bold">
                Visakhapatnam
              </text>
            </g>

            {/* Paradip */}
            <g transform="translate(255, 160)" className="cursor-pointer">
              <circle r="4" fill="#10B981" />
              <text x="10" y="4" fill="#F8FAFC" fontSize="11" fontFamily="mono" fontWeight="bold">
                Paradip
              </text>
            </g>

            {/* Chennai */}
            <g transform="translate(235, 230)" className="cursor-pointer">
              <circle r="4" fill="#EF4444" />
              <text x="10" y="4" fill="#F8FAFC" fontSize="10" fontFamily="mono">
                Chennai
              </text>
            </g>

            {/* Australia Ports (Newcastle / Gladstone) */}
            <g transform="translate(580, 260)">
              <circle r="5" fill="#818CF8" />
              <text x="10" y="4" fill="#F8FAFC" fontSize="11" fontFamily="mono" fontWeight="bold">
                Australia (Newcastle)
              </text>
            </g>

            {/* Vessel Pin Markers along the line */}
            <g transform="translate(420, 215)">
              <circle r="3" fill="#FBBF24" />
              <text x="6" y="-6" fill="#FBBF24" fontSize="9" fontFamily="mono">MV Ocean Star (18 Sep)</text>
            </g>
          </svg>

          {/* Map Floating Legend Overlay */}
          <div className="absolute bottom-3 left-3 p-3 rounded-lg bg-[#0B1120]/90 border border-[#1E293B] text-[10px] font-mono space-y-1 backdrop-blur-md">
            <span className="font-bold text-slate-200 block uppercase">Lane Legend</span>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-cyan-400 inline-block" /> Australia → Visakhapatnam ($31.8/MT)
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-emerald-400 inline-block" /> Australia → Paradip ($30.9/MT)
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-blue-400 inline-block" /> Indonesia → Paradip ($19.4/MT)
            </div>
          </div>
        </div>

        {/* AI Route Recommendation Line */}
        <div className="p-3 rounded-lg bg-[#0B1120] border border-emerald-500/30 text-xs text-slate-300 flex items-start gap-2">
          <Award className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-bold text-emerald-400">AI Route Recommendation: </span>
            Paradip discharge port currently offers the lowest expected landed cost ($141.2/MT) for coal imports due to minimal berth congestion compared to Visakhapatnam.
          </p>
        </div>
      </div>

      {/* Route Comparison Table */}
      <div className="p-5 bg-[#131C31] border border-[#1E293B] rounded-xl shadow-md space-y-4">
        <h3 className="text-sm font-bold text-slate-100 uppercase font-mono">
          Route Metric Comparison Directory
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-[#1E293B] text-slate-400 text-[10px] font-mono uppercase">
                <th className="py-2.5 px-3">Route (Origin → Dest)</th>
                <th className="py-2.5 px-3">Avg Freight Rate</th>
                <th className="py-2.5 px-3">Transit Time</th>
                <th className="py-2.5 px-3">Port Congestion</th>
                <th className="py-2.5 px-3">Available Tonnage</th>
                <th className="py-2.5 px-3">Risk Level</th>
                <th className="py-2.5 px-3">Landed Cost / MT</th>
                <th className="py-2.5 px-3">Best For</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {routes.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelectedRoute(r)}
                  className={`hover:bg-[#1C2942] transition-colors cursor-pointer ${
                    r.isRecommended ? 'bg-cyan-500/5' : ''
                  }`}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2 font-bold text-slate-100">
                      <span>{r.origin} → {r.destination}</span>
                      {r.isRecommended && (
                        <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-emerald-500/20 text-emerald-300">
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-cyan-400">${r.avgFreightRate}/MT</td>
                  <td className="py-3 px-3 font-mono text-slate-300">{r.transitTimeDays} Days</td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-mono text-[11px] font-bold ${
                        r.portCongestionLevel === 'Low'
                          ? 'text-emerald-400'
                          : r.portCongestionLevel === 'Medium'
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}
                    >
                      {r.portCongestionLevel} Delay
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">{r.vesselAvailabilityCount} Open Vessels</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                        r.risk === 'LOW'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : r.risk === 'MEDIUM'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {r.risk}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-extrabold text-slate-100">
                    ${r.estimatedLandedCostPerMt}
                  </td>
                  <td className="py-3 px-3 text-slate-400 text-[11px]">
                    {r.destination === 'Visakhapatnam'
                      ? 'High-grade coking coal'
                      : r.destination === 'Paradip'
                      ? 'Lowest landed cost thermal coal'
                      : 'Southern power plants'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
