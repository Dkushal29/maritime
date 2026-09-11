import React from 'react';

export type VesselOperationalStatus = 'Available' | 'Booked' | 'At Sea' | 'Maintenance';

export interface VesselStatusProps {
  status: VesselOperationalStatus | string;
  size?: 'sm' | 'md';
}

export const VesselStatus: React.FC<VesselStatusProps> = ({
  status,
  size = 'md',
}) => {
  const normalized = (status || 'Available').toLowerCase();

  const config = normalized.includes('avail')
    ? { text: 'Available', color: '#6DAF91', bg: 'rgba(109, 175, 145, 0.12)', border: 'rgba(109, 175, 145, 0.3)' }
    : normalized.includes('sea') || normalized.includes('transit')
    ? { text: 'At Sea', color: '#5D9BC4', bg: 'rgba(93, 155, 196, 0.12)', border: 'rgba(93, 155, 196, 0.3)' }
    : normalized.includes('book')
    ? { text: 'Booked', color: '#D6A24A', bg: 'rgba(214, 162, 74, 0.12)', border: 'rgba(214, 162, 74, 0.3)' }
    : { text: 'Maintenance', color: '#C96B6B', bg: 'rgba(201, 107, 107, 0.12)', border: 'rgba(201, 107, 107, 0.3)' };

  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded font-mono font-semibold ${sizeClass}`}
      style={{
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
      <span>{config.text}</span>
    </span>
  );
};
