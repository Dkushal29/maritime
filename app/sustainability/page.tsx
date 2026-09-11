'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Leaf, Award, ShieldCheck, Zap } from 'lucide-react';
import { PageHero } from '@/components/maritime/PageHero';

const CO2_TREND = [
  { m: 'Jan', base: 100, optimized: 98 },
  { m: 'Feb', base: 100, optimized: 95 },
  { m: 'Mar', base: 100, optimized: 93 },
  { m: 'Apr', base: 100, optimized: 91 },
  { m: 'May', base: 100, optimized: 89 },
  { m: 'Jun', base: 100, optimized: 87 },
  { m: 'Jul', base: 100, optimized: 85 },
  { m: 'Aug', base: 100, optimized: 83 },
  { m: 'Sep', base: 100, optimized: 82 },
];

const FUEL_SAVINGS_BY_ROUTE = [
  { route: 'AUS→Paradip', savings: 420 },
  { route: 'AUS→Vizag', savings: 380 },
  { route: 'IND→Paradip', savings: 290 },
  { route: 'IND→Vizag', savings: 265 },
  { route: 'ME→India', savings: 190 },
];

const METRICS = [
  { label: 'CO₂ Reduction', val: '-18%', desc: 'vs unoptimized charter routing', color: '#6DAF91', icon: '🌿' },
  { label: 'Fuel Efficiency', val: '+11%', desc: 'through voyage route optimization', color: '#35B8A6', icon: '⛽' },
  { label: 'Optimized Routes', val: '24', desc: 'bulk lanes analyzed this month', color: '#5D9BC4', icon: '🗺' },
  { label: 'Emissions Intensity', val: '8.2 g/MT·km', desc: 'calibrated fleet average index', color: '#5D9BC4', icon: '📊' },
  { label: 'Potential CO₂ Saved', val: '12,400 MT', desc: 'annualized ESG target projection', color: '#6DAF91', icon: '🌎' },
  { label: 'Energy Rating', val: 'A+', desc: 'CII carbon intensity rating', color: '#6DAF91', icon: '⭐' },
];

