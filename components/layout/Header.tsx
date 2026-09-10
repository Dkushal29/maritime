'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Sparkles,
  CloudSun,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import NotificationDropdown from '../NotificationDropdown';
import { Badge } from '../ui/Badge';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Global Maritime Intelligence',
    subtitle: 'AI-powered freight forecasting, cargo demand intelligence and vessel charter optimization.',
  },
  '/forecast': {
    title: 'Freight Rate Forecast Workspace',
    subtitle: 'XGBoost multi-horizon freight rate predictions with 95% confidence intervals.',
  },
  '/cargo': {
    title: 'Bulk Cargo Intelligence',
    subtitle: 'XGBoost demand forecast · Inventory monitoring · Procurement planning.',
  },
  '/vessels': {
    title: 'Vessel Intelligence Terminal',
    subtitle: 'AI-scored vessel suitability for bulk cargo delivery to East Coast India.',
  },
  '/optimization': {
    title: 'AI Charter Optimization',
    subtitle: 'Find the lowest-risk, lowest-cost vessel charter strategy using MILP optimization.',
  },
  '/simulator': {
    title: 'What-If Decision Simulator',
    subtitle: 'Stress-test maritime strategy against bunker spikes, congestion, and demand shifts.',
  },
  '/routes': {
    title: 'Route Analytics & Corridors',
    subtitle: 'AI-ranked shipping routes for bulk cargo to India East Coast ports.',
  },
  '/analytics': {
    title: 'Advanced Analytics & Explainable AI',
    subtitle: 'Model accuracy metrics, SHAP feature importance & correlation matrices.',
  },
  '/alerts': {
    title: 'Operational Alerts & Risk Center',
    subtitle: 'Real-time alerts for freight spikes, stock depletion & fleet availability.',
  },
  '/sources': {
    title: 'Data Sources & Provenance',
    subtitle: 'Transparent data audit trail · Baltic Exchange, Indian Ports, and trade registries.',
  },
  '/sustainability': {
    title: 'Maritime Sustainability Intelligence',
    subtitle: 'CO₂ emissions reduction tracking, fuel efficiency gains & CII ratings.',
  },
  '/settings': {
    title: 'Platform Settings & Preferences',
    subtitle: 'Configure enterprise defaults, demo data modes, and API connectivity.',
  },
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { setCommandPaletteOpen, setCopilotOpen, unreadAlertsCount } = useAppStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 22));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const pageInfo = pageTitles[pathname] || {
    title: 'Maritime Decision Support',
    subtitle: 'AI-powered freight forecasting and charter optimization',
  };

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-6 shrink-0"
      style={{
        height: 60,
        background: 'rgba(2, 13, 24, 0.85)',
        borderBottom: '1px solid rgba(22, 131, 255, 0.1)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Left: Page Title Context */}
      <div className="flex flex-col min-w-0 mr-4">
        <h1 className="font-display font-bold text-sm md:text-base text-slate-100 m-0 truncate leading-tight">
          {pageInfo.title}
        </h1>
        <p className="text-[11px] text-slate-400 font-mono m-0 truncate hidden lg:block">
          {pageInfo.subtitle}
        </p>
      </div>

      {/* Middle: Global Search Bar Trigger */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between gap-3 px-3.5 py-1.5 rounded-lg text-left transition-all cursor-pointer bg-ocean-900/80 border border-electric/20 hover:border-cyan/40 hover:bg-ocean-800/80 shadow-inner"
        >
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">Search vessels, ports, routes, forecasts...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-ocean-950/80 border border-electric/20 rounded">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Telemetry, UTC Clock, Copilot & Controls */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Data Freshness Indicator */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Updated 2m ago</span>
          </div>
          <Badge variant="demo" size="sm">
            DEMO
          </Badge>
        </div>

        {/* Live UTC Clock */}
        <div className="hidden xl:block text-xs font-mono text-cyan font-semibold px-2.5 py-1 rounded bg-ocean-900/60 border border-electric/15">
          {utcTime ? `${utcTime} UTC` : 'UTC'}
        </div>

        {/* Mobile Search Button */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-ocean-800"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Marine Weather Shortcut */}
        <button
          className="hidden sm:flex p-2 rounded-lg text-slate-400 hover:text-cyan hover:bg-ocean-800/60 transition-colors border border-electric/10"
          title="East Coast Marine Conditions"
        >
          <CloudSun className="w-4 h-4" />
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-ocean-800/60 transition-colors border border-electric/10 cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border border-ocean-950" />
            )}
          </button>
          {isNotifOpen && (
            <NotificationDropdown onClose={() => setIsNotifOpen(false)} />
          )}
        </div>

        {/* AI Copilot Launcher */}
        <button
          onClick={() => setCopilotOpen(true)}
          className="ai-gradient flex items-center gap-2 px-3 py-1.5 rounded-lg text-white font-display font-bold text-xs shadow-md shadow-electric/25 hover:opacity-95 transition-opacity cursor-pointer border border-white/15"
        >
          <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
          <span>AI COPILOT</span>
        </button>

        {/* Landing Page Return / Profile */}
        <button
          onClick={() => router.push('/')}
          className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-xs text-white shrink-0 shadow-md shadow-electric/20 cursor-pointer border border-white/20 hover:scale-105 transition-transform"
          style={{ background: 'linear-gradient(135deg, #1683FF, #22D3EE)' }}
          title="Return to Landing Page"
        >
          K
        </button>
      </div>
    </header>
  );
}
