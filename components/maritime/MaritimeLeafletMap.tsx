'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { RouteMetric } from '@/types';
import { Anchor, Compass, Eye, Maximize2, Navigation, Ship, ZoomIn, ZoomOut } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Type definitions
export interface VesselLiveItem {
  id: string;
  name: string;
  type: 'Bulk Carrier' | 'Container Ship' | 'Tanker' | 'Cargo Vessel';
  category: 'bulk' | 'container' | 'tanker' | 'cargo';
  lat: number;
  lng: number;
  speedKts: number;
  headingDeg: number;
  route: string;
  status: string;
  cargo: string;
  eta: string;
  imo: string;
  color: string;
}

export interface MaritimeLeafletMapProps {
  selectedRoute?: RouteMetric | null;
  onSelectRoute?: (route: RouteMetric) => void;
  className?: string;
}

// Deterministic live vessels along Indo-Pacific corridors
const LIVE_VESSELS: VesselLiveItem[] = [
  {
    id: 'V-01',
    name: 'MV Pacific Trader',
    type: 'Bulk Carrier',
    category: 'bulk',
    lat: 2.5,
    lng: 95.2,
    speedKts: 12.4,
    headingDeg: 340,
    route: 'Australia → Visakhapatnam',
    status: 'Underway Laden',
    cargo: 'Coking Coal (78,000 MT)',
    eta: '6.2 Days',
    imo: 'IMO 9845120',
    color: '#00F0FF',
  },
  {
    id: 'V-02',
    name: 'Ocean Voyager',
    type: 'Container Ship',
    category: 'container',
    lat: 9.8,
    lng: 86.5,
    speedKts: 14.2,
    headingDeg: 295,
    route: 'Singapore → Chennai',
    status: 'Underway',
    cargo: 'Containerized (4,200 TEU)',
    eta: '1.8 Days',
    imo: 'IMO 9762314',
    color: '#3B82F6',
  },
  {
    id: 'V-03',
    name: 'Eastern Star',
    type: 'Tanker',
    category: 'tanker',
    lat: 14.2,
    lng: 70.5,
    speedKts: 13.1,
    headingDeg: 125,
    route: 'Fujairah → Paradip',
    status: 'Underway Laden',
    cargo: 'Crude Oil (105,000 MT)',
    eta: '4.1 Days',
    imo: 'IMO 9631109',
    color: '#EC4899',
  },
  {
    id: 'V-04',
    name: 'Coral Breeze',
    type: 'Bulk Carrier',
    category: 'bulk',
    lat: -9.5,
    lng: 107.0,
    speedKts: 11.8,
    headingDeg: 310,
    route: 'Port Hedland → Paradip',
    status: 'Underway Laden',
    cargo: 'Iron Ore (82,000 MT)',
    eta: '9.5 Days',
    imo: 'IMO 9812401',
    color: '#00F0FF',
  },
  {
    id: 'V-05',
    name: 'Indo Marine',
    type: 'Container Ship',
    category: 'container',
    lat: 5.2,
    lng: 94.2,
    speedKts: 15.6,
    headingDeg: 320,
    route: 'Port Klang → Visakhapatnam',
    status: 'Underway',
    cargo: 'Steel & Industrial Spares',
    eta: '2.9 Days',
    imo: 'IMO 9890123',
    color: '#3B82F6',
  },
  {
    id: 'V-06',
    name: 'Global Horizon',
    type: 'Cargo Vessel',
    category: 'cargo',
    lat: 15.8,
    lng: 84.2,
    speedKts: 10.5,
    headingDeg: 350,
    route: 'Indonesia → Visakhapatnam',
    status: 'Approaching Pilot Station',
    cargo: 'Thermal Coal (55,000 MT)',
    eta: '8 Hours',
    imo: 'IMO 9523412',
    color: '#10B981',
  },
  {
    id: 'V-07',
    name: 'Petro Atlantic',
    type: 'Tanker',
    category: 'tanker',
    lat: 7.0,
    lng: 81.5,
    speedKts: 12.8,
    headingDeg: 35,
    route: 'Singapore → Haldia',
    status: 'Underway',
    cargo: 'VLSFO Bunker Fuel (42,000 MT)',
    eta: '3.4 Days',
    imo: 'IMO 9718892',
    color: '#EC4899',
  },
  {
    id: 'V-08',
    name: 'Southern Cross',
    type: 'Bulk Carrier',
    category: 'bulk',
    lat: -16.0,
    lng: 115.5,
    speedKts: 12.0,
    headingDeg: 315,
    route: 'Australia → Visakhapatnam',
    status: 'Underway Laden',
    cargo: 'Coking Coal (80,000 MT)',
    eta: '14.1 Days',
    imo: 'IMO 9794503',
    color: '#00F0FF',
  },
];

