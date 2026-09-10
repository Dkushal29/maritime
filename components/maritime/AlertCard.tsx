import React from 'react';
import { ShieldAlert, AlertTriangle, Sparkles, Info } from 'lucide-react';

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
  const rawSev = String(alert.severity || alert.category || alert.type || 'info').toLowerCase();
  const isCrit = rawSev.includes('crit');
  const isWarn = rawSev.includes('warn');
  const isOpp = rawSev.includes('opp') || rawSev.includes('recom') || rawSev.includes('arbitrage');

  const config = isCrit
    ? {
        label: 'CRITICAL',
        color: '#EF4444',
        borderClass: 'border-l-rose-500',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        icon: ShieldAlert,
      }
    : isWarn
    ? {
        label: 'WARNING',
        color: '#F59E0B',
        borderClass: 'border-l-amber-500',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        icon: AlertTriangle,
      }
    : isOpp
    ? {
        label: 'OPPORTUNITY',
        color: '#10B981',
        borderClass: 'border-l-emerald-500',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        icon: Sparkles,
      }
    : {
        label: 'INFO',
        color: '#06B6D4',
        borderClass: 'border-l-cyan-500',
        badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        icon: Info,
      };

  const Icon = config.icon;
  const typeBadge = (alert.type || 'Operational Telemetry').toUpperCase();

  return (
    <div
      className={`glass rounded-xl p-4 transition-all hover:bg-ocean-800/60 border border-electric/15 border-l-4 ${config.borderClass}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Condition / Severity Badge */}
          <span
            className={`text-[10px] font-mono px-2.5 py-0.5 rounded font-extrabold border flex items-center gap-1.5 tracking-wider ${config.badgeBg}`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {config.label}
          </span>

          {/* Type Tag */}
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-ocean-900/90 text-slate-300 border border-electric/25 font-semibold">
            {typeBadge}
          </span>

          {/* Route or Location */}
          {alert.route && (
            <span className="text-xs text-cyan font-mono font-medium">
              • {alert.route}
            </span>
          )}
        </div>

        <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
          {alert.time || alert.timestamp || 'Just now'}
        </span>
      </div>

      <h4 className="font-display font-bold text-sm text-slate-100 mb-1">
        {alert.title}
      </h4>

      {alert.description && (
        <p className="text-xs text-slate-300 leading-relaxed mb-3 font-sans">
          {alert.description}
        </p>
      )}

      {alert.action && (
        <div className="flex items-center justify-between pt-2.5 border-t border-electric/10 mt-2">
          <div className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-cyan font-bold shrink-0">↳ ACTION:</span>
            <span className="truncate">{alert.action}</span>
          </div>
          {onAction && (
            <button
              onClick={onAction}
              className="text-xs font-mono text-cyan hover:underline shrink-0 ml-2"
            >
              Resolve →
            </button>
          )}
        </div>
      )}
    </div>
  );
};
