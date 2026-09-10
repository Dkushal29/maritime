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
    ? { text: 'Available', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' }
    : normalized.includes('sea') || normalized.includes('transit')
    ? { text: 'At Sea', color: '#22D3EE', bg: 'rgba(34, 211, 238, 0.12)', border: 'rgba(34, 211, 238, 0.3)' }
    : normalized.includes('book')
    ? { text: 'Booked', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' }
    : { text: 'Maintenance', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' };

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
