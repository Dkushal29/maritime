import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export interface DemandDataPoint {
  date: string;
  inventory: number;
  demand: number;
  procurement?: number;
}

export interface CargoDemandChartProps {
  data: DemandDataPoint[];
  height?: number;
}

export const CargoDemandChart: React.FC<CargoDemandChartProps> = ({
  data,
  height = 300,
}) => {
  return (
    <div className="w-full">
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="demGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(22, 131, 255, 0.08)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}k`}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(11, 31, 54, 0.95)',
                border: '1px solid rgba(22, 131, 255, 0.25)',
                borderRadius: 8,
                fontSize: 11,
                fontFamily: 'JetBrains Mono',
              }}
              formatter={(val: any, name: any) => [
                `${Number(val).toLocaleString()} MT`,
                name === 'inventory' ? 'Inventory Stock' : 'Projected Consumption',
              ]}
            />
            <Area
              type="monotone"
              dataKey="inventory"
              stroke="#22D3EE"
              strokeWidth={2}
              fill="url(#invGrad)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="demand"
              stroke="#EF4444"
              strokeWidth={2}
              strokeDasharray="4 2"
              fill="url(#demGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-6 mt-3 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-cyan rounded" />
          <span>Inventory Level (MT)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-rose-500 rounded" />
          <span>Burn / Consumption Rate</span>
        </div>
      </div>
    </div>
  );
};
