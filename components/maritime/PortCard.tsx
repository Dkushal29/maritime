import React from 'react';

export interface PortCardProps {
  name: string;
  freight: string;
  congestion: string;
  vessels: string;
  risk: 'Low' | 'Medium' | 'High';
  selected?: boolean;
  onClick?: () => void;
}

export const PortCard: React.FC<PortCardProps> = ({
  name,
  freight,
  congestion,
  vessels,
  risk,
  selected = false,
  onClick,
}) => {
  const riskColor = risk === 'Low' ? '#10B981' : risk === 'Medium' ? '#F59E0B' : '#EF4444';
  const congColor = parseInt(congestion, 10) > 25 ? '#F59E0B' : '#10B981';

  return (
    <button
      onClick={onClick}
      className={`rounded-xl p-3 text-left transition-all w-full cursor-pointer select-none ${
        selected
          ? 'bg-electric/15 border-electric/40 shadow-lg shadow-electric/10'
          : 'bg-ocean-800/60 border-electric/10 hover:bg-ocean-800/90 hover:border-electric/25'
      } border`}
    >
      {selected && (
        <div className="text-[9px] text-cyan font-mono font-bold mb-1 flex items-center gap-1">
          <span>★</span> SELECTED PORT
        </div>
      )}
      <div className="text-xs font-bold text-slate-100 font-display mb-2">{name}</div>

      <div className="flex flex-col gap-1 text-[10px] font-mono">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Freight</span>
          <span className="font-semibold text-cyan">{freight}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Congestion</span>
          <span className="font-semibold" style={{ color: congColor }}>{congestion}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Vessels</span>
          <span className="font-semibold text-emerald-400">{vessels}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Risk</span>
          <span className="font-semibold" style={{ color: riskColor }}>{risk}</span>
        </div>
      </div>
    </button>
  );
};
