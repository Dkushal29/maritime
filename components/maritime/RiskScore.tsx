import React from 'react';

export interface RiskScoreProps {
  score?: number; // 0 to 100
  level: 'Low' | 'Medium' | 'High' | 'Critical';
  size?: 'sm' | 'md' | 'lg';
}

export const RiskScore: React.FC<RiskScoreProps> = ({
  score,
  level,
  size = 'md',
}) => {
  const colorMap = {
    Low: { text: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)' },
    Medium: { text: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)' },
    High: { text: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)' },
    Critical: { text: '#F43F5E', bg: 'rgba(244, 63, 94, 0.2)', border: 'rgba(244, 63, 94, 0.4)' },
  }[level];

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5 font-bold',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded font-mono font-semibold ${sizeStyles}`}
      style={{
        color: colorMap.text,
        backgroundColor: colorMap.bg,
        border: `1px solid ${colorMap.border}`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: colorMap.text }}
      />
      <span>{level.toUpperCase()} RISK</span>
      {score !== undefined && <span className="opacity-75">({score})</span>}
    </span>
  );
};
