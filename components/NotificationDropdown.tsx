'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, AlertTriangle, Info, Check, ShieldAlert, Sparkles } from 'lucide-react';
import { getAlerts } from '@/lib/api';
import { mockAlerts } from '@/data/mockData';
import { AlertItem } from '@/types';

interface NotificationDropdownProps {
  onClose: () => void;
}

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>(mockAlerts);
  const [filter, setFilter] = useState<'All' | 'Critical' | 'Warning'>('All');

  useEffect(() => {
    getAlerts()
      .then((data) => {
        if (data && data.length > 0) setAlerts(data);
      })
      .catch(() => {});
  }, []);

  const markAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const dismissAlert = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const matchCondition = (item: AlertItem, cat: string) => {
    if (cat === 'All') return true;
    const sev = String(item.severity || item.category || '').toLowerCase();
    const typ = String(item.type || '').toLowerCase();
    const c = cat.toLowerCase();
    if (c === 'critical') return sev.includes('crit') || typ.includes('crit');
    if (c === 'warning') return sev.includes('warn') || typ.includes('warn');
    return true;
  };

  const filtered = alerts.filter((a) => matchCondition(a, filter));
  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-[#0B1528] border border-electric/25 rounded-xl shadow-2xl overflow-hidden animate-in fade-in duration-150 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#08101E] border-b border-electric/20">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan" />
          <span className="text-xs font-bold text-slate-100 font-display">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] font-mono rounded-full bg-cyan/20 text-cyan border border-cyan/30 font-bold">
              {unreadCount} new
            </span>
          )}
        </div>
        <button
          onClick={markAllRead}
          className="text-[10px] text-cyan hover:underline flex items-center gap-1 font-mono cursor-pointer"
        >
          <Check className="w-3 h-3" /> Mark all read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 px-3 py-2 bg-ocean-950/60 border-b border-electric/15">
        {(['All', 'Critical', 'Warning'] as const).map((cat) => {
          const count = alerts.filter((a) => matchCondition(a, cat)).length;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filter === cat
                  ? 'bg-electric text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-ocean-800/60'
              }`}
            >
              <span>{cat}</span>
              <span className={`text-[9px] px-1 py-0.1 rounded-full ${
                filter === cat ? 'bg-white/20 text-white' : 'bg-ocean-900 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-electric/10">
        {filtered.length > 0 ? (
          filtered.map((item) => {
            const rawSev = String(item.severity || item.category || '').toLowerCase();
            const isCrit = rawSev.includes('crit');
            const isWarn = rawSev.includes('warn');
            const isOpp = rawSev.includes('opp') || rawSev.includes('recom');

            return (
              <div
                key={item.id}
                className={`p-3.5 hover:bg-ocean-800/50 transition-colors relative flex flex-col gap-1.5 ${
                  !item.read ? 'bg-ocean-900/40' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isCrit ? (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-rose-400" />
                        CRITICAL
                      </span>
                    ) : isWarn ? (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        WARNING
                      </span>
                    ) : isOpp ? (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        OPPORTUNITY
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan/20 text-cyan border border-cyan/30 flex items-center gap-1">
                        <Info className="w-3 h-3 text-cyan" />
                        INFO
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-200">{item.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">{item.timestamp}</span>
                </div>

                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed font-sans">{item.description}</p>

                <div className="flex items-center justify-between mt-0.5 pt-1.5 border-t border-electric/10">
                  <span className="text-[10px] font-mono text-cyan truncate max-w-[240px]">
                    ↳ {item.action || item.recommendedAction}
                  </span>
                  <button
                    onClick={(e) => dismissAlert(item.id, e)}
                    className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer font-mono"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-xs text-slate-400 font-mono">No notifications in this category.</div>
        )}
      </div>

      {/* Footer link */}
      <div className="p-2.5 bg-[#08101E] border-t border-electric/20 text-center">
        <Link
          href="/alerts"
          onClick={onClose}
          className="text-xs font-mono font-semibold text-cyan hover:underline"
        >
          View Full Alert Center →
        </Link>
      </div>
    </div>
  );
}
