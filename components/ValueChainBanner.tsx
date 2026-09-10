'use client';

import React from 'react';
import { ArrowRight, Database, TrendingUp, Boxes, Ship, Sparkles, Award, DollarSign } from 'lucide-react';

const steps = [
  { label: 'Historical Data', icon: Database, color: 'text-slate-400' },
  { label: 'Freight Forecast', icon: TrendingUp, color: 'text-cyan-400' },
  { label: 'Cargo Demand', icon: Boxes, color: 'text-blue-400' },
  { label: 'Vessel Tonnage', icon: Ship, color: 'text-indigo-400' },
  { label: 'MILP Optimization', icon: Sparkles, color: 'text-purple-400' },
  { label: 'Charter Plan', icon: Award, color: 'text-amber-400' },
  { label: 'Cost Saving', icon: DollarSign, color: 'text-emerald-400' },
];

export default function ValueChainBanner() {
  return (
    <div className="w-full bg-[#131C31]/90 border border-[#1E293B] rounded-xl p-3 shadow-md mb-6 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[760px] gap-2 px-2">
        <div className="flex items-center gap-2 pr-4 border-r border-[#1E293B] shrink-0">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
            VALUE CHAIN
          </span>
        </div>

        <div className="flex items-center justify-between flex-1 gap-1">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isLast = idx === steps.length - 1;

            return (
              <React.Fragment key={step.label}>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#0B1120]/60 border border-[#1E293B] hover:border-slate-600 transition-colors">
                  <Icon className={`w-3.5 h-3.5 ${step.color}`} />
                  <span className="text-xs font-semibold text-slate-200 whitespace-nowrap">{step.label}</span>
                </div>
                {!isLast && <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
