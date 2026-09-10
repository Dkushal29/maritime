'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  Ship,
  Boxes,
  Sliders,
  Compass,
  Leaf,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Freight Forecasting',
    desc: 'XGBoost-powered model predicts ocean freight rates with 95% confidence bounds across all major bulk corridors.',
    color: '#22D3EE',
    link: '/forecast',
  },
  {
    icon: Ship,
    title: 'Vessel Optimization',
    desc: 'AI scores every available vessel for suitability. MILP optimization finds the minimum-cost charter strategy.',
    color: '#1683FF',
    link: '/vessels',
  },
  {
    icon: Boxes,
    title: 'Cargo Intelligence',
    desc: 'Real-time inventory monitoring with AI procurement recommendations across coal, iron ore, and bulk commodities.',
    color: '#8B5CF6',
    link: '/cargo',
  },
  {
    icon: Sliders,
    title: 'What-If Simulation',
    desc: 'Stress-test your strategy. Adjust bunker prices, congestion, and demand to see how risk evolves in real time.',
    color: '#F59E0B',
    link: '/simulator',
  },
  {
    icon: Compass,
    title: 'Route Analytics',
    desc: 'AI-ranked shipping routes for India East Coast delivery. Risk, freight, and landed cost compared across all corridors.',
    color: '#10B981',
    link: '/routes',
  },
  {
    icon: Leaf,
    title: 'Sustainability',
    desc: 'Track CO₂ reduction, fuel efficiency gains, and CII ratings. AI optimization cuts emissions by an estimated 18%.',
    color: '#10B981',
    link: '/sustainability',
  },
];

