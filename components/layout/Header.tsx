'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Sparkles,
  ChevronDown,
  Compass,
  BarChart3,
  Sliders,
  Boxes,
  Leaf,
  Database,
  Settings,
  Menu,
  X,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import NotificationDropdown from '../NotificationDropdown';

const MAIN_NAV = [
  { label: 'Overview', href: '/dashboard' },
  { label: 'Forecasting', href: '/forecast' },
  { label: 'Optimization', href: '/optimization' },
  { label: 'Fleet', href: '/vessels' },
  { label: 'Cargo', href: '/cargo' },
  { label: 'Simulator', href: '/simulator' },
  { label: 'Routes', href: '/routes' },
  { label: 'Sustainability', href: '/sustainability' },
  { label: 'Analytics', href: '/analytics' },
];

const MORE_NAV = [
  { label: 'Alerts & Risk', href: '/alerts', icon: Bell },
  { label: 'Data Sources', href: '/sources', icon: Database },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { setCommandPaletteOpen, setCopilotOpen, unreadAlertsCount } = useAppStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  // Close dropdowns on route change
  useEffect(() => {
    setIsMoreOpen(false);
    setIsMobileMenuOpen(false);
    setIsNotifOpen(false);
  }, [pathname]);

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 md:px-12 h-16 shrink-0 border-b border-electric/15"
      style={{
        background: 'rgba(2, 13, 24, 0.90)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* 1. Left: Brand Logo & Title */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-md shadow-electric/25 group-hover:scale-105 transition-transform"
            style={{ background: 'linear-gradient(135deg, #1683FF, #22D3EE)' }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M2 13 Q5 8 10 10 Q15 12 18 7" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M10 10 L10 4 L14 7 L10 4 L6 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div>
            <span className="font-display font-extrabold text-base tracking-wider text-slate-100">
              MARITIME <span className="text-cyan">AI</span>
            </span>
          </div>
        </Link>
      </div>

      {/* 2. Center: Sleek Horizontal Nav Links matching Screenshot */}
      <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
        {MAIN_NAV.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-electric/20 text-cyan border border-cyan/40 shadow-sm shadow-cyan/10 font-semibold'
                  : 'text-slate-300 hover:text-cyan hover:bg-ocean-800/60'
              }`}
            >
              {item.label}
            </Link>
          );
        })}

        {/* More dropdown for secondary pages */}
        <div className="relative">
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-ocean-800/60 transition-all cursor-pointer"
          >
            <span>More</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMoreOpen && (
            <div
              className="absolute right-0 mt-2 w-48 rounded-xl bg-ocean-950/95 border border-electric/25 p-2 shadow-2xl backdrop-blur-xl z-50 flex flex-col gap-1"
            >
              {MORE_NAV.map((m) => {
                const Icon = m.icon;
                const isActive = pathname === m.href;
                return (
                  <Link
                    key={m.href}
                    href={m.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                      isActive
                        ? 'bg-electric/20 text-cyan font-semibold'
                        : 'text-slate-300 hover:text-cyan hover:bg-ocean-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-cyan" />
                    <span>{m.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* 3. Right: Telemetry, Copilot & Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Real-time Telemetry Pill */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-ocean-900/80 border border-electric/20 text-[11px] font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-semibold">REAL-TIME INFERENCE</span>
        </div>

        {/* Search Bar Trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-400 bg-ocean-900/80 border border-electric/20 hover:border-cyan/40 hover:bg-ocean-800/80 transition-all shadow-inner cursor-pointer"
          title="Search Platform (⌘K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden xl:inline">Search...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-ocean-950/80 border border-electric/20 rounded">
            ⌘K
          </kbd>
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-lg text-slate-300 hover:text-cyan hover:bg-ocean-800/60 transition-colors border border-electric/15 cursor-pointer"
            title="Operational Alerts"
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
          className="ai-gradient flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-white font-display font-bold text-xs shadow-md shadow-electric/25 hover:opacity-95 transition-opacity cursor-pointer border border-white/15"
        >
          <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
          <span className="hidden sm:inline">AI COPILOT</span>
        </button>

        {/* Landing Page Showcase Toggle */}
        <Link
          href="/"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-cyan hover:bg-ocean-800/60 border border-electric/15 transition-all"
          title="View Landing Showcase"
        >
          <span>Showcase</span>
          <ArrowRight className="w-3 h-3 text-cyan" />
        </Link>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-cyan hover:bg-ocean-800/60 border border-electric/15"
          title="Toggle Navigation"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed top-16 left-0 right-0 bg-ocean-950/95 border-b border-electric/25 p-4 shadow-2xl backdrop-blur-2xl flex flex-col gap-2 z-50">
          <div className="grid grid-cols-2 gap-2">
            {[...MAIN_NAV, ...MORE_NAV].map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-electric/20 text-cyan border border-cyan/40 font-semibold'
                      : 'text-slate-300 hover:text-cyan hover:bg-ocean-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="pt-3 border-t border-electric/15 flex items-center justify-between">
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              REAL-TIME INFERENCE ACTIVE
            </span>
            <Link
              href="/"
              className="text-xs text-cyan hover:underline flex items-center gap-1"
            >
              <span>Landing Showcase</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
