'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type DataSourceType = 'live' | 'model' | 'demo';

export interface DataSourceBadgeProps {
  type: DataSourceType;
  label?: string;
  tooltip?: string;
  className?: string;
  size?: 'xs' | 'sm';
}

const CONFIG = {
  live: {
    defaultLabel: 'Live',
    defaultTooltip: 'Real-time live telemetry feed',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dotClass: 'bg-emerald-400 animate-pulse',
  },
  model: {
    defaultLabel: 'Model Forecast',
    defaultTooltip: 'Real-time ML inference & mathematical optimization output',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    dotClass: 'bg-cyan-400',
  },
  demo: {
    defaultLabel: 'Demo',
    defaultTooltip: 'Pre-computed benchmark demonstration data (No real live feed connected)',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dotClass: 'bg-amber-400',
  },
};

export function DataSourceBadge({
  type,
  label,
  tooltip,
  className,
  size = 'xs',
}: DataSourceBadgeProps) {
  const conf = CONFIG[type] || CONFIG.demo;
  const displayLabel = label || conf.defaultLabel;
  const titleText = tooltip || conf.defaultTooltip;

  return (
    <span
      title={titleText}
      className={cn(
        'inline-flex items-center gap-1.5 font-mono font-semibold rounded-full border transition-colors cursor-help select-none',
        size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        conf.badgeClass,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', conf.dotClass)} />
      <span>{displayLabel}</span>
    </span>
  );
}

export default DataSourceBadge;
