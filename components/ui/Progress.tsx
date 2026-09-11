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
  color = '#35B8A6',
  gradient = false,
  height = 6,
  className = '',
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      className={`w-full rounded-sm overflow-hidden bg-[#0B1726] border border-[#294154] ${className}`}
      style={{ height }}
    >
      <div
        className="h-full transition-all duration-300"
        style={{
          width: `${clamped}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
};
