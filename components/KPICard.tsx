'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string;
  unit?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
  icon: LucideIcon;
  sparklineData?: { value: number }[];
  sparklineColor?: string;
  badgeColor?: string;
}

export default function KPICard({
  title,
  value,
  unit,
  change,
  changeType = 'neutral',
  subtitle,
  icon: Icon,
  sparklineData,
  sparklineColor = '#06B6D4',
  badgeColor,
}: KPICardProps) {
  return (
    <div className="relative flex flex-col justify-between p-4 bg-[#131C31] border border-[#1E293B] rounded-xl hover:border-slate-700 transition-all shadow-sm group">
      <div>
        {/* Top bar: label + icon */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </span>
          <div className="p-1.5 rounded-lg bg-[#0B1120] border border-[#1E293B] text-slate-300 group-hover:text-cyan-400 transition-colors">
            <Icon className="w-4 h-4" />
          </div>
        </div>

        {/* Big Main Value */}
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-2xl lg:text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
            {value}
          </span>
          {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
        </div>
      </div>

      {/* Bottom bar: Trend indicator + Sparkline */}
      <div className="flex items-end justify-between gap-2 mt-4 pt-3 border-t border-[#1E293B]/60">
        <div className="flex flex-col">
          {change && (
            <div className="flex items-center gap-1">
              {changeType === 'positive' ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              ) : changeType === 'negative' ? (
                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Minus className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span
                className={cn(
                  'text-xs font-semibold font-mono',
                  changeType === 'positive'
                    ? 'text-emerald-400'
                    : changeType === 'negative'
                    ? 'text-red-400'
                    : 'text-slate-400',
                  badgeColor
                )}
              >
                {change}
              </span>
            </div>
          )}
          {subtitle && <span className="text-[10px] text-slate-400 leading-none mt-0.5">{subtitle}</span>}
        </div>

        {/* Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="w-20 h-8 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={sparklineColor}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
