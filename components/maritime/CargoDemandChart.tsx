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
                <stop offset="5%" stopColor="#35B8A6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#35B8A6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="demGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D6A24A" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#D6A24A" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#294154" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#91A6B8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#91A6B8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}k`}
            />
            <Tooltip
              contentStyle={{
                background: '#102235',
                border: '1px solid #294154',
                borderRadius: 6,
                fontSize: 11,
                fontFamily: 'JetBrains Mono',
                color: '#E8F0F5',
              }}
              formatter={(val: any, name: any) => [
                `${Number(val).toLocaleString()} MT`,
                name === 'inventory' ? 'Inventory Stock' : 'Projected Consumption',
              ]}
            />
            <Area
              type="monotone"
              dataKey="inventory"
              stroke="#35B8A6"
              strokeWidth={2}
              fill="url(#invGrad)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="demand"
              stroke="#D6A24A"
              strokeWidth={2}
              strokeDasharray="4 2"
              fill="url(#demGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-6 mt-3 text-xs font-mono text-[#91A6B8]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-[#35B8A6] rounded" />
          <span>Inventory Level (MT)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-[#D6A24A] rounded" />
          <span>Burn / Consumption Rate</span>
        </div>
      </div>
    </div>
  );
};
