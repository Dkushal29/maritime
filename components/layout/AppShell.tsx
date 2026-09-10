'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import CommandPalette from '../CommandPalette';
import AICopilotDrawer from '../AICopilotDrawer';
import VesselDetailDrawer from '../VesselDetailDrawer';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  if (isLandingPage) {
    return (
      <div className="min-h-screen bg-ocean-950 text-slate-100 font-sans">
        {children}
        <CommandPalette />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-ocean-950 text-slate-100 font-sans">
      {/* Left Collapsible Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto scroll-hidden bg-ocean-900/40">
          <div className="p-4 md:p-7 max-w-[1680px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Drawers & Command Overlays */}
      <CommandPalette />
      <AICopilotDrawer />
      <VesselDetailDrawer />
    </div>
  );
}