// Key ports with exact geographic coordinates
const MARITIME_PORTS: Record<string, { name: string; lat: number; lng: number; country: string; type: 'origin' | 'discharge' | 'hub'; desc: string }> = {
  PORT_HEDLAND: { name: 'Port Hedland', lat: -20.31, lng: 118.58, country: 'Australia', type: 'origin', desc: 'World premier bulk commodity port in Pilbara region' },
  VISAKHAPATNAM: { name: 'Visakhapatnam', lat: 17.69, lng: 83.22, country: 'India', type: 'discharge', desc: 'Primary deepwater bulk cargo & steel terminal on East Coast India' },
  PARADIP: { name: 'Paradip', lat: 20.27, lng: 86.70, country: 'India', type: 'discharge', desc: 'Mechanized coal and mineral discharge port, Odisha' },
  CHENNAI: { name: 'Chennai', lat: 13.08, lng: 80.27, country: 'India', type: 'discharge', desc: 'Major East Coast container & bulk hub, Tamil Nadu' },
  HALDIA: { name: 'Haldia', lat: 22.02, lng: 88.06, country: 'India', type: 'discharge', desc: 'Riverine cargo port servicing West Bengal & mineral belt' },
  INDONESIA: { name: 'Banjarmasin (Kalimantan)', lat: -3.5, lng: 114.5, country: 'Indonesia', type: 'origin', desc: 'Key thermal coal loading anchorage, South Kalimantan' },
  COLOMBO: { name: 'Colombo', lat: 6.93, lng: 79.86, country: 'Sri Lanka', type: 'hub', desc: 'Strategic South Asian bunker & transshipment hub' },
  SINGAPORE: { name: 'Singapore', lat: 1.29, lng: 103.85, country: 'Singapore', type: 'hub', desc: 'Straits of Malacca bunkering & global maritime focal point' },
  FUJAIRAH: { name: 'Fujairah / Arabian Gulf', lat: 25.18, lng: 56.36, country: 'UAE', type: 'origin', desc: 'Primary Indian Ocean crude & bunker anchorage' },
  RICHARDS_BAY: { name: 'Richards Bay', lat: -28.8, lng: 32.1, country: 'South Africa', type: 'origin', desc: 'Major coal export terminal on Indian Ocean coastline' },
};

// Ocean & Geographical Region Labels
const WATER_REGIONS = [
  { name: 'BAY OF BENGAL', lat: 14.5, lng: 88.0 },
  { name: 'ARABIAN SEA', lat: 15.5, lng: 65.5 },
  { name: 'INDIAN OCEAN', lat: -5.0, lng: 85.0 },
  { name: 'INDIA', lat: 21.0, lng: 78.5, isCountry: true },
  { name: 'AUSTRALIA', lat: -23.5, lng: 122.5, isCountry: true },
  { name: 'INDONESIA', lat: -1.8, lng: 116.0, isCountry: true },
  { name: 'SRI LANKA', lat: 7.8, lng: 80.7, isCountry: true },
];

