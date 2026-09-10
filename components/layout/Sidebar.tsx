'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  Boxes,
  Ship,
  Sparkles,
  Sliders,
  Compass,
  BarChart3,
  Bell,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  Anchor,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Freight Forecast', href: '/forecast', icon: TrendingUp },
  { label: 'Cargo Demand', href: '/cargo', icon: Boxes },
  { label: 'Vessel Intelligence', href: '/vessels', icon: Ship },
  { label: 'Charter Optimization', href: '/optimization', icon: Sparkles, badge: 'AI' },
  { label: 'What-If Simulator', href: '/simulator', icon: Sliders },
  { label: 'Route Analytics', href: '/routes', icon: Compass },
  { label: 'Advanced Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Alerts', href: '/alerts', icon: Bell },
  { label: 'Data & Sources', href: '/sources', icon: Database },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { unreadAlertsCount } = useAppStore();

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen bg-[#070C18] border-r border-[#1E293B] text-slate-300 transition-all duration-300 z-30 select-none',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#1E293B]">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
            <Anchor className="w-5 h-5 animate-pulse" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-wider text-slate-100 uppercase">
                MARITIME <span className="text-cyan-400">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Freight Intelligence</span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-[#131C31] transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group relative',
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#131C31]'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200')} />
              
              {!isCollapsed && <span className="truncate">{item.label}</span>}

              {item.badge && !isCollapsed && (
                <span className="ml-auto px-1.5 py-0.5 text-[9px] font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {item.badge}
                </span>
              )}

              {item.href === '/alerts' && unreadAlertsCount > 0 && (
                <span
                  className={cn(
                    'flex items-center justify-center font-bold text-[10px] rounded-full bg-amber-500 text-slate-950',
                    isCollapsed ? 'absolute top-1 right-1 w-2 h-2 p-0' : 'ml-auto px-1.5 py-0.5 min-w-[18px]'
                  )}
                >
                  {!isCollapsed && unreadAlertsCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Status Block */}
      <div className="p-3 border-t border-[#1E293B] bg-[#090E1C]">
        {!isCollapsed ? (
          <div className="flex flex-col gap-1 p-2 rounded-lg bg-[#131C31] border border-[#1E293B]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-semibold text-slate-200">AI Engine Operational</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 truncate">
              Freight XGBoost v1.0 · MILP Active
            </span>
          </div>
        ) : (
          <div className="flex justify-center p-1" title="AI Engine Operational - Freight XGBoost v1.0">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
