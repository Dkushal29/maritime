import React from 'react';

export interface DriverItem {
  label: string;
  value: number; // percentage, positive or negative
  direction: 'up' | 'down';
}

export interface FreightDriverCardProps {
  drivers: DriverItem[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export const FreightDriverCard: React.FC<FreightDriverCardProps> = ({
  drivers,
  title = 'What Is Driving Freight?',
  subtitle = 'SHAP-style driver impact analysis from XGBoost model',
  className = '',
}) => {
  return (
    <div className={`glass rounded-xl p-5 ${className}`}>
      <div className="mb-4">
        <div className="text-[11px] text-cyan font-mono tracking-wider uppercase mb-1">
          ◆ MODEL EXPLAINABILITY
        </div>
        <h3 className="font-display font-bold text-lg text-slate-100 m-0">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex flex-col gap-3">
        {drivers.map((d) => {
          const isUp = d.direction === 'up' || d.value > 0;
          const absVal = Math.abs(d.value);

          return (
            <div key={d.label} className="flex items-center gap-4 text-xs">
              <span className="w-36 text-slate-300 truncate font-medium">{d.label}</span>
              <div className="flex-1 relative flex items-center h-6">
                {/* Left side (negative impact) */}
                <div className="w-1/2 flex justify-end">
                  {!isUp && (
                    <div
                      className="h-4 rounded-l bg-gradient-to-l from-rose-500/80 to-rose-500/30 transition-all duration-500"
                      style={{ width: `${Math.min(100, absVal * 2.2)}%` }}
                    />
                  )}
                </div>
                {/* Center line */}
                <div className="w-[2px] h-6 bg-electric/40 shrink-0" />
                {/* Right side (positive impact) */}
                <div className="w-1/2">
                  {isUp && (
                    <div
                      className="h-4 rounded-r bg-gradient-to-r from-electric/80 to-cyan/60 transition-all duration-500"
                      style={{ width: `${Math.min(100, absVal * 2.2)}%` }}
                    />
                  )}
                </div>
              </div>
              <span
                className="w-14 text-right font-mono font-bold text-xs"
                style={{ color: isUp ? '#22D3EE' : '#EF4444' }}
              >
                {isUp ? '+' : '-'}{absVal}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
