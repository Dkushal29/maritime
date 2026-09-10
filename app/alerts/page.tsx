'use client';

import React, { useState, useEffect } from 'react';
import { getAlerts } from '@/lib/api';
import { AlertItem } from '@/types';
import { AlertCard } from '@/components/maritime/AlertCard';

const CATEGORIES = ['All', 'CRITICAL', 'WARNING', 'OPPORTUNITY', 'INFO'];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filter, setFilter] = useState('All');
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

  const filtered = filter === 'All'
    ? alerts
    : alerts.filter((a) => {
        const typeStr = (a.type || a.severity || a.category || '').toUpperCase();
        return typeStr.includes(filter.toUpperCase());
      });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-[11px] text-cyan font-mono tracking-wider uppercase mb-1 font-bold">
          ◆ OPERATIONAL RISK CENTER
        </div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-100 m-0">
          Alerts & Risk Notifications
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Automated warnings for freight spikes, low inventory stock, fleet availability and weather
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 p-1 bg-ocean-950/80 rounded-xl border border-electric/15">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                filter === cat
                  ? 'bg-electric text-white shadow-md shadow-electric/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-ocean-800/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="text-xs font-mono text-slate-400">
          Showing <strong className="text-cyan">{filtered.length}</strong> active notifications
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
                type: alert.type || alert.severity || 'INFO',
                severity: (alert.severity as any) || (alert.type?.toLowerCase() as any) || 'info',
                category: alert.category,
                route: alert.route,
                description: alert.description,
                action: alert.action || alert.recommendedAction || 'Monitor parameters closely.',
                time: alert.timestamp || '2 min ago',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
