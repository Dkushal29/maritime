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
    score >= 90 ? '#10B981' : score >= 80 ? '#22D3EE' : score >= 70 ? '#F59E0B' : '#EF4444';

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
        className={`glass rounded-xl p-3 flex items-center gap-3 transition-all cursor-pointer border ${
          selected
            ? 'bg-electric/15 border-electric/40 shadow-lg shadow-electric/15'
            : 'hover:border-electric/30 hover:bg-ocean-800/50'
        }`}
      >
        <img
          src={imgUrl}
          alt={vessel.name}
          className="w-20 h-14 rounded-lg object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-sm text-slate-100 truncate">
            {vessel.name}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            {vessel.type} · {dwtDisplay}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-sm font-bold" style={{ color: scoreColor }}>
            {score}
          </div>
          <div className="text-[9px] font-mono text-slate-500">SUITABILITY</div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`glass rounded-xl overflow-hidden flex flex-col transition-all duration-200 cursor-pointer border ${
        selected
          ? 'border-cyan/50 shadow-xl shadow-cyan/10 ring-1 ring-cyan/30'
          : 'hover:border-electric/40 hover:bg-ocean-800/40'
      }`}
    >
      {/* Vessel Imagery */}
      <div className="relative h-36 w-full overflow-hidden bg-ocean-950">
        <img
          src={imgUrl}
          alt={vessel.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ocean-950 via-ocean-950/40 to-transparent" />

        {/* Score Badge */}
        <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-md bg-ocean-950/80 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-slate-400">SCORE</span>
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
          <h4 className="font-display font-bold text-base text-slate-100 m-0 mb-1 truncate">
            {vessel.name}
          </h4>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mb-3">
            <span>{vessel.type}</span>
            <span>•</span>
            <span>{dwtDisplay}</span>
            {vessel.carbon_rating && (
              <>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">CII: {vessel.carbon_rating}</span>
              </>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-electric/10 grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div>
            <div className="text-slate-500 text-[9px] uppercase">Location</div>
            <div className="text-slate-300 font-medium truncate">{vessel.location}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-500 text-[9px] uppercase">Rate</div>
            <div className="text-cyan font-bold">{rateDisplay}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
