'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Search,
  Bell,
  Bot,
  User,
  Radio,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import NotificationDropdown from '../NotificationDropdown';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Freight Intelligence Center',
    subtitle: 'AI-powered vessel chartering and bulk cargo procurement intelligence.',
  },
  '/forecast': {
    title: 'Freight Rate Forecasting',
    subtitle: 'XGBoost multi-horizon rate projections, feature drivers & confidence bounds.',
  },
  '/cargo': {
    title: 'Bulk Cargo Demand Forecast',
    subtitle: 'Commodity inventory coverage, regional import demand & procurement windows.',
  },
  '/vessels': {
    title: 'Vessel Intelligence Terminal',
    subtitle: 'Real-time tonnage tracking, DWT specs, charter rates & AI suitability scores.',
  },
  '/optimization': {
    title: 'AI Charter Optimization Engine',
    subtitle: 'Mixed-Integer Linear Programming (MILP) vessel allocation & cost minimization.',
  },
  '/simulator': {
    title: 'What-If Decision Simulator',
    subtitle: 'Test market sensitivity across fuel prices, port delays, and demand surges.',
  },
  '/routes': {
    title: 'Route Analytics & Shipping Lanes',
    subtitle: 'Origin-destination landed cost comparisons & interactive lane mapping.',
  },
  '/analytics': {
    title: 'Advanced Analytics & Explainable AI',
    subtitle: 'SHAP force values, correlation matrices & XGBoost model metrics.',
  },
  '/alerts': {
    title: 'Alerts & Risk Notification Center',
    subtitle: 'Automated warnings for rate spikes, stock depletion & vessel openings.',
  },
  '/sources': {
    title: 'Data Feeds & Source Audit',
    subtitle: 'Verified integration status for Baltic Exchange, IPA & trade databases.',
  },
  '/settings': {
    title: 'System Preferences & Settings',
    subtitle: 'Configure default routes, currencies, units, and model hyper-parameters.',
  },
};

export default function Header() {
  const pathname = usePathname();
  const { setCommandPaletteOpen, setCopilotOpen, unreadAlertsCount } = useAppStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pageInfo = pageTitles[pathname] || {
    title: 'Freight Intelligence Terminal',
    subtitle: 'Predictive maritime analytics & charter optimization',
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 bg-[#0B1120]/80 backdrop-blur-md border-b border-[#1E293B]">
      {/* Title & Breadcrumb */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
          <span>MARITIME</span>
          <span>/</span>
          <span className="text-cyan-400 capitalize">{pathname.replace('/', '') || 'dashboard'}</span>
        </div>
        <h1 className="text-base font-bold text-slate-100 tracking-tight leading-tight">
          {pageInfo.title}
        </h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Live Data Status Indicator */}
        <button
          onClick={handleRefresh}
          className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#131C31] border border-[#1E293B] text-[11px] text-slate-300 hover:border-slate-600 transition-colors"
          title="Click to manually refresh data streams"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-emerald-400 font-medium">Live</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">Updated 2m ago</span>
          <RefreshCw className={`w-3 h-3 text-slate-400 ml-1 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        {/* Global Search Button */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#131C31] border border-[#1E293B] text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all shadow-sm group"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400" />
          <span className="hidden sm:inline font-sans">Search vessels, routes, forecasts...</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-[#0B1120] border border-[#1E293B] rounded">
            ⌘K
          </kbd>
        </button>

        {/* AI Copilot Trigger */}
        <button
          onClick={() => setCopilotOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/20 transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)]"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span className="hidden sm:inline">AI Copilot</span>
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-lg bg-[#131C31] border border-[#1E293B] text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>

          {isNotifOpen && <NotificationDropdown onClose={() => setIsNotifOpen(false)} />}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#1E293B]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-xs font-bold text-slate-100 shadow-md">
            VK
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-200 leading-tight">Bulk Commodity Trading</span>
            <span className="text-[10px] font-mono text-slate-400">Vizag Port Desk</span>
          </div>
        </div>
      </div>
    </header>
  );
}