const STATS = [
  { val: '99.3%', label: 'Freight Model R² Score' },
  { val: '$420K', label: 'Avg. Charter Savings' },
  { val: '320+', label: 'Vessel-Route Combos Analyzed' },
  { val: '-18%', label: 'CO₂ Emissions Reduction' },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-ocean-950 text-slate-100 font-sans selection:bg-cyan selection:text-ocean-950">
      {/* Top Floating Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 border-b border-electric/15"
        style={{
          background: 'rgba(2, 13, 24, 0.88)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <Link href="/dashboard" className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-md shadow-electric/25"
            style={{ background: 'linear-gradient(135deg, #1683FF, #22D3EE)' }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M2 13 Q5 8 10 10 Q15 12 18 7" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M10 10 L10 4 L14 7 L10 4 L6 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div>
            <span className="font-display font-extrabold text-base tracking-wider text-slate-100">
              MARITIME <span className="text-cyan">AI</span>
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
          <Link href="/dashboard" className="hover:text-cyan transition-colors">Overview</Link>
          <Link href="/forecast" className="hover:text-cyan transition-colors">Forecasting</Link>
          <Link href="/optimization" className="hover:text-cyan transition-colors">Optimization</Link>
          <Link href="/vessels" className="hover:text-cyan transition-colors">Fleet</Link>
          <Link href="/sustainability" className="hover:text-cyan transition-colors">Sustainability</Link>
        </div>

        <Link
          href="/dashboard"
          className="ai-gradient px-4 py-2 rounded-lg text-white font-display font-bold text-xs shadow-lg shadow-electric/25 hover:opacity-95 transition-opacity flex items-center gap-2 border border-white/15"
        >
          <span>Open Platform</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </nav>

      {/* Hero Section */}
      <div className="relative min-h-[92vh] flex items-center pt-24 pb-16 px-6 md:px-16 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1724597500306-a4cbb7d1324e?w=1440&h=900&fit=crop&auto=format"
          alt="Aerial view of bulk carrier cargo ship in open ocean"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Layered Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-ocean-950/70 via-ocean-950/80 to-ocean-950" />
        <div className="absolute inset-0 bg-radial-at-c from-electric/10 via-transparent to-ocean-950/90" />

        {/* Route Line SVG Animation */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
        >
          <path
            d="M 120 700 Q 720 200 1320 400"
            stroke="#22D3EE"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="8 6"
            className="route-animated"
          />
          <path
            d="M 200 750 Q 800 250 1260 360"
            stroke="#1683FF"
            strokeWidth="1.2"
            fill="none"
            strokeDasharray="8 6"
            className="route-animated"
          />
          <circle cx="120" cy="700" r="5" fill="#22D3EE" className="port-pulse" />
          <circle cx="1320" cy="400" r="5" fill="#22D3EE" className="port-pulse" />
          <circle cx="1260" cy="360" r="5" fill="#1683FF" className="port-pulse" />
        </svg>

        {/* Hero Content */}
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan/10 border border-cyan/30 text-cyan text-xs font-mono mb-6">
            <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            <span>GLOBAL MARITIME DECISION SUPPORT SYSTEM</span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl text-slate-100 leading-[1.1] mb-6 tracking-tight">
            Predict the market.<br />
            <span className="text-cyan">Optimize the fleet.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-2xl leading-relaxed">
            Enterprise AI decision support platform for bulk-cargo importers. Powered by{' '}
            <span className="text-cyan font-semibold">XGBoost freight & demand forecasting</span> and{' '}
            <span className="text-electric-light font-semibold">OR-Tools MILP charter optimization</span>.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/dashboard"
              className="ai-gradient px-6 py-3.5 rounded-xl text-white font-display font-bold text-sm shadow-xl shadow-electric/30 hover:opacity-95 transition-all flex items-center gap-2 border border-white/20"
            >
              <span>Explore Intelligence</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/optimization"
              className="px-6 py-3.5 rounded-xl bg-ocean-800/80 hover:bg-ocean-700 text-slate-100 font-display font-semibold text-sm border border-electric/25 hover:border-cyan/50 transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-cyan" />
              <span>Run AI Optimization</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="border-y border-electric/15 bg-ocean-900/60 py-8 px-6 md:px-16">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="font-mono text-3xl md:text-4xl font-extrabold text-cyan mb-1">
                {stat.val}
              </div>
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Core Value Chain Workflow */}
      <div className="py-20 px-6 md:px-16 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="text-xs font-mono text-cyan tracking-wider uppercase mb-2 font-bold">
            END-TO-END DECISION ARCHITECTURE
          </div>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl text-slate-100">
            From Raw Telemetry to Optimal Vessel Charters
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { step: '01', title: 'Data Ingestion', desc: 'Baltic indices, port traffic, AIS, and trade flows.' },
            { step: '02', title: 'Predictive ML', desc: 'Dual XGBoost engines forecast freight rates and cargo demand.' },
            { step: '03', title: 'MILP Optimization', desc: 'Google OR-Tools solver resolves capacity & budget constraints.' },
            { step: '04', title: 'Actionable Insights', desc: 'Charter timing, vessel picks, and expected net savings.' },
          ].map((item) => (
            <div
              key={item.step}
              className="glass rounded-xl p-5 border border-electric/15 relative overflow-hidden"
            >
              <div className="text-2xl font-mono font-extrabold text-cyan/30 mb-2">
                {item.step}
              </div>
              <h3 className="font-display font-bold text-sm text-slate-100 mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-slate-400 leading-snug m-0">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <Link
                key={feat.title}
                href={feat.link}
                className="glass rounded-2xl p-6 transition-all hover:border-cyan/40 hover:bg-ocean-800/50 group border border-electric/15 block"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: `${feat.color}15`,
                    border: `1px solid ${feat.color}35`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: feat.color }} />
                </div>
                <h3 className="font-display font-bold text-base text-slate-100 mb-2 group-hover:text-cyan transition-colors">
                  {feat.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed m-0">
                  {feat.desc}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-electric/15 bg-ocean-950 py-10 px-6 md:px-16 text-center text-xs font-mono text-slate-500">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="font-display font-bold text-slate-300">MARITIME AI</span>
          <span>•</span>
          <span className="text-cyan">Predict. Optimize. Charter Smarter.</span>
        </div>
        <div>Built for Smart India Hackathon · Powered by FastAPI, XGBoost & Google OR-Tools</div>
      </footer>
    </div>
  );
}
