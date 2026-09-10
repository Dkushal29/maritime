import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeId,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap gap-1.5 p-1 bg-ocean-950/80 rounded-xl border border-electric/15 ${className}`}>
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              active
                ? 'bg-electric text-white shadow-md shadow-electric/25 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-ocean-800/60'
            }`}
          >
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                active ? 'bg-white/20 text-white' : 'bg-ocean-800 text-cyan'
              }`}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
