import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import CommandPalette from '@/components/CommandPalette';
import AICopilotDrawer from '@/components/AICopilotDrawer';
import VesselDetailDrawer from '@/components/VesselDetailDrawer';

export const metadata: Metadata = {
  title: 'MARITIME AI — Freight Forecasting & Vessel Charter Optimization',
  description:
    'Production-grade enterprise decision support platform for bulk-cargo importers. Powered by XGBoost freight forecasting and MILP charter optimization.',
  keywords: [
    'Maritime AI',
    'Freight Forecasting',
    'Vessel Chartering',
    'Bulk Cargo Procurement',
    'Coal Import Optimization',
    'Visakhapatnam Port',
    'Panamax Charter',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B1120] text-slate-100 antialiased min-h-screen flex overflow-x-hidden">
        {/* Main Sidebar */}
        <Sidebar />

        {/* Right Shell Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <Header />
          <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-[1600px] w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Global Drawers & Modals */}
        <CommandPalette />
        <AICopilotDrawer />
        <VesselDetailDrawer />
      </body>
    </html>
  );
}
