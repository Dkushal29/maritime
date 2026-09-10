import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[11px] font-mono text-slate-400 mb-1.5 uppercase tracking-wider">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full bg-ocean-900 border border-electric/20 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/30 transition-all cursor-pointer ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-ocean-950 text-slate-100">
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);
Select.displayName = 'Select';
