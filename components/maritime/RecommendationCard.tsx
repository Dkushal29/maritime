import React from 'react';

export interface RecommendationCardProps {
  action: string;
  reasons: string[];
  expectedSavings?: string;
  confidence?: string | number;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  primaryLabel?: string;
  secondaryLabel?: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  action,
  reasons,
  expectedSavings = '$420,000',
  confidence = '87%',
  onPrimaryClick,
  onSecondaryClick,
  primaryLabel = 'View Analysis',
  secondaryLabel = 'Run Scenario',
}) => {
  const confText = typeof confidence === 'number' ? `${Math.round(confidence * 100)}%` : confidence;

  return (
    <div
      className="rounded-2xl relative overflow-hidden p-6 border border-electric/30"
      style={{
        background: 'linear-gradient(135deg, rgba(22, 131, 255, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
      }}
    >
      {/* Header Badge */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg ai-gradient flex items-center justify-center text-white text-xs">
          ★
        </div>
        <span className="text-[11px] font-mono text-cyan tracking-wider font-bold uppercase">
          AI CHARTER RECOMMENDATION
        </span>
      </div>

      {/* Main Headline */}
      <h3 className="font-display font-extrabold text-2xl text-slate-100 mb-3 leading-tight">
        {action}
      </h3>

      {/* Rationale Bullet Points */}
      <div className="flex flex-col gap-2 mb-5">
        {reasons.map((r, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan mt-1.5 shrink-0" />
            <span className="leading-snug">{r}</span>
          </div>
        ))}
      </div>

      {/* Key Metric Blocks */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl p-3 bg-emerald-500/10 border border-emerald-500/25">
          <div className="text-[10px] font-mono text-emerald-400 font-bold mb-1">
            ESTIMATED SAVINGS
          </div>
          <div className="font-mono text-xl font-bold text-emerald-400">
            {expectedSavings}
          </div>
        </div>

        <div className="rounded-xl p-3 bg-electric/10 border border-electric/25">
          <div className="text-[10px] font-mono text-cyan font-bold mb-1">
            AI CONFIDENCE
          </div>
          <div className="font-mono text-xl font-bold text-cyan">
            {confText}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {onPrimaryClick && (
          <button
            onClick={onPrimaryClick}
            className="flex-1 py-2.5 rounded-lg ai-gradient text-white text-xs font-display font-bold cursor-pointer hover:opacity-95 shadow-md shadow-electric/20 border border-white/15"
          >
            {primaryLabel}
          </button>
        )}
        {onSecondaryClick && (
          <button
            onClick={onSecondaryClick}
            className="flex-1 py-2.5 rounded-lg bg-ocean-800/80 hover:bg-ocean-700 text-slate-200 text-xs font-medium cursor-pointer border border-electric/20 transition-colors"
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
};
