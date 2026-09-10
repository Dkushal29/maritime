'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';

export interface PageHeroStat {
  value: string;
  label: string;
  sublabel?: string;
  highlight?: boolean;
}

export interface PageHeroProps {
  badge: string;
  subBadge?: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  stats?: PageHeroStat[];
  bgImage?: string;
  minHeight?: number;
}

export function PageHero({
  badge,
  subBadge,
  titleLine1,
  titleLine2,
  description,
  primaryAction,
  secondaryAction,
  stats,
  bgImage = 'https://images.unsplash.com/photo-1724597500306-a4cbb7d1324e?w=1440&h=600&fit=crop&auto=format',
  minHeight = 320,
}: PageHeroProps) {
  const router = useRouter();

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-electric/25 shadow-2xl shadow-ocean-950/80 mb-8"
      style={{ minHeight }}
    >
      {/* Aerial Ocean Vessel Photography */}
      <img
        src={bgImage}
        alt="Aerial maritime bulk carrier in ocean"
        className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-1000 hover:scale-100"
      />

      {/* Layered Gradient Overlays for High Legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-ocean-950/75 via-ocean-950/85 to-ocean-950" />
      <div className="absolute inset-0 bg-gradient-to-r from-ocean-950/95 via-ocean-950/80 to-transparent" />
      <div className="absolute inset-0 bg-radial-at-c from-electric/10 via-transparent to-ocean-950/90" />

      {/* Animated Route Line & Waypoint Overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
      >
        <path
          d="M 60 340 Q 550 80 1380 220"
          stroke="#22D3EE"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="8 6"
          className="route-animated"
        />
        <path
          d="M 140 370 Q 620 120 1260 180"
          stroke="#1683FF"
          strokeWidth="1"
          fill="none"
          strokeDasharray="6 4"
          className="route-animated"
        />
        <circle cx="60" cy="340" r="4.5" fill="#22D3EE" className="port-pulse" />
        <circle cx="550" cy="180" r="3.5" fill="#1683FF" className="port-pulse" />
        <circle cx="1380" cy="220" r="5" fill="#22D3EE" className="port-pulse" />
      </svg>

      {/* Hero Content Section */}
      <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col justify-between min-h-full">
        <div>
          {/* Top Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase bg-cyan/10 text-cyan border border-cyan/30 shadow-sm shadow-cyan/10">
              <span className="w-2 h-2 rounded-full bg-cyan animate-pulse inline-block" />
              <span>{badge}</span>
            </span>
            {subBadge && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-ai/20 text-purple-ai border border-purple-ai/40">
                {subBadge}
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <span>REAL-TIME INFERENCE</span>
            </span>
          </div>

          {/* Massive Typography matching Landing Showcase */}
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-slate-100 leading-tight mb-3 tracking-tight">
            {titleLine1} <br />
            <span className="text-cyan text-glow">{titleLine2}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed mb-6">
            {description}
          </p>

          {/* Action CTAs */}
          {(primaryAction || secondaryAction) && (
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {primaryAction && (
                primaryAction.href ? (
                  <Link
                    href={primaryAction.href}
                    className="ai-gradient px-5 py-2.5 rounded-xl text-white font-display font-bold text-xs sm:text-sm shadow-lg shadow-electric/25 hover:opacity-95 transition-all flex items-center gap-2 border border-white/15"
                  >
                    <span>{primaryAction.label}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    onClick={primaryAction.onClick}
                    className="ai-gradient px-5 py-2.5 rounded-xl text-white font-display font-bold text-xs sm:text-sm shadow-lg shadow-electric/25 hover:opacity-95 transition-all flex items-center gap-2 border border-white/15 cursor-pointer"
                  >
                    <span>{primaryAction.label}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )
              )}

              {secondaryAction && (
                secondaryAction.href ? (
                  <Link
                    href={secondaryAction.href}
                    className="px-5 py-2.5 rounded-xl bg-ocean-900/80 hover:bg-ocean-800 text-slate-200 font-display font-semibold text-xs sm:text-sm border border-electric/30 hover:border-cyan/50 transition-all flex items-center gap-2 shadow-inner"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan" />
                    <span>{secondaryAction.label}</span>
                  </Link>
                ) : (
                  <button
                    onClick={secondaryAction.onClick}
                    className="px-5 py-2.5 rounded-xl bg-ocean-900/80 hover:bg-ocean-800 text-slate-200 font-display font-semibold text-xs sm:text-sm border border-electric/30 hover:border-cyan/50 transition-all flex items-center gap-2 shadow-inner cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan" />
                    <span>{secondaryAction.label}</span>
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Big Bold Stats Strip at bottom of Hero (matching Landing Page) */}
        {stats && stats.length > 0 && (
          <div className="pt-5 border-t border-electric/15 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex flex-col">
                <span className="font-display font-extrabold text-2xl sm:text-3xl text-cyan tracking-tight">
                  {stat.value}
                </span>
                <span className="text-[11px] sm:text-xs font-mono text-slate-300 font-medium mt-0.5">
                  {stat.label}
                </span>
                {stat.sublabel && (
                  <span className="text-[10px] font-mono text-slate-500 mt-0.5">
                    {stat.sublabel}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
