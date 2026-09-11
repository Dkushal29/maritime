'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Bell,
  Sparkles,
  ChevronDown,
  Menu,
  X,
  Boxes,
  BarChart3,
  Sliders,
  Database,
  Settings,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import NotificationDropdown from '../NotificationDropdown';

const MAIN_NAV = [
  { label: 'Overview', href: '/dashboard' },
  { label: 'Planning', href: '/planning' },
  { label: 'Forecasting', href: '/forecast' },
  { label: 'Optimization', href: '/optimization' },
  { label: 'Fleet', href: '/vessels' },
  { label: 'Routes', href: '/routes' },
  { label: 'Procurement', href: '/procurement' },
];

const MORE_NAV = [
  { label: 'Stockpile & Cargo', href: '/cargo', icon: Boxes },
  { label: 'Scenario Simulator', href: '/simulator', icon: Sliders },
  { label: 'Market Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Alerts & Risk', href: '/alerts', icon: Bell },
  { label: 'Data Sources', href: '/sources', icon: Database },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function Header() {
  const pathname = usePathname();
  const { setCommandPaletteOpen, setCopilotOpen, unreadAlertsCount } = useAppStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close dropdowns on route change
  useEffect(() => {
    setIsMoreOpen(false);
    setIsMobileMenuOpen(false);
    setIsNotifOpen(false);
  }, [pathname]);

  const isMoreActive = MORE_NAV.some((m) => m.href === pathname);

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 md:px-10 h-14 shrink-0 border-b border-[#294154] bg-[#0B1726]"
    >
      {/* 1. Left: Brand Logo & Title */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded flex items-center justify-center shrink-0 border border-[#294154] bg-[#162C40]">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
              <path d="M2 13 Q5 8 10 10 Q15 12 18 7" stroke="#35B8A6" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M10 10 L10 4 L14 7 L10 4 L6 7" stroke="#35B8A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <span className="font-sans font-semibold text-sm tracking-wider text-[#E8F0F5]">
            MARITIME <span className="text-[#35B8A6]">AI</span>
          </span>
        </Link>
      </div>

      {/* 2. Center: Streamlined Horizontal Nav Links */}
      <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
        {MAIN_NAV.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-2.5 py-1 text-xs font-medium transition-colors relative ${
                isActive
                  ? 'text-[#E8F0F5] font-semibold after:absolute after:bottom-[-13px] after:left-2 after:right-2 after:h-[2px] after:bg-[#35B8A6]'
                  : 'text-[#91A6B8] hover:text-[#E8F0F5]'
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
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer relative ${
              isMoreActive
                ? 'text-[#E8F0F5] font-semibold after:absolute after:bottom-[-13px] after:left-2 after:right-2 after:h-[2px] after:bg-[#35B8A6]'
                : 'text-[#91A6B8] hover:text-[#E8F0F5]'
            }`}
          >
            <span>More</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMoreOpen && (
            <div className="absolute right-0 mt-2.5 w-52 rounded-md bg-[#102235] border border-[#294154] p-1 shadow-lg z-50 flex flex-col gap-0.5">
              {MORE_NAV.map((m) => {
                const Icon = m.icon;
                const isActive = pathname === m.href;
                return (
                  <Link
                    key={m.href}
                    href={m.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs transition-colors ${
                      isActive
                        ? 'bg-[#162C40] text-[#35B8A6] font-medium'
                        : 'text-[#91A6B8] hover:text-[#E8F0F5] hover:bg-[#162C40]/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-[#35B8A6]" />
                    <span>{m.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* 3. Right: Quiet Live Indicator, Search, Alerts & Copilot */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Quiet Live API Indicator */}
        <Link
          href="/sources"
          className="hidden xl:flex items-center gap-1.5 px-2 py-1 text-xs text-[#91A6B8] hover:text-[#E8F0F5] transition-colors"
          title="Data ingestion provenance & status"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#35B8A6]" />
          <span className="text-[11px] font-sans">Live API</span>
        </Link>

        {/* Compact Search Trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded text-xs text-[#91A6B8] bg-[#102235] border border-[#294154] hover:text-[#E8F0F5] hover:border-[#35B8A6]/40 transition-colors w-32 lg:w-40 justify-between cursor-pointer"
          title="Search Platform (⌘K)"
        >
          <div className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-[#91A6B8]" />
            <span>Search...</span>
          </div>
          <kbd className="px-1 text-[10px] font-mono text-[#91A6B8] bg-[#0B1726] border border-[#294154] rounded">
            ⌘K
          </kbd>
        </button>

        {/* Operational Alerts Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-1.5 rounded text-[#91A6B8] hover:text-[#E8F0F5] hover:bg-[#102235] transition-colors cursor-pointer"
            title="Operational alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#C96B6B]" />
            )}
          </button>
          {isNotifOpen && (
            <NotificationDropdown onClose={() => setIsNotifOpen(false)} />
          )}
        </div>

        {/* Restrained Copilot Trigger */}
        <button
          onClick={() => setCopilotOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#102235] hover:bg-[#162C40] text-[#91A6B8] hover:text-[#E8F0F5] border border-[#294154] text-xs font-medium transition-colors cursor-pointer"
          title="Toggle Copilot assistant"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#35B8A6]" />
          <span className="hidden sm:inline">Copilot</span>
        </button>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-1.5 rounded text-[#91A6B8] hover:text-[#E8F0F5] hover:bg-[#102235]"
          title="Toggle navigation"
        >
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed top-14 left-0 right-0 bg-[#0B1726]/98 border-b border-[#294154] p-4 shadow-xl flex flex-col gap-2 z-50">
          <div className="grid grid-cols-2 gap-2">
            {[...MAIN_NAV, ...MORE_NAV].map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#162C40] text-[#35B8A6] border border-[#294154] font-semibold'
                      : 'text-[#91A6B8] hover:text-[#E8F0F5] hover:bg-[#102235]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="pt-2 border-t border-[#294154] flex items-center justify-between text-xs text-[#91A6B8]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#35B8A6]" />
              Telemetry live
            </span>
            <Link href="/" className="hover:text-[#E8F0F5]">
              Showcase
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
