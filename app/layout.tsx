import type { Metadata } from 'next';
import './globals.css';

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

import AppShell from '@/components/layout/AppShell';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body className="bg-[#0B1726] text-[#E8F0F5] antialiased min-h-screen overflow-x-hidden">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
