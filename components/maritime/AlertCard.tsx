import React from 'react';

export interface AlertData {
  id?: string | number;
  type?: string;
  severity?: 'critical' | 'warning' | 'opportunity' | 'info' | string;
  category?: string;
  title: string;
  route?: string;
  description?: string;
  action?: string;
  timestamp?: string;
  time?: string;
}

export interface AlertCardProps {
  alert: AlertData;
  onAction?: () => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onAction }) => {
  const sev = (alert.severity || alert.type || 'info').toLowerCase();
  const isCrit = sev === 'critical';
  const isWarn = sev === 'warning';
  const isOpp = sev === 'opportunity' || sev === 'success';

  const color = isCrit ? '#EF4444' : isWarn ? '#F59E0B' : isOpp ? '#10B981' : '#22D3EE';
  const badgeText = (alert.type || alert.severity || 'INFO').toUpperCase();

  return (
    <div
      className="glass rounded-xl p-4 transition-all hover:bg-ocean-800/50"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
            style={{
              color,
              backgroundColor: `${color}18`,
              border: `1px solid ${color}33`,
            }}
          >
            {badgeText}
          </span>
          {alert.category && (
            <span className="text-xs text-slate-400 font-mono">
              {alert.category}
            </span>
          )}
          {alert.route && (
            <span className="text-xs text-cyan font-mono font-medium">
              • {alert.route}
            </span>
          )}
        </div>
        <span className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
          {alert.time || alert.timestamp || 'Just now'}
        </span>
      </div>

      <h4 className="font-display font-bold text-sm text-slate-100 mb-1">
        {alert.title}
      </h4>

      {alert.description && (
        <p className="text-xs text-slate-300 leading-relaxed mb-3">
          {alert.description}
        </p>
      )}

      {alert.action && (
        <div className="flex items-center justify-between pt-2 border-t border-electric/10 mt-2">
          <div className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
            <span className="text-cyan font-bold">↳ ACTION:</span>
            <span>{alert.action}</span>
          </div>
          {onAction && (
            <button
              onClick={onAction}
              className="text-xs font-mono text-cyan hover:underline"
            >
              Resolve →
            </button>
          )}
        </div>
      )}
    </div>
  );
};
