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
  Leaf,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

const intelligenceNav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Freight Forecast', href: '/forecast', icon: TrendingUp },
  { label: 'Cargo Demand', href: '/cargo', icon: Boxes },
  { label: 'Vessel Intelligence', href: '/vessels', icon: Ship },
  { label: 'Charter Optimization', href: '/optimization', icon: Sparkles, badge: 'AI' },
  { label: 'What-If Simulator', href: '/simulator', icon: Sliders },
  { label: 'Route Analytics', href: '/routes', icon: Compass },
];

const systemNav = [
  { label: 'Advanced Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Alerts', href: '/alerts', icon: Bell, hasAlerts: true },
  { label: 'Data Sources', href: '/sources', icon: Database },
  { label: 'Sustainability', href: '/sustainability', icon: Leaf },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { unreadAlertsCount } = useAppStore();

  return (
    <aside
      className={`sidebar-texture flex flex-col shrink-0 transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #020D18 0%, #061525 40%, #071929 100%)',
        borderRight: '1px solid rgba(22, 131, 255, 0.1)',
      }}
    >
      {/* Brand Header */}
      <div
        className="flex items-center justify-between px-4 py-4"
        style={{ borderBottom: '1px solid rgba(22, 131, 255, 0.08)' }}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div
            className="flex items-center justify-center rounded-lg shrink-0 shadow-md shadow-electric/25"
            style={{
              width: 34,
              height: 34,
              background: 'linear-gradient(135deg, #1683FF 0%, #22D3EE 100%)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M2 13 Q5 8 10 10 Q15 12 18 7" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M10 10 L10 4 L14 7 L10 4 L6 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          {!isCollapsed && (
            <div>
              <div style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: 14, letterSpacing: '0.04em' }}>
                <span className="text-slate-100">MARITIME</span>
                <span className="text-cyan"> AI</span>
              </div>
              <div className="text-[9px] text-slate-500 font-mono tracking-widest">
                PREDICT · OPTIMIZE · CHARTER
              </div>
            </div>
          )}
        </Link>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-ocean-800 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto scroll-hidden flex flex-col gap-0.5">
        {!isCollapsed && (
          <div className="text-[9px] text-slate-500 font-mono tracking-wider px-3 mb-1 mt-1 font-bold">
            INTELLIGENCE
          </div>
        )}
        {intelligenceNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-electric/15 text-slate-100 border border-electric/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-ocean-800/60 border border-transparent'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-cyan' : 'text-slate-500'
                }`}
              />
              {!isCollapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-electric/30 text-cyan border border-cyan/30">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}

        {!isCollapsed && (
          <div className="text-[9px] text-slate-500 font-mono tracking-wider px-3 mb-1 mt-3 font-bold">
            SYSTEM
          </div>
        )}
        {systemNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-electric/15 text-slate-100 border border-electric/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-ocean-800/60 border border-transparent'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-cyan' : 'text-slate-500'
                }`}
              />
              {!isCollapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.hasAlerts && unreadAlertsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-500 text-white">
                      {unreadAlertsCount}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User / Organization Profile Footer */}
      <div
        className="p-3"
        style={{ borderTop: '1px solid rgba(22, 131, 255, 0.08)' }}
      >
        <Link
          href="/settings"
          className="flex items-center gap-3 p-2 rounded-lg bg-electric/5 hover:bg-electric/10 border border-electric/15 transition-all cursor-pointer"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md shadow-electric/20"
            style={{ background: 'linear-gradient(135deg, #1683FF, #22D3EE)' }}
          >
            K
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-slate-100 truncate font-display">
                Kushal
              </span>
              <span className="text-[10px] text-cyan font-mono truncate">
                Enterprise Plan
              </span>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}
