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
  { label: 'CO₂ Reduction', val: '-18%', desc: 'vs unoptimized charter routing', color: '#10B981', icon: '🌿' },
  { label: 'Fuel Efficiency', val: '+11%', desc: 'through voyage route optimization', color: '#22D3EE', icon: '⛽' },
  { label: 'Optimized Routes', val: '24', desc: 'bulk lanes analyzed this month', color: '#1683FF', icon: '🗺' },
  { label: 'Emissions Intensity', val: '8.2 g/MT·km', desc: 'calibrated fleet average index', color: '#8B5CF6', icon: '📊' },
  { label: 'Potential CO₂ Saved', val: '12,400 MT', desc: 'annualized ESG target projection', color: '#10B981', icon: '🌎' },
  { label: 'Energy Rating', val: 'A+', desc: 'CII carbon intensity rating', color: '#10B981', icon: '⭐' },
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
      <div
        className="rounded-2xl p-7 relative overflow-hidden border border-emerald-500/25 shadow-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 21, 37, 0.95) 100%)',
        }}
      >
        <div className="max-w-2xl">
          <div className="text-[10px] text-emerald-400 font-mono tracking-wider uppercase mb-1 font-bold">
            GREEN SHIPPING CORRIDORS
          </div>
          <h2 className="font-display font-extrabold text-2xl text-slate-100 mb-2">
            AI Fleet Optimization Reduces Voyage Emissions by 18%
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed mb-6 font-sans">
            By optimizing vessel speed profiles, draft load factors, and reducing demurrage waiting queues at Visakhapatnam and Paradip ports, our MILP engine minimizes unnecessary fuel burn and delivers verified carbon savings.
          </p>

          <div className="grid grid-cols-3 gap-3 font-mono">
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
              <div className="text-[9px] text-emerald-400 uppercase">CO₂ Reduction</div>
              <div className="text-2xl font-extrabold text-emerald-400">-18%</div>
            </div>
            <div className="p-3 rounded-xl bg-cyan/15 border border-cyan/30">
              <div className="text-[9px] text-cyan uppercase">Fuel Efficiency Gain</div>
              <div className="text-2xl font-extrabold text-cyan">+11%</div>
            </div>
            <div className="p-3 rounded-xl bg-purple-ai/15 border border-purple-ai/30">
              <div className="text-[9px] text-purple-ai uppercase">CII Fleet Rating</div>
              <div className="text-2xl font-extrabold text-purple-ai">A+</div>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Sustainability Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 font-mono">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="glass rounded-xl p-4 border border-electric/15"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-base">{m.icon}</span>
              <span className="text-[10px] font-bold" style={{ color: m.color }}>
                CII METRIC
              </span>
            </div>
            <div className="text-xl font-bold mb-1" style={{ color: m.color }}>
              {m.val}
            </div>
            <div className="text-[11px] text-slate-200 font-semibold mb-0.5">{m.label}</div>
            <div className="text-[9px] text-slate-500 font-sans leading-tight">{m.desc}</div>
          </div>
        ))}
      </div>

      {/* Row 2: CO2 Reduction Trend AreaChart + Fuel Savings BarChart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CO2 Reduction Trajectory AreaChart (7 cols) */}
        <div className="lg:col-span-7 glass rounded-xl p-5 border border-electric/15 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] text-emerald-400 font-mono tracking-wider uppercase font-bold">
                ◆ EMISSIONS TRAJECTORY
              </div>
              <h3 className="font-display font-bold text-sm text-slate-100 m-0">
                CO₂ Index: Unoptimized Baseline vs AI-Optimized Routing
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Normalized Index (100 Base)
            </span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CO2_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="optGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(22, 131, 255, 0.08)" vertical={false} />
                <XAxis dataKey="m" tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} domain={[75, 105]} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(11, 31, 54, 0.95)',
                    border: '1px solid rgba(22, 131, 255, 0.25)',
                    borderRadius: 6,
                    fontSize: 11,
                    fontFamily: 'JetBrains Mono',
                  }}
                  formatter={(v: any, n: any) => [`${v} Index`, n === 'base' ? 'Unoptimized Route' : 'AI-Optimized Route']}
                />
                <Area type="monotone" dataKey="base" stroke="#64748B" strokeWidth={1.5} strokeDasharray="3 3" fill="none" dot={false} />
                <Area type="monotone" dataKey="optimized" stroke="#10B981" strokeWidth={2.5} fill="url(#optGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fuel Savings by Corridor BarChart (5 cols) */}
        <div className="lg:col-span-5 glass rounded-xl p-5 border border-electric/15 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] text-cyan font-mono tracking-wider uppercase font-bold">
                ◆ VOYAGE EFFICIENCY
              </div>
              <h3 className="font-display font-bold text-sm text-slate-100 m-0">
                Fuel Savings by Corridor (MT VLSFO)
              </h3>
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={FUEL_SAVINGS_BY_ROUTE} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(22, 131, 255, 0.08)" vertical={false} />
                <XAxis dataKey="route" tick={{ fill: '#64748B', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(11, 31, 54, 0.95)',
                    border: '1px solid rgba(22, 131, 255, 0.25)',
                    borderRadius: 6,
                    fontSize: 11,
                    fontFamily: 'JetBrains Mono',
                  }}
                  formatter={(v: any) => [`${v} MT Saved`, 'Fuel Efficiency']}
                />
                <Bar dataKey="savings" fill="#22D3EE" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
