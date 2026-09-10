'use client';

import React, { useState, useEffect } from 'react';
import GlobalFilterBar from '@/components/GlobalFilterBar';
import { Bell, ShieldAlert, AlertTriangle, Info, CheckCircle2, Trash2, Filter } from 'lucide-react';
import { getAlerts } from '@/lib/api';
import { AlertItem } from '@/types';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  useEffect(() => {
    getAlerts().then(setAlerts);
  }, []);

  const handleMarkRead = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };

  const handleDismiss = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const filtered = filterCategory === 'ALL'
    ? alerts
    : alerts.filter((a) => a.category.toLowerCase() === filterCategory.toLowerCase());

  return (
    <div className="space-y-6">
      <GlobalFilterBar />

      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#131C31] border border-[#1E293B] rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-100 uppercase font-mono">
            Alert &amp; Risk Notification Center ({filtered.length} Active Items)
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex items-center gap-1 bg-[#0B1120] border border-[#1E293B] rounded-lg p-0.5 text-xs font-mono">
            {['ALL', 'Critical', 'Warning', 'Information', 'Recommendation'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Cards Stream */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`p-5 rounded-xl border transition-all ${
              !item.read
                ? 'bg-[#131C31] border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                : 'bg-[#0B1120] border-[#1E293B] opacity-80'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                {item.category === 'Critical' ? (
                  <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                ) : item.category === 'Warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                ) : (
                  <Info className="w-5 h-5 text-cyan-400 shrink-0" />
                )}
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{item.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                    <span>{item.type}</span>
                    <span>·</span>
                    <span>{item.timestamp}</span>
                    {item.route && (
                      <>
                        <span>·</span>
                        <span className="text-cyan-400">{item.route}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!item.read && (
                  <button
                    onClick={() => handleMarkRead(item.id)}
                    className="px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono hover:bg-cyan-500/20"
                  >
                    Mark Read
                  </button>
                )}
                <button
                  onClick={() => handleDismiss(item.id)}
                  className="p-1 rounded text-slate-500 hover:text-red-400"
                  title="Dismiss alert"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-3">{item.description}</p>

            <div className="p-3 rounded-lg bg-[#070C18] border border-[#1E293B] flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Recommended Action:</span>
              <span className="font-bold text-cyan-400">{item.recommendedAction}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
