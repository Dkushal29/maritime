import React from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export interface ForecastPoint {
  date: string;
  actual?: number;
  predicted?: number;
  upperCI?: number;
  lowerCI?: number;
}

export interface FreightForecastChartProps {
  data: ForecastPoint[];
  todayMarkerDate?: string;
  height?: number;
}

export const FreightForecastChart: React.FC<FreightForecastChartProps> = ({
  data,
  todayMarkerDate = 'Sep 10',
  height = 320,
}) => {
  return (
    <div className="w-full">
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1683FF" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#1683FF" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.02} />
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
              tickFormatter={(v) => `$${v}`}
              domain={['auto', 'auto']}
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
                `$${val}/MT`,
                name === 'actual'
                  ? 'Historical Rate'
                  : name === 'predicted'
                  ? 'Forecast'
                  : name === 'upperCI'
                  ? 'Upper CI (95%)'
                  : 'Lower CI (95%)',
              ]}
            />

            {/* Confidence Area */}
            <Area
              type="monotone"
              dataKey="upperCI"
              stroke="none"
              fill="url(#confGrad)"
              activeDot={false}
            />
            <Line
              type="monotone"
              dataKey="upperCI"
              stroke="#8B5CF6"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              opacity={0.6}
            />
            <Line
              type="monotone"
              dataKey="lowerCI"
              stroke="#8B5CF6"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              opacity={0.6}
            />

            {/* Historical Trend */}
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#22D3EE"
              strokeWidth={2.5}
              fill="url(#actualGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#22D3EE' }}
            />

            {/* Forecast Trend */}
            <Area
              type="monotone"
              dataKey="predicted"
              stroke="#1683FF"
              strokeWidth={2.5}
              strokeDasharray="5 3"
              fill="url(#predGrad)"
              dot={false}
              activeDot={{ r: 5, fill: '#1683FF' }}
            />

            {todayMarkerDate && (
              <ReferenceLine
                x={todayMarkerDate}
                stroke="#F59E0B"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                label={{
                  value: 'TODAY',
                  position: 'top',
                  fill: '#F59E0B',
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono',
                  fontWeight: 600,
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend */}
      <div className="flex flex-wrap items-center gap-5 mt-3 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-0.5 bg-cyan rounded" />
          <span>Historical Freight</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-0.5 bg-electric border-t-2 border-dashed border-electric" />
          <span>Ensemble Forecast (XGBoost + Chronos)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-0.5 bg-purple-ai opacity-60" />
          <span>Prediction Interval (P10 — P90)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Forecast Anchor</span>
        </div>
      </div>
    </div>
  );
};
