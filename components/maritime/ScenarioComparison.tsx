import React from 'react';

export interface ScenarioMetric {
  label: string;
  baseVal: string | number;
  simVal: string | number;
  delta?: string | number;
  isPositiveChange?: boolean;
}

export interface ScenarioComparisonProps {
  metrics: ScenarioMetric[];
  baseTitle?: string;
  simTitle?: string;
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  className?: string;
}

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
  metrics,
  baseTitle = 'CURRENT (BASE)',
  simTitle = 'SIMULATED SCENARIO',
  riskLevel = 'Medium',
  className = '',
}) => {
  const riskColor =
    riskLevel === 'Low' ? '#10B981' : riskLevel === 'Medium' ? '#F59E0B' : '#EF4444';

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
      {/* Base Card */}
      <div className="rounded-xl p-4 bg-cyan/5 border border-cyan/20">
        <div className="text-[10px] font-mono text-cyan font-bold tracking-wider uppercase mb-3">
          {baseTitle}
        </div>
        <div className="flex flex-col gap-2.5">
          {metrics.map((m, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-sans">{m.label}</span>
              <span className="font-mono font-semibold text-cyan">{m.baseVal}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Simulated Card */}
      <div
        className="rounded-xl p-4 border"
        style={{
          backgroundColor: `${riskColor}0a`,
          borderColor: `${riskColor}33`,
        }}
      >
        <div
          className="text-[10px] font-mono font-bold tracking-wider uppercase mb-3 flex items-center justify-between"
          style={{ color: riskColor }}
        >
          <span>{simTitle}</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/10">
            {riskLevel} RISK
          </span>
        </div>
        <div className="flex flex-col gap-2.5">
          {metrics.map((m, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-sans">{m.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-slate-100">{m.simVal}</span>
                {m.delta !== undefined && (
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: m.isPositiveChange ? '#10B981' : '#EF4444' }}
                  >
                    ({m.delta})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
