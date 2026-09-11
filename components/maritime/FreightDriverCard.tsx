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
    <div className={`bg-[#102235] rounded-lg p-5 border border-[#294154] ${className}`}>
      <div className="mb-4">
        <div className="text-[11px] text-[#35B8A6] font-mono tracking-wider uppercase mb-1 font-semibold">
          ◆ MODEL EXPLAINABILITY
        </div>
        <h3 className="font-display font-bold text-base text-[#E8F0F5] m-0">{title}</h3>
        {subtitle && <p className="text-xs text-[#91A6B8] mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex flex-col gap-3">
        {drivers.map((d) => {
          const isUp = d.direction === 'up' || d.value > 0;
          const absVal = Math.abs(d.value);

          return (
            <div key={d.label} className="flex items-center gap-4 text-xs">
              <span className="w-36 text-[#E8F0F5] truncate font-medium">{d.label}</span>
              <div className="flex-1 relative flex items-center h-6">
                {/* Left side (negative impact) */}
                <div className="w-1/2 flex justify-end">
                  {!isUp && (
                    <div
                      className="h-3.5 rounded-l bg-[#C96B6B] transition-all duration-300"
                      style={{ width: `${Math.min(100, absVal * 2.2)}%` }}
                    />
                  )}
                </div>
                {/* Center line */}
                <div className="w-[2px] h-5 bg-[#294154] shrink-0" />
                {/* Right side (positive impact) */}
                <div className="w-1/2">
                  {isUp && (
                    <div
                      className="h-3.5 rounded-r bg-[#35B8A6] transition-all duration-300"
                      style={{ width: `${Math.min(100, absVal * 2.2)}%` }}
                    />
                  )}
                </div>
              </div>
              <span
                className="w-14 text-right font-mono font-bold text-xs"
                style={{ color: isUp ? '#35B8A6' : '#C96B6B' }}
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
