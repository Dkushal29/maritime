import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[11px] font-mono text-slate-400 mb-1.5 uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full bg-ocean-900/90 border border-electric/20 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/30 transition-all ${
            error ? 'border-critical/60 focus:border-critical' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-critical font-mono">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
