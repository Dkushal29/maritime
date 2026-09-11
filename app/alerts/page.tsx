'use client';

import React, { useState, useEffect } from 'react';
import { getAlerts } from '@/lib/api';
import { AlertItem } from '@/types';
import { AlertCard } from '@/components/maritime/AlertCard';
import { PageHero } from '@/components/maritime/PageHero';

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
        <div className="flex flex-wrap gap-1.5 p-1 bg-[#102235] rounded-md border border-[#294154]">
          {CATEGORIES.map((cat) => {
            const count = getCategoryCount(cat);
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  filter === cat
                    ? 'bg-[#162C40] text-[#35B8A6] border border-[#35B8A6]/40'
                    : 'text-[#91A6B8] hover:text-[#E8F0F5] hover:bg-[#162C40]'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  filter === cat ? 'bg-[#35B8A6]/20 text-[#35B8A6]' : 'bg-[#0B1726] text-[#91A6B8]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-xs font-mono text-[#91A6B8]">
          Showing <strong className="text-[#35B8A6] font-semibold">{filtered.length}</strong> active notifications
        </div>
      </div>

      {/* Alerts Stream */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-[#102235] rounded-lg border border-[#294154]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#102235] rounded-lg p-12 text-center border border-[#294154] text-[#91A6B8] font-mono text-xs">
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
