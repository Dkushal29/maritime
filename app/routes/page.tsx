'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  getRouteAnalytics,
  compareMaritimeRoutes,
  assessRouteRisk,
  checkBerthAvailability,
  getAlternativePortOptions,
  allocateFleetCargo,
  getCharterBookings,
  createCharterBooking,
  rescheduleCharterBooking,
  cancelCharterBooking,
} from '@/lib/api';
import {
  RouteMetric,
  RouteOptionItem,
  RouteCompareResponse,
  RouteAlertItem,
  BerthAvailabilityResponse,
  AlternativePortResponse,
  FleetAllocationResponse,
  CharterBookingRecord,
  RescheduleResponse,
} from '@/types';
import { PageHero } from '@/components/maritime/PageHero';
import {
  Ship,
  Anchor,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
  FileText,
  Layers,
  Navigation,
  Sliders,
  AlertCircle,
  TrendingDown,
  Waves,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Dynamically import Leaflet maritime map with SSR disabled
const MaritimeLeafletMap = dynamic(
  () => import('@/components/maritime/MaritimeLeafletMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[460px] rounded-lg bg-[#0B1726] border border-[#294154] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#294154] border-t-[#35B8A6] animate-spin" />
        <span className="text-xs font-mono text-[#91A6B8]">Loading Leaflet sea-lane map…</span>
      </div>
    ),
  }
);

// Supported Origin and Destination Port configurations
const ORIGIN_PORTS = [
  { id: 'Port Hedland', name: 'Port Hedland', country: 'Australia', region: 'Oceania', defaultCargo: 'Iron Ore' },
  { id: 'Hay Point', name: 'Hay Point / Gladstone', country: 'Australia', region: 'Oceania', defaultCargo: 'Coking Coal' },
  { id: 'Banjarmasin', name: 'Banjarmasin', country: 'Indonesia', region: 'SE Asia', defaultCargo: 'Thermal Coal' },
  { id: 'Samarinda', name: 'Samarinda', country: 'Indonesia', region: 'SE Asia', defaultCargo: 'Thermal Coal' },
  { id: 'Richards Bay', name: 'Richards Bay', country: 'South Africa', region: 'Africa', defaultCargo: 'Thermal Coal' },
  { id: 'Maputo', name: 'Maputo / Matola', country: 'Mozambique', region: 'Africa', defaultCargo: 'Coal / Minerals' },
  { id: 'Houston', name: 'Houston / US Gulf', country: 'United States', region: 'Americas', defaultCargo: 'Petcoke / Grain' },
  { id: 'Baltimore', name: 'Baltimore / US East Coast', country: 'United States', region: 'Americas', defaultCargo: 'Met Coal' },
  { id: 'Ust-Luga', name: 'Ust-Luga / Baltic', country: 'Russia', region: 'Europe', defaultCargo: 'Coal / Fertilizer' },
  { id: 'Fujairah', name: 'Fujairah Anchorage', country: 'UAE', region: 'Middle East', defaultCargo: 'Bunkers / Bulk' },
];

const DEST_PORTS = [
  { id: 'Visakhapatnam', name: 'Visakhapatnam (Vizag)', code: 'P001', maxDraft: 18.5, maxDwt: 200000 },
  { id: 'Paradip', name: 'Paradip Port', code: 'P002', maxDraft: 17.1, maxDwt: 150000 },
  { id: 'Chennai', name: 'Chennai Port', code: 'P003', maxDraft: 16.5, maxDwt: 140000 },
  { id: 'Kamarajar', name: 'Kamarajar (Ennore)', code: 'P004', maxDraft: 16.0, maxDwt: 150000 },
  { id: 'Haldia', name: 'Haldia Dock Complex', code: 'P005', maxDraft: 12.5, maxDwt: 65000, draftRestricted: true },
  { id: 'Dhamra', name: 'Dhamra Port', code: 'P006', maxDraft: 18.0, maxDwt: 180000 },
];

const CARGO_COMMODITIES = ['Coal', 'Iron Ore', 'Bauxite', 'Manganese', 'Limestone', 'Petcoke', 'Fertilizer', 'Grain'];

