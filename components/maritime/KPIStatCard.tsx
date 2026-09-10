import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export interface KPIStatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
  isPositive?: boolean;
  color?: string;
  sparkline?: number[];
  icon?: React.ReactNode;
  onClick?: () => void;
}

export const KPIStatCard: React.FC<KPIStatCardProps> = ({
  label,
  value,
  unit = '',
  trend,
  isPositive = true,
  color = '#22D3EE',
  sparkline = [30, 31, 29, 32, 33, 31, 35],
  icon,
  onClick,
}) => {
  const chartData = sparkline.map((v, i) => ({ v, i }));

  return (
    <div
      onClick={onClick}
      className={`glass rounded-xl p-4 transition-all duration-200 ${
        onClick ? 'hover:border-cyan/40 cursor-pointer hover:bg-ocean-800/40' : ''
      }`}
      style={{ borderColor: `${color}25` }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {icon && <span className="text-sm opacity-80">{icon}</span>}
          <span className="text-[11px] font-mono text-slate-400 tracking-wider uppercase">
            {label}
          </span>
        </div>
        {trend && (
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold"
            style={{
              color: isPositive ? '#10B981' : '#F59E0B',
              backgroundColor: isPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            }}
          >
            {trend}
          </span>
        )}
      </div>

      <div
        className="font-mono text-2xl font-bold tracking-tight mb-2"
        style={{ color }}
      >
        {value}
        {unit && <span className="text-xs text-slate-400 ml-1 font-normal">{unit}</span>}
      </div>

      <div className="h-9 w-full">
        <ResponsiveContainer width="100%" height={36}>
          <AreaChart data={chartData}>
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              fill={`${color}18`}
              strokeWidth={1.5}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
