import React from 'react';

export interface StrategyOption {
  label: string;
  cost: string | number;
  risk: 'Low' | 'Medium' | 'High';
  savings: string;
  isRecommended?: boolean;
  description: string;
}

export interface OptimizationResultProps {
  recommendedAction: string;
  selectedVessels: Array<{ name: string; type: string; dwt: string | number; cost: string | number }>;
  totalCost: string | number;
  fuelCost?: string | number;
  freightCost?: string | number;
  delayRisk?: string;
  estimatedSavings?: string;
  confidenceScore?: number;
  deadlineFeasible?: boolean;
  alternativeStrategies?: StrategyOption[];
  onSelectStrategy?: (strategy: StrategyOption) => void;
}

export const OptimizationResult: React.FC<OptimizationResultProps> = ({
  recommendedAction,
  selectedVessels,
  totalCost,
  fuelCost = '$1.84M',
  freightCost = '$5.52M',
  delayRisk = 'Low (4%)',
  estimatedSavings = '$420,000',
  confidenceScore = 0.88,
  deadlineFeasible = true,
  alternativeStrategies,
  onSelectStrategy,
}) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Recommended Strategy Banner */}
      <div
        className="rounded-2xl p-7 relative overflow-hidden border border-electric/30 shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(22, 131, 255, 0.15) 0%, rgba(34, 211, 238, 0.08) 100%)',
        }}
      >
        <div className="absolute top-5 right-5 px-3 py-1.5 rounded-lg ai-gradient text-white text-[11px] font-mono font-bold tracking-wider">
          ★ AI OPTIMAL PLAN
        </div>

        <div className="text-xs font-mono text-cyan font-bold tracking-wider mb-1 uppercase">
          RECOMMENDED CHARTER STRATEGY
        </div>
        <h2 className="font-display font-extrabold text-2xl text-slate-100 m-0 mb-4">
          {recommendedAction}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-ocean-950/70 border border-electric/15 mb-5 font-mono">
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Total Estimated Cost</div>
            <div className="text-xl font-bold text-cyan">{totalCost}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Projected Savings</div>
            <div className="text-xl font-bold text-emerald-400">{estimatedSavings}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Delay Risk</div>
            <div className="text-xl font-bold text-emerald-400">{delayRisk}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Feasibility</div>
            <div className="text-xl font-bold text-emerald-400">
              {deadlineFeasible ? 'Within Deadline ✓' : 'Tight Deadline ⚠'}
            </div>
          </div>
        </div>

        {/* Selected Vessels Breakdown */}
        <div>
          <div className="text-xs font-mono text-slate-300 font-semibold mb-2">
            ASSIGNED FLEET ALLOCATION:
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {selectedVessels.map((v, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-ocean-900/80 border border-electric/15"
              >
                <div>
                  <div className="font-display font-bold text-sm text-slate-100">{v.name}</div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {v.type} • {typeof v.dwt === 'number' ? `${v.dwt.toLocaleString()} DWT` : v.dwt}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-xs font-bold text-cyan">{v.cost}</div>
                  <div className="text-[9px] text-emerald-400 font-semibold">100% SUITABLE</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alternative Scenario Comparison Cards */}
      {alternativeStrategies && alternativeStrategies.length > 0 && (
        <div>
          <h3 className="font-display font-bold text-base text-slate-100 mb-3">
            Scenario Strategy Comparison
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {alternativeStrategies.map((strat, i) => {
              const riskColor = strat.risk === 'Low' ? '#10B981' : strat.risk === 'Medium' ? '#F59E0B' : '#EF4444';
              return (
                <div
                  key={i}
                  onClick={() => onSelectStrategy && onSelectStrategy(strat)}
                  className={`glass rounded-xl p-5 border transition-all ${
                    strat.isRecommended
                      ? 'border-cyan/50 ring-1 ring-cyan/30 bg-ocean-800/60 shadow-lg shadow-cyan/10'
                      : 'hover:border-electric/30 hover:bg-ocean-800/40 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {strat.label}
                    </span>
                    {strat.isRecommended && (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan/20 text-cyan border border-cyan/40 font-bold">
                        AI OPTIMAL
                      </span>
                    )}
                  </div>

                  <div className="font-mono text-2xl font-bold text-slate-100 mb-2">
                    {strat.cost}
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono mb-3">
                    <span style={{ color: riskColor }}>{strat.risk} Risk</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-emerald-400">Save {strat.savings}</span>
                  </div>

                  <p className="text-xs text-slate-400 leading-snug m-0">
                    {strat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
