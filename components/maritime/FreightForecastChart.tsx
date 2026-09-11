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
                <stop offset="5%" stopColor="#5D9BC4" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#5D9BC4" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#35B8A6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#35B8A6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5D9BC4" stopOpacity={0.08} />
                <stop offset="95%" stopColor="#5D9BC4" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#294154" strokeOpacity={0.4} vertical={false} />
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
              tickFormatter={(v) => `$${v}`}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#102235',
                border: '1px solid #294154',
                borderRadius: 6,
                fontSize: 11,
                color: '#E8F0F5',
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
              stroke="#5D9BC4"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              opacity={0.5}
            />
            <Line
              type="monotone"
              dataKey="lowerCI"
              stroke="#5D9BC4"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              opacity={0.5}
            />

            {/* Historical Trend */}
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#5D9BC4"
              strokeWidth={2}
              fill="url(#actualGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#5D9BC4' }}
            />

            {/* Forecast Trend */}
            <Area
              type="monotone"
              dataKey="predicted"
              stroke="#35B8A6"
              strokeWidth={2}
              strokeDasharray="5 3"
              fill="url(#predGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#35B8A6' }}
            />

            {todayMarkerDate && (
              <ReferenceLine
                x={todayMarkerDate}
                stroke="#D6A24A"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                label={{
                  value: 'TODAY',
                  position: 'top',
                  fill: '#D6A24A',
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
      <div className="flex flex-wrap items-center gap-5 mt-3 text-xs font-mono text-[#91A6B8]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-[#5D9BC4] rounded" />
          <span>Historical Freight</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-[#35B8A6] border-t-2 border-dashed border-[#35B8A6]" />
          <span>Ensemble Forecast (XGBoost + Chronos)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-[#5D9BC4] opacity-50" />
          <span>Prediction Interval (P10 — P90)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#D6A24A]" />
          <span>Forecast Anchor</span>
        </div>
      </div>
    </div>
  );
};
