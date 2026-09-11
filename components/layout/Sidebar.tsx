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
  ClipboardList,
  Target,
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
  { label: 'Cargo Planning', href: '/planning', icon: Target, badge: 'SIH' },
  { label: 'Freight Forecast', href: '/forecast', icon: TrendingUp },
  { label: 'Cargo Demand', href: '/cargo', icon: Boxes },
  { label: 'Procurement Orders', href: '/procurement', icon: ClipboardList },
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
      className={`flex flex-col shrink-0 transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
      style={{
        minHeight: '100vh',
        background: '#0B1726',
        borderRight: '1px solid #294154',
      }}
    >
      {/* Brand Header */}
      <div
        className="flex items-center justify-between px-4 py-4"
        style={{ borderBottom: '1px solid #294154' }}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 border border-[#294154] bg-[#162C40]"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M2 13 Q5 8 10 10 Q15 12 18 7" stroke="#35B8A6" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M10 10 L10 4 L14 7 L10 4 L6 7" stroke="#35B8A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          {!isCollapsed && (
            <div>
              <div style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 14, letterSpacing: '0.04em' }}>
                <span className="text-[#E8F0F5]">MARITIME</span>
                <span className="text-[#35B8A6]"> AI</span>
              </div>
              <div className="text-[9px] text-[#91A6B8] font-mono tracking-widest">
                FREIGHT & VESSEL CHARTERING
              </div>
            </div>
          )}
        </Link>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md text-[#91A6B8] hover:text-[#E8F0F5] hover:bg-[#102235] transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto scroll-hidden flex flex-col gap-0.5">
        {!isCollapsed && (
          <div className="text-[9px] text-[#91A6B8] font-mono tracking-wider px-3 mb-1 mt-1 font-semibold uppercase">
            OPERATIONS
          </div>
        )}
        {intelligenceNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#162C40] text-[#E8F0F5] border border-[#294154] font-semibold'
                  : 'text-[#91A6B8] hover:text-[#E8F0F5] hover:bg-[#102235] border border-transparent'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-[#35B8A6]' : 'text-[#91A6B8]'
                }`}
              />
              {!isCollapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-[#102235] text-[#35B8A6] border border-[#294154]">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}

        {!isCollapsed && (
          <div className="text-[9px] text-[#91A6B8] font-mono tracking-wider px-3 mb-1 mt-3 font-semibold uppercase">
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
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#162C40] text-[#E8F0F5] border border-[#294154] font-semibold'
                  : 'text-[#91A6B8] hover:text-[#E8F0F5] hover:bg-[#102235] border border-transparent'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-[#35B8A6]' : 'text-[#91A6B8]'
                }`}
              />
              {!isCollapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.hasAlerts && unreadAlertsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-[#C96B6B] text-[#0B1726]">
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
        style={{ borderTop: '1px solid #294154' }}
      >
        <Link
          href="/settings"
          className="flex items-center gap-3 p-2 rounded-md bg-[#102235] hover:bg-[#162C40] border border-[#294154] transition-colors cursor-pointer"
        >
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs text-[#0B1726] bg-[#35B8A6] shrink-0"
          >
            K
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-[#E8F0F5] truncate font-display">
                Kushal
              </span>
              <span className="text-[10px] text-[#35B8A6] font-mono truncate">
                Operations
              </span>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}
