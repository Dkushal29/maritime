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
      className="relative rounded-xl overflow-hidden border border-[#294154] mb-6"
      style={{ minHeight: Math.min(minHeight, 260) }}
    >
      {/* Background with Dark Navy Overlay */}
      <img
        src={bgImage}
        alt="Maritime vessel background"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-25"
      />
      <div className="absolute inset-0 bg-[#0B1726]/90" />

      {/* Hero Content Section */}
      <div className="relative z-10 p-5 sm:p-7 flex flex-col justify-between min-h-full">
        <div>
          {/* Top Operational Tag */}
          <div className="flex items-center gap-2 mb-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium tracking-wide uppercase bg-[#102235] text-[#35B8A6] border border-[#294154]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#35B8A6] inline-block" />
              <span>{badge}</span>
            </span>
            {subBadge && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[#91A6B8] bg-[#102235] border border-[#294154]">
                {subBadge}
              </span>
            )}
          </div>

          {/* Heading with Restrained Hierarchy */}
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#E8F0F5] leading-tight mb-2 tracking-tight">
            {titleLine1} <span className="text-[#35B8A6]">{titleLine2}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-[#91A6B8] max-w-2xl leading-relaxed mb-4">
            {description}
          </p>

          {/* Action CTAs */}
          {(primaryAction || secondaryAction) && (
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              {primaryAction && (
                primaryAction.href ? (
                  <Link
                    href={primaryAction.href}
                    className="px-4 py-2 rounded-md bg-[#35B8A6] hover:bg-[#2EA595] text-[#0B1726] font-semibold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>{primaryAction.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <button
                    onClick={primaryAction.onClick}
                    className="px-4 py-2 rounded-md bg-[#35B8A6] hover:bg-[#2EA595] text-[#0B1726] font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{primaryAction.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )
              )}

              {secondaryAction && (
                secondaryAction.href ? (
                  <Link
                    href={secondaryAction.href}
                    className="px-4 py-2 rounded-md bg-[#102235] hover:bg-[#162C40] text-[#E8F0F5] border border-[#294154] font-medium text-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>{secondaryAction.label}</span>
                  </Link>
                ) : (
                  <button
                    onClick={secondaryAction.onClick}
                    className="px-4 py-2 rounded-md bg-[#102235] hover:bg-[#162C40] text-[#E8F0F5] border border-[#294154] font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{secondaryAction.label}</span>
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Stats Strip at bottom of Hero */}
        {stats && stats.length > 0 && (
          <div className="pt-3.5 border-t border-[#294154] grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex flex-col">
                <span className={`font-mono text-xl sm:text-2xl font-bold tracking-tight ${stat.highlight ? 'text-[#35B8A6]' : 'text-[#E8F0F5]'}`}>
                  {stat.value}
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-[#91A6B8] mt-0.5 uppercase">
                  {stat.label}
                </span>
                {stat.sublabel && (
                  <span className="text-[10px] font-mono text-[#91A6B8]/70 mt-0.5">
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
