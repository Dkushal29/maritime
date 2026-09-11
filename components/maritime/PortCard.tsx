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
  const riskColor = risk === 'Low' ? '#6DAF91' : risk === 'Medium' ? '#D6A24A' : '#C96B6B';
  const congColor = parseInt(congestion, 10) > 25 ? '#D6A24A' : '#6DAF91';

  return (
    <button
      onClick={onClick}
      className={`rounded-lg p-3 text-left transition-colors w-full cursor-pointer select-none border ${
        selected
          ? 'bg-[#162C40] border-[#35B8A6]'
          : 'bg-[#102235] border-[#294154] hover:bg-[#162C40] hover:border-[#35B8A6]/40'
      }`}
    >
      {selected && (
        <div className="text-[9px] text-[#35B8A6] font-mono font-semibold mb-1">
          SELECTED PORT
        </div>
      )}
      <div className="text-xs font-semibold text-[#E8F0F5] mb-2">{name}</div>

      <div className="flex flex-col gap-1 text-[10px] font-mono">
        <div className="flex justify-between items-center">
          <span className="text-[#91A6B8]">Freight</span>
          <span className="font-semibold text-[#35B8A6]">{freight}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#91A6B8]">Congestion</span>
          <span className="font-semibold" style={{ color: congColor }}>{congestion}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#91A6B8]">Vessels</span>
          <span className="font-semibold text-[#5D9BC4]">{vessels}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#91A6B8]">Risk</span>
          <span className="font-semibold" style={{ color: riskColor }}>{risk}</span>
        </div>
      </div>
    </button>
  );
};
