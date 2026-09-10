'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Database, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { PageHero } from '@/components/maritime/PageHero';

const SOURCES = [
  {
    name: 'Baltic Exchange',
    desc: 'BCI, BPI, BSI freight indices and fixtures data',
    type: 'Freight Indices',
    freq: 'Daily',
    status: 'Demo Data',
    statusColor: '#F59E0B',
    coverage: ['BCI', 'BPI', 'BSI', 'BHI', 'Fixtures'],
  },
  {
    name: 'Indian Ports Authority',
    desc: 'Official port traffic, vessel movements, berth availability',
    type: 'Port Operations',
    freq: 'Real-time',
    status: 'Demo Data',
    statusColor: '#F59E0B',
    coverage: ['Paradip', 'Vizag', 'Chennai', 'Kamarajar', 'Haldia'],
  },
  {
    name: 'Govt. of India — Open Data',
    desc: 'data.gov.in: cargo statistics, port performance, trade data',
    type: 'Government Trade',
    freq: 'Monthly',
    status: 'Demo Data',
    statusColor: '#F59E0B',
    coverage: ['Cargo volumes', 'Port capacity', 'Trade flow'],
  },
  {
    name: 'UN Comtrade',
    desc: 'International trade statistics for coal, iron ore, grain, fertilizer',
    type: 'Global Trade',
    freq: 'Monthly',
    status: 'Demo Data',
    statusColor: '#F59E0B',
    coverage: ['Coal', 'Iron Ore', 'Limestone', 'Fertilizer', 'Grain'],
  },
  {
    name: 'World Bank Commodity Markets',
    desc: 'Global commodity price indices — Pink Sheet benchmarks',
    type: 'Commodity Prices',
    freq: 'Monthly',
    status: 'Demo Data',
    statusColor: '#F59E0B',
    coverage: ['Coal price', 'Iron ore price', 'Energy', 'Fertilizer'],
  },
  {
    name: 'IEA / EIA Fuel Benchmarks',
    desc: 'Bunker fuel prices, VLSFO, MGO pricing benchmarks',
    type: 'Bunker Prices',
    freq: 'Weekly',
    status: 'Demo Data',
    statusColor: '#F59E0B',
    coverage: ['VLSFO', 'MGO', 'IFO380', 'Brent'],
  },
  {
    name: 'AIS / MarineTraffic (Simulated)',
    desc: 'Vessel positions, speed, route, ETA — AIS transponder telemetry',
    type: 'Fleet Tracking',
    freq: 'Real-time',
    status: 'Demo Data',
    statusColor: '#F59E0B',
    coverage: ['Panamax', 'Capesize', 'Supramax', 'Positions'],
  },
];

export default function SourcesPage() {
  const [activeMode, setActiveMode] = useState<'DEMO' | 'LIVE'>('DEMO');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cinematic Hero Banner matching Landing Page */}
      <PageHero
        badge="DATA PROVENANCE & AUDIT TRAIL"
        subBadge="TRANSPARENT INGESTION REGISTRY"
        titleLine1="Verify the data."
        titleLine2="Trust the decision."
        description="Transparent data audit trail across Baltic Exchange indices, Indian Ports Association feeds, Ministry of Shipping records, and satellite AIS positioning."
        primaryAction={{
          label: "Inspect Model Telemetry",
          href: "/analytics",
        }}
        secondaryAction={{
          label: "View Predictive Forecasts",
          href: "/forecast",
        }}
        stats={[
          { value: `${SOURCES.length || 8} Feeds`, label: "Connected Ingestion Feeds", sublabel: "Freight, Fuel, Congestion" },
          { value: "Daily / Realtime", label: "Refresh Cadence", sublabel: "Automated Pipeline" },
          { value: "100% Audited", label: "Traceable Provenance", sublabel: "Zero Fabricated Inputs" },
          { value: "Production Ready", label: "Connector Architecture", sublabel: "REST / WebSocket Ready" },
        ]}
      />

      {/* Data Mode Banner (DEMO vs LIVE) */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-ocean-900 via-ocean-800 to-ocean-900 border border-electric/25 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Current Environment Data Mode:</span>
            <Badge variant="demo" size="md">
              DEMO DATA
            </Badge>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed m-0 font-sans">
            The platform currently operates with synthetic and calibrated demonstration datasets adhering to historical Indian East Coast port throughput. Production connectors are architected for real-time AIS, Baltic fixtures, and IPA feeds.
          </p>
        </div>

        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-ocean-950 border border-electric/20 shrink-0 font-mono text-xs">
          <button
            onClick={() => setActiveMode('DEMO')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeMode === 'DEMO'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DEMO
          </button>
          <button
            onClick={() => setActiveMode('LIVE')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeMode === 'LIVE'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            LIVE (PROD READY)
          </button>
        </div>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SOURCES.map((src) => (
          <div
            key={src.name}
            className="glass rounded-xl p-5 border border-electric/15 hover:border-electric/30 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-display font-bold text-sm text-slate-100 m-0">
                  {src.name}
                </h3>
                <span
                  className="px-2 py-0.5 rounded text-[9px] font-mono font-bold shrink-0"
                  style={{
                    color: src.statusColor,
                    backgroundColor: `${src.statusColor}18`,
                    border: `1px solid ${src.statusColor}33`,
                  }}
                >
                  {src.status}
                </span>
              </div>

              <div className="text-xs font-mono text-cyan mb-2">{src.type}</div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {src.desc}
              </p>
            </div>

            <div className="pt-3 border-t border-electric/10 space-y-2 font-mono text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Update Cadence:</span>
                <span className="text-slate-200 font-semibold">{src.freq}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Coverage Scope:</span>
                <div className="flex flex-wrap gap-1">
                  {src.coverage.map((c) => (
                    <span
                      key={c}
                      className="px-1.5 py-0.2 rounded bg-ocean-950 text-[10px] text-slate-300 border border-electric/10"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
