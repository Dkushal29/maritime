import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'glassBright' | 'interactive';
  glow?: 'none' | 'electric' | 'cyan' | 'success';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'glass',
  glow = 'none',
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-ocean-900 border border-electric/15 rounded-xl',
    glass: 'glass rounded-xl',
    glassBright: 'glass-bright rounded-xl',
    interactive: 'glass rounded-xl hover:border-electric/40 transition-all duration-200 cursor-pointer',
  }[variant];

  const glowStyles = {
    none: '',
    electric: 'glow-electric',
    cyan: 'glow-cyan',
    success: 'glow-success',
  }[glow];

  return (
    <div className={`${variantStyles} ${glowStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};