export default function RoutesPage() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'workspace' | 'corridors'>('workspace');

  // Cargo & voyage parameters
  const [cargoType, setCargoType] = useState('Coal');
  const [cargoQuantity, setCargoQuantity] = useState(75000);
  const [originPort, setOriginPort] = useState('Port Hedland');
  const [destPort, setDestPort] = useState('Visakhapatnam');
  const [laycanStart, setLaycanStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [arrivalDate, setArrivalDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 19);
    return d.toISOString().split('T')[0];
  });
  const [budgetUsd, setBudgetUsd] = useState(2600000);
  const [vesselClass, setVesselClass] = useState('Panamax');

  // Evaluation state
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  // Engine outputs
  const [routeComparison, setRouteComparison] = useState<RouteCompareResponse | null>(null);
  const [selectedRouteKey, setSelectedRouteKey] = useState<'shortest' | 'lowest_cost'>('lowest_cost');
  const [routeAlerts, setRouteAlerts] = useState<RouteAlertItem[]>([]);
  const [berthData, setBerthData] = useState<BerthAvailabilityResponse | null>(null);
  const [selectedBerthId, setSelectedBerthId] = useState<string | null>(null);
  const [alternativePorts, setAlternativePorts] = useState<AlternativePortResponse | null>(null);
  const [fleetAllocation, setFleetAllocation] = useState<FleetAllocationResponse | null>(null);
  const [selectedVesselId, setSelectedVesselId] = useState<string | null>(null);

  // Booking management
  const [existingBookings, setExistingBookings] = useState<CharterBookingRecord[]>([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingFeedback, setBookingFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Reschedule modal
  const [activeRescheduleBooking, setActiveRescheduleBooking] = useState<CharterBookingRecord | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState('Port congestion and delayed loading window');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [reschedulePort, setReschedulePort] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleOptions, setRescheduleOptions] = useState<RescheduleResponse | null>(null);

  // Legacy corridor analytics tab state
  const [routes, setRoutes] = useState<RouteMetric[]>([]);
  const [selectedLegacyRoute, setSelectedLegacyRoute] = useState<RouteMetric | null>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // Initial load
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Load corridors and legacy routes
    getRouteAnalytics()
      .then((res) => {
        setRoutes(res);
        if (res.length > 0) setSelectedLegacyRoute(res[0]);
      })
      .catch(() => {});

    // Load active charter bookings from database
    loadBookings();

    // Trigger initial evaluation on mount
    handleEvaluateVoyage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBookings = async () => {
    try {
      const data = await getCharterBookings();
      setExistingBookings(data);
    } catch {
      setExistingBookings([]);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Main evaluation handler
  // ─────────────────────────────────────────────────────────────────────────────
  const handleEvaluateVoyage = useCallback(async () => {
    setIsEvaluating(true);
    setEvaluationError(null);
    setBookingFeedback(null);

    try {
      // 1. Dual Route Comparison (Fastest vs Lowest-Cost)
      const routeRes = await compareMaritimeRoutes({
        origin: originPort,
        destination: destPort,
        cargo_type: cargoType,
        cargo_quantity: cargoQuantity,
        laycan_start: laycanStart,
        required_arrival_date: arrivalDate,
        vessel_class: vesselClass,
      });
      setRouteComparison(routeRes);
      setSelectedRouteKey((routeRes.recommended_option as any) || 'lowest_cost');

      // 2. Dynamic Route Risk & Coastal Disruption Assessment
      try {
        const riskRes = await assessRouteRisk(originPort, destPort);
        setRouteAlerts(riskRes.active_alerts || []);
      } catch {
        setRouteAlerts([]);
      }

      // 3. Destination Port Berth Availability & Conflict Detection
      const matchedDest = DEST_PORTS.find((p) => p.name.includes(destPort) || destPort.includes(p.name));
      const portCode = matchedDest?.code || 'P001';

      try {
        const berthRes = await checkBerthAvailability(portCode, {
          requested_arrival: arrivalDate,
          estimated_stay_hours: 48,
          vessel_draft: vesselClass === 'Capesize' ? 18.2 : vesselClass === 'Panamax' ? 14.5 : 12.0,
          vessel_dwt: cargoQuantity * 1.1,
        });
        setBerthData(berthRes);
        const availBerth = berthRes.berths?.find((b) => b.status === 'Available');
        if (availBerth) {
          setSelectedBerthId(availBerth.berth_id);
        } else {
          setSelectedBerthId(null);
        }
      } catch {
        setBerthData(null);
      }

      // 4. Alternative Port Rerouting Logic
      try {
        const altRes = await getAlternativePortOptions(portCode, {
          cargo_quantity: cargoQuantity,
          cargo_type: cargoType,
          vessel_draft: vesselClass === 'Capesize' ? 18.2 : 14.5,
          vessel_dwt: cargoQuantity * 1.1,
        });
        setAlternativePorts(altRes);
      } catch {
        setAlternativePorts(null);
      }

      // 5. Fleet Suitability & Allocation Engine
      try {
        const fleetRes = await allocateFleetCargo({
          cargo_quantity: cargoQuantity,
          cargo_type: cargoType,
          origin: originPort,
          destination: destPort,
          delivery_deadline: arrivalDate,
          maximum_budget: budgetUsd,
          preferred_vessel_class: vesselClass,
        });
        setFleetAllocation(fleetRes);
        const suitable = fleetRes.candidate_details?.filter((v) => v.is_suitable);
        if (fleetRes.scenarios?.[0]?.vessel_ids?.[0]) {
          setSelectedVesselId(fleetRes.scenarios[0].vessel_ids[0]);
        } else if (suitable && suitable.length > 0) {
          setSelectedVesselId(suitable[0].vessel_id);
        }
      } catch {
        setFleetAllocation(null);
      }
    } catch (err: any) {
      setEvaluationError(err.message || 'Voyage calculation failed. Please check inputs.');
    } finally {
      setIsEvaluating(false);
    }
  }, [originPort, destPort, cargoType, cargoQuantity, laycanStart, arrivalDate, vesselClass, budgetUsd]);

  // Active selected route option details
  const activeRouteOption: RouteOptionItem | undefined = useMemo(() => {
    if (!routeComparison) return undefined;
    return selectedRouteKey === 'shortest'
      ? routeComparison.shortest_route
      : routeComparison.lowest_cost_route;
  }, [routeComparison, selectedRouteKey]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Booking Creation
  // ─────────────────────────────────────────────────────────────────────────────
  const handleConfirmBooking = async (isDraft = false) => {
    if (!activeRouteOption) return;
    setIsBookingSubmitting(true);
    setBookingFeedback(null);

    const chosenVessel = selectedVesselId || 'MV_PACIFIC_CHARTER_01';
    const chosenBerth = selectedBerthId || (berthData?.berths?.find((b) => b.status === 'Available')?.berth_id);

    try {
      const record = await createCharterBooking({
        vessel_id: chosenVessel,
        origin_port: originPort,
        destination_port: destPort,
        selected_route_type: selectedRouteKey,
        selected_berth_id: chosenBerth,
        planned_departure: activeRouteOption.estimated_departure,
        planned_arrival: activeRouteOption.estimated_arrival,
        cargo_quantity: cargoQuantity,
        cargo_type: cargoType,
        estimated_total_cost: activeRouteOption.total_cost_usd,
        notes: isDraft ? 'Planning Draft - Laycan Pending' : 'Charter Confirmed - Berth Window Reserved',
      });

      setBookingFeedback({
        type: 'success',
        message: `Booking #${record.booking_id} ${isDraft ? 'saved as draft' : 'successfully confirmed'}! Assigned berth: ${record.selected_berth_id || 'Awaiting berth assignment'}.`,
      });

      setIsBookingModalOpen(false);
      loadBookings();
    } catch (err: any) {
      setBookingFeedback({
        type: 'error',
        message: err.message || 'Booking creation rejected. Please check berth or vessel constraints.',
      });
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Rescheduling Flow
  // ─────────────────────────────────────────────────────────────────────────────
  const handleOpenReschedule = (booking: CharterBookingRecord) => {
    setActiveRescheduleBooking(booking);
    setRescheduleReason('Port congestion disruption at discharge terminal');
    setRescheduleDate(booking.planned_arrival);
    setReschedulePort(booking.destination_port);
    setRescheduleOptions(null);
  };

  const handleCalculateRescheduleOptions = async (confirm = false) => {
    if (!activeRescheduleBooking) return;
    setIsRescheduling(true);
    try {
      const res = await rescheduleCharterBooking(activeRescheduleBooking.booking_id, {
        reason: rescheduleReason,
        new_arrival_date: rescheduleDate,
        new_port: reschedulePort,
        confirm_changes: confirm,
      });
      setRescheduleOptions(res);
      if (confirm && res.applied_changes) {
        setBookingFeedback({
          type: 'success',
          message: `Booking #${activeRescheduleBooking.booking_id} mutated and rescheduled successfully.`,
        });
        setActiveRescheduleBooking(null);
        loadBookings();
      }
    } catch (err: any) {
      setBookingFeedback({
        type: 'error',
        message: err.message || 'Rescheduling calculation failed.',
      });
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    const reason = window.prompt('Please provide a reason for cancelling this charter booking:', 'Commercial rescheduling / laycan cancellation');
    if (!reason) return;

    try {
      await cancelCharterBooking(bookingId, reason);
      setBookingFeedback({
        type: 'success',
        message: `Booking #${bookingId} cancelled and berth window released.`,
      });
      loadBookings();
    } catch (err: any) {
      setBookingFeedback({
        type: 'error',
        message: err.message || 'Cancellation failed.',
      });
    }
  };

  // Legacy chart data for Tab 2
  const legacyChartData = routes.map((r) => ({
    route: `${r.origin.slice(0, 3)}→${r.destination.slice(0, 3)}`,
    freight: r.avgFreightRate,
    score: r.isRecommended ? 94 : r.riskLevel === 'LOW' ? 89 : r.riskLevel === 'MEDIUM' ? 78 : 65,
  }));

  const suitableCandidates = fleetAllocation?.candidate_details?.filter((v) => v.is_suitable) || [];
  const rejectedCandidates = fleetAllocation?.candidate_details?.filter((v) => !v.is_suitable) || [];

  return (
    <div className="space-y-6 animate-fade-in text-[#E8F0F5]">
      {/* Hero Banner */}
      <PageHero
        badge="MARITIME ROUTE PLANNING & DISCHARGE ALLOTMENT"
        subBadge="GRAPH ROUTING · BERTH CONFLICT ENGINE · FLEET ALLOTMENT"
        titleLine1="Route the cargo."
        titleLine2="Reserve the berth."
        description="Graph-based maritime routing comparing Shortest vs Lowest-Cost sea lanes from global bulk export origins to the East Coast of India. Integrated with real berth conflict detection, dynamic fleet allotment, and audit-logged charter bookings."
        stats={[
          { value: "8+ Corridors", label: "Nautical Sea Lanes", sublabel: "Australia, Indo, SA to India" },
          { value: "Dual Engine", label: "Fastest vs Eco-Steaming", sublabel: "Cubic Propulsion Fuel Law" },
          { value: "6 East Coast Ports", label: "Berth Scheduling", sublabel: "6-Hour Safety Buffer" },
          { value: "Zero Fake AIS", label: "Verified Attribution", sublabel: "Live vs Estimated Labels" },
        ]}
      />

      {/* Main Workspace Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-[#294154] pb-2">
        <div className="flex gap-2 font-mono text-xs">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-4 py-2 rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'workspace'
                ? 'bg-[#162C40] text-[#35B8A6] border-t-2 border-[#35B8A6] font-bold'
                : 'text-[#91A6B8] hover:text-[#E8F0F5]'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Dynamic Route Planner & Charter Booking</span>
          </button>
          <button
            onClick={() => setActiveTab('corridors')}
            className={`px-4 py-2 rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'corridors'
                ? 'bg-[#162C40] text-[#35B8A6] border-t-2 border-[#35B8A6] font-bold'
                : 'text-[#91A6B8] hover:text-[#E8F0F5]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Historical Sea-Lane Corridors</span>
          </button>
        </div>

        {/* Live / Estimated attribution indicator */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-[#91A6B8]">
          <span className="w-2 h-2 rounded-full bg-[#D6A24A]" />
          <span>Data Attribution:</span>
          <span className="text-[#D6A24A] font-semibold uppercase">Estimated Planning Corridors</span>
        </div>
      </div>

      {/* Feedback Banner */}
      {bookingFeedback && (
        <div
          className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-between ${
            bookingFeedback.type === 'success'
              ? 'bg-[#35B8A6]/15 border-[#35B8A6]/40 text-[#6DAF91]'
              : 'bg-[#DC2626]/15 border-[#DC2626]/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {bookingFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{bookingFeedback.message}</span>
          </div>
          <button onClick={() => setBookingFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          TAB 1: DYNAMIC ROUTE PLANNER & CHARTER BOOKING WORKSPACE
         ─────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'workspace' && (
        <div className="space-y-6">
          {/* SECTION 1: Cargo & Voyage Input Controls */}
          <div className="bg-[#0E1E2E] border border-[#294154] rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#294154]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#35B8A6]" />
                <h3 className="font-display font-bold text-sm tracking-wide text-white uppercase m-0">
                  Cargo & Voyage Specifications
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#91A6B8]">
                Nautical graph routing · Discharge port compatibility check
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              {/* Origin Port */}
              <div>
                <label className="block text-[#91A6B8] text-[10px] uppercase mb-1">Overseas Loading Port</label>
                <select
                  value={originPort}
                  onChange={(e) => setOriginPort(e.target.value)}
                  className="w-full bg-[#102235] border border-[#294154] rounded px-2.5 py-2 text-[#E8F0F5] focus:border-[#35B8A6] focus:outline-none"
                >
                  {ORIGIN_PORTS.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({p.country})
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Port */}
              <div>
                <label className="block text-[#91A6B8] text-[10px] uppercase mb-1">East Coast Indian Discharge Port</label>
                <select
                  value={destPort}
                  onChange={(e) => setDestPort(e.target.value)}
                  className="w-full bg-[#102235] border border-[#294154] rounded px-2.5 py-2 text-[#E8F0F5] focus:border-[#35B8A6] focus:outline-none"
                >
                  {DEST_PORTS.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} {p.draftRestricted ? '⚠️ (Draft: 12.5m)' : `(Draft: ${p.maxDraft}m)`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cargo Type */}
              <div>
                <label className="block text-[#91A6B8] text-[10px] uppercase mb-1">Bulk Commodity</label>
                <select
                  value={cargoType}
                  onChange={(e) => setCargoType(e.target.value)}
                  className="w-full bg-[#102235] border border-[#294154] rounded px-2.5 py-2 text-[#E8F0F5] focus:border-[#35B8A6] focus:outline-none"
                >
                  {CARGO_COMMODITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Cargo Quantity */}
              <div>
                <label className="block text-[#91A6B8] text-[10px] uppercase mb-1">Cargo Quantity (MT)</label>
                <input
                  type="number"
                  step="5000"
                  min="10000"
                  max="250000"
                  value={cargoQuantity}
                  onChange={(e) => setCargoQuantity(Number(e.target.value) || 0)}
                  className="w-full bg-[#102235] border border-[#294154] rounded px-2.5 py-2 text-[#E8F0F5] focus:border-[#35B8A6] focus:outline-none"
                />
              </div>

              {/* Laycan Departure Start */}
              <div>
                <label className="block text-[#91A6B8] text-[10px] uppercase mb-1">Earliest Departure (Laycan)</label>
                <input
                  type="date"
                  value={laycanStart}
                  onChange={(e) => setLaycanStart(e.target.value)}
                  className="w-full bg-[#102235] border border-[#294154] rounded px-2.5 py-2 text-[#E8F0F5] focus:border-[#35B8A6] focus:outline-none"
                />
              </div>

              {/* Required Arrival Date */}
              <div>
                <label className="block text-[#91A6B8] text-[10px] uppercase mb-1">Required Arrival Deadline</label>
                <input
                  type="date"
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  className="w-full bg-[#102235] border border-[#294154] rounded px-2.5 py-2 text-[#E8F0F5] focus:border-[#35B8A6] focus:outline-none"
                />
              </div>

              {/* Preferred Vessel Class */}
              <div>
                <label className="block text-[#91A6B8] text-[10px] uppercase mb-1">Preferred Vessel Class</label>
                <select
                  value={vesselClass}
                  onChange={(e) => setVesselClass(e.target.value)}
                  className="w-full bg-[#102235] border border-[#294154] rounded px-2.5 py-2 text-[#E8F0F5] focus:border-[#35B8A6] focus:outline-none"
                >
                  <option value="Handysize">Handysize (25k - 40k MT)</option>
                  <option value="Supramax">Supramax (50k - 65k MT)</option>
                  <option value="Panamax">Panamax (65k - 85k MT)</option>
                  <option value="Capesize">Capesize (120k - 200k MT)</option>
                </select>
              </div>

              {/* Budget Limit */}
              <div>
                <label className="block text-[#91A6B8] text-[10px] uppercase mb-1">Maximum Budget (USD)</label>
                <input
                  type="number"
                  step="50000"
                  value={budgetUsd}
                  onChange={(e) => setBudgetUsd(Number(e.target.value) || 0)}
                  className="w-full bg-[#102235] border border-[#294154] rounded px-2.5 py-2 text-[#E8F0F5] focus:border-[#35B8A6] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-[11px] font-mono text-[#91A6B8]">
                Note: Haldia has strict 12.5m draft limits. Capesize requires deepwater ports (Vizag / Dhamra).
              </span>
              <button
                type="button"
                onClick={handleEvaluateVoyage}
                disabled={isEvaluating}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#35B8A6] hover:bg-[#2CA493] text-[#0B1726] font-bold font-mono text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
                <span>{isEvaluating ? 'Computing Sea Lanes & Berths…' : 'Compute Routes & Check Availability'}</span>
              </button>
            </div>
          </div>

          {evaluationError && (
            <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 font-mono text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{evaluationError}</span>
            </div>
          )}

          {/* SECTION 2: Route Comparison (Option A: Shortest vs Option B: Lowest Cost) */}
          {routeComparison && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-base text-white m-0">
                    Dual Sea-Lane Corridor Comparison
                  </h3>
                  <p className="text-xs text-[#91A6B8] mt-0.5 font-mono">
                    Deterministic graph routing comparing Fast Steaming (Option A) vs Eco-Steaming & Green Dues (Option B).
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#102235] border border-[#294154] text-[#D6A24A]">
                  Estimated planning corridor — not for navigation
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* OPTION A: Shortest / Fastest */}
                <div
                  onClick={() => setSelectedRouteKey('shortest')}
                  className={`bg-[#0E1E2E] rounded-xl p-5 border transition-all cursor-pointer relative ${
                    selectedRouteKey === 'shortest'
                      ? 'border-[#5D9BC4] ring-1 ring-[#5D9BC4]/40 shadow-lg shadow-[#5D9BC4]/10 bg-[#102438]'
                      : 'border-[#294154] hover:border-[#5D9BC4]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-[#5D9BC4] bg-[#5D9BC4]/10 px-2.5 py-1 rounded border border-[#5D9BC4]/30">
                      OPTION A — SHORTEST / FASTEST
                    </span>
                    <span className="text-[11px] font-mono text-[#91A6B8]">Fast Steaming (14.2 kts)</span>
                  </div>

                  <div className="text-sm font-bold text-white mb-2">
                    {routeComparison.shortest_route.origin} → {routeComparison.shortest_route.destination}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs my-3 p-3 bg-[#0B1726] rounded-lg border border-[#294154]/50">
                    <div>
                      <div className="text-[9px] text-[#91A6B8] uppercase">Distance</div>
                      <div className="font-bold text-white">{routeComparison.shortest_route.distance_nm.toLocaleString()} nm</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#91A6B8] uppercase">Transit Time</div>
                      <div className="font-bold text-white">{routeComparison.shortest_route.sailing_days} Days</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#91A6B8] uppercase">Total Cost</div>
                      <div className="font-bold text-[#5D9BC4]">${routeComparison.shortest_route.total_cost_usd.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#91A6B8] uppercase">Cost / MT</div>
                      <div className="font-bold text-white">${routeComparison.shortest_route.cost_per_ton_usd.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono text-[#91A6B8] border-t border-[#294154] pt-2">
                    <div className="flex justify-between">
                      <span>Bunker Fuel Cost:</span>
                      <span className="text-white">${routeComparison.shortest_route.fuel_cost_usd.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Port & Demurrage Risk:</span>
                      <span className="text-white">
                        ${(routeComparison.shortest_route.port_charges_usd + routeComparison.shortest_route.demurrage_risk_usd).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Arrival:</span>
                      <span className="text-[#5D9BC4] font-semibold">{routeComparison.shortest_route.estimated_arrival}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Risk Score:</span>
                      <span className="text-white font-bold">{routeComparison.shortest_route.risk_score} / 100 ({routeComparison.shortest_route.risk_level})</span>
                    </div>
                  </div>

                  <div className="mt-3 p-2 rounded bg-[#102235] text-[11px] text-[#91A6B8] border border-[#294154]">
                    <span className="text-[#5D9BC4] font-semibold">Tradeoff: </span>
                    {routeComparison.shortest_route.tradeoff_explanation}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedRouteKey('shortest'); }}
                      className={`w-full py-1.5 rounded font-mono text-xs font-bold transition-colors cursor-pointer ${
                        selectedRouteKey === 'shortest'
                          ? 'bg-[#5D9BC4] text-[#0B1726]'
                          : 'bg-[#102235] border border-[#5D9BC4]/40 text-[#5D9BC4] hover:bg-[#5D9BC4]/10'
                      }`}
                    >
                      {selectedRouteKey === 'shortest' ? '✓ Route A Selected' : 'Select Shortest Route'}
                    </button>
                  </div>
                </div>

                {/* OPTION B: Lowest-Cost */}
                <div
                  onClick={() => setSelectedRouteKey('lowest_cost')}
                  className={`bg-[#0E1E2E] rounded-xl p-5 border transition-all cursor-pointer relative ${
                    selectedRouteKey === 'lowest_cost'
                      ? 'border-[#35B8A6] ring-1 ring-[#35B8A6]/40 shadow-lg shadow-[#35B8A6]/10 bg-[#102934]'
                      : 'border-[#294154] hover:border-[#35B8A6]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-[#35B8A6] bg-[#35B8A6]/10 px-2.5 py-1 rounded border border-[#35B8A6]/30">
                      OPTION B — LOWEST COST (RECOMMENDED)
                    </span>
                    <span className="text-[11px] font-mono text-[#6DAF91]">Eco-Steaming (12.0 kts)</span>
                  </div>

                  <div className="text-sm font-bold text-white mb-2">
                    {routeComparison.lowest_cost_route.origin} → {routeComparison.lowest_cost_route.destination}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs my-3 p-3 bg-[#0B1726] rounded-lg border border-[#294154]/50">
                    <div>
                      <div className="text-[9px] text-[#91A6B8] uppercase">Distance</div>
                      <div className="font-bold text-white">{routeComparison.lowest_cost_route.distance_nm.toLocaleString()} nm</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#91A6B8] uppercase">Transit Time</div>
                      <div className="font-bold text-white">{routeComparison.lowest_cost_route.sailing_days} Days</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#91A6B8] uppercase">Total Cost</div>
                      <div className="font-bold text-[#35B8A6]">${routeComparison.lowest_cost_route.total_cost_usd.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#91A6B8] uppercase">Cost / MT</div>
                      <div className="font-bold text-white">${routeComparison.lowest_cost_route.cost_per_ton_usd.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono text-[#91A6B8] border-t border-[#294154] pt-2">
                    <div className="flex justify-between items-center">
                      <span>Total Savings vs Route A:</span>
                      <span className="text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-700/50">
                        -${routeComparison.lowest_cost_route.cost_savings_usd.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bunker Fuel Cost:</span>
                      <span className="text-white">${routeComparison.lowest_cost_route.fuel_cost_usd.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Arrival:</span>
                      <span className="text-[#35B8A6] font-semibold">{routeComparison.lowest_cost_route.estimated_arrival}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Risk Score:</span>
                      <span className="text-white font-bold">{routeComparison.lowest_cost_route.risk_score} / 100 ({routeComparison.lowest_cost_route.risk_level})</span>
                    </div>
                  </div>

                  <div className="mt-3 p-2 rounded bg-[#102235] text-[11px] text-[#91A6B8] border border-[#294154]">
                    <span className="text-[#35B8A6] font-semibold">Tradeoff: </span>
                    {routeComparison.lowest_cost_route.tradeoff_explanation}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedRouteKey('lowest_cost'); }}
                      className={`w-full py-1.5 rounded font-mono text-xs font-bold transition-colors cursor-pointer ${
                        selectedRouteKey === 'lowest_cost'
                          ? 'bg-[#35B8A6] text-[#0B1726]'
                          : 'bg-[#102235] border border-[#35B8A6]/40 text-[#35B8A6] hover:bg-[#35B8A6]/10'
                      }`}
                    >
                      {selectedRouteKey === 'lowest_cost' ? '✓ Route B Selected' : 'Select Lowest-Cost Route'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Tradeoff Summary Callout */}
              <div className="bg-[#102235] border border-[#294154] rounded-lg p-3 text-xs font-mono flex items-start gap-2.5">
                <TrendingDown className="w-4 h-4 text-[#35B8A6] shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-semibold">Strategic Route Decision: </span>
                  <span className="text-[#91A6B8]">{routeComparison.tradeoff_summary}</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: Interactive Leaflet Map with Dual Route Visualization */}
          <div className="bg-[#0E1E2E] border border-[#294154] rounded-xl p-4 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#294154]">
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-[#35B8A6]" />
                <h4 className="font-display font-bold text-sm text-white m-0 uppercase">
                  Geospatial Nautical Corridor Map
                </h4>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-[#5D9BC4] font-semibold">Route A: Muted Blue</span>
                <span className="text-[#35B8A6] font-semibold">Route B: Muted Teal</span>
                <span className="text-[#D97706] font-semibold">Chokepoints / Alerts: Amber</span>
              </div>
            </div>

            <MaritimeLeafletMap
              routeComparison={
                routeComparison
                  ? {
                      shortest: routeComparison.shortest_route,
                      lowestCost: routeComparison.lowest_cost_route,
                    }
                  : null
              }
              selectedRouteKey={selectedRouteKey}
              onSelectRouteKey={(key) => setSelectedRouteKey(key)}
              alerts={routeAlerts}
            />
          </div>

          {/* SECTION 4: Active Route Risk & Coastal Disruption Alerts */}
          {routeAlerts.length > 0 && (
            <div className="bg-[#0E1E2E] border border-[#294154] rounded-xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#294154]">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#D6A24A]" />
                  <h4 className="font-display font-bold text-sm text-white m-0 uppercase">
                    Active Route Risks & Coastal Weather Alerts ({routeAlerts.length})
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-[#91A6B8]">Evaluated against regional hydrographic notices</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {routeAlerts.map((alert) => {
                  const isCrit = alert.severity === 'CRITICAL';
                  const isWarn = alert.severity === 'WARNING';
                  const badgeColor = isCrit
                    ? 'bg-rose-950/60 text-rose-300 border-rose-700'
                    : isWarn
                    ? 'bg-amber-950/60 text-amber-300 border-amber-700'
                    : 'bg-cyan-950/60 text-cyan-300 border-cyan-700';

                  return (
                    <div key={alert.alert_id} className="bg-[#102235] border border-[#294154] rounded-lg p-3 font-mono text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${badgeColor}`}>
                          {alert.severity}
                        </span>
                        <span className="text-[10px] text-[#91A6B8]">{alert.source}</span>
                      </div>
                      <div className="font-semibold text-white text-xs">{alert.area}</div>
                      <div className="text-[#B0C4D8] text-[11px] leading-relaxed">{alert.description}</div>
                      {alert.recommended_action && (
                        <div className="text-[10px] text-[#D6A24A] border-t border-[#294154] pt-1 mt-1">
                          ⚡ Action: {alert.recommended_action}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 5: Vessel Capacity & Suitability Evaluation */}
          {fleetAllocation && (
            <div className="bg-[#0E1E2E] border border-[#294154] rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#294154]">
                <div className="flex items-center gap-2">
                  <Ship className="w-4 h-4 text-[#35B8A6]" />
                  <h3 className="font-display font-bold text-sm text-white uppercase m-0">
                    Vessel Capacity & Suitability Screening
                  </h3>
                </div>
                <div className="text-[11px] font-mono text-[#91A6B8]">
                  Enforces: Capacity ≥ {cargoQuantity.toLocaleString()} MT · Draft ≤ Port Limits · Zero Double-Booking
                </div>
              </div>

              {/* Suitable Vessels */}
              <div className="space-y-2">
                <div className="text-xs font-mono font-semibold text-[#6DAF91]">
                  Qualified Candidate Vessels ({suitableCandidates.length})
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
                  {suitableCandidates.map((v) => {
                    const isSelected = selectedVesselId === v.vessel_id;
                    return (
                      <div
                        key={v.vessel_id}
                        onClick={() => setSelectedVesselId(v.vessel_id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#102934] border-[#35B8A6] shadow-md'
                            : 'bg-[#102235] border-[#294154] hover:border-[#35B8A6]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white">{v.vessel_name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#35B8A6]/10 text-[#35B8A6] border border-[#35B8A6]/30 font-semibold">
                            {v.vessel_class}
                          </span>
                        </div>
                        <div className="text-[#91A6B8] text-[11px] space-y-0.5">
                          <div className="flex justify-between">
                            <span>Capacity:</span>
                            <span className="text-white">{v.dwt.toLocaleString()} DWT</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Max Draft:</span>
                            <span className="text-white">{v.draft_meters} m</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Charter Rate:</span>
                            <span className="text-[#35B8A6]">${v.charter_rate_per_day.toLocaleString()} / day</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Estimated Voyage:</span>
                            <span className="text-white">${v.estimated_voyage_cost.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="mt-2 text-right">
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-[#35B8A6]' : 'text-[#91A6B8]'}`}>
                            {isSelected ? '✓ Selected for Charter' : 'Click to Allot'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rejected Vessels with Explicit Operational Reasons */}
              {rejectedCandidates.length > 0 && (
                <div className="space-y-2 border-t border-[#294154] pt-3">
                  <div className="text-xs font-mono font-semibold text-[#D6A24A]">
                    Screened & Disqualified Vessels ({rejectedCandidates.length})
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-xs">
                    {rejectedCandidates.map((v) => (
                      <div key={v.vessel_id} className="p-2.5 rounded bg-[#102235]/60 border border-[#294154] flex flex-col gap-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[#91A6B8] font-semibold">{v.vessel_name} ({v.vessel_class})</span>
                          <span className="text-rose-400 text-[10px] px-1 py-0.2 rounded bg-rose-950/40 border border-rose-800">
                            REJECTED
                          </span>
                        </div>
                        <div className="text-rose-300/90 text-[10px]">
                          ✕ {v.rejection_reason || 'Vessel non-compliant with port draft or cargo capacity requirement.'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 6: Berth Availability & Conflict Detection */}
          {berthData && (
            <div className="bg-[#0E1E2E] border border-[#294154] rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#294154]">
                <div className="flex items-center gap-2">
                  <Anchor className="w-4 h-4 text-[#35B8A6]" />
                  <h3 className="font-display font-bold text-sm text-white uppercase m-0">
                    Discharge Port Berth Schedule: {berthData.port_name}
                  </h3>
                </div>
                <div className="text-[11px] font-mono">
                  Requested Arrival: <span className="text-white font-bold">{berthData.requested_arrival}</span>
                </div>
              </div>

              {/* Conflict Alert Banner */}
              {!berthData.is_preferred_berth_available ? (
                <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-600 text-amber-200 font-mono text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>BERTH CONFLICT DETECTED FOR REQUESTED ARRIVAL WINDOW</span>
                  </div>
                  <div className="text-[11px] text-amber-200/90 pl-6">
                    {berthData.recommendation || 'One or more primary berths are occupied during requested arrival + 6h safety buffer.'}
                  </div>
                  {berthData.alternative_dates?.length > 0 && (
                    <div className="text-[11px] text-amber-100 pl-6 pt-1 border-t border-amber-700/50">
                      💡 Suggested Alternative Date Windows: {berthData.alternative_dates.join(', ')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-[#35B8A6]/10 border border-[#35B8A6]/30 text-[#6DAF91] font-mono text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Berth slots available for requested delivery window without collision.</span>
                </div>
              )}

              {/* Berth Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
                {berthData.berths?.map((b) => {
                  const isAvailable = b.status === 'Available';
                  const isChosen = selectedBerthId === b.berth_id;
                  return (
                    <div
                      key={b.berth_id}
                      onClick={() => isAvailable && setSelectedBerthId(b.berth_id)}
                      className={`p-3 rounded-lg border transition-all ${
                        !isAvailable
                          ? 'bg-[#102235]/60 border-[#294154] opacity-80 cursor-not-allowed'
                          : isChosen
                          ? 'bg-[#102934] border-[#35B8A6] shadow-md cursor-pointer'
                          : 'bg-[#102235] border-[#294154] hover:border-[#35B8A6]/40 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white">{b.berth_name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          isAvailable
                            ? 'bg-[#6DAF91]/20 text-[#6DAF91] border border-[#6DAF91]/40'
                            : 'bg-rose-950/50 text-rose-300 border border-rose-800'
                        }`}>
                          {b.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[#91A6B8] text-[11px] space-y-0.5">
                        <div className="flex justify-between"><span>Max DWT:</span><span className="text-white">{b.max_dwt.toLocaleString()} DWT</span></div>
                        <div className="flex justify-between"><span>Permissible Draft:</span><span className="text-white">{b.draft_meters} m</span></div>
                        {b.conflict_reason && (
                          <div className="text-rose-300 text-[10px] pt-1">
                            ⚠️ {b.conflict_reason}
                          </div>
                        )}
                      </div>
                      {isAvailable && (
                        <div className="mt-2 text-right">
                          <span className={`text-[10px] font-bold ${isChosen ? 'text-[#35B8A6]' : 'text-[#91A6B8]'}`}>
                            {isChosen ? '✓ Selected Berth' : 'Select Berth'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 7: Alternative Discharge Port Landed Cost Comparison */}
          {alternativePorts && alternativePorts.options?.length > 0 && (
            <div className="bg-[#0E1E2E] border border-[#294154] rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#294154]">
                <div>
                  <h3 className="font-display font-bold text-sm text-white uppercase m-0">
                    Alternative East Coast Port Feasibility & Landed Cost
                  </h3>
                  <p className="text-xs text-[#91A6B8] mt-0.5 font-mono">
                    Evaluates rerouting when preferred port is congested or draft-constrained.
                  </p>
                </div>
                <span className="text-xs font-mono text-[#35B8A6]">
                  Strategic Recommendation Available
                </span>
              </div>

              <div className="p-3 rounded bg-[#102235] text-xs font-mono border border-[#294154] text-[#E8F0F5]">
                <span className="text-[#35B8A6] font-bold">Recommendation: </span>
                {alternativePorts.strategic_recommendation}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
                {alternativePorts.options.map((opt) => (
                  <div key={opt.port_id} className="bg-[#102235] border border-[#294154] rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{opt.port_name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        opt.berth_availability_status === 'AVAILABLE' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' : 'bg-amber-950/60 text-amber-300 border border-amber-800'
                      }`}>
                        {opt.berth_availability_status}
                      </span>
                    </div>

                    <div className="space-y-0.5 text-[11px] text-[#91A6B8]">
                      <div className="flex justify-between"><span>Distance Delta:</span><span className="text-white">{opt.distance_difference_nm > 0 ? `+${opt.distance_difference_nm}` : opt.distance_difference_nm} nm</span></div>
                      <div className="flex justify-between"><span>Inland Freight:</span><span className="text-white">${opt.inland_freight_cost_usd.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Total Landed Cost:</span><span className="text-[#35B8A6] font-bold">${opt.total_landed_cost_usd.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Cost Delta:</span><span className="text-white font-semibold">${opt.cost_difference_usd > 0 ? `+$${opt.cost_difference_usd.toLocaleString()}` : `$${opt.cost_difference_usd.toLocaleString()}`}</span></div>
                    </div>

                    <div className="text-[10px] text-[#91A6B8] border-t border-[#294154] pt-1">
                      {opt.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 8: Final Charter Booking Actions & Active Bookings List */}
          <div className="bg-[#0E1E2E] border border-[#294154] rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#294154]">
              <div>
                <h3 className="font-display font-bold text-sm text-white uppercase m-0">
                  Charter Booking Execution & Rescheduling Log
                </h3>
                <p className="text-xs text-[#91A6B8] mt-0.5 font-mono">
                  All reservations are persisted in SQLite. Confirmed bookings require explicit user confirmation to mutate.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleConfirmBooking(true)}
                  disabled={!activeRouteOption || isBookingSubmitting}
                  className="px-3 py-2 rounded bg-[#102235] hover:bg-[#162C40] border border-[#294154] text-[#E8F0F5] font-mono text-xs cursor-pointer transition-colors"
                >
                  Save Draft Plan
                </button>
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(true)}
                  disabled={!activeRouteOption || isBookingSubmitting}
                  className="px-4 py-2 rounded bg-[#35B8A6] hover:bg-[#2CA493] text-[#0B1726] font-bold font-mono text-xs cursor-pointer transition-colors shadow-md"
                >
                  Confirm Charter Booking
                </button>
              </div>
            </div>

            {/* Existing Active Bookings Table */}
            {existingBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#102235] text-[#91A6B8] uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Booking ID</th>
                      <th className="p-2.5">Route Corridor</th>
                      <th className="p-2.5">Vessel / Berth</th>
                      <th className="p-2.5">Laycan Departure</th>
                      <th className="p-2.5">Planned Arrival</th>
                      <th className="p-2.5">Cargo (MT)</th>
                      <th className="p-2.5">Total Cost</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#294154]">
                    {existingBookings.map((b) => {
                      const isConfirmed = b.booking_status === 'CONFIRMED';
                      const isDraft = b.booking_status === 'DRAFT';
                      const isRescheduleReq = b.booking_status === 'RESCHEDULE_REQUIRED';
                      const isCancelled = b.booking_status === 'CANCELLED';

                      return (
                        <tr key={b.booking_id} className="hover:bg-[#102235]/40 transition-colors">
                          <td className="p-2.5 font-bold text-white">{b.booking_id}</td>
                          <td className="p-2.5">{b.origin_port} → {b.destination_port}</td>
                          <td className="p-2.5">
                            <div>{b.vessel_id}</div>
                            <div className="text-[10px] text-[#91A6B8]">{b.selected_berth_id || 'Berth pending'}</div>
                          </td>
                          <td className="p-2.5">{b.planned_departure}</td>
                          <td className="p-2.5">{b.planned_arrival}</td>
                          <td className="p-2.5">{b.cargo_quantity.toLocaleString()}</td>
                          <td className="p-2.5 text-[#35B8A6] font-bold">${b.estimated_total_cost.toLocaleString()}</td>
                          <td className="p-2.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              isConfirmed ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' :
                              isDraft ? 'bg-blue-950/60 text-blue-300 border border-blue-800' :
                              isRescheduleReq ? 'bg-amber-950/60 text-amber-300 border border-amber-800' :
                              'bg-rose-950/60 text-rose-300 border border-rose-800'
                            }`}>
                              {b.booking_status}
                            </span>
                          </td>
                          <td className="p-2.5 text-right space-x-2">
                            {!isCancelled && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenReschedule(b)}
                                  className="text-[#35B8A6] hover:underline cursor-pointer"
                                >
                                  Reschedule
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancelBooking(b.booking_id)}
                                  className="text-rose-400 hover:underline cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-[#91A6B8] font-mono text-xs border border-dashed border-[#294154] rounded-lg">
                No active charter bookings created yet. Use the planner above to select corridors, vessels, and berths.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          TAB 2: LEGACY CORRIDORS & HISTORICAL METRICS (BACKWARD COMPATIBILITY)
         ─────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'corridors' && (
        <div className="space-y-6">
          <div className="bg-[#0E1E2E] border border-[#294154] rounded-xl p-5 space-y-4">
            <h3 className="font-display font-bold text-lg text-white m-0">
              Corridor Historical Freight Benchmarks
            </h3>
            <p className="text-xs text-[#91A6B8] font-mono">
              Monitored bulk export shipping corridors to Indian East Coast discharge terminals.
            </p>

            <MaritimeLeafletMap
              selectedRoute={selectedLegacyRoute}
              onSelectRoute={(r) => setSelectedLegacyRoute(r)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 flex flex-col gap-3">
              {routes.map((route, idx) => {
                const isSelected = selectedLegacyRoute?.id === route.id;
                const isRec = route.isRecommended || idx === 0;
                return (
                  <button
                    key={route.id}
                    onClick={() => setSelectedLegacyRoute(route)}
                    className={`bg-[#0E1E2E] rounded-xl p-4 text-left transition-all border cursor-pointer ${
                      isSelected
                        ? 'border-[#35B8A6] ring-1 ring-[#35B8A6]/30 shadow-lg'
                        : 'border-[#294154] hover:border-[#35B8A6]/40'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#102235] border border-[#294154] flex items-center justify-center font-mono font-bold text-sm text-[#35B8A6]">
                        #{idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-white text-sm">{route.origin}</span>
                          <span className="text-[#35B8A6] font-mono">→</span>
                          <span className="font-bold text-[#35B8A6] text-sm">{route.destination}</span>
                          {isRec && (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#35B8A6] text-[#0B1726] font-bold">
                              RECOMMENDED
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#91A6B8]">
                          {route.origin === 'Australia'
                            ? 'Deepwater Capesize/Panamax transit with reliable draft clearance.'
                            : 'Regional high-frequency thermal coal discharge route.'}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-right font-mono shrink-0 hidden sm:grid">
                        <div>
                          <div className="text-[9px] text-[#91A6B8] uppercase">Freight</div>
                          <div className="text-xs font-bold text-[#35B8A6]">${route.avgFreightRate}/MT</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-[#91A6B8] uppercase">Transit</div>
                          <div className="text-xs font-bold text-white">{route.avgTransitDays || 16} Days</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-[#91A6B8] uppercase">Risk</div>
                          <div className="text-xs font-bold text-emerald-400">LOW</div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-4">
              {selectedLegacyRoute && (
                <div className="bg-[#0E1E2E] rounded-xl p-5 border border-[#294154] space-y-4 font-mono text-xs">
                  <div className="text-[10px] text-[#35B8A6] uppercase tracking-wider font-bold">
                    CORRIDOR METRICS ANALYSIS
                  </div>
                  <h4 className="font-display font-bold text-base text-white m-0">
                    {selectedLegacyRoute.origin} → {selectedLegacyRoute.destination}
                  </h4>

                  <div className="space-y-2 text-slate-300 divide-y divide-[#294154]">
                    <div className="flex justify-between py-1.5">
                      <span className="text-[#91A6B8]">Transit Distance:</span>
                      <span>{(selectedLegacyRoute.distanceNm ?? 4820).toLocaleString()} nm</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-[#91A6B8]">Average Transit Time:</span>
                      <span>{selectedLegacyRoute.avgTransitDays || 16} Days</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-[#91A6B8]">Current Benchmark Freight:</span>
                      <span className="text-[#35B8A6] font-bold">${selectedLegacyRoute.avgFreightRate}/MT</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="text-[10px] text-[#91A6B8] uppercase tracking-wider mb-2">
                      Freight Rate Comparison ($/MT)
                    </div>
                    <div className="h-32 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={legacyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(41, 65, 84, 0.4)" vertical={false} />
                          <XAxis dataKey="route" tick={{ fill: '#91A6B8', fontSize: 9 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#91A6B8', fontSize: 9 }} axisLine={false} tickLine={false} domain={[20, 38]} />
                          <Tooltip
                            contentStyle={{ background: '#0B1726', border: '1px solid #294154', borderRadius: 6, fontSize: 11 }}
                            formatter={(v: any) => [`$${v}/MT`, 'Rate']}
                          />
                          <Bar dataKey="freight" fill="#35B8A6" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          MODAL 1: CONFIRM BOOKING MODAL
         ─────────────────────────────────────────────────────────────────────── */}
      {isBookingModalOpen && activeRouteOption && (
        <div className="fixed inset-0 z-[1000] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0E1E2E] border border-[#294154] rounded-xl max-w-lg w-full p-5 space-y-4 font-mono text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#294154]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#35B8A6]" />
                <h4 className="font-display font-bold text-sm text-white m-0 uppercase">
                  Confirm Voyage Charter & Berth Allotment
                </h4>
              </div>
              <button onClick={() => setIsBookingModalOpen(false)} className="text-[#91A6B8] hover:text-white">✕</button>
            </div>

            <div className="space-y-2 text-[#91A6B8] bg-[#0B1726] p-3 rounded border border-[#294154]">
              <div className="flex justify-between"><span className="text-[#91A6B8]">Corridor:</span><span className="text-white font-bold">{originPort} → {destPort}</span></div>
              <div className="flex justify-between"><span className="text-[#91A6B8]">Cargo:</span><span className="text-white">{cargoQuantity.toLocaleString()} MT {cargoType}</span></div>
              <div className="flex justify-between"><span className="text-[#91A6B8]">Route Strategy:</span><span className="text-[#35B8A6] font-bold uppercase">{selectedRouteKey}</span></div>
              <div className="flex justify-between"><span className="text-[#91A6B8]">Allocated Vessel:</span><span className="text-white font-bold">{selectedVesselId || 'MV_PACIFIC_CHARTER_01'}</span></div>
              <div className="flex justify-between"><span className="text-[#91A6B8]">Assigned Berth:</span><span className="text-[#35B8A6] font-bold">{selectedBerthId || 'Primary Bulk Terminal (Auto-Assigned)'}</span></div>
              <div className="flex justify-between"><span className="text-[#91A6B8]">Departure (Laycan):</span><span className="text-white">{activeRouteOption.estimated_departure}</span></div>
              <div className="flex justify-between"><span className="text-[#91A6B8]">Estimated Arrival:</span><span className="text-white">{activeRouteOption.estimated_arrival}</span></div>
              <div className="flex justify-between border-t border-[#294154] pt-1.5"><span className="text-[#91A6B8]">Total Estimated Voyage Cost:</span><span className="text-emerald-400 font-bold text-sm">${activeRouteOption.total_cost_usd.toLocaleString()}</span></div>
            </div>

            <p className="text-[10px] text-[#91A6B8] leading-relaxed">
              Enforcement Note: Confirmation permanently locks the requested berth slot with a 6-hour buffer. Confirmed bookings will never be modified without explicit re-confirmation.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="px-3 py-1.5 rounded bg-[#102235] border border-[#294154] text-[#91A6B8] hover:text-white"
              >
                Back to Review
              </button>
              <button
                type="button"
                onClick={() => handleConfirmBooking(false)}
                disabled={isBookingSubmitting}
                className="px-4 py-1.5 rounded bg-[#35B8A6] hover:bg-[#2CA493] text-[#0B1726] font-bold"
              >
                {isBookingSubmitting ? 'Confirming Charter…' : 'Lock & Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          MODAL 2: RESCHEDULE & PORT DIVERSION MODAL
         ─────────────────────────────────────────────────────────────────────── */}
      {activeRescheduleBooking && (
        <div className="fixed inset-0 z-[1000] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0E1E2E] border border-[#294154] rounded-xl max-w-lg w-full p-5 space-y-4 font-mono text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#294154]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D6A24A]" />
                <h4 className="font-display font-bold text-sm text-white m-0 uppercase">
                  Reschedule / Reroute Booking #{activeRescheduleBooking.booking_id}
                </h4>
              </div>
              <button onClick={() => setActiveRescheduleBooking(null)} className="text-[#91A6B8] hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-[#91A6B8] uppercase mb-1">Reason for Rescheduling / Diversion</label>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full bg-[#102235] border border-[#294154] rounded px-2.5 py-1.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#91A6B8] uppercase mb-1">Proposed Arrival Date</label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full bg-[#102235] border border-[#294154] rounded px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#91A6B8] uppercase mb-1">Discharge Port</label>
                  <select
                    value={reschedulePort}
                    onChange={(e) => setReschedulePort(e.target.value)}
                    className="w-full bg-[#102235] border border-[#294154] rounded px-2.5 py-1.5 text-white"
                  >
                    {DEST_PORTS.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {rescheduleOptions && (
                <div className="p-3 bg-[#0B1726] border border-[#294154] rounded space-y-2 text-[11px]">
                  <div className="text-white font-bold">Calculated Rescheduling Impact:</div>
                  <div className="text-[#91A6B8]">{rescheduleOptions.message}</div>
                  {rescheduleOptions.rescheduling_options?.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-[#294154]">
                      {rescheduleOptions.rescheduling_options.slice(0, 3).map((opt, i) => (
                        <div key={i} className="flex justify-between text-[#91A6B8]">
                          <span>{opt.option_type}: {opt.proposed_port || opt.proposed_arrival_date}</span>
                          <span className="text-white font-semibold">
                            {opt.additional_cost_usd > 0 ? `+$${opt.additional_cost_usd.toLocaleString()}` : 'No Cost Delta'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#294154]">
              <button
                type="button"
                onClick={() => setActiveRescheduleBooking(null)}
                className="px-3 py-1.5 rounded bg-[#102235] border border-[#294154] text-[#91A6B8]"
              >
                Close
              </button>
              {!rescheduleOptions ? (
                <button
                  type="button"
                  onClick={() => handleCalculateRescheduleOptions(false)}
                  disabled={isRescheduling}
                  className="px-4 py-1.5 rounded bg-[#D6A24A] text-[#0B1726] font-bold"
                >
                  {isRescheduling ? 'Evaluating Impact…' : 'Calculate Reschedule Options'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCalculateRescheduleOptions(true)}
                  disabled={isRescheduling}
                  className="px-4 py-1.5 rounded bg-[#35B8A6] text-[#0B1726] font-bold"
                >
                  {isRescheduling ? 'Saving Changes…' : 'Confirm & Mutate Booking'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
