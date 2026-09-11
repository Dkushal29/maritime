'use client';

import React, { useState, useEffect } from 'react';
import { getAlerts } from '@/lib/api';
import { AlertItem } from '@/types';
import { AlertCard } from '@/components/maritime/AlertCard';
import { PageHero } from '@/components/maritime/PageHero';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';

const CATEGORIES = ['All', 'CRITICAL', 'WARNING', 'OPPORTUNITY', 'INFO'] as const;

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getAlerts()
      .then((res) => {
        setAlerts(res);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Alerts API error:', err);
        setIsLoading(false);
      });
  }, []);

  const matchCategory = (a: AlertItem, cat: string) => {
    if (cat === 'All') return true;
    const sev = String(a.severity || a.category || '').toLowerCase();
    const typ = String(a.type || '').toLowerCase();
    const c = cat.toLowerCase();

    if (c === 'critical') {
      return sev.includes('crit') || typ.includes('crit');
    }
    if (c === 'warning') {
      return sev.includes('warn') || typ.includes('warn');
    }
    if (c === 'opportunity') {
      return sev.includes('opp') || sev.includes('recom') || typ.includes('opp') || typ.includes('arbitrage');
    }
    if (c === 'info') {
      return sev.includes('info') || typ.includes('info') || typ.includes('advisory') || (!sev.includes('crit') && !sev.includes('warn') && !sev.includes('opp'));
    }
    return true;
  };

  const getCategoryCount = (cat: string) => {
    return alerts.filter((a) => matchCategory(a, cat)).length;
  };

  const filtered = alerts.filter((a) => matchCategory(a, filter));

  const critCount = getCategoryCount('CRITICAL');
  const warnCount = getCategoryCount('WARNING');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cinematic Hero Banner matching Landing Page */}
      <PageHero
        badge="OPERATIONAL RISK & ANOMALY DETECTION"
        subBadge="REAL-TIME TELEMETRY TRIGGERS"
        titleLine1="Track the risks."
        titleLine2="Act on real-time spikes."
        description="Automated early warnings for freight rate surges, bunker fuel escalation, critical plant inventory depletion, and port congestion bottlenecks across East Coast India."
        primaryAction={{
          label: "Execute Mitigation Strategy",
          href: "/optimization",
        }}
        secondaryAction={{
          label: "Simulate Risk Trade-Offs",
          href: "/simulator",
        }}
        stats={[
          { value: `${alerts.length} Active`, label: "Risk Telemetry Alerts", sublabel: "Real-time Feed" },
          { value: `${critCount} Critical`, label: "High Severity Spikes", sublabel: "Urgent Mitigation" },
          { value: `${warnCount} Warnings`, label: "Operational Warnings", sublabel: "Threshold Triggers" },
          { value: "+21.6%", label: "Freight Volatility", sublabel: "30-Day Forward Curve" },
        ]}
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 p-1 bg-ocean-950/80 rounded-xl border border-electric/15">
          {CATEGORIES.map((cat) => {
            const count = getCategoryCount(cat);
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filter === cat
                    ? 'bg-electric text-white shadow-md shadow-electric/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-ocean-800/60'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  filter === cat ? 'bg-white/20 text-white' : 'bg-ocean-800 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <DataSourceBadge type="model" label="Model & Telemetry" tooltip="Alert triggers computed from XGBoost volatility predictions and terminal coverage models" />
          <div className="text-xs font-mono text-slate-400">
            Showing <strong className="text-cyan font-bold">{filtered.length}</strong> active notifications
          </div>
        </div>
      </div>

      {/* Alerts Stream */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-ocean-900 rounded-xl border border-electric/15" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center border-electric/15 text-slate-400 font-mono text-xs">
          No active alerts match this filter. All operational systems normal.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={{
                id: alert.id,
                title: alert.title,
                type: alert.type || 'Operational Telemetry',
                severity: alert.severity || alert.category?.toLowerCase() || 'info',
                category: alert.category,
                route: alert.route,
                description: alert.description,
                action: alert.action || alert.recommendedAction || 'Monitor parameters closely.',
                time: alert.timestamp || 'Just now',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