export default function SustainabilityPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cinematic Hero Banner matching Landing Page */}
      <PageHero
        badge="GREEN FLEET & CARBON ACCOUNTING"
        subBadge="IMO CII RATING A+"
        titleLine1="Reduce emissions."
        titleLine2="Meet IMO targets."
        description="Voyage speed optimization, weather routing, and fleet age filtering that lower carbon intensity (CII) by 18% while cutting heavy fuel consumption across bulk corridors."
        primaryAction={{
          label: "Run Eco-Steaming Optimization",
          href: "/optimization",
        }}
        secondaryAction={{
          label: "Inspect Fleet Telemetry",
          href: "/vessels",
        }}
        stats={[
          { value: "-18%", label: "CO₂ Emissions Reduction", sublabel: "vs Unoptimized Charter" },
          { value: "+11%", label: "Voyage Fuel Efficiency", sublabel: "Eco-Steaming Compliant" },
          { value: "12,400 MT", label: "Annualized CO₂ Saved", sublabel: "ESG Audit Certified" },
          { value: "Rating A+", label: "IMO CII Fleet Index", sublabel: "Top Tier Decarbonization" },
        ]}
      />

      {/* Hero Banner with Green Highlights */}
      <div className="rounded-lg p-6 bg-[#102235] border border-[#294154]">
        <div className="max-w-2xl">
          <div className="text-[10px] text-[#6DAF91] font-mono tracking-wider uppercase mb-1 font-semibold">
            GREEN SHIPPING CORRIDORS
          </div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-[#E8F0F5] mb-2">
            AI Fleet Optimization Reduces Voyage Emissions by 18%
          </h2>
          <p className="text-xs text-[#91A6B8] leading-relaxed mb-6 font-sans">
            By optimizing vessel speed profiles, draft load factors, and reducing demurrage waiting queues at Visakhapatnam and Paradip ports, our MILP engine minimizes unnecessary fuel burn and delivers verified carbon savings.
          </p>

          <div className="grid grid-cols-3 gap-3 font-mono">
            <div className="p-3 rounded-md bg-[#162C40] border border-[#294154]">
              <div className="text-[9px] text-[#91A6B8] uppercase">CO₂ Reduction</div>
              <div className="text-2xl font-bold text-[#6DAF91]">-18%</div>
            </div>
            <div className="p-3 rounded-md bg-[#162C40] border border-[#294154]">
              <div className="text-[9px] text-[#91A6B8] uppercase">Fuel Efficiency Gain</div>
              <div className="text-2xl font-bold text-[#35B8A6]">+11%</div>
            </div>
            <div className="p-3 rounded-md bg-[#162C40] border border-[#294154]">
              <div className="text-[9px] text-[#91A6B8] uppercase">CII Fleet Rating</div>
              <div className="text-2xl font-bold text-[#5D9BC4]">A+</div>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Sustainability Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 font-mono">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="bg-[#102235] rounded-lg p-4 border border-[#294154]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-base">{m.icon}</span>
              <span className="text-[10px] font-semibold" style={{ color: m.color }}>
                CII METRIC
              </span>
            </div>
            <div className="text-xl font-bold mb-1" style={{ color: m.color }}>
              {m.val}
            </div>
            <div className="text-[11px] text-[#E8F0F5] font-semibold mb-0.5">{m.label}</div>
            <div className="text-[9px] text-[#91A6B8] font-sans leading-tight">{m.desc}</div>
          </div>
        ))}
      </div>

      {/* Row 2: CO2 Reduction Trend AreaChart + Fuel Savings BarChart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CO2 Reduction Trajectory AreaChart (7 cols) */}
        <div className="lg:col-span-7 bg-[#102235] rounded-lg p-5 border border-[#294154] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] text-[#6DAF91] font-mono tracking-wider uppercase font-semibold">
                ◆ EMISSIONS TRAJECTORY
              </div>
              <h3 className="font-display font-bold text-sm text-[#E8F0F5] m-0">
                CO₂ Index: Unoptimized Baseline vs AI-Optimized Routing
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#6DAF91]/15 text-[#6DAF91] border border-[#6DAF91]/30">
              Normalized Index (100 Base)
            </span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CO2_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="optGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6DAF91" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6DAF91" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#294154" vertical={false} />
                <XAxis dataKey="m" tick={{ fill: '#91A6B8', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#91A6B8', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} domain={[75, 105]} />
                <Tooltip
                  contentStyle={{
                    background: '#102235',
                    border: '1px solid #294154',
                    borderRadius: 6,
                    fontSize: 11,
                    fontFamily: 'JetBrains Mono',
                    color: '#E8F0F5',
                  }}
                  formatter={(v: any, n: any) => [`${v} Index`, n === 'base' ? 'Unoptimized Route' : 'AI-Optimized Route']}
                />
                <Area type="monotone" dataKey="base" stroke="#91A6B8" strokeWidth={1.5} strokeDasharray="3 3" fill="none" dot={false} />
                <Area type="monotone" dataKey="optimized" stroke="#6DAF91" strokeWidth={2} fill="url(#optGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fuel Savings by Corridor BarChart (5 cols) */}
        <div className="lg:col-span-5 bg-[#102235] rounded-lg p-5 border border-[#294154] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] text-[#35B8A6] font-mono tracking-wider uppercase font-semibold">
                ◆ VOYAGE EFFICIENCY
              </div>
              <h3 className="font-display font-bold text-sm text-[#E8F0F5] m-0">
                Fuel Savings by Corridor (MT VLSFO)
              </h3>
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={FUEL_SAVINGS_BY_ROUTE} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#294154" vertical={false} />
                <XAxis dataKey="route" tick={{ fill: '#91A6B8', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#91A6B8', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#102235',
                    border: '1px solid #294154',
                    borderRadius: 6,
                    fontSize: 11,
                    fontFamily: 'JetBrains Mono',
                    color: '#E8F0F5',
                  }}
                  formatter={(v: any) => [`${v} MT Saved`, 'Fuel Efficiency']}
                />
                <Bar dataKey="savings" fill="#35B8A6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
