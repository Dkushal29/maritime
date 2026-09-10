'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, DollarSign, SlidersHorizontal } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

interface AIRecommendationCardProps {
  title?: string;
  recommendation: string;
  confidence?: number;
  reasons: string[];
  estimatedSavings: number;
  risk?: 'LOW' | 'MEDIUM' | 'HIGH';
  className?: string;
  onViewAnalysis?: () => void;
  onRunScenario?: () => void;
}

export default function AIRecommendationCard({
  title = 'AI CHARTER RECOMMENDATION',
  recommendation,
  confidence = 87,
  reasons,
  estimatedSavings,
  risk = 'MEDIUM',
  className,
}: AIRecommendationCardProps) {
  const riskColor =
    risk === 'LOW'
      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
      : risk === 'MEDIUM'
      ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
      : 'text-red-400 border-red-500/30 bg-red-500/10';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-gradient-to-br from-[#131C31] via-[#10182A] to-[#0D1424] border border-cyan-500/30 border-l-4 border-l-cyan-400 p-5 shadow-lg shadow-cyan-950/20',
        className
      )}
    >
      {/* Background Subtle AI Grid Effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Confidence Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[11px] font-mono text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>{confidence}% CONFIDENCE</span>
          </div>

          {/* Risk Badge */}
          <div className={cn('px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold', riskColor)}>
            {risk} RISK
          </div>
        </div>
      </div>

      {/* Primary Recommendation Headline */}
      <div className="mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight leading-snug">
          {recommendation}
        </h2>
      </div>

      {/* Grid: Supporting Reasons & Savings Callout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Bulleted Reasons */}
        <div className="lg:col-span-2 space-y-2">
          {reasons.map((reason, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-mono font-bold shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{reason}</span>
            </div>
          ))}
        </div>

        {/* Estimated Savings Callout */}
        <div className="flex flex-col justify-center items-start lg:items-end p-3.5 rounded-lg bg-[#0B1120]/80 border border-[#1E293B]">
          <span className="text-[10px] font-mono font-semibold uppercase text-slate-400">
            Estimated Cost Savings
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-extrabold text-emerald-400 font-mono tracking-tight">
              {formatCurrency(estimatedSavings)}
            </span>
          </div>
          <span className="text-[10px] text-emerald-500/80 font-medium">
            vs 30-day delayed charter
          </span>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#1E293B]">
        <Link
          href="/optimization"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
        >
          <span>View Optimization Plan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        <Link
          href="/simulator"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#131C31] border border-[#1E293B] text-slate-200 font-medium text-xs hover:bg-[#1C2942] hover:border-slate-600 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
          <span>Run What-If Scenario</span>
        </Link>
      </div>
    </div>
  );
}
