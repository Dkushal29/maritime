import React from 'react';
import { VesselStatus } from './VesselStatus';

export interface VesselData {
  id?: string;
  name: string;
  imo?: string;
  type: string;
  dwt: number | string;
  location: string;
  eta?: string;
  rate?: string | number;
  daily_charter_rate?: number;
  score?: number;
  status?: string;
  img?: string;
  speed?: number;
  draft?: number;
  carbon_rating?: string;
}

export interface VesselCardProps {
  vessel: VesselData;
  selected?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export const VesselCard: React.FC<VesselCardProps> = ({
  vessel,
  selected = false,
  compact = false,
  onClick,
}) => {
  const score = vessel.score ?? 85;
  const scoreColor =
    score >= 90 ? '#6DAF91' : score >= 80 ? '#35B8A6' : score >= 70 ? '#D6A24A' : '#C96B6B';

  const defaultImg =
    vessel.type === 'Capesize'
      ? 'https://images.unsplash.com/photo-1670121180530-cfcba4438038?w=500&h=280&fit=crop&auto=format'
      : vessel.type === 'Supramax'
      ? 'https://images.unsplash.com/photo-1670121180583-39ab653a071c?w=500&h=280&fit=crop&auto=format'
      : 'https://images.unsplash.com/photo-1700114339471-9e90a155d4b7?w=500&h=280&fit=crop&auto=format';

  const imgUrl = vessel.img || defaultImg;
  const dwtDisplay = typeof vessel.dwt === 'number' ? `${vessel.dwt.toLocaleString()} DWT` : vessel.dwt;
  const rateDisplay =
    vessel.rate !== undefined
      ? vessel.rate
      : vessel.daily_charter_rate
      ? `$${vessel.daily_charter_rate.toLocaleString()}/day`
      : '$28,500/day';

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`bg-[#102235] rounded-lg p-3 flex items-center gap-3 transition-colors cursor-pointer border ${
          selected
            ? 'bg-[#162C40] border-[#35B8A6]'
            : 'border-[#294154] hover:border-[#35B8A6]/50 hover:bg-[#162C40]'
        }`}
      >
        <img
          src={imgUrl}
          alt={vessel.name}
          className="w-20 h-14 rounded-md object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-sm text-[#E8F0F5] truncate">
            {vessel.name}
          </div>
          <div className="text-[11px] font-mono text-[#91A6B8]">
            {vessel.type} · {dwtDisplay}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-sm font-bold" style={{ color: scoreColor }}>
            {score}
          </div>
          <div className="text-[9px] font-mono text-[#91A6B8]">SUITABILITY</div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`bg-[#102235] rounded-lg overflow-hidden flex flex-col transition-colors cursor-pointer border ${
        selected
          ? 'border-[#35B8A6] bg-[#162C40]'
          : 'border-[#294154] hover:border-[#35B8A6]/50 hover:bg-[#162C40]'
      }`}
    >
      {/* Vessel Imagery */}
      <div className="relative h-36 w-full overflow-hidden bg-[#0B1726]">
        <img
          src={imgUrl}
          alt={vessel.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#102235] via-[#102235]/40 to-transparent" />

        {/* Score Badge */}
        <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-md bg-[#0B1726]/85 border border-[#294154] flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-[#91A6B8]">SCORE</span>
          <span className="font-mono font-bold text-xs" style={{ color: scoreColor }}>
            {score}
          </span>
        </div>

        {/* Operational Status */}
        <div className="absolute bottom-2.5 left-3">
          <VesselStatus status={vessel.status || 'Available'} size="sm" />
        </div>
      </div>

      {/* Info Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-display font-bold text-base text-[#E8F0F5] m-0 mb-1 truncate">
            {vessel.name}
          </h4>
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#91A6B8] mb-3">
            <span>{vessel.type}</span>
            <span>•</span>
            <span>{dwtDisplay}</span>
            {vessel.carbon_rating && (
              <>
                <span>•</span>
                <span className="text-[#6DAF91] font-semibold">CII: {vessel.carbon_rating}</span>
              </>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-[#294154] grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div>
            <div className="text-[#91A6B8] text-[9px] uppercase">Location</div>
            <div className="text-[#E8F0F5] font-medium truncate">{vessel.location}</div>
          </div>
          <div className="text-right">
            <div className="text-[#91A6B8] text-[9px] uppercase">Rate</div>
            <div className="text-[#35B8A6] font-bold">{rateDisplay}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
