import React from 'react';

export interface ProgressProps {
  value: number; // 0 to 100
  color?: string;
  gradient?: boolean;
  height?: number;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  color = '#1683FF',
  gradient = true,
  height = 6,
  className = '',
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      className={`w-full rounded-full overflow-hidden bg-ocean-950/80 border border-electric/15 ${className}`}
      style={{ height }}
    >
      <div
        className={`h-full rounded-full transition-all duration-300 ${gradient ? 'ai-gradient' : ''}`}
        style={{
          width: `${clamped}%`,
          backgroundColor: gradient ? undefined : color,
        }}
      />
    </div>
  );
};
