import React from 'react';

export interface CostItem {
  label: string;
  amount: string | number;
  percentage?: number;
  color?: string;
}

export interface CostBreakdownProps {
  items: CostItem[];
  totalCost: string | number;
  className?: string;
}

export const CostBreakdown: React.FC<CostBreakdownProps> = ({
  items,
  totalCost,
  className = '',
}) => {
  return (
    <div className={`bg-[#102235] border border-[#294154] rounded-lg p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] font-mono text-[#35B8A6] tracking-wider uppercase mb-0.5">
            FINANCIAL INTELLIGENCE
          </div>
          <h3 className="font-semibold text-base text-[#E8F0F5] m-0">Landed Cost Breakdown</h3>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono text-[#91A6B8] uppercase">Total Landed Cost</div>
          <div className="font-mono font-bold text-lg text-[#35B8A6]">{totalCost}</div>
        </div>
      </div>

      {/* Stacked Progress Bar */}
      <div className="w-full h-2.5 rounded-sm overflow-hidden flex bg-[#0B1726] mb-4 border border-[#294154]">
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              width: `${item.percentage || 25}%`,
              backgroundColor: item.color || '#35B8A6',
            }}
            className="h-full transition-all duration-300"
          />
        ))}
      </div>

      {/* Legend & Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        {items.map((item, idx) => (
          <div key={idx} className="p-2.5 rounded-md bg-[#162C40] border border-[#294154]">
            <div className="flex items-center gap-1.5 text-[#91A6B8] mb-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || '#35B8A6' }} />
              <span className="truncate">{item.label}</span>
            </div>
            <div className="font-semibold text-[#E8F0F5] text-sm">{item.amount}</div>
            {item.percentage && (
              <div className="text-[10px] text-[#91A6B8]/70">{item.percentage}% of total</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
