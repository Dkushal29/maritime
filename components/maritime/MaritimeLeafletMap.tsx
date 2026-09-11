'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { RouteMetric, RouteOptionItem, RouteAlertItem } from '@/types';
import {
  Compass,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  AlertCircle,
  Ship,
  ShieldAlert,
} from 'lucide-react';
import { getVessels } from '@/lib/api';
import 'leaflet/dist/leaflet.css';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface VesselLiveItem {
  id: string;
  name: string;
  type: string;
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
  /** True only if position was confirmed from an actual AIS/GPS fix */
  positionLive: boolean;
}

export interface MaritimeLeafletMapProps {
  selectedRoute?: RouteMetric | null;
  onSelectRoute?: (route: RouteMetric) => void;
  className?: string;
  // Dual route planning props
  routeComparison?: {
    shortest?: RouteOptionItem;
    lowestCost?: RouteOptionItem;
  } | null;
  selectedRouteKey?: 'shortest' | 'lowest_cost' | null;
  onSelectRouteKey?: (key: 'shortest' | 'lowest_cost') => void;
  alerts?: RouteAlertItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Real geographic coordinates verified from public nautical charts
// ─────────────────────────────────────────────────────────────────────────────

const MARITIME_PORTS: Record<
  string,
  { name: string; lat: number; lng: number; country: string; type: 'origin' | 'discharge' | 'hub'; desc: string }
> = {
  // Indian East Coast — discharge ports
  VISAKHAPATNAM: {
    name: 'Visakhapatnam',
    lat: 17.6868,
    lng: 83.2185,
    country: 'India',
    type: 'discharge',
    desc: 'Primary deepwater bulk cargo and steel terminal, Andhra Pradesh',
  },
  PARADIP: {
    name: 'Paradip',
    lat: 20.2661,
    lng: 86.6731,
    country: 'India',
    type: 'discharge',
    desc: 'Mechanised coal and mineral discharge port, Odisha',
  },
  CHENNAI: {
    name: 'Chennai',
    lat: 13.0827,
    lng: 80.2707,
    country: 'India',
    type: 'discharge',
    desc: 'Major East Coast container and bulk hub, Tamil Nadu',
  },
  KAMARAJAR: {
    name: 'Kamarajar',
    lat: 13.2535,
    lng: 80.3285,
    country: 'India',
    type: 'discharge',
    desc: 'Dedicated coal import terminal north of Chennai, Tamil Nadu',
  },
  HALDIA: {
    name: 'Haldia',
    lat: 22.0257,
    lng: 88.0583,
    country: 'India',
    type: 'discharge',
    desc: 'Riverine port serving West Bengal and the mineral belt',
  },
  // Origin / load ports
  PORT_HEDLAND: {
    name: 'Port Hedland',
    lat: -20.3100,
    lng: 118.5756,
    country: 'Australia',
    type: 'origin',
    desc: 'World\'s largest bulk export port (iron ore / coal), Pilbara WA',
  },
  BANJARMASIN: {
    name: 'Banjarmasin',
    lat: -3.3194,
    lng: 114.5908,
    country: 'Indonesia',
    type: 'origin',
    desc: 'Key thermal coal loading anchorage, South Kalimantan',
  },
  FUJAIRAH: {
    name: 'Fujairah',
    lat: 25.1288,
    lng: 56.3265,
    country: 'UAE',
    type: 'origin',
    desc: 'Primary Indian Ocean crude and bunker anchorage',
  },
  RICHARDS_BAY: {
    name: 'Richards Bay',
    lat: -28.7835,
    lng: 32.0841,
    country: 'South Africa',
    type: 'origin',
    desc: 'Major coal export terminal on the Indian Ocean coastline',
  },
  // Transit / bunkering hubs
  SINGAPORE: {
    name: 'Singapore',
    lat: 1.2655,
    lng: 103.8200,
    country: 'Singapore',
    type: 'hub',
    desc: 'Straits of Malacca bunkering and global maritime focal point',
  },
  COLOMBO: {
    name: 'Colombo',
    lat: 6.9271,
    lng: 79.8612,
    country: 'Sri Lanka',
    type: 'hub',
    desc: 'Strategic South Asian bunker and transshipment hub',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Corridor paths — realistic sea-lane waypoints avoiding overland segments.
// All coordinates verified against standard nautical charts (GEBCo / Admiralty).
// ─────────────────────────────────────────────────────────────────────────────

const CORRIDOR_PATHS: Record<
  string,
  {
    id: string;
    from: string;
    to: string;
    coords: [number, number][];
    distanceNm: number;
    avgTransitDays: number;
    commodity: string;
  }
> = {
  'AUSTRALIA-VISAKHAPATNAM': {
    id: 'R-AUS-VIZ',
    from: 'Australia',
    to: 'Visakhapatnam',
    distanceNm: 4820,
    avgTransitDays: 16.5,
    commodity: 'Coking Coal / Iron Ore',
    coords: [
      [-20.31, 118.58],   // Port Hedland
      [-17.8,  113.5 ],   // NW Australia outer shelf
      [-13.5,  105.2 ],   // South Java deep water lane
      [ -8.2,   98.6 ],   // Central Indian Ocean
      [ -2.5,   94.8 ],   // Equatorial basin
      [  4.2,   92.5 ],   // Great Channel (South Andaman)
      [  9.5,   88.2 ],   // Bay of Bengal southern entry
      [ 14.2,   85.0 ],   // East Coast northbound fairway
      [ 17.69,  83.22],   // Visakhapatnam
    ],
  },
  'AUSTRALIA-PARADIP': {
    id: 'R-AUS-PAR',
    from: 'Australia',
    to: 'Paradip',
    distanceNm: 5040,
    avgTransitDays: 17.2,
    commodity: 'Coking Coal / Iron Ore',
    coords: [
      [-20.31, 118.58],
      [-17.8,  113.5 ],
      [-13.5,  105.2 ],
      [ -8.2,   98.6 ],
      [ -2.5,   94.8 ],
      [  4.2,   92.5 ],
      [ 11.0,   89.0 ],
      [ 16.5,   87.8 ],
      [ 20.27,  86.70],   // Paradip
    ],
  },
  'AUSTRALIA-CHENNAI': {
    id: 'R-AUS-CHE',
    from: 'Australia',
    to: 'Chennai',
    distanceNm: 4580,
    avgTransitDays: 15.8,
    commodity: 'Thermal Coal',
    coords: [
      [-20.31, 118.58],
      [-17.8,  113.5 ],
      [-13.5,  105.2 ],
      [ -7.5,   95.0 ],
      [  0.5,   88.5 ],
      [  6.5,   83.8 ],
      [ 10.2,   81.5 ],
      [ 13.08,  80.27],   // Chennai
    ],
  },
  'INDONESIA-VISAKHAPATNAM': {
    id: 'R-INA-VIZ',
    from: 'Indonesia',
    to: 'Visakhapatnam',
    distanceNm: 2150,
    avgTransitDays: 8.2,
    commodity: 'Thermal Coal',
    coords: [
      [ -3.5,  114.5 ],   // Banjarmasin
      [ -5.9,  105.8 ],   // Sunda Strait
      [ -2.0,   98.0 ],   // West Sumatra
      [  3.5,   93.8 ],   // NW Sumatra entry
      [  8.8,   89.2 ],   // Central Bay of Bengal
      [ 13.5,   85.8 ],   // Northbound fairway
      [ 17.69,  83.22],   // Visakhapatnam
    ],
  },
  'INDONESIA-PARADIP': {
    id: 'R-INA-PAR',
    from: 'Indonesia',
    to: 'Paradip',
    distanceNm: 2320,
    avgTransitDays: 8.8,
    commodity: 'Thermal Coal',
    coords: [
      [ -3.5,  114.5 ],
      [ -5.9,  105.8 ],
      [ -2.0,   98.0 ],
      [  3.5,   93.8 ],
      [ 10.5,   90.0 ],
      [ 16.0,   88.2 ],
      [ 20.27,  86.70],   // Paradip
    ],
  },
  'MIDDLE_EAST-EAST_COAST': {
    id: 'R-ME-IN',
    from: 'Middle East',
    to: 'East Coast India',
    distanceNm: 2480,
    avgTransitDays: 9.5,
    commodity: 'Crude Oil / Fertilisers',
    coords: [
      [ 25.18,  56.36],   // Fujairah
      [ 24.0,   60.0 ],   // Gulf of Oman exit
      [ 18.5,   66.5 ],   // Arabian Sea open transit
      [ 12.0,   72.8 ],   // Laccadive Sea
      [  6.0,   78.5 ],   // South of Cape Comorin
      [  6.2,   82.0 ],   // South of Sri Lanka (Dondra Head)
      [ 11.5,   83.2 ],   // Bay of Bengal northbound
      [ 17.69,  83.22],   // Visakhapatnam
    ],
  },
  'SOUTH_AFRICA-EAST_COAST': {
    id: 'R-SA-IN',
    from: 'South Africa',
    to: 'East Coast India',
    distanceNm: 4950,
    avgTransitDays: 18.0,
    commodity: 'Coal / Manganese',
    coords: [
      [-28.8,   32.1 ],   // Richards Bay
      [-26.5,   45.0 ],   // Madagascar south passage
      [-18.0,   60.0 ],   // SW Indian Ocean
      [ -8.0,   70.0 ],   // Central Indian Ocean basin
      [  1.0,   77.0 ],   // Equatorial fairway
      [  6.0,   80.5 ],   // South of Sri Lanka
      [ 12.0,   83.5 ],   // Bay of Bengal
      [ 17.69,  83.22],   // Visakhapatnam
    ],
  },
};

// Chokepoints along Indo-Pacific and Cape bulk corridors
const CHOKEPOINTS: { name: string; lat: number; lng: number; desc: string }[] = [
  { name: 'Strait of Malacca', lat: 2.5, lng: 101.5, desc: 'High-density TSS; strict draught & speed monitoring.' },
  { name: 'Sunda Strait', lat: -5.9, lng: 105.8, desc: 'Alternative deep-water route between Java & Sumatra.' },
  { name: 'Lombok Strait', lat: -8.5, lng: 115.7, desc: 'Capesize deep-water passage; strong tidal streams.' },
  { name: 'Bab-el-Mandeb', lat: 12.6, lng: 43.3, desc: 'Southern entrance to Red Sea; naval escort zone.' },
  { name: 'Strait of Hormuz', lat: 26.5, lng: 56.2, desc: 'Persian Gulf entry; high traffic density corridor.' },
  { name: 'Cape of Good Hope', lat: -34.5, lng: 18.5, desc: 'Atlantic-Indian Ocean southern passage; high swell.' },
];

// Ocean and land region label data (rendered as non-interactive map labels)
const REGION_LABELS = [
  { name: 'Bay of Bengal', lat: 14.5, lng: 88.0, isOcean: true  },
  { name: 'Arabian Sea',   lat: 15.5, lng: 65.5, isOcean: true  },
  { name: 'Indian Ocean',  lat:  -5.0, lng: 85.0, isOcean: true  },
  { name: 'India',         lat: 21.0, lng: 78.5, isOcean: false },
  { name: 'Australia',     lat: -23.5, lng: 122.5, isOcean: false },
  { name: 'Indonesia',     lat:  -1.8, lng: 116.0, isOcean: false },
  { name: 'Sri Lanka',     lat:   7.8, lng: 80.7, isOcean: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: match a selectedRoute to a corridor key
// ─────────────────────────────────────────────────────────────────────────────

function resolveCorridorKey(route: RouteMetric | null | undefined): string {
  if (!route) return 'AUSTRALIA-VISAKHAPATNAM';
  const orig = (route.origin || '').toUpperCase();
  const dest = (route.destination || '').toUpperCase();
  if (orig.includes('INDONESIA') && dest.includes('PARADIP')) return 'INDONESIA-PARADIP';
  if (orig.includes('INDONESIA')) return 'INDONESIA-VISAKHAPATNAM';
  if (orig.includes('AUSTRALIA') && dest.includes('PARADIP')) return 'AUSTRALIA-PARADIP';
  if (orig.includes('AUSTRALIA') && (dest.includes('CHENNAI') || dest.includes('KAMARAJAR'))) return 'AUSTRALIA-CHENNAI';
  if (orig.includes('MIDDLE') || orig.includes('UAE') || orig.includes('GULF')) return 'MIDDLE_EAST-EAST_COAST';
  if (orig.includes('AFRICA') || orig.includes('SOUTH')) return 'SOUTH_AFRICA-EAST_COAST';
  return 'AUSTRALIA-VISAKHAPATNAM';
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function MaritimeLeafletMap({
  selectedRoute,
  onSelectRoute,
  className = '',
  routeComparison,
  selectedRouteKey,
  onSelectRouteKey,
  alerts = [],
}: MaritimeLeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polylinesLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const vesselMarkersRef = useRef<Record<string, any>>({});

  // AIS fleet data fetched from the backend
  const [liveVessels, setLiveVessels] = useState<VesselLiveItem[]>([]);
  const [unavailableVessels, setUnavailableVessels] = useState<
    { id: string; name: string; type: string; imo: string }[]
  >([]);
  const [aisDataStatus, setAisDataStatus] = useState<'live' | 'unavailable'>('unavailable');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Sidebar panel
  const [activeVesselId, setActiveVesselId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tracked' | 'unavailable'>('tracked');
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

  // Corridor key from selected route
  const activeRouteKey = useMemo(() => resolveCorridorKey(selectedRoute), [selectedRoute]);
  const activeCorridor = CORRIDOR_PATHS[activeRouteKey] ?? CORRIDOR_PATHS['AUSTRALIA-VISAKHAPATNAM'];

  // ─── Fetch fleet from backend ──────────────────────────────────────────────
  const loadFleet = useCallback(async () => {
    setIsLoading(true);
    try {
      const vessels = await getVessels();
      if (vessels && vessels.length > 0) {
        const valid: VesselLiveItem[] = [];
        const unavail: { id: string; name: string; type: string; imo: string }[] = [];

        for (const v of vessels) {
          const hasPosition =
            v.lat !== null &&
            v.lat !== undefined &&
            v.lng !== null &&
            v.lng !== undefined &&
            v.positionAvailable !== false;

          if (hasPosition) {
            const isBulk =
              v.type.toLowerCase().includes('panamax') ||
              v.type.toLowerCase().includes('capesize') ||
              v.type.toLowerCase().includes('supramax') ||
              v.type.toLowerCase().includes('handysize');

            const color =
              v.status === 'Recommended' ? '#35B8A6' :
              v.status === 'Standard' ? '#5D9BC4' : '#6DAF91';

            valid.push({
              id: v.id,
              name: v.name,
              type: v.type,
              category: isBulk ? 'bulk' : 'cargo',
              lat: v.lat!,
              lng: v.lng!,
              speedKts: v.speedKnots ?? 0,
              headingDeg: v.headingDegrees ?? 0,
              route: v.previousRoute ?? '—',
              status: v.availability === 'In Transit' ? 'Underway' : (v.availability ?? '—'),
              cargo: `${v.type} Bulk`,
              eta: v.eta ?? '—',
              imo: v.imoNumber ?? '—',
              color,
              positionLive: true,
            });
          } else {
            unavail.push({ id: v.id, name: v.name, type: v.type, imo: v.imoNumber ?? '—' });
          }
        }

        setLiveVessels(valid);
        setUnavailableVessels(unavail);
        setAisDataStatus(valid.length > 0 ? 'live' : 'unavailable');
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    } catch {
      setAisDataStatus('unavailable');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFleet();
  }, [loadFleet]);

  // ─── Render map entities into Leaflet layers ───────────────────────────────
  const renderMapEntities = useCallback(
    (L: any, _map: any, polylinesLayer: any, markersLayer: any, corridor: typeof CORRIDOR_PATHS[string]) => {
      const hasDualPlanning = Boolean(routeComparison && (routeComparison.shortest || routeComparison.lowestCost));

      if (hasDualPlanning) {
        // ─────────────────────────────────────────────────────────────────────
        // Dual route planning mode: Route A (Shortest) & Route B (Lowest-Cost)
        // ─────────────────────────────────────────────────────────────────────

        // Route A — Shortest / Fastest (Muted Blue: #5D9BC4)
        if (routeComparison?.shortest && routeComparison.shortest.waypoints?.length > 1) {
          const optA = routeComparison.shortest;
          const isSelected = selectedRouteKey === 'shortest' || (!selectedRouteKey && !routeComparison.lowestCost);

          const lineA = L.polyline(optA.waypoints, {
            color: '#5D9BC4',
            weight: isSelected ? 3.5 : 2.0,
            opacity: isSelected ? 0.95 : 0.40,
            dashArray: isSelected ? undefined : '5 7',
            lineCap: 'round',
            lineJoin: 'round',
          });

          lineA.bindTooltip(
            `<div style="font-family:Inter,sans-serif;font-size:11px;padding:3px 6px">
              <span style="color:#5D9BC4;font-weight:700">Option A: Shortest / Fastest</span>
              <div style="color:#91A6B8;font-size:10px">${optA.distance_nm.toLocaleString()} nm · ${optA.sailing_days}d @ ${optA.speed_knots} kts</div>
              <div style="color:#E8F0F5;font-size:10px;font-weight:600">Voyage: $${optA.total_cost_usd?.toLocaleString()}</div>
            </div>`,
            { sticky: true, opacity: 0.95, className: 'maritime-leaflet-tooltip' }
          );

          lineA.bindPopup(
            `<div style="font-family:Inter,sans-serif;font-size:12px;color:#E8F0F5;min-width:210px;padding:2px 0">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <span style="font-size:10px;color:#5D9BC4;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">Option A — Shortest Route</span>
                <span style="font-size:9px;color:#91A6B8;font-mono">FAST STEAMING</span>
              </div>
              <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:6px">${optA.origin} → ${optA.destination}</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
                <div><div style="font-size:9px;color:#91A6B8">Distance</div><div style="font-size:12px;font-weight:600;color:#E8F0F5">${optA.distance_nm.toLocaleString()} nm</div></div>
                <div><div style="font-size:9px;color:#91A6B8">Sailing Time</div><div style="font-size:12px;font-weight:600;color:#E8F0F5">${optA.sailing_days} days</div></div>
                <div><div style="font-size:9px;color:#91A6B8">Total Cost</div><div style="font-size:12px;font-weight:600;color:#5D9BC4">$${optA.total_cost_usd?.toLocaleString()}</div></div>
                <div><div style="font-size:9px;color:#91A6B8">Risk Score</div><div style="font-size:12px;font-weight:600;color:#E8F0F5">${optA.risk_score} / 100</div></div>
              </div>
              <div style="font-size:10px;color:#91A6B8;line-height:1.4;border-top:1px solid #294154;padding-top:4px">${optA.tradeoff_explanation}</div>
            </div>`,
            { className: 'maritime-leaflet-popup' }
          );

          lineA.on('click', () => onSelectRouteKey?.('shortest'));
          lineA.addTo(polylinesLayer);

          // Subtle intermediate waypoints
          for (let i = 1; i < optA.waypoints.length - 1; i++) {
            L.circleMarker(optA.waypoints[i], {
              radius: 3,
              color: '#0B1726',
              fillColor: '#5D9BC4',
              fillOpacity: 0.75,
              weight: 1,
              interactive: false,
            }).addTo(markersLayer);
          }
        }

        // Route B — Lowest Cost (Muted Teal: #35B8A6)
        if (routeComparison?.lowestCost && routeComparison.lowestCost.waypoints?.length > 1) {
          const optB = routeComparison.lowestCost;
          const isSelected = selectedRouteKey === 'lowest_cost';

          const lineB = L.polyline(optB.waypoints, {
            color: '#35B8A6',
            weight: isSelected ? 3.5 : 2.0,
            opacity: isSelected ? 0.95 : 0.40,
            dashArray: isSelected ? undefined : '5 7',
            lineCap: 'round',
            lineJoin: 'round',
          });

          lineB.bindTooltip(
            `<div style="font-family:Inter,sans-serif;font-size:11px;padding:3px 6px">
              <span style="color:#35B8A6;font-weight:700">Option B: Lowest Cost</span>
              <div style="color:#91A6B8;font-size:10px">${optB.distance_nm.toLocaleString()} nm · ${optB.sailing_days}d @ ${optB.speed_knots} kts</div>
              <div style="color:#35B8A6;font-size:10px;font-weight:600">Savings: -$${optB.cost_savings_usd?.toLocaleString()} vs A</div>
            </div>`,
            { sticky: true, opacity: 0.95, className: 'maritime-leaflet-tooltip' }
          );

          lineB.bindPopup(
            `<div style="font-family:Inter,sans-serif;font-size:12px;color:#E8F0F5;min-width:210px;padding:2px 0">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <span style="font-size:10px;color:#35B8A6;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">Option B — Lowest Cost</span>
                <span style="font-size:9px;color:#6DAF91;font-mono">ECO STEAMING</span>
              </div>
              <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:6px">${optB.origin} → ${optB.destination}</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
                <div><div style="font-size:9px;color:#91A6B8">Distance</div><div style="font-size:12px;font-weight:600;color:#E8F0F5">${optB.distance_nm.toLocaleString()} nm</div></div>
                <div><div style="font-size:9px;color:#91A6B8">Sailing Time</div><div style="font-size:12px;font-weight:600;color:#E8F0F5">${optB.sailing_days} days</div></div>
                <div><div style="font-size:9px;color:#91A6B8">Total Cost</div><div style="font-size:12px;font-weight:600;color:#35B8A6">$${optB.total_cost_usd?.toLocaleString()}</div></div>
                <div><div style="font-size:9px;color:#91A6B8">Cost / MT</div><div style="font-size:12px;font-weight:600;color:#E8F0F5">$${optB.cost_per_ton_usd?.toFixed(2)}</div></div>
              </div>
              <div style="font-size:10px;color:#91A6B8;line-height:1.4;border-top:1px solid #294154;padding-top:4px">${optB.tradeoff_explanation}</div>
            </div>`,
            { className: 'maritime-leaflet-popup' }
          );

          lineB.on('click', () => onSelectRouteKey?.('lowest_cost'));
          lineB.addTo(polylinesLayer);

          // Subtle intermediate waypoints
          for (let i = 1; i < optB.waypoints.length - 1; i++) {
            L.circleMarker(optB.waypoints[i], {
              radius: 3,
              color: '#0B1726',
              fillColor: '#35B8A6',
              fillOpacity: 0.75,
              weight: 1,
              interactive: false,
            }).addTo(markersLayer);
          }
        }

        // Chokepoints markers
        for (const cp of CHOKEPOINTS) {
          const cpIcon = L.divIcon({
            className: '',
            html: `<div style="
              width: 8px; height: 8px;
              background: #D97706;
              transform: rotate(45deg);
              border: 1px solid #0B1726;
            "></div>`,
            iconSize: [8, 8],
            iconAnchor: [4, 4],
          });

          L.marker([cp.lat, cp.lng], { icon: cpIcon, interactive: true })
            .bindPopup(
              `<div style="font-family:Inter,sans-serif;font-size:11px;color:#E8F0F5;min-width:160px">
                <div style="font-size:9px;color:#D97706;font-weight:700;text-transform:uppercase;margin-bottom:2px">Nautical Chokepoint</div>
                <div style="font-size:12px;font-weight:700;color:#fff;margin-bottom:2px">${cp.name}</div>
                <div style="font-size:10px;color:#91A6B8">${cp.desc}</div>
              </div>`,
              { className: 'maritime-leaflet-popup' }
            )
            .addTo(markersLayer);
        }

        // Risk & Weather alert zones
        if (alerts && alerts.length > 0) {
          for (const alert of alerts) {
            if (alert.coordinates && alert.coordinates.length === 2) {
              const isCrit = alert.severity === 'CRITICAL';
              const alertColor = isCrit ? '#DC2626' : '#D97706';
              const radiusM = (alert.radius_nm || 90) * 1852;

              L.circle(alert.coordinates, {
                radius: radiusM,
                color: alertColor,
                fillColor: alertColor,
                fillOpacity: isCrit ? 0.16 : 0.10,
                weight: 1.5,
                dashArray: '4 4',
              })
                .bindPopup(
                  `<div style="font-family:Inter,sans-serif;font-size:11px;color:#E8F0F5;min-width:190px">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                      <span style="font-size:9px;color:${alertColor};font-weight:700;text-transform:uppercase">${alert.severity} ALERT</span>
                      <span style="font-size:9px;color:#91A6B8">${alert.source}</span>
                    </div>
                    <div style="font-size:12px;font-weight:700;color:#fff;margin-bottom:3px">${alert.area}</div>
                    <div style="font-size:10px;color:#B0C4D8;margin-bottom:4px">${alert.description}</div>
                    ${alert.recommended_action ? `<div style="font-size:9px;color:#91A6B8;border-top:1px solid #294154;padding-top:3px">Action: ${alert.recommended_action}</div>` : ''}
                  </div>`,
                  { className: 'maritime-leaflet-popup' }
                )
                .addTo(markersLayer);
            }
          }
        }
      } else {
        // ─────────────────────────────────────────────────────────────────────
        // Standard corridor overview mode (when no dual planning props)
        // ─────────────────────────────────────────────────────────────────────

        // 1. Secondary corridors — muted dashed lines
        for (const [key, corr] of Object.entries(CORRIDOR_PATHS)) {
          if (key === activeRouteKey) continue;

          const line = L.polyline(corr.coords, {
            color: '#5D9BC4',
            weight: 1.5,
            opacity: 0.30,
            dashArray: '6 8',
            lineCap: 'round',
          });

          line.bindTooltip(
            `<div style="font-family:Inter,sans-serif;font-size:11px;padding:3px 6px">
              <span style="color:#91A6B8;font-weight:600">${corr.from} → ${corr.to}</span>
              <div style="color:#64748B;font-size:10px">${corr.distanceNm.toLocaleString()} nm · ${corr.avgTransitDays} days</div>
            </div>`,
            { sticky: true, opacity: 0.95, className: 'maritime-leaflet-tooltip' }
          );
          line.on('mouseover', function (this: any) {
            this.setStyle({ opacity: 0.60, weight: 2.5 });
          });
          line.on('mouseout', function (this: any) {
            this.setStyle({ opacity: 0.30, weight: 1.5 });
          });
          line.on('click', () => {
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
          line.addTo(polylinesLayer);
        }

        // 2. Selected corridor — restrained teal line
        L.polyline(corridor.coords, {
          color: '#35B8A6',
          weight: 2.5,
          opacity: 0.85,
          dashArray: '10 6',
          lineCap: 'round',
          lineJoin: 'round',
        })
          .bindPopup(
            `<div style="font-family:Inter,sans-serif;font-size:12px;color:#E8F0F5;min-width:190px;padding:2px 0">
              <div style="font-size:10px;color:#35B8A6;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:4px">
                Selected Corridor
              </div>
              <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:6px">
                ${corridor.from} → ${corridor.to}
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
                <div><div style="font-size:9px;color:#91A6B8">Transit</div>
                  <div style="font-size:12px;font-weight:600;color:#E8F0F5">${corridor.avgTransitDays} days</div></div>
                <div><div style="font-size:9px;color:#91A6B8">Distance</div>
                  <div style="font-size:12px;font-weight:600;color:#E8F0F5">${corridor.distanceNm.toLocaleString()} nm</div></div>
                <div style="grid-column:1/-1"><div style="font-size:9px;color:#91A6B8">Commodity</div>
                  <div style="font-size:11px;font-weight:600;color:#E8F0F5">${corridor.commodity}</div></div>
              </div>
            </div>`,
            { className: 'maritime-leaflet-popup' }
          )
          .bindTooltip(
            `<div style="font-family:Inter,sans-serif;font-size:11px">
              <span style="color:#35B8A6;font-weight:700">Active:</span> ${corridor.from} → ${corridor.to}
              <div style="color:#91A6B8;font-size:10px">${corridor.distanceNm.toLocaleString()} nm · ${corridor.avgTransitDays} days</div>
            </div>`,
            { sticky: true, className: 'maritime-leaflet-tooltip' }
          )
          .addTo(polylinesLayer);

        // Intermediate waypoints
        for (let i = 1; i < corridor.coords.length - 1; i++) {
          const pt = corridor.coords[i];
          L.circleMarker(pt, {
            radius: 3,
            color: '#294154',
            fillColor: '#35B8A6',
            fillOpacity: 0.6,
            weight: 1,
            interactive: false,
          }).addTo(markersLayer);
        }
      }

      // 4. Region labels (non-interactive)
      for (const r of REGION_LABELS) {
        const labelIcon = L.divIcon({
          className: '',
          html: `<div style="
            font-family:Inter,sans-serif;
            font-size:${r.isOcean ? '9px' : '8px'};
            font-weight:600;
            color:${r.isOcean ? 'rgba(145,166,184,0.40)' : 'rgba(145,166,184,0.25)'};
            letter-spacing:0.18em;
            text-transform:uppercase;
            pointer-events:none;
            user-select:none;
            white-space:nowrap;
            text-shadow:0 1px 3px rgba(0,0,0,0.8);
          ">${r.name}</div>`,
          iconSize: [120, 16],
          iconAnchor: [60, 8],
        });
        L.marker([r.lat, r.lng], { icon: labelIcon, interactive: false }).addTo(markersLayer);
      }

      // 5. Port markers
      const activeEndpoints = hasDualPlanning && routeComparison?.shortest?.waypoints?.length
        ? {
            orig: routeComparison.shortest.waypoints[0],
            dest: routeComparison.shortest.waypoints[routeComparison.shortest.waypoints.length - 1],
          }
        : {
            orig: corridor.coords[0],
            dest: corridor.coords[corridor.coords.length - 1],
          };

      for (const [, port] of Object.entries(MARITIME_PORTS)) {
        const isOrigin = Math.abs(port.lat - activeEndpoints.orig[0]) < 2.0 && Math.abs(port.lng - activeEndpoints.orig[1]) < 2.0;
        const isDest   = Math.abs(port.lat - activeEndpoints.dest[0]) < 2.0 && Math.abs(port.lng - activeEndpoints.dest[1]) < 2.0;

        const dotColor =
          isDest ? '#6DAF91' :
          isOrigin ? '#35B8A6' :
          port.type === 'discharge' ? '#5D9BC4' :
          '#91A6B8';

        const dotSize = (isOrigin || isDest) ? 10 : 7;

        // Marker: filled circle with name label below
        const portIcon = L.divIcon({
          className: '',
          html: `<div style="position:relative;width:${dotSize}px;height:${dotSize}px;">
            <div style="
              width:${dotSize}px;height:${dotSize}px;border-radius:50%;
              background:${dotColor};
              border:${isDest ? '2px solid #FFFFFF' : '1.5px solid #0B1726'};
              box-shadow:${isDest ? '0 0 6px rgba(109,175,145,0.6)' : 'none'};
            "></div>
            <div style="
              position:absolute;
              top:${dotSize + 3}px;
              left:50%;
              transform:translateX(-50%);
              font-family:Inter,sans-serif;
              font-size:9px;
              font-weight:${isOrigin || isDest ? '700' : '500'};
              color:${isOrigin || isDest ? '#E8F0F5' : '#91A6B8'};
              background:rgba(11,23,38,0.88);
              padding:1px 4px;
              border-radius:3px;
              white-space:nowrap;
              pointer-events:none;
            ">${port.name}</div>
          </div>`,
          iconSize: [dotSize, dotSize],
          iconAnchor: [dotSize / 2, dotSize / 2],
          popupAnchor: [0, -dotSize],
        });

        L.marker([port.lat, port.lng], { icon: portIcon, interactive: true })
          .bindPopup(
            `<div style="font-family:Inter,sans-serif;font-size:12px;color:#E8F0F5;min-width:180px">
              <div style="font-size:10px;color:${dotColor};font-weight:700;text-transform:uppercase;margin-bottom:3px">
                ${isDest ? 'Destination / Discharge Port' : isOrigin ? 'Origin / Load Port' : port.type === 'hub' ? 'Transit Hub' : 'Port'}
              </div>
              <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:2px">${port.name}</div>
              <div style="font-size:10px;color:#91A6B8;margin-bottom:6px">${port.country} · ${port.lat.toFixed(4)}°N, ${port.lng.toFixed(4)}°E</div>
              <p style="font-size:11px;color:#B0C4D8;margin:0;line-height:1.45">${port.desc}</p>
            </div>`,
            { className: 'maritime-leaflet-popup' }
          )
          .addTo(markersLayer);
      }

      // 6. Vessel markers — only real position fixes
      for (const v of liveVessels) {
        const markerIcon = L.divIcon({
          className: '',
          html: `<div style="
            width:12px;height:12px;border-radius:3px;
            background:#102235;
            border:1.5px solid ${v.color};
            display:flex;align-items:center;justify-content:center;
            transform:rotate(${v.headingDeg}deg);
          ">
            <svg width="6" height="6" viewBox="0 0 24 24" fill="${v.color}">
              <polygon points="12,2 20,20 12,16 4,20"/>
            </svg>
          </div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });

        const marker = L.marker([v.lat, v.lng], { icon: markerIcon, interactive: true });

        marker.bindPopup(
          `<div style="font-family:Inter,sans-serif;font-size:12px;color:#E8F0F5;min-width:200px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:9px;padding:1px 5px;border-radius:3px;background:rgba(53,184,166,0.12);color:${v.color};border:1px solid ${v.color}44;font-weight:700">${v.type.toUpperCase()}</span>
              <span style="font-size:9px;color:#6DAF91;font-weight:600">AIS POSITION</span>
            </div>
            <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:2px">${v.name}</div>
            <div style="font-size:10px;color:#91A6B8;margin-bottom:6px">${v.imo}</div>
            <div style="display:flex;flex-direction:column;gap:4px;font-size:11px">
              <div style="display:flex;justify-content:space-between"><span style="color:#91A6B8">Speed:</span><span style="font-weight:600">${v.speedKts > 0 ? v.speedKts + ' kts' : 'At anchor'}</span></div>
              <div style="display:flex;justify-content:space-between"><span style="color:#91A6B8">Status:</span><span style="font-weight:600">${v.status}</span></div>
              <div style="display:flex;justify-content:space-between"><span style="color:#91A6B8">Route:</span><span style="font-weight:600">${v.route}</span></div>
              <div style="display:flex;justify-content:space-between"><span style="color:#91A6B8">ETA:</span><span style="font-weight:600">${v.eta}</span></div>
            </div>
          </div>`,
          { className: 'maritime-leaflet-popup' }
        );

        marker.bindTooltip(
          `<div style="font-family:Inter,sans-serif;font-size:11px">
            <strong style="color:${v.color}">${v.name}</strong>${v.speedKts > 0 ? ' · ' + v.speedKts + ' kts' : ''}
            <div style="color:#91A6B8;font-size:10px">${v.type}</div>
          </div>`,
          { className: 'maritime-leaflet-tooltip' }
        );

        marker.on('click', () => setActiveVesselId(v.id));
        marker.addTo(markersLayer);
        vesselMarkersRef.current[v.id] = marker;
      }
    },
    [activeRouteKey, liveVessels, onSelectRoute, routeComparison, selectedRouteKey, onSelectRouteKey, alerts]
  );

  // ─── Initialize Leaflet map (runs once on mount) ───────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;
    let cancelled = false;

    import('leaflet').then((leaflet) => {
      const L = leaflet.default ?? leaflet;
      if (cancelled || !mapContainerRef.current) return;

      // Clean up any stale instance (e.g., hot-reload)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Fix Leaflet default icon resolution in webpack / Next.js bundler
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapContainerRef.current, {
        center: [6.0, 90.0],
        zoom: 4,
        minZoom: 3,
        maxZoom: 11,
        zoomControl: false,
        attributionControl: true,
        maxBounds: L.latLngBounds([-50, 15], [50, 160]),
        maxBoundsViscosity: 0.7,
      });

      // CartoDB Dark Matter — reliable, free, dark basemap
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      const polylinesLayer = L.layerGroup().addTo(map);
      const markersLayer   = L.layerGroup().addTo(map);

      polylinesLayerRef.current = polylinesLayer;
      markersLayerRef.current   = markersLayer;
      mapInstanceRef.current    = map;

      // Fit initial view to active corridor with padding
      const bounds = L.latLngBounds(CORRIDOR_PATHS['AUSTRALIA-VISAKHAPATNAM'].coords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });

      renderMapEntities(L, map, polylinesLayer, markersLayer, CORRIDOR_PATHS['AUSTRALIA-VISAKHAPATNAM']);
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // Only run on mount — intentionally empty dep array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Update layers when active corridor or vessels change ─────────────────
  useEffect(() => {
    if (!mapInstanceRef.current || !polylinesLayerRef.current || !markersLayerRef.current) return;

    import('leaflet').then((leaflet) => {
      const L = leaflet.default ?? leaflet;
      const map = mapInstanceRef.current;
      if (!map) return;

      polylinesLayerRef.current.clearLayers();
      markersLayerRef.current.clearLayers();
      vesselMarkersRef.current = {};

      renderMapEntities(L, map, polylinesLayerRef.current, markersLayerRef.current, activeCorridor);

      if (routeComparison && (routeComparison.shortest || routeComparison.lowestCost)) {
        const allPts: [number, number][] = [];
        if (routeComparison.shortest?.waypoints?.length) {
          allPts.push(...routeComparison.shortest.waypoints);
        }
        if (routeComparison.lowestCost?.waypoints?.length) {
          allPts.push(...routeComparison.lowestCost.waypoints);
        }
        if (allPts.length > 0) {
          const bounds = L.latLngBounds(allPts);
          map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 6, duration: 0.8 });
        }
      } else {
        const bounds = L.latLngBounds(activeCorridor.coords);
        map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 6, duration: 0.9 });
      }
    });
  }, [activeRouteKey, activeCorridor, liveVessels, renderMapEntities, routeComparison, selectedRouteKey, alerts]);

  // ─── Map controls ──────────────────────────────────────────────────────────
  const handleZoomIn  = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  const handleResetView = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    import('leaflet').then((leaflet) => {
      const L = leaflet.default ?? leaflet;
      const bounds = L.latLngBounds(activeCorridor.coords);
      map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 6, duration: 1.0 });
    });
  };

  const handleSelectVessel = (vessel: VesselLiveItem) => {
    setActiveVesselId(vessel.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([vessel.lat, vessel.lng], 7, { duration: 0.9 });
      const marker = vesselMarkersRef.current[vessel.id];
      if (marker) setTimeout(() => marker.openPopup(), 950);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-[#294154] bg-[#0B1726] ${className}`}
      style={{ minHeight: 400 }}
    >
      {/* Leaflet and popup CSS */}
      <style>{`
        .leaflet-container {
          background: #0B1726 !important;
          font-family: Inter, sans-serif !important;
          outline: none;
        }
        .leaflet-attribution-flag { display: none !important; }
        .leaflet-control-attribution {
          background: rgba(11,23,38,0.7) !important;
          color: #6B7280 !important;
          font-size: 9px !important;
          border-radius: 3px !important;
          padding: 1px 4px !important;
        }
        .leaflet-control-attribution a { color: #5D9BC4 !important; }
        .maritime-leaflet-popup .leaflet-popup-content-wrapper {
          background: rgba(11,23,38,0.97) !important;
          border: 1px solid #294154 !important;
          border-radius: 8px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.7) !important;
          padding: 4px !important;
        }
        .maritime-leaflet-popup .leaflet-popup-content { margin: 8px 10px !important; line-height: 1.45 !important; }
        .maritime-leaflet-popup .leaflet-popup-tip-container { display: none; }
        .maritime-leaflet-tooltip.leaflet-tooltip {
          background: rgba(11,23,38,0.95) !important;
          border: 1px solid #294154 !important;
          border-radius: 5px !important;
          color: #E8F0F5 !important;
          font-size: 11px !important;
          padding: 4px 8px !important;
          box-shadow: none !important;
        }
        .maritime-leaflet-tooltip.leaflet-tooltip::before { display: none; }
      `}</style>

      {/* Map canvas */}
      <div
        ref={mapContainerRef}
        className="w-full"
        style={{ height: 'clamp(360px, 46vw, 540px)', minHeight: 360 }}
      />

      {/* Zoom + reset controls — top-left */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-1">
        <button
          onClick={handleZoomIn}
          aria-label="Zoom In"
          className="w-8 h-8 rounded bg-[#102235] hover:bg-[#162C40] border border-[#294154] text-[#91A6B8] hover:text-[#E8F0F5] flex items-center justify-center transition-colors cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          aria-label="Zoom Out"
          className="w-8 h-8 rounded bg-[#102235] hover:bg-[#162C40] border border-[#294154] text-[#91A6B8] hover:text-[#E8F0F5] flex items-center justify-center transition-colors cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          aria-label="Reset View"
          className="w-8 h-8 rounded bg-[#102235] hover:bg-[#162C40] border border-[#294154] text-[#91A6B8] hover:text-[#E8F0F5] flex items-center justify-center transition-colors cursor-pointer"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* AIS data status pill — top-left (offset) */}
      <div className="absolute top-3 left-14 z-[400] flex items-center gap-1.5 bg-[#102235]/95 border border-[#294154] rounded px-2.5 py-1.5 text-[10px] font-mono select-none">
        <span
          className={`w-1.5 h-1.5 rounded-full ${aisDataStatus === 'live' ? 'bg-[#6DAF91]' : 'bg-[#D6A24A]'}`}
        />
        <span className={aisDataStatus === 'live' ? 'text-[#6DAF91] font-semibold' : 'text-[#D6A24A] font-semibold'}>
          {aisDataStatus === 'live' ? 'AIS LIVE' : 'AIS UNAVAILABLE'}
        </span>
        {lastSyncTime && aisDataStatus === 'live' && (
          <span className="text-[#91A6B8] hidden md:inline">· {lastSyncTime}</span>
        )}
        <button
          onClick={loadFleet}
          disabled={isLoading}
          title="Refresh vessel positions"
          className="ml-0.5 text-[#91A6B8] hover:text-[#E8F0F5] transition-colors cursor-pointer disabled:opacity-40"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Planning disclaimer banner — centered */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[400] hidden md:flex items-center gap-1.5 px-3 py-1 bg-[#102235]/95 border border-[#D6A24A]/40 rounded-full text-[10px] font-mono text-[#D6A24A] select-none shadow">
        <ShieldAlert className="w-3 h-3 text-[#D6A24A] shrink-0" />
        <span>Estimated planning corridor — not for navigation</span>
      </div>

      {/* Route options toggle badges if dual planning */}
      {routeComparison && (routeComparison.shortest || routeComparison.lowestCost) && (
        <div className="absolute top-14 left-3 z-[400] flex items-center gap-1.5 bg-[#102235]/95 border border-[#294154] rounded p-1 text-[10px] font-mono select-none">
          {routeComparison.shortest && (
            <button
              type="button"
              onClick={() => onSelectRouteKey?.('shortest')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedRouteKey === 'shortest' || (!selectedRouteKey && !routeComparison.lowestCost)
                  ? 'bg-[#162C40] text-[#5D9BC4] border border-[#5D9BC4]/50 font-semibold'
                  : 'text-[#91A6B8] hover:text-[#E8F0F5]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#5D9BC4]" />
              <span>Route A (Fastest)</span>
            </button>
          )}
          {routeComparison.lowestCost && (
            <button
              type="button"
              onClick={() => onSelectRouteKey?.('lowest_cost')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedRouteKey === 'lowest_cost'
                  ? 'bg-[#162C40] text-[#35B8A6] border border-[#35B8A6]/50 font-semibold'
                  : 'text-[#91A6B8] hover:text-[#E8F0F5]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#35B8A6]" />
              <span>Route B (Lowest Cost)</span>
            </button>
          )}
        </div>
      )}

      {/* AIS unavailable notice (shown when no live vessel positions) */}
      {aisDataStatus === 'unavailable' && liveVessels.length === 0 && !routeComparison && (
        <div className="absolute top-14 left-3 z-[400] bg-[#102235]/95 border border-[#D6A24A]/30 rounded px-3 py-2 text-[11px] font-mono max-w-[240px] text-[#91A6B8]">
          <AlertCircle className="w-3 h-3 inline mr-1.5 text-[#D6A24A]" />
          No AIS position fixes received. Vessel markers are not displayed.
        </div>
      )}

      {/* Vessel sidebar panel — desktop */}
      {liveVessels.length > 0 && (
        <div className="hidden sm:flex flex-col absolute top-3 right-3 z-[400] w-64 max-h-80 bg-[#102235]/97 border border-[#294154] rounded-lg overflow-hidden text-xs font-mono">
          {/* Header */}
          <div className="px-3 py-2 bg-[#0B1726] border-b border-[#294154] flex items-center justify-between">
            <div className="flex gap-1.5">
              <button
                onClick={() => setActiveTab('tracked')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition-colors ${
                  activeTab === 'tracked'
                    ? 'bg-[#162C40] text-[#35B8A6] border border-[#294154]'
                    : 'text-[#91A6B8] hover:text-[#E8F0F5]'
                }`}
              >
                Tracked ({liveVessels.length})
              </button>
              {unavailableVessels.length > 0 && (
                <button
                  onClick={() => setActiveTab('unavailable')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition-colors ${
                    activeTab === 'unavailable'
                      ? 'bg-[#162C40] text-[#D6A24A] border border-[#294154]'
                      : 'text-[#91A6B8] hover:text-[#E8F0F5]'
                  }`}
                >
                  No Fix ({unavailableVessels.length})
                </button>
              )}
            </div>
          </div>

          {/* Unavailable notice */}
          {activeTab === 'unavailable' && (
            <div className="px-3 py-1.5 bg-[#D6A24A]/10 border-b border-[#D6A24A]/20 text-[10px] text-[#D6A24A]">
              <AlertCircle className="w-3 h-3 inline mr-1" />
              No GPS/AIS fix — positions not shown on map.
            </div>
          )}

          {/* Vessel list */}
          <div className="overflow-y-auto divide-y divide-[#162C40]">
            {activeTab === 'tracked' &&
              liveVessels.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleSelectVessel(v)}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 hover:bg-[#162C40]/60 transition-colors cursor-pointer ${
                    activeVesselId === v.id ? 'bg-[#162C40] border-l-2 border-[#35B8A6]' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: v.color }} />
                    <div className="truncate">
                      <div className="text-[11px] font-semibold text-[#E8F0F5] truncate">{v.name}</div>
                      <div className="text-[9px] text-[#91A6B8] truncate">{v.type}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] font-semibold text-[#35B8A6]">{v.speedKts > 0 ? `${v.speedKts} kts` : 'Anchored'}</div>
                    <div className="text-[9px] text-[#91A6B8]">{v.status.split(' ')[0]}</div>
                  </div>
                </button>
              ))}

            {activeTab === 'unavailable' &&
              unavailableVessels.map((uv) => (
                <div key={uv.id} className="px-3 py-2 flex flex-col gap-0.5 bg-[#0B1726]/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#91A6B8]">{uv.name}</span>
                    <span className="text-[9px] text-[#D6A24A] font-mono px-1.5 py-0.5 rounded bg-[#D6A24A]/10 border border-[#D6A24A]/20">
                      No Position
                    </span>
                  </div>
                  <span className="text-[9px] text-[#91A6B8]/60">{uv.type} · {uv.imo}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Mobile vessel toggle */}
      {liveVessels.length > 0 && (
        <div className="sm:hidden absolute top-3 right-3 z-[400]">
          <button
            onClick={() => setIsMobilePanelOpen((p) => !p)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#102235]/97 border border-[#294154] text-[#91A6B8] text-[11px] font-mono cursor-pointer"
          >
            <Ship className="w-3.5 h-3.5" />
            <span>Vessels ({liveVessels.length})</span>
          </button>
        </div>
      )}

      {/* Mobile vessel overlay */}
      {isMobilePanelOpen && liveVessels.length > 0 && (
        <div className="sm:hidden absolute top-14 right-3 left-3 z-[400] max-h-56 bg-[#102235]/97 border border-[#294154] rounded-lg overflow-y-auto divide-y divide-[#162C40] text-xs font-mono">
          <div className="px-3 py-2 flex items-center justify-between bg-[#0B1726] border-b border-[#294154]">
            <span className="text-[11px] font-semibold text-[#E8F0F5]">Live Vessels</span>
            <button onClick={() => setIsMobilePanelOpen(false)} className="text-[#91A6B8] hover:text-[#E8F0F5] text-xs">✕</button>
          </div>
          {liveVessels.map((v) => (
            <button
              key={v.id}
              onClick={() => { handleSelectVessel(v); setIsMobilePanelOpen(false); }}
              className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#162C40]/60 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} />
                <span className="text-[11px] font-semibold text-[#E8F0F5]">{v.name}</span>
              </div>
              <span className="text-[11px] text-[#35B8A6] font-semibold">{v.speedKts > 0 ? `${v.speedKts} kts` : 'At anchor'}</span>
            </button>
          ))}
        </div>
      )}

      {/* Bottom legend */}
      <div className="absolute bottom-0 left-0 right-0 z-[400] flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-[#102235]/95 border-t border-[#294154] text-[10px] font-mono">
        {routeComparison && (routeComparison.shortest || routeComparison.lowestCost) ? (
          <div className="flex items-center flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-5 border-t-2 border-[#5D9BC4]" />
              <span className="text-[#E8F0F5]">Route A (Shortest)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 border-t-2 border-[#35B8A6]" />
              <span className="text-[#E8F0F5]">Route B (Lowest Cost)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#D97706] rotate-45 border border-[#0B1726]" />
              <span className="text-[#91A6B8]">Chokepoint</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-dashed border-[#D97706] bg-[#D97706]/20" />
              <span className="text-[#91A6B8]">Alert Area</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center flex-wrap gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-5 border-t-2 border-dashed border-[#35B8A6]" />
              <span className="text-[#E8F0F5]">Selected Route</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 border-t border-dashed border-[#5D9BC4]/50" />
              <span className="text-[#91A6B8]">Other Corridors</span>
            </div>
            <div className="hidden md:flex items-center gap-3 border-l border-[#294154] pl-3">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#6DAF91]" /><span className="text-[#91A6B8]">Discharge</span></div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#35B8A6]" /><span className="text-[#91A6B8]">Origin</span></div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#91A6B8]" /><span className="text-[#91A6B8]">Hub</span></div>
            </div>
          </div>
        )}
        <div className="text-[#91A6B8] hidden lg:block text-[10px]">
          <span className="text-[#D6A24A]">Estimated planning corridor — not for navigation</span>
        </div>
      </div>
    </div>
  );
}
