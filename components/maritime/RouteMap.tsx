import React from 'react';

export interface RouteMapProps {
  highlightPort?: string;
  onSelectPort?: (portName: string) => void;
  className?: string;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  highlightPort = 'VIZAG',
  onSelectPort,
  className = '',
}) => {
  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-ocean-950/90 border border-electric/15 ${className}`}
      style={{ height: 280 }}
    >
      <svg
        viewBox="0 0 200 120"
        className="w-full h-full"
        style={{ opacity: 0.95 }}
      >
        <defs>
          <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ocean dots grid */}
        {Array.from({ length: 40 }, (_, i) =>
          Array.from({ length: 24 }, (_, j) => (
            <circle
              key={`${i}-${j}`}
              cx={i * 5 + 2.5}
              cy={j * 5 + 2.5}
              r={0.3}
              fill="#1683FF"
              opacity={0.18}
            />
          ))
        )}

        {/* Continents (Simplified Geo Shapes) */}
        {/* Europe */}
        <path d="M90 18 L100 15 L108 18 L110 25 L105 28 L95 27 L88 22 Z" fill="#0F2D50" stroke="#1683FF" strokeWidth="0.3" opacity={0.75}/>
        {/* Africa */}
        <path d="M95 30 L105 28 L108 38 L105 55 L100 60 L94 55 L90 40 Z" fill="#0F2D50" stroke="#1683FF" strokeWidth="0.3" opacity={0.75}/>
        {/* Asia */}
        <path d="M108 14 L140 12 L155 20 L155 35 L145 42 L130 40 L115 35 L110 25 Z" fill="#0F2D50" stroke="#1683FF" strokeWidth="0.3" opacity={0.75}/>
        {/* India peninsula */}
        <path d="M129 38 L135 40 L132 52 L128 52 L125 43 Z" fill="#123B67" stroke="#22D3EE" strokeWidth="0.6" opacity={0.95}/>
        {/* Australia */}
        <path d="M148 58 L165 56 L168 68 L162 75 L148 73 L142 65 Z" fill="#0F2D50" stroke="#1683FF" strokeWidth="0.3" opacity={0.75}/>
        {/* Americas */}
        <path d="M32 15 L55 15 L60 35 L55 65 L45 80 L38 70 L30 45 L28 25 Z" fill="#0F2D50" stroke="#1683FF" strokeWidth="0.3" opacity={0.75}/>
        {/* Indonesia */}
        <path d="M148 48 L162 46 L165 50 L155 52 L148 50 Z" fill="#0F2D50" stroke="#1683FF" strokeWidth="0.3" opacity={0.75}/>

        {/* Shipping Routes to India East Coast */}
        {/* Australia -> Vizag */}
        <path
          d="M155 65 Q145 55 131 50"
          stroke="#22D3EE"
          strokeWidth="0.9"
          fill="none"
          strokeDasharray="3 2"
          filter="url(#routeGlow)"
          className="route-animated"
        />
        {/* Indonesia -> Paradip */}
        <path
          d="M156 49 Q148 46 132 48"
          stroke="#8B5CF6"
          strokeWidth="0.8"
          fill="none"
          strokeDasharray="3 2"
          filter="url(#routeGlow)"
          className="route-animated"
        />
        {/* Middle East -> India */}
        <path
          d="M115 35 Q122 40 130 47"
          stroke="#F59E0B"
          strokeWidth="0.8"
          fill="none"
          strokeDasharray="3 2"
          className="route-animated"
        />
        {/* Africa -> India */}
        <path
          d="M100 52 Q112 50 128 50"
          stroke="#10B981"
          strokeWidth="0.8"
          fill="none"
          strokeDasharray="3 2"
          className="route-animated"
        />
        {/* Brazil/Atlantic -> India */}
        <path
          d="M48 60 Q75 55 128 50"
          stroke="#94A3B8"
          strokeWidth="0.6"
          fill="none"
          strokeDasharray="3 2"
          opacity={0.5}
        />

        {/* Port Nodes - India East Coast */}
        {/* Paradip */}
        <g
          className="cursor-pointer"
          onClick={() => onSelectPort && onSelectPort('PARADIP')}
        >
          <circle cx="133" cy="46" r="2.2" fill="#22D3EE" className="port-pulse"/>
          <text x="135.5" y="45" style={{ fontSize: 3.2, fill: '#22D3EE', fontFamily: 'monospace', fontWeight: 600 }}>Paradip</text>
        </g>
        {/* Vizag (Highlighted) */}
        <g
          className="cursor-pointer"
          onClick={() => onSelectPort && onSelectPort('VIZAG')}
        >
          <circle cx="132" cy="49" r="2.8" fill="#1683FF" className="port-pulse"/>
          <circle cx="132" cy="49" r="4.5" fill="none" stroke="#22D3EE" strokeWidth="0.4" className="animate-ping" opacity={0.6}/>
          <text x="134.5" y="49" style={{ fontSize: 3.4, fill: '#38BDF8', fontFamily: 'monospace', fontWeight: 700 }}>Vizag</text>
        </g>
        {/* Chennai */}
        <g
          className="cursor-pointer"
          onClick={() => onSelectPort && onSelectPort('CHENNAI')}
        >
          <circle cx="129" cy="53" r="2.2" fill="#22D3EE" className="port-pulse"/>
          <text x="131" y="53.5" style={{ fontSize: 3.2, fill: '#22D3EE', fontFamily: 'monospace' }}>Chennai</text>
        </g>

        {/* Origin Trade Hubs */}
        <circle cx="155" cy="65" r="2.8" fill="#10B981" className="port-pulse"/>
        <text x="157" y="64" style={{ fontSize: 3.2, fill: '#10B981', fontFamily: 'monospace', fontWeight: 600 }}>Australia (Coal)</text>
        <circle cx="158" cy="49" r="2.4" fill="#8B5CF6" className="port-pulse"/>
        <text x="160.5" y="48" style={{ fontSize: 3.2, fill: '#8B5CF6', fontFamily: 'monospace' }}>Indonesia</text>
        <circle cx="115" cy="35" r="2.4" fill="#F59E0B" className="port-pulse"/>
        <text x="110" y="34" style={{ fontSize: 3.2, fill: '#F59E0B', fontFamily: 'monospace' }}>M.East</text>
      </svg>

      {/* Corridor Legend Overlay */}
      <div className="absolute bottom-2.5 left-3 right-3 flex flex-wrap gap-2 pointer-events-none">
        {[
          { label: 'Australia → Vizag', color: '#22D3EE' },
          { label: 'Indonesia → Paradip', color: '#8B5CF6' },
          { label: 'Middle East Corridor', color: '#F59E0B' },
          { label: 'South Africa Route', color: '#10B981' },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-ocean-950/80 border border-electric/15 text-[9px] font-mono text-slate-300 backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