// Defined realistic nautical sea-lane paths (avoiding overland lines)
const CORRIDOR_PATHS: Record<string, { id: string; from: string; to: string; coords: [number, number][]; distanceNm: number; avgTransitDays: number }> = {
  'AUSTRALIA-VISAKHAPATNAM': {
    id: 'R-AUS-VIZ',
    from: 'Australia',
    to: 'Visakhapatnam',
    distanceNm: 4820,
    avgTransitDays: 16.5,
    coords: [
      [-20.31, 118.58], // Port Hedland
      [-17.8, 113.5],   // NW Australia sea lane
      [-13.5, 105.2],   // South Java deep water
      [-8.2, 98.6],     // Indian Ocean open transit
      [-2.5, 94.8],     // Equatorial basin
      [4.2, 92.5],      // Great Channel approach (South Nicobar)
      [9.5, 88.2],      // Bay of Bengal southern entry
      [14.2, 85.0],      // East Coast fairway
      [17.69, 83.22],   // Visakhapatnam
    ],
  },
  'AUSTRALIA-PARADIP': {
    id: 'R-AUS-PAR',
    from: 'Australia',
    to: 'Paradip',
    distanceNm: 5040,
    avgTransitDays: 17.2,
    coords: [
      [-20.31, 118.58],
      [-17.8, 113.5],
      [-13.5, 105.2],
      [-8.2, 98.6],
      [-2.5, 94.8],
      [4.2, 92.5],
      [11.0, 89.0],
      [16.5, 87.8],
      [20.27, 86.70], // Paradip
    ],
  },
  'AUSTRALIA-CHENNAI': {
    id: 'R-AUS-CHE',
    from: 'Australia',
    to: 'Chennai',
    distanceNm: 4580,
    avgTransitDays: 15.8,
    coords: [
      [-20.31, 118.58],
      [-17.8, 113.5],
      [-13.5, 105.2],
      [-7.5, 95.0],
      [0.5, 88.5],
      [6.5, 83.8],
      [10.2, 81.5],
      [13.08, 80.27], // Chennai
    ],
  },
  'INDONESIA-VISAKHAPATNAM': {
    id: 'R-INA-VIZ',
    from: 'Indonesia',
    to: 'Visakhapatnam',
    distanceNm: 2150,
    avgTransitDays: 8.2,
    coords: [
      [-3.5, 114.5],   // Banjarmasin
      [-5.9, 105.8],   // Sunda Strait
      [-2.0, 98.0],    // West Sumatra Indian Ocean
      [3.5, 93.8],     // NW Sumatra entry
      [8.8, 89.2],     // Central Bay of Bengal
      [13.5, 85.8],    // Fairway
      [17.69, 83.22],  // Visakhapatnam
    ],
  },
  'INDONESIA-PARADIP': {
    id: 'R-INA-PAR',
    from: 'Indonesia',
    to: 'Paradip',
    distanceNm: 2320,
    avgTransitDays: 8.8,
    coords: [
      [-3.5, 114.5],
      [-5.9, 105.8],
      [-2.0, 98.0],
      [3.5, 93.8],
      [10.5, 90.0],
      [16.0, 88.2],
      [20.27, 86.70],
    ],
  },
  'MIDDLE_EAST-EAST_COAST': {
    id: 'R-ME-IN',
    from: 'Middle East',
    to: 'East Coast India',
    distanceNm: 2480,
    avgTransitDays: 9.5,
    coords: [
      [25.18, 56.36],  // Fujairah
      [24.0, 60.0],    // Gulf of Oman exit
      [18.5, 66.5],    // Arabian Sea open transit
      [12.0, 72.8],    // Laccadive Sea
      [6.0, 78.5],     // South of Cape Comorin
      [6.2, 82.0],     // South of Sri Lanka (Dondra Head)
      [11.5, 83.2],    // Bay of Bengal north-bound
      [17.69, 83.22],  // Visakhapatnam
    ],
  },
  'SOUTH_AFRICA-EAST_COAST': {
    id: 'R-SA-IN',
    from: 'South Africa',
    to: 'East Coast India',
    distanceNm: 4950,
    avgTransitDays: 18.0,
    coords: [
      [-28.8, 32.1],   // Richards Bay
      [-26.5, 45.0],   // Madagascar South passage
      [-18.0, 60.0],   // Southwest Indian Ocean
      [-8.0, 70.0],    // Central Indian Ocean basin
      [1.0, 77.0],     // Equatorial fairway
      [6.0, 80.5],     // South of Sri Lanka
      [12.0, 83.5],    // Bay of Bengal
      [17.69, 83.22],  // Visakhapatnam
    ],
  },
};

