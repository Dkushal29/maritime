import React from 'react';

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  color?: string;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (v) => `${v}`,
  color = '#22D3EE',
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-xs font-mono font-semibold" style={{ color }}>
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
};
