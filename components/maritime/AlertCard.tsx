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
        color: '#C96B6B',
        borderClass: 'border-l-[#C96B6B]',
        badgeBg: 'bg-[#C96B6B]/15 text-[#C96B6B] border-[#C96B6B]/40',
        icon: ShieldAlert,
      }
    : isWarn
    ? {
        label: 'WARNING',
        color: '#D6A24A',
        borderClass: 'border-l-[#D6A24A]',
        badgeBg: 'bg-[#D6A24A]/15 text-[#D6A24A] border-[#D6A24A]/40',
        icon: AlertTriangle,
      }
    : isOpp
    ? {
        label: 'OPPORTUNITY',
        color: '#6DAF91',
        borderClass: 'border-l-[#6DAF91]',
        badgeBg: 'bg-[#6DAF91]/15 text-[#6DAF91] border-[#6DAF91]/40',
        icon: Sparkles,
      }
    : {
        label: 'INFO',
        color: '#5D9BC4',
        borderClass: 'border-l-[#5D9BC4]',
        badgeBg: 'bg-[#5D9BC4]/15 text-[#5D9BC4] border-[#5D9BC4]/40',
        icon: Info,
      };

  const Icon = config.icon;
  const typeBadge = (alert.type || 'Operational').toUpperCase();

  return (
    <div
      className={`bg-[#102235] rounded-lg p-3.5 transition-colors hover:bg-[#162C40] border border-[#294154] border-l-4 ${config.borderClass}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Condition / Severity Badge */}
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border flex items-center gap-1.5 tracking-wide ${config.badgeBg}`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {config.label}
          </span>

          {/* Type Tag */}
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#162C40] text-[#91A6B8] border border-[#294154]">
            {typeBadge}
          </span>

          {/* Route or Location */}
          {alert.route && (
            <span className="text-xs text-[#35B8A6] font-mono">
              • {alert.route}
            </span>
          )}
        </div>

        <span className="text-[11px] font-mono text-[#91A6B8] whitespace-nowrap">
          {alert.time || alert.timestamp || 'Just now'}
        </span>
      </div>

      <h4 className="font-display font-semibold text-sm text-[#E8F0F5] mb-1">
        {alert.title}
      </h4>

      {alert.description && (
        <p className="text-xs text-[#91A6B8] leading-relaxed mb-3 font-sans">
          {alert.description}
        </p>
      )}

      {alert.action && (
        <div className="flex items-center justify-between pt-2.5 border-t border-[#294154] mt-2">
          <div className="text-[11px] font-mono text-[#91A6B8] flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-[#35B8A6] font-semibold shrink-0">ACTION:</span>
            <span className="truncate text-[#E8F0F5]">{alert.action}</span>
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
