import React from 'react';

export interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'warning' | 'busy' | 'pulse';
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = 'md',
}) => {
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  const colorMap = {
    online: 'bg-emerald-400',
    offline: 'bg-slate-500',
    warning: 'bg-amber-400',
    busy: 'bg-rose-500',
    pulse: 'bg-cyan',
  }[status];

  return (
    <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
      <span className={`relative flex ${dotSize}`}>
        {(status === 'online' || status === 'pulse') && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colorMap}`} />
        )}
        <span className={`relative inline-flex rounded-full ${dotSize} ${colorMap}`} />
      </span>
      {label && <span>{label}</span>}
    </div>
  );
};
