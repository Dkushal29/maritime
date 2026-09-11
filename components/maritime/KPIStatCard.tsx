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
  color = '#35B8A6',
  sparkline = [30, 31, 29, 32, 33, 31, 35],
  icon,
  onClick,
}) => {
  const chartData = sparkline.map((v, i) => ({ v, i }));

  return (
    <div
      onClick={onClick}
      className={`bg-[#102235] border border-[#294154] rounded-lg p-3.5 transition-colors ${
        onClick ? 'hover:border-[#35B8A6]/60 cursor-pointer hover:bg-[#162C40]' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {icon && <span className="text-sm opacity-80 text-[#91A6B8]">{icon}</span>}
          <span className="text-[11px] font-mono text-[#91A6B8] tracking-wider uppercase">
            {label}
          </span>
        </div>
        {trend && (
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold border border-[#294154]"
            style={{
              color: isPositive ? '#6DAF91' : '#D6A24A',
              backgroundColor: isPositive ? 'rgba(109, 175, 145, 0.12)' : 'rgba(214, 162, 74, 0.12)',
            }}
          >
            {trend}
          </span>
        )}
      </div>

      <div
        className="font-mono text-2xl font-bold tracking-tight mb-2 text-[#E8F0F5]"
      >
        {value}
        {unit && <span className="text-xs text-[#91A6B8] ml-1 font-normal">{unit}</span>}
      </div>

      <div className="h-9 w-full">
        <ResponsiveContainer width="100%" height={36}>
          <AreaChart data={chartData}>
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              fill={`${color}15`}
              strokeWidth={1.5}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
