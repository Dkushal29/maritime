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
      className="bg-[#102235] border border-[#294154] rounded-lg p-5"
    >
      {/* Header Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-mono text-[#35B8A6] tracking-wider font-semibold uppercase px-2 py-0.5 rounded bg-[#162C40] border border-[#294154]">
          Charter Recommendation
        </span>
      </div>

      {/* Main Headline */}
      <h3 className="font-display font-bold text-xl text-[#E8F0F5] mb-3 leading-tight">
        {action}
      </h3>

      {/* Rationale Bullet Points */}
      <div className="flex flex-col gap-2 mb-4">
        {reasons.map((r, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-[#91A6B8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#35B8A6] mt-1.5 shrink-0" />
            <span className="leading-snug">{r}</span>
          </div>
        ))}
      </div>

      {/* Key Metric Blocks */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-md p-2.5 bg-[#162C40] border border-[#294154]">
          <div className="text-[10px] font-mono text-[#91A6B8] uppercase mb-0.5">
            Estimated Savings
          </div>
          <div className="font-mono text-lg font-bold text-[#6DAF91]">
            {expectedSavings}
          </div>
        </div>

        <div className="rounded-md p-2.5 bg-[#162C40] border border-[#294154]">
          <div className="text-[10px] font-mono text-[#91A6B8] uppercase mb-0.5">
            Model Confidence
          </div>
          <div className="font-mono text-lg font-bold text-[#5D9BC4]">
            {confText}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2.5">
        {onPrimaryClick && (
          <button
            onClick={onPrimaryClick}
            className="flex-1 py-2 rounded-md bg-[#35B8A6] hover:bg-[#2EA595] text-[#0B1726] text-xs font-semibold cursor-pointer transition-colors"
          >
            {primaryLabel}
          </button>
        )}
        {onSecondaryClick && (
          <button
            onClick={onSecondaryClick}
            className="flex-1 py-2 rounded-md bg-[#102235] hover:bg-[#162C40] text-[#E8F0F5] border border-[#294154] text-xs font-medium cursor-pointer transition-colors"
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
};
