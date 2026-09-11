import React from 'react';

export interface AIInsightProps {
  title?: string;
  insight: string;
  impact?: string;
  confidence?: string | number;
  className?: string;
}

export const AIInsight: React.FC<AIInsightProps> = ({
  title = 'AI INSIGHT',
  insight,
  impact,
  confidence,
  className = '',
}) => {
  return (
    <div
      className={`rounded-lg p-4 border border-[#294154] bg-[#102235] ${className}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#35B8A6]" />
        <span className="text-[10px] font-mono text-[#35B8A6] font-semibold tracking-wider uppercase">
          {title}
        </span>
        {confidence !== undefined && (
          <span className="ml-auto text-[10px] font-mono text-[#5D9BC4] bg-[#162C40] px-1.5 py-0.5 rounded border border-[#294154]">
            {typeof confidence === 'number' ? `${Math.round(confidence * 100)}% Conf.` : confidence}
          </span>
        )}
      </div>

      <p className="text-xs text-[#91A6B8] leading-relaxed m-0 font-sans">
        {insight}
      </p>

      {impact && (
        <div className="mt-3 p-2.5 rounded-md bg-[#162C40] border border-[#294154]">
          <div className="text-[10px] font-mono text-[#6DAF91] font-semibold mb-0.5">EXPECTED IMPACT</div>
          <div className="text-xs text-[#E8F0F5] font-medium">{impact}</div>
        </div>
      )}
    </div>
  );
};
