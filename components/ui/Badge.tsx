import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'critical' | 'cyan' | 'purple' | 'demo' | 'live';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5 rounded font-mono',
    md: 'text-xs px-2.5 py-1 rounded-md font-mono font-medium',
  }[size];

  const variantStyles = {
    default: 'bg-ocean-700/60 text-slate-300 border border-electric/20',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    critical: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    cyan: 'bg-cyan/15 text-cyan border border-cyan/30',
    purple: 'bg-purple-ai/15 text-purple-ai border border-purple-ai/30',
    demo: 'bg-amber-500/15 text-amber-300 border border-amber-500/40 tracking-wider font-bold',
    live: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 tracking-wider font-bold',
  }[variant];

  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </span>
  );
};
