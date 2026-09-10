'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bell, AlertTriangle, Info, Check, CheckCircle2, ShieldAlert } from 'lucide-react';
import { mockAlerts } from '@/data/mockData';
import { AlertItem } from '@/types';

interface NotificationDropdownProps {
  onClose: () => void;
}

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>(mockAlerts);

  const markAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const dismissAlert = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-[#131C31] border border-[#1E293B] rounded-xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0B1120] border-b border-[#1E293B]">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-100">Notifications</span>
          <span className="px-1.5 py-0.2 text-[10px] font-mono rounded-full bg-cyan-500/20 text-cyan-300">
            {alerts.filter((a) => !a.read).length} new
          </span>
        </div>
        <button
          onClick={markAllRead}
          className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-mono"
        >
          <Check className="w-3 h-3" /> Mark all read
        </button>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-[#1E293B]">
        {alerts.length > 0 ? (
          alerts.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 hover:bg-[#1C2942] transition-colors relative flex flex-col gap-1 ${
                !item.read ? 'bg-[#0B1120]/40' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {item.category === 'Critical' ? (
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  ) : item.category === 'Warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                  )}
                  <span className="text-xs font-bold text-slate-200">{item.title}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{item.timestamp}</span>
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>

              <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-[#1E293B]/60">
                <span className="text-[10px] font-mono text-cyan-400 truncate max-w-[220px]">
                  {item.recommendedAction}
                </span>
                <button
                  onClick={(e) => dismissAlert(item.id, e)}
                  className="text-[10px] text-slate-500 hover:text-slate-300"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">All notifications cleared.</div>
        )}
      </div>

      {/* Footer link */}
      <div className="p-2.5 bg-[#090E1C] border-t border-[#1E293B] text-center">
        <Link
          href="/alerts"
          onClick={onClose}
          className="text-xs font-mono font-semibold text-cyan-400 hover:underline"
        >
          View Full Alert Center →
        </Link>
      </div>
    </div>
  );
}