export default function MaritimeLeafletMap({
  selectedRoute,
  onSelectRoute,
  className = '',
}: MaritimeLeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const polylinesLayerRef = useRef<any>(null);
  const vesselMarkersRef = useRef<Record<string, any>>({});
  const [activeVesselId, setActiveVesselId] = useState<string | null>(null);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

  // Normalize selected route key
  const activeRouteKey = useMemo(() => {
    if (!selectedRoute) return 'AUSTRALIA-VISAKHAPATNAM';
    const orig = (selectedRoute.origin || '').toUpperCase();
    const dest = (selectedRoute.destination || '').toUpperCase();
    if (orig.includes('INDONESIA') && dest.includes('PARADIP')) return 'INDONESIA-PARADIP';
    if (orig.includes('INDONESIA')) return 'INDONESIA-VISAKHAPATNAM';
    if (orig.includes('AUSTRALIA') && dest.includes('PARADIP')) return 'AUSTRALIA-PARADIP';
    if (orig.includes('AUSTRALIA') && dest.includes('CHENNAI')) return 'AUSTRALIA-CHENNAI';
    if (orig.includes('MIDDLE')) return 'MIDDLE_EAST-EAST_COAST';
    if (orig.includes('AFRICA')) return 'SOUTH_AFRICA-EAST_COAST';
    return 'AUSTRALIA-VISAKHAPATNAM';
  }, [selectedRoute]);

  // Primary active corridor
  const activeCorridor = CORRIDOR_PATHS[activeRouteKey] || CORRIDOR_PATHS['AUSTRALIA-VISAKHAPATNAM'];

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let isSubscribed = true;
    let map: any = null;

    import('leaflet').then((L) => {
      if (!isSubscribed || !mapContainerRef.current) return;

      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Default bounds: Indo-Pacific shipping basin
      const defaultBounds = L.latLngBounds([-25, 48], [27, 126]);

      map = L.map(mapContainerRef.current, {
        center: [6.0, 88.0],
        zoom: 4,
        minZoom: 3,
        maxZoom: 10,
        zoomControl: false,
        attributionControl: false,
        maxBounds: L.latLngBounds([-45, 20], [45, 150]),
        maxBoundsViscosity: 0.8,
      });

      mapInstanceRef.current = map;

      // Dark Matter Carto Tile Layer (Reliable public dark basemap)
      const primaryTiles = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          subdomains: 'abcd',
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        }
      );

      primaryTiles.addTo(map);

      // Create dedicated LayerGroups for clean updates
      const polylinesLayer = L.layerGroup().addTo(map);
      const markersLayer = L.layerGroup().addTo(map);

      polylinesLayerRef.current = polylinesLayer;
      markersLayerRef.current = markersLayer;

      // Initial fit to active corridor
      const corridorBounds = L.latLngBounds(activeCorridor.coords);
      map.fitBounds(corridorBounds, { padding: [50, 50], maxZoom: 6 });

      // Draw all map entities
      renderMapEntities(L, map, polylinesLayer, markersLayer, activeCorridor);
    });

    return () => {
      isSubscribed = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run on mount

  // Update polylines and markers when active route changes
  useEffect(() => {
    if (!mapInstanceRef.current || !polylinesLayerRef.current || !markersLayerRef.current) return;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      const polylinesLayer = polylinesLayerRef.current;
      const markersLayer = markersLayerRef.current;

      polylinesLayer.clearLayers();
      markersLayer.clearLayers();
      vesselMarkersRef.current = {};

      renderMapEntities(L, map, polylinesLayer, markersLayer, activeCorridor);

      // Smoothly fit bounds to new corridor
      const corridorBounds = L.latLngBounds(activeCorridor.coords);
      map.flyToBounds(corridorBounds, { padding: [50, 50], maxZoom: 6, duration: 1.1 });
    });
  }, [activeRouteKey, activeCorridor]);

  // Main rendering helper for Leaflet layers
  const renderMapEntities = (
    L: any,
    map: any,
    polylinesLayer: any,
    markersLayer: any,
    primaryCorridor: typeof CORRIDOR_PATHS[string]
  ) => {
    // 1. Render Secondary Corridors (Muted Dashed)
    Object.entries(CORRIDOR_PATHS).forEach(([key, corr]) => {
      if (key === activeRouteKey) return; // Skip primary here

      const secondaryLine = L.polyline(corr.coords, {
        color: '#2563EB',
        weight: 2,
        opacity: 0.35,
        dashArray: '6, 8',
        lineCap: 'round',
      });

      // Hover feedback and tooltip
      secondaryLine.bindTooltip(
        `<div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; padding: 3px 6px;">
          <span style="color: #93C5FD; font-weight: 700;">${corr.from} → ${corr.to}</span>
          <div style="color: #64748B; font-size: 10px;">${corr.distanceNm.toLocaleString()} nm • ${corr.avgTransitDays} Days</div>
        </div>`,
        { sticky: true, opacity: 0.95, className: 'maritime-leaflet-tooltip' }
      );

      secondaryLine.on('mouseover', function (this: any) {
        this.setStyle({ color: '#60A5FA', opacity: 0.7, weight: 3 });
      });
      secondaryLine.on('mouseout', function (this: any) {
        this.setStyle({ color: '#2563EB', opacity: 0.35, weight: 2 });
      });

      // Clicking secondary route selects it
      secondaryLine.on('click', () => {
        if (onSelectRoute) {
          onSelectRoute({
            id: corr.id,
            origin: corr.from as any,
            destination: corr.to as any,
            avgFreightRate: 31.8,
            transitTimeDays: corr.avgTransitDays,
            avgTransitDays: corr.avgTransitDays,
            distanceNm: corr.distanceNm,
            portCongestionLevel: 'Low',
            vesselAvailabilityCount: 5,
            risk: 'LOW',
            riskLevel: 'LOW',
            estimatedLandedCostPerMt: 142.0,
            isRecommended: false,
            originCoords: corr.coords[0],
            destCoords: corr.coords[corr.coords.length - 1],
          });
        }
      });

      secondaryLine.addTo(polylinesLayer);
    });

    // 2. Render Primary Selected Route with Glowing Dual-Layer
    // Bottom Layer: Wide Glow
    const glowLine = L.polyline(primaryCorridor.coords, {
      color: '#00F0FF',
      weight: 9,
      opacity: 0.3,
      lineCap: 'round',
      lineJoin: 'round',
    });
    glowLine.addTo(polylinesLayer);

    // Top Layer: High-Contrast Animated Dashed Core
    const coreLine = L.polyline(primaryCorridor.coords, {
      color: '#22D3EE',
      weight: 3.5,
      opacity: 0.95,
      dashArray: '10, 8',
      className: 'leaflet-animated-route',
    });

    const routePopupContent = `
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #F8FAFC; min-width: 200px; padding: 4px 2px;">
        <div style="font-size: 9px; color: #22D3EE; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 3px;">
          ◆ SELECTED PRIORITY CORRIDOR
        </div>
        <div style="font-size: 14px; font-weight: 800; color: #FFFFFF; margin-bottom: 8px;">
          ${primaryCorridor.from} → ${primaryCorridor.to}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: rgba(15, 45, 80, 0.6); padding: 8px; border-radius: 8px; border: 1px solid rgba(34, 211, 238, 0.25);">
          <div>
            <div style="font-size: 9px; color: #94A3B8;">AVG TRANSIT</div>
            <div style="font-size: 12px; font-weight: 700; color: #22D3EE;">${primaryCorridor.avgTransitDays} Days</div>
          </div>
          <div>
            <div style="font-size: 9px; color: #94A3B8;">DISTANCE</div>
            <div style="font-size: 12px; font-weight: 700; color: #F8FAFC;">${primaryCorridor.distanceNm.toLocaleString()} nm</div>
          </div>
          <div>
            <div style="font-size: 9px; color: #94A3B8;">COMMODITY</div>
            <div style="font-size: 12px; font-weight: 700; color: #F8FAFC;">Coking Coal</div>
          </div>
          <div>
            <div style="font-size: 9px; color: #94A3B8;">VESSEL CLASS</div>
            <div style="font-size: 12px; font-weight: 700; color: #34D399;">Panamax</div>
          </div>
        </div>
      </div>
    `;

    coreLine.bindPopup(routePopupContent, { className: 'maritime-leaflet-popup' });
    coreLine.bindTooltip(
      `<div style="font-family: 'JetBrains Mono', monospace; font-size: 11px;">
        <span style="color: #22D3EE; font-weight: 800;">ACTIVE:</span> ${primaryCorridor.from} → ${primaryCorridor.to}
        <div style="color: #94A3B8; font-size: 10px;">${primaryCorridor.distanceNm.toLocaleString()} nm • ${primaryCorridor.avgTransitDays} Days</div>
      </div>`,
      { sticky: true, opacity: 0.95, className: 'maritime-leaflet-tooltip' }
    );

    coreLine.addTo(polylinesLayer);

    // 3. Render Intermediate Waypoints along the selected route
    primaryCorridor.coords.slice(1, -1).forEach((pt, i) => {
      const wpIcon = L.divIcon({
        className: 'custom-waypoint-marker',
        html: `
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #22D3EE; box-shadow: 0 0 8px #22D3EE; border: 1.5px solid #061525;"></div>
        `,
        iconSize: [8, 8],
        iconAnchor: [4, 4],
      });

      const wpMarker = L.marker(pt, { icon: wpIcon, interactive: true });
      wpMarker.bindTooltip(
        `<div style="font-family: 'JetBrains Mono'; font-size: 10px; color: #94A3B8;">Waypoint #${i + 1} (${pt[0].toFixed(1)}°, ${pt[1].toFixed(1)}°)</div>`,
        { className: 'maritime-leaflet-tooltip' }
      );
      wpMarker.addTo(markersLayer);
    });

    // 4. Render Regional Water Area & Continental Labels
    WATER_REGIONS.forEach((r) => {
      const labelIcon = L.divIcon({
        className: 'custom-region-label',
        html: `
          <div style="
            font-family: 'JetBrains Mono', monospace;
            font-size: ${r.isCountry ? '11px' : '10px'};
            font-weight: 800;
            color: ${r.isCountry ? 'rgba(148, 163, 184, 0.45)' : 'rgba(34, 211, 238, 0.35)'};
            letter-spacing: 0.16em;
            text-shadow: 0 0 8px rgba(0, 0, 0, 0.9);
            pointer-events: none;
            user-select: none;
            white-space: nowrap;
          ">
            ${r.name}
          </div>
        `,
        iconSize: [120, 20],
        iconAnchor: [60, 10],
      });

      L.marker([r.lat, r.lng], { icon: labelIcon, interactive: false }).addTo(markersLayer);
    });

    // 5. Render Port Nodes with Distinct Origin & Destination Styling
    const origCoord = primaryCorridor.coords[0];
    const destCoord = primaryCorridor.coords[primaryCorridor.coords.length - 1];

    Object.entries(MARITIME_PORTS).forEach(([_, port]) => {
      const isOrigin = Math.abs(port.lat - origCoord[0]) < 1.0 && Math.abs(port.lng - origCoord[1]) < 1.0;
      const isDest = Math.abs(port.lat - destCoord[0]) < 1.0 && Math.abs(port.lng - destCoord[1]) < 1.0;

      const portBorderColor = isDest ? '#10B981' : isOrigin ? '#00F0FF' : '#3B82F6';
      const portBgColor = isDest ? 'rgba(16, 185, 129, 0.25)' : isOrigin ? 'rgba(0, 240, 255, 0.25)' : 'rgba(11, 31, 54, 0.8)';
      const pulseRing = isDest || isOrigin ? `<div class="port-pulse-ring" style="border-color: ${portBorderColor};"></div>` : '';

      const portIcon = L.divIcon({
        className: 'custom-port-marker',
        html: `
          <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
            ${pulseRing}
            <div style="
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background: ${portBorderColor};
              border: 2px solid #061525;
              box-shadow: 0 0 10px ${portBorderColor};
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="width: 4px; height: 4px; border-radius: 50%; background: #FFFFFF;"></div>
            </div>
            <div style="
              position: absolute;
              top: 24px;
              left: 50%;
              transform: translateX(-50%);
              font-family: 'JetBrains Mono', monospace;
              font-size: 10px;
              font-weight: 700;
              color: ${isDest ? '#34D399' : isOrigin ? '#22D3EE' : '#CBD5E1'};
              background: rgba(6, 21, 37, 0.9);
              border: 1px solid ${portBorderColor}40;
              padding: 1px 5px;
              border-radius: 4px;
              white-space: nowrap;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6);
            ">
              ${port.name}
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const portMarker = L.marker([port.lat, port.lng], { icon: portIcon, interactive: true });

      portMarker.bindPopup(`
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #F8FAFC; min-width: 190px;">
          <div style="font-size: 9px; color: ${portBorderColor}; font-weight: 800; text-transform: uppercase; margin-bottom: 2px;">
            ◆ ${isDest ? 'DISCHARGE PORT' : isOrigin ? 'ORIGIN TERMINAL' : 'MARITIME HARBOR'}
          </div>
          <div style="font-size: 14px; font-weight: 800; color: #FFF; margin-bottom: 4px;">${port.name}</div>
          <div style="font-size: 11px; color: #94A3B8; margin-bottom: 8px;">${port.country} • Lat: ${port.lat.toFixed(2)}°, Lng: ${port.lng.toFixed(2)}°</div>
          <p style="font-size: 11px; color: #CBD5E1; margin: 0; line-height: 1.4;">${port.desc}</p>
        </div>
      `, { className: 'maritime-leaflet-popup' });

      portMarker.addTo(markersLayer);
    });

    // 6. Render Live Vessels with CSS DivIcons & Directional Indicators
    LIVE_VESSELS.forEach((v) => {
      const isBulker = v.category === 'bulk';
      const isContainer = v.category === 'container';
      const isTanker = v.category === 'tanker';
      const color = v.color;

      const vesselIcon = L.divIcon({
        className: `custom-vessel-marker vessel-${v.id}`,
        html: `
          <div class="vessel-badge-wrapper" style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <!-- Subtle Radar Ping Beacon -->
            <div class="vessel-ping" style="border-color: ${color};"></div>
            <!-- Vessel Body with Direction Arrow -->
            <div style="
              width: 18px;
              height: 18px;
              border-radius: 4px;
              background: #0B192C;
              border: 1.5px solid ${color};
              box-shadow: 0 0 8px ${color}88;
              display: flex;
              align-items: center;
              justify-content: center;
              transform: rotate(${v.headingDeg}deg);
            ">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="${color}">
                <polygon points="12,2 22,22 12,17 2,22" />
              </svg>
            </div>
            <!-- Status Dot -->
            <div style="position: absolute; top: -1px; right: -1px; width: 5px; height: 5px; border-radius: 50%; background: #10B981; border: 1px solid #061525;"></div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([v.lat, v.lng], { icon: vesselIcon, interactive: true });

      const vesselPopupContent = `
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #F8FAFC; min-width: 220px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 4px; background: ${color}22; color: ${color}; border: 1px solid ${color}44;">
              ${v.type.toUpperCase()}
            </span>
            <span style="font-size: 9px; color: #10B981; font-weight: 700; display: flex; align-items: center; gap: 4px;">
              <span style="width: 5px; height: 5px; border-radius: 50%; background: #10B981; display: inline-block;"></span>
              LIVE AIS
            </span>
          </div>

          <div style="font-size: 14px; font-weight: 800; color: #FFF; margin-bottom: 2px;">
            ${v.name}
          </div>
          <div style="font-size: 10px; color: #64748B; margin-bottom: 8px;">
            ${v.imo} • Heading ${v.headingDeg}°
          </div>

          <div style="display: flex; flex-direction: column; gap: 5px; background: rgba(15, 45, 80, 0.5); padding: 8px; border-radius: 6px; border: 1px solid rgba(34, 211, 238, 0.15);">
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span style="color: #94A3B8;">Speed:</span>
              <span style="font-weight: 700; color: #22D3EE;">${v.speedKts} knots</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span style="color: #94A3B8;">Route:</span>
              <span style="font-weight: 700; color: #F8FAFC;">${v.route}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span style="color: #94A3B8;">Cargo:</span>
              <span style="font-weight: 700; color: #CBD5E1;">${v.cargo}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span style="color: #94A3B8;">Status:</span>
              <span style="font-weight: 700; color: #34D399;">${v.status}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span style="color: #94A3B8;">Est. Arrival:</span>
              <span style="font-weight: 700; color: #F59E0B;">${v.eta}</span>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(vesselPopupContent, { className: 'maritime-leaflet-popup' });
      marker.bindTooltip(
        `<div style="font-family: 'JetBrains Mono', monospace; font-size: 11px;">
          <strong style="color: ${color}">${v.name}</strong> • ${v.speedKts} kts
          <div style="color: #94A3B8; font-size: 10px;">${v.type}</div>
        </div>`,
        { className: 'maritime-leaflet-tooltip' }
      );

      marker.addTo(markersLayer);
      vesselMarkersRef.current[v.id] = marker;
    });
  };

  // Zoom in handler
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  // Zoom out handler
  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  // Reset view to active corridor
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      const corridorBounds = (window as any).L?.latLngBounds(activeCorridor.coords) || [
        [-24, 50],
        [25, 125],
      ];
      mapInstanceRef.current.flyToBounds(corridorBounds, { padding: [50, 50], maxZoom: 6, duration: 1.0 });
    }
  };

  // Select vessel from live panel
  const handleSelectVessel = (vessel: VesselLiveItem) => {
    setActiveVesselId(vessel.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([vessel.lat, vessel.lng], 6, { duration: 1.0 });
      const marker = vesselMarkersRef.current[vessel.id];
      if (marker) {
        setTimeout(() => marker.openPopup(), 900);
      }
    }
  };

  return (
    <div className={`relative rounded-xl overflow-hidden border border-electric/25 bg-[#061525] shadow-2xl ${className}`}>
      {/* Embedded CSS for Leaflet Dark Customization */}
      <style jsx global>{`
        .leaflet-container {
          background-color: #061525 !important;
          font-family: 'Inter', sans-serif !important;
          outline: none;
        }
        .maritime-leaflet-popup .leaflet-popup-content-wrapper {
          background: rgba(11, 25, 44, 0.96) !important;
          border: 1px solid rgba(34, 211, 238, 0.35) !important;
          border-radius: 12px !important;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.85) !important;
          backdrop-filter: blur(12px) !important;
          padding: 6px !important;
        }
        .maritime-leaflet-popup .leaflet-popup-content {
          margin: 8px 10px !important;
          line-height: 1.4 !important;
        }
        .maritime-leaflet-popup .leaflet-popup-tip {
          background: #0B192C !important;
          border: 1px solid rgba(34, 211, 238, 0.35) !important;
        }
        .maritime-leaflet-tooltip {
          background: rgba(6, 21, 37, 0.95) !important;
          border: 1px solid rgba(34, 211, 238, 0.3) !important;
          border-radius: 6px !important;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.7) !important;
          color: #F8FAFC !important;
          padding: 4px 8px !important;
        }
        .maritime-leaflet-tooltip::before {
          border-top-color: rgba(34, 211, 238, 0.3) !important;
        }
        /* Animated Dash Stroke for Selected Route */
        @keyframes routeDashAnimation {
          to {
            stroke-dashoffset: -36;
          }
        }
        .leaflet-animated-route {
          animation: routeDashAnimation 2.2s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .leaflet-animated-route {
            animation: none !important;
          }
        }
        /* Port Pulse Ring */
        @keyframes portRingPulse {
          0% {
            transform: scale(0.6);
            opacity: 1;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
        .port-pulse-ring {
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1.5px solid #00F0FF;
          animation: portRingPulse 2.4s ease-out infinite;
          pointer-events: none;
        }
        /* Vessel Ping */
        @keyframes vesselPingPulse {
          0% {
            transform: scale(0.8);
            opacity: 0.9;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
        .vessel-ping {
          position: absolute;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid #00F0FF;
          animation: vesselPingPulse 2.8s ease-out infinite;
          pointer-events: none;
        }
      `}</style>

      {/* Map DOM Container */}
      <div
        ref={mapContainerRef}
        className="w-full relative z-0"
        style={{ height: '560px', minHeight: '440px' }}
      />

      {/* Top-Left Custom Navigation Controls */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          aria-label="Zoom In"
          className="w-8 h-8 rounded-lg bg-[#0B1A2F]/90 hover:bg-[#122D52] border border-cyan/30 text-cyan hover:text-white flex items-center justify-center shadow-lg backdrop-blur-md transition-all cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          aria-label="Zoom Out"
          className="w-8 h-8 rounded-lg bg-[#0B1A2F]/90 hover:bg-[#122D52] border border-cyan/30 text-cyan hover:text-white flex items-center justify-center shadow-lg backdrop-blur-md transition-all cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          aria-label="Reset View"
          title="Reset View to Active Corridor"
          className="w-8 h-8 rounded-lg bg-[#0B1A2F]/90 hover:bg-[#122D52] border border-cyan/30 text-cyan hover:text-white flex items-center justify-center shadow-lg backdrop-blur-md transition-all cursor-pointer"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Panel: Live Vessels Near Route (Top Right) */}
      <div className="hidden sm:block absolute top-4 right-4 z-[400] w-72 max-h-[380px] bg-[#0B192C]/92 border border-electric/30 rounded-xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden font-mono">
        {/* Panel Header */}
        <div className="px-3.5 py-2.5 bg-[#081220] border-b border-electric/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-100 tracking-wide">Live Vessels Near Route</span>
          </div>
          <span className="text-[10px] text-cyan bg-cyan/10 border border-cyan/25 px-1.5 py-0.2 rounded font-bold">
            {LIVE_VESSELS.length} Active
          </span>
        </div>

        {/* Vessel List */}
        <div className="overflow-y-auto divide-y divide-electric/10 max-h-[320px] text-xs">
          {LIVE_VESSELS.map((v) => {
            const isActive = activeVesselId === v.id;
            return (
              <button
                key={v.id}
                onClick={() => handleSelectVessel(v)}
                className={`w-full px-3 py-2 text-left transition-all hover:bg-ocean-800/60 flex items-center justify-between gap-2 cursor-pointer ${
                  isActive ? 'bg-cyan/10 border-l-2 border-cyan' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: v.color, boxShadow: `0 0 6px ${v.color}` }}
                  />
                  <div className="truncate">
                    <div className="font-bold text-slate-200 text-[11px] truncate">{v.name}</div>
                    <div className="text-[9px] text-slate-400 truncate">{v.type}</div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] font-bold text-cyan">{v.speedKts} kts</div>
                  <div className="text-[9px] text-slate-500">{v.status.split(' ')[0]}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Vessel Panel Toggle */}
      <div className="sm:hidden absolute top-4 right-4 z-[400]">
        <button
          onClick={() => setIsMobilePanelOpen(!isMobilePanelOpen)}
          className="px-2.5 py-1.5 rounded-lg bg-[#0B192C]/90 border border-electric/30 text-cyan text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md"
        >
          <Ship className="w-3.5 h-3.5" />
          <span>Vessels ({LIVE_VESSELS.length})</span>
        </button>
      </div>

      {/* Mobile Vessels Overlay */}
      {isMobilePanelOpen && (
        <div className="sm:hidden absolute top-14 right-4 left-4 z-[400] max-h-60 bg-[#0B192C]/96 border border-electric/30 rounded-xl shadow-2xl backdrop-blur-xl overflow-y-auto divide-y divide-electric/10 font-mono text-xs">
          <div className="px-3 py-2 bg-[#081220] flex items-center justify-between border-b border-electric/20">
            <span className="font-bold text-slate-200 text-xs">Live Vessels Near Route</span>
            <button
              onClick={() => setIsMobilePanelOpen(false)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
          {LIVE_VESSELS.map((v) => (
            <button
              key={v.id}
              onClick={() => {
                handleSelectVessel(v);
                setIsMobilePanelOpen(false);
              }}
              className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-ocean-800/60"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} />
                <span className="font-bold text-slate-200 text-[11px]">{v.name}</span>
                <span className="text-[9px] text-slate-400">({v.type})</span>
              </div>
              <span className="font-bold text-cyan text-[11px]">{v.speedKts} kts</span>
            </button>
          ))}
        </div>
      )}

      {/* Bottom Compact Map Legend */}
      <div className="absolute bottom-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-3 p-2.5 px-4 rounded-xl bg-[#081220]/90 border border-electric/20 backdrop-blur-md text-[11px] font-mono">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Selected Route */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 rounded bg-cyan shadow-[0_0_8px_#00F0FF]"></div>
            <span className="text-slate-200 font-bold">Selected Route</span>
          </div>

          {/* Other Corridors */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 border-t border-dashed border-blue-400"></div>
            <span className="text-slate-400">Other Corridors</span>
          </div>

          {/* Vessel Symbols */}
          <div className="hidden md:flex items-center gap-4 border-l border-electric/20 pl-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] shadow-[0_0_6px_#00F0FF]"></span>
              <span className="text-slate-300">Bulk Carrier</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shadow-[0_0_6px_#3B82F6]"></span>
              <span className="text-slate-300">Container Ship</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899] shadow-[0_0_6px_#EC4899]"></span>
              <span className="text-slate-300">Tanker</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_6px_#10B981]"></span>
              <span className="text-slate-300">Cargo Vessel</span>
            </div>
          </div>
        </div>

        {/* Active Corridor Live Details Pill */}
        <div className="text-[10px] text-slate-400 hidden lg:flex items-center gap-2">
          <span>Active: <strong className="text-cyan">{activeCorridor.from} → {activeCorridor.to}</strong></span>
          <span className="text-slate-600">•</span>
          <span>{activeCorridor.distanceNm.toLocaleString()} nm</span>
          <span className="text-slate-600">•</span>
          <span>{activeCorridor.avgTransitDays} Days</span>
        </div>
      </div>
    </div>
  );
}
