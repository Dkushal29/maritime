import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all rounded-lg cursor-pointer select-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5 font-semibold',
  }[size];

  const variantStyles = {
    primary: 'bg-electric hover:bg-electric-light text-white shadow-lg shadow-electric/20 border border-electric/40',
    secondary: 'bg-ocean-800 hover:bg-ocean-700 text-slate-100 border border-electric/15',
    outline: 'bg-transparent hover:bg-ocean-800 text-cyan border border-cyan/30 hover:border-cyan/60',
    ghost: 'bg-transparent hover:bg-ocean-800/60 text-slate-300 hover:text-white',
    gradient: 'ai-gradient text-white font-display font-bold shadow-lg shadow-electric/30 border border-white/15',
    danger: 'bg-critical/20 hover:bg-critical/30 text-critical border border-critical/30',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};
