'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import CommandPalette from '../CommandPalette';
import AICopilotDrawer from '../AICopilotDrawer';
import VesselDetailDrawer from '../VesselDetailDrawer';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  if (isLandingPage) {
    return (
      <div className="min-h-screen bg-ocean-950 text-slate-100 font-sans selection:bg-cyan selection:text-ocean-950">
        {children}
        <CommandPalette />
        <AICopilotDrawer />
        <VesselDetailDrawer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-ocean-950 text-slate-100 font-sans selection:bg-cyan selection:text-ocean-950">
      {/* Unified Cinematic Top Navigation Bar */}
      <Header />

      {/* Full-Width Spacious Main Canvas with Smooth Webflow */}
      <main className="flex-1 w-full bg-ocean-950/60 pb-16">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 pt-6 sm:pt-8 animate-fade-in">
          {children}
        </div>
      </main>

      {/* Drawers & Command Overlays */}
      <CommandPalette />
      <AICopilotDrawer />
      <VesselDetailDrawer />
    </div>
  );
}
