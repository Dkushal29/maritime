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
      className={`rounded-xl p-4 border border-purple-ai/25 bg-gradient-to-br from-purple-ai/10 via-electric/5 to-transparent ${className}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-purple-ai animate-pulse" />
        <span className="text-[10px] font-mono text-purple-ai font-bold tracking-wider uppercase">
          {title}
        </span>
        {confidence !== undefined && (
          <span className="ml-auto text-[10px] font-mono text-cyan/90 bg-cyan/10 px-1.5 py-0.5 rounded border border-cyan/20">
            {typeof confidence === 'number' ? `${Math.round(confidence * 100)}% Conf.` : confidence}
          </span>
        )}
      </div>

      <p className="text-xs text-slate-300 leading-relaxed m-0 font-sans">
        {insight}
      </p>

      {impact && (
        <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="text-[10px] font-mono text-emerald-400 font-semibold mb-0.5">EXPECTED IMPACT</div>
          <div className="text-xs text-slate-200 font-medium">{impact}</div>
        </div>
      )}
    </div>
  );
};
