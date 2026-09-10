'use client';

import React from 'react';
import GlobalFilterBar from '@/components/GlobalFilterBar';
import { Database, CheckCircle2, RefreshCw, ShieldCheck, ExternalLink } from 'lucide-react';
import { mockDataSources } from '@/data/mockData';

export default function SourcesPage() {
  return (
    <div className="space-y-6">
      <GlobalFilterBar />

      <div className="p-5 bg-[#131C31] border border-[#1E293B] rounded-xl shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Verified Data Feeds &amp; Market Ingestion Directory
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Institutional data providers powering XGBoost forecasts and MILP charter optimization.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
            ● 5/5 Feeds Connected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockDataSources.map((src) => (
            <div
              key={src.id}
              className="p-4 rounded-xl bg-[#0B1120] border border-[#1E293B] hover:border-slate-700 transition-colors space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{src.name}</h3>
                  <span className="text-[10px] font-mono text-cyan-400 block mt-0.5">{src.dataType}</span>
                </div>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {src.status}
                </span>
              </div>

              <div className="space-y-1 text-xs font-mono text-slate-400 pt-2 border-t border-[#1E293B]">
                <div className="flex justify-between">
                  <span>Update Cadence:</span>
                  <span className="text-slate-200">{src.updateCadence}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Sync:</span>
                  <span className="text-slate-200">{src.lastSync}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reliability Score:</span>
                  <span className="text-emerald-400 font-bold">{src.reliabilityScore}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
