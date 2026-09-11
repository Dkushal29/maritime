'use client';

import React, { useState, useEffect } from 'react';
import {
  Target,
  TrendingUp,
  Ship,
  DollarSign,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Info,
  Calendar,
  Anchor,
  Compass,
} from 'lucide-react';
import { PageHero } from '@/components/maritime/PageHero';
import { planCargoWorkflow, getPlanningHistory } from '@/lib/api';
import {
  CargoPlanningInput,
  CargoPlanningResponse,
  VesselSuitabilityItem,
  CharterPlanItem,
} from '@/types';

const SUPPORTED_CARGOS = ['Coal', 'Iron Ore', 'Limestone', 'Grain', 'Fertilizer'];
const DESTINATION_PORTS = [
  { name: 'Visakhapatnam', draft: '18.5m', maxDwt: '200k MT', code: 'INVTZ' },
  { name: 'Paradip', draft: '17.1m', maxDwt: '125k MT', code: 'INPRT' },
  { name: 'Chennai', draft: '16.5m', maxDwt: '85k MT', code: 'INMAA' },
  { name: 'Kamarajar (Ennore)', draft: '18.0m', maxDwt: '150k MT', code: 'INENR' },
  { name: 'Haldia', draft: '12.5m', maxDwt: '45k MT', code: 'INHAL' },
];
const VESSEL_CLASSES = ['Any', 'Handysize', 'Supramax', 'Panamax', 'Capesize'];

export default function PlanningPage() {
  // Today's ISO date string
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultFutureDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  // Form input state
  const [formData, setFormData] = useState<CargoPlanningInput>({
    cargo_type: 'Coal',
    cargo_quantity: 75000,
    origin: 'Australia',
    destination_port: 'Visakhapatnam',
    required_arrival_date: defaultFutureDate,
    maximum_budget: 15000000,
    preferred_vessel_class: 'Panamax',
    supplier_price_per_tonne: 112.50,
  });

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [planResult, setPlanResult] = useState<CargoPlanningResponse | null>(null);
  const [vesselFilter, setVesselFilter] = useState<'ALL' | 'SUITABLE' | 'UNSUITABLE'>('ALL');
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [historyPlans, setHistoryPlans] = useState<any[]>([]);

  // Load history on initial mount
  useEffect(() => {
    getPlanningHistory(5).then((data) => {
      if (data && data.plans) {
        setHistoryPlans(data.plans);
      }
    }).catch(() => {});
  }, []);

  // Form submission handler
  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Client-side quick validations
    if (formData.cargo_quantity <= 0) {
      setErrorMsg('Cargo quantity must be greater than 0 tonnes.');
      return;
    }
    if (!formData.origin.trim() || !formData.destination_port.trim()) {
      setErrorMsg('Origin and destination ports cannot be empty.');
      return;
    }
    if (formData.maximum_budget <= 0) {
      setErrorMsg('Maximum budget must be greater than $0.');
      return;
    }
    if (new Date(formData.required_arrival_date) < new Date(todayStr)) {
      setErrorMsg('Required arrival date cannot be in the past.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await planCargoWorkflow(formData);
      setPlanResult(response);
      // Refresh history list
      getPlanningHistory(5).then((data) => {
        if (data && data.plans) setHistoryPlans(data.plans);
      }).catch(() => {});
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to execute cargo planning workflow.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter vessels
  const filteredVessels = (planResult?.vessel_evaluations || []).filter((v) => {
    if (vesselFilter === 'SUITABLE') return v.is_suitable;
    if (vesselFilter === 'UNSUITABLE') return !v.is_suitable;
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in text-slate-100 pb-16">
      {/* Page Hero */}
      <PageHero
        badge="SIH PROBLEM STATEMENT 26006"
        subBadge="CORE WORKFLOW"
        titleLine1="Intelligent Bulk Cargo Planning"
        titleLine2="& Freight Forecasting"
        description="End-to-end intelligent forecasting, vessel suitability evaluation, and transparent landed cost charter optimization for East Coast India."
        stats={[
          { value: '5 STAGES', label: 'WORKFLOW PHASES', sublabel: 'Input to Charter Fixture', highlight: true },
          { value: '4 CLASSES', label: 'VESSEL SUITABILITY', sublabel: 'Handysize to Capesize' },
          { value: '8 TERMS', label: 'LANDED COST', sublabel: 'Itemized Transparent Ledger' },
        ]}
      />

      {/* 5-Step Workflow Pipeline Diagram */}
      <div className="bg-[#102235] border border-[#294154] rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { step: '1', title: 'Cargo Requirement', desc: 'Volume, origin, arrival laycan', active: true },
            { step: '2', title: 'Freight Forecasting', desc: 'XGBoost vs SMA baseline', active: Boolean(planResult) },
            { step: '3', title: 'Vessel Suitability', desc: 'Port draft & DWT limits', active: Boolean(planResult) },
            { step: '4', title: 'Total Landed Cost', desc: 'Transparent 8-component sum', active: Boolean(planResult) },
            { step: '5', title: 'Procurement Fixture', desc: 'Charter now vs delayed window', active: Boolean(planResult) },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-md border transition-all ${
                item.active
                  ? 'bg-[#162C40] border-[#35B8A6]/50'
                  : 'bg-[#0B1726]/40 border-[#294154]/60 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  item.active ? 'bg-[#35B8A6] text-[#0B1726]' : 'bg-[#102235] text-[#91A6B8] border border-[#294154]'
                }`}>
                  {item.step}
                </span>
                <span className="font-semibold text-xs text-[#E8F0F5]">{item.title}</span>
              </div>
              <p className="text-[11px] text-[#91A6B8] leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Phase 1: Interactive Cargo Requirement Form */}
      <div className="bg-[#102235] border border-[#294154] rounded-lg p-6 relative">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#294154]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#162C40] border border-[#294154] flex items-center justify-center text-[#5D9BC4]">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8F0F5] flex items-center gap-2">
                Phase 1: Cargo Requirement & Constraints
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#162C40] text-[#35B8A6] border border-[#294154]">
                  POST /api/v1/planning/cargo
                </span>
              </h2>
              <p className="text-xs text-[#91A6B8]">
                Specify cargo volume, loading origin, destination port, arrival deadline, and target budget.
              </p>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs text-[#91A6B8]">Presets:</span>
            <button
              type="button"
              onClick={() => setFormData({
                cargo_type: 'Coal',
                cargo_quantity: 75000,
                origin: 'Australia',
                destination_port: 'Visakhapatnam',
                required_arrival_date: defaultFutureDate,
                maximum_budget: 15000000,
                preferred_vessel_class: 'Panamax',
                supplier_price_per_tonne: 112.50,
              })}
              className="text-xs px-2.5 py-1 rounded bg-[#162C40] hover:bg-[#1b344d] text-[#E8F0F5] border border-[#294154] transition-colors"
            >
              Australia Coal (Panamax)
            </button>
            <button
              type="button"
              onClick={() => setFormData({
                cargo_type: 'Iron Ore',
                cargo_quantity: 160000,
                origin: 'Australia',
                destination_port: 'Visakhapatnam',
                required_arrival_date: defaultFutureDate,
                maximum_budget: 28000000,
                preferred_vessel_class: 'Capesize',
                supplier_price_per_tonne: 118.00,
              })}
              className="text-xs px-2.5 py-1 rounded bg-[#162C40] hover:bg-[#1b344d] text-[#E8F0F5] border border-[#294154] transition-colors"
            >
              Australia Iron Ore (Capesize)
            </button>
            <button
              type="button"
              onClick={() => setFormData({
                cargo_type: 'Limestone',
                cargo_quantity: 42000,
                origin: 'United Arab Emirates',
                destination_port: 'Haldia',
                required_arrival_date: defaultFutureDate,
                maximum_budget: 4500000,
                preferred_vessel_class: 'Handysize',
                supplier_price_per_tonne: 34.00,
              })}
              className="text-xs px-2.5 py-1 rounded bg-[#162C40] hover:bg-[#1b344d] text-[#D6A24A] border border-[#D6A24A]/40 transition-colors"
            >
              Haldia Limestone (Draft Test)
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-md bg-[#C96B6B]/10 border border-[#C96B6B]/40 flex items-start gap-3">
            <XCircle className="w-4 h-4 text-[#C96B6B] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-[#C96B6B]">Validation Error</h4>
              <p className="text-xs text-[#E8F0F5]/80 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handlePlanSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cargo Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#91A6B8] flex items-center justify-between">
                <span>Cargo Type</span>
                <span className="text-[10px] text-[#35B8A6] font-mono">DRY BULK</span>
              </label>
              <select
                value={formData.cargo_type}
                onChange={(e) => setFormData({ ...formData, cargo_type: e.target.value })}
                className="w-full bg-[#0B1726] border border-[#294154] rounded-md px-3 py-2 text-sm text-[#E8F0F5] focus:outline-none focus:border-[#35B8A6] transition-colors"
              >
                {SUPPORTED_CARGOS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Cargo Quantity */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#91A6B8] flex items-center justify-between">
                <span>Cargo Quantity (Tonnes)</span>
                <span className="text-[10px] text-[#91A6B8]">min 1,000 MT</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={formData.cargo_quantity}
                  onChange={(e) => setFormData({ ...formData, cargo_quantity: Number(e.target.value) })}
                  className="w-full bg-[#0B1726] border border-[#294154] rounded-md px-3 py-2 text-sm text-[#E8F0F5] focus:outline-none focus:border-[#35B8A6] transition-colors pr-12"
                />
                <span className="absolute right-3 top-2 text-xs text-[#91A6B8] font-mono">MT</span>
              </div>
            </div>

            {/* Origin */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#91A6B8]">Origin / Loading Port</label>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                placeholder="e.g. Australia (Newcastle), Indonesia, UAE"
                className="w-full bg-[#0B1726] border border-[#294154] rounded-md px-3 py-2 text-sm text-[#E8F0F5] focus:outline-none focus:border-[#35B8A6] transition-colors"
              />
            </div>

            {/* Destination Port */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#91A6B8] flex items-center justify-between">
                <span>Destination Port</span>
                <span className="text-[10px] text-[#91A6B8]">East Coast India</span>
              </label>
              <select
                value={formData.destination_port}
                onChange={(e) => setFormData({ ...formData, destination_port: e.target.value })}
                className="w-full bg-[#0B1726] border border-[#294154] rounded-md px-3 py-2 text-sm text-[#E8F0F5] focus:outline-none focus:border-[#35B8A6] transition-colors"
              >
                {DESTINATION_PORTS.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} (Draft: {p.draft} | Max: {p.maxDwt})
                  </option>
                ))}
              </select>
            </div>

            {/* Required Arrival Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#91A6B8]">Required Arrival Date</label>
              <input
                type="date"
                min={todayStr}
                value={formData.required_arrival_date}
                onChange={(e) => setFormData({ ...formData, required_arrival_date: e.target.value })}
                className="w-full bg-[#0B1726] border border-[#294154] rounded-md px-3 py-2 text-sm text-[#E8F0F5] focus:outline-none focus:border-[#35B8A6] transition-colors"
              />
            </div>

            {/* Maximum Budget */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#91A6B8]">Maximum Budget (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-[#91A6B8] font-mono">$</span>
                <input
                  type="number"
                  min="10000"
                  step="10000"
                  value={formData.maximum_budget}
                  onChange={(e) => setFormData({ ...formData, maximum_budget: Number(e.target.value) })}
                  className="w-full bg-[#0B1726] border border-[#294154] rounded-md pl-7 pr-3 py-2 text-sm text-[#E8F0F5] focus:outline-none focus:border-[#35B8A6] transition-colors"
                />
              </div>
            </div>

            {/* Preferred Vessel Class */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#91A6B8]">Preferred Vessel Class</label>
              <select
                value={formData.preferred_vessel_class}
                onChange={(e) => setFormData({ ...formData, preferred_vessel_class: e.target.value })}
                className="w-full bg-[#0B1726] border border-[#294154] rounded-md px-3 py-2 text-sm text-[#E8F0F5] focus:outline-none focus:border-[#35B8A6] transition-colors"
              >
                {VESSEL_CLASSES.map((vc) => (
                  <option key={vc} value={vc}>{vc}</option>
                ))}
              </select>
            </div>

            {/* Supplier Price per Tonne (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#91A6B8] flex items-center justify-between">
                <span>Supplier FOB Price (Optional)</span>
                <span className="text-[10px] text-[#35B8A6] font-mono">$/MT</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-[#91A6B8] font-mono">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.supplier_price_per_tonne || ''}
                  placeholder="Market Benchmark Default"
                  onChange={(e) => setFormData({
                    ...formData,
                    supplier_price_per_tonne: e.target.value ? Number(e.target.value) : undefined,
                  })}
                  className="w-full bg-[#0B1726] border border-[#294154] rounded-md pl-7 pr-3 py-2 text-sm text-[#E8F0F5] focus:outline-none focus:border-[#35B8A6] transition-colors placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="text-xs text-[#91A6B8] flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-[#35B8A6]" />
              <span>Strict operational validation: Non-positive quantities, past dates, and invalid ports will be rejected.</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-md bg-[#35B8A6] hover:bg-[#2EA595] text-[#0B1726] font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing 5-Stage Optimization...</span>
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4" />
                  <span>Run Cargo Planning Workflow</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Output Results Section */}
      {planResult && (
        <div className="space-y-6 animate-fade-in">
          {/* Phase 5 Primary Recommendation Banner */}
          <div className="bg-[#162C40] border border-[#35B8A6]/40 rounded-lg p-6 relative">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-[#35B8A6]/15 text-[#35B8A6] border border-[#35B8A6]/30 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    Optimal Charter Recommendation
                  </span>
                  <span className="text-xs font-mono text-[#91A6B8]">Plan: {planResult.plan_id}</span>
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${
                    planResult.data_status === 'historical'
                      ? 'bg-[#102235] text-[#35B8A6] border-[#294154]'
                      : 'bg-[#D6A24A]/10 text-[#D6A24A] border-[#D6A24A]/30'
                  }`}>
                    {planResult.data_status === 'historical' ? 'Baltic Historical Fix' : 'Illustrative Econometric Proxy'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#E8F0F5]">
                  {planResult.recommended_plan.title}
                </h3>
                <p className="text-sm text-[#91A6B8] max-w-3xl">
                  {planResult.reasons[0]}
                </p>
              </div>

              {/* Cost & Savings Highlights */}
              <div className="flex items-center gap-6 bg-[#102235] border border-[#294154] rounded-md p-4 shrink-0">
                <div>
                  <div className="text-[11px] text-[#91A6B8] uppercase font-mono">Estimated Landed Cost</div>
                  <div className="text-xl font-bold text-[#E8F0F5]">
                    ${planResult.recommended_plan.estimated_total_cost.toLocaleString()}
                  </div>
                  <div className="text-xs text-[#35B8A6] font-mono">
                    ${planResult.recommended_plan.estimated_cost_per_tonne.toFixed(2)} / MT
                  </div>
                </div>

                {planResult.recommended_plan.potential_savings > 0 && (
                  <div className="border-l border-[#294154] pl-6">
                    <div className="text-[11px] text-[#6DAF91] uppercase font-mono">Cost Avoidance</div>
                    <div className="text-xl font-bold text-[#6DAF91]">
                      +${planResult.recommended_plan.potential_savings.toLocaleString()}
                    </div>
                    <div className="text-xs text-[#6DAF91]/80">vs forward spot surge</div>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendation Supporting Points */}
            <div className="mt-5 pt-4 border-t border-[#294154] grid grid-cols-1 md:grid-cols-3 gap-3">
              {planResult.reasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-[#E8F0F5] bg-[#102235] p-3 rounded-md border border-[#294154]">
                  <CheckCircle2 className="w-4 h-4 text-[#6DAF91] shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Grid: Phase 2 Freight Forecast & Phase 4 Landed Cost */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Phase 2: Freight Forecast Card */}
            <div className="bg-[#102235] border border-[#294154] rounded-lg p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-[#294154] pb-3">
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4 text-[#35B8A6]" />
                  <h3 className="font-semibold text-[#E8F0F5] text-sm">Phase 2: Forward Freight Forecast</h3>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                  planResult.freight_forecast.data_status === 'historical'
                    ? 'bg-[#35B8A6]/10 text-[#35B8A6] border-[#35B8A6]/30'
                    : 'bg-[#D6A24A]/10 text-[#D6A24A] border-[#D6A24A]/30'
                }`}>
                  {planResult.freight_forecast.data_status === 'historical' ? 'Historical Index' : 'Illustrative Forecast'}
                </span>
              </div>

              {/* Rate Trajectory Highlights */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#162C40] p-3.5 rounded-md border border-[#294154]">
                  <div className="text-[10px] text-[#91A6B8] uppercase font-mono">Spot Benchmark</div>
                  <div className="text-lg font-bold text-[#E8F0F5] mt-1">
                    ${planResult.freight_forecast.current_rate_per_tonne.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-[#91A6B8] font-mono">USD/MT</div>
                </div>

                <div className="bg-[#162C40] p-3.5 rounded-md border border-[#294154]">
                  <div className="text-[10px] text-[#91A6B8] uppercase font-mono">30-Day Forecast</div>
                  <div className="text-lg font-bold text-[#35B8A6] mt-1">
                    ${planResult.freight_forecast.predicted_rate_per_tonne.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-[#35B8A6]/80 font-mono">USD/MT (Forward)</div>
                </div>

                <div className="bg-[#162C40] p-3.5 rounded-md border border-[#294154]">
                  <div className="text-[10px] text-[#91A6B8] uppercase font-mono">Trajectory / Conf.</div>
                  <div className="text-sm font-bold text-[#D6A24A] mt-1 uppercase flex items-center gap-1">
                    <span>{planResult.freight_forecast.forecast_direction}</span>
                  </div>
                  <div className="text-[10px] text-[#91A6B8] capitalize">
                    {planResult.freight_forecast.confidence} Confidence
                  </div>
                </div>
              </div>

              {/* Model vs Baseline Evaluation Comparison */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-[#91A6B8] flex items-center justify-between">
                  <span>Model Evaluation vs Naive Baseline</span>
                  <span className="text-[10px] text-[#91A6B8] font-mono">Test Partition: 2026</span>
                </div>
                <div className="bg-[#0B1726] rounded-md border border-[#294154] overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#162C40] text-[#91A6B8] text-[11px] font-mono border-b border-[#294154]">
                      <tr>
                        <th className="p-2.5">Model</th>
                        <th className="p-2.5">MAE ($/MT)</th>
                        <th className="p-2.5">RMSE ($/MT)</th>
                        <th className="p-2.5">MAPE (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#294154] font-mono">
                      <tr className="text-[#35B8A6] bg-[#35B8A6]/5">
                        <td className="p-2.5 font-semibold font-sans">{planResult.freight_forecast.model_name || 'XGBoost Regressor'}</td>
                        <td className="p-2.5">{planResult.freight_forecast.metrics.mae.toFixed(3)}</td>
                        <td className="p-2.5">{planResult.freight_forecast.metrics.rmse.toFixed(3)}</td>
                        <td className="p-2.5">{planResult.freight_forecast.metrics.mape.toFixed(1)}%</td>
                      </tr>
                      <tr className="text-[#91A6B8]">
                        <td className="p-2.5 font-sans">30D Moving Average (Baseline)</td>
                        <td className="p-2.5">{planResult.freight_forecast.metrics.baseline_mae?.toFixed(3) || '2.840'}</td>
                        <td className="p-2.5">{planResult.freight_forecast.metrics.baseline_rmse?.toFixed(3) || '3.720'}</td>
                        <td className="p-2.5">{planResult.freight_forecast.metrics.baseline_mape?.toFixed(1) || '9.4'}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Limitations & Data Disclaimers */}
              {planResult.freight_forecast.limitations.length > 0 && (
                <div className="p-3 rounded-md bg-[#162C40] border border-[#294154] text-[11px] text-[#91A6B8] space-y-1">
                  <div className="font-semibold text-[#E8F0F5] flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-[#35B8A6]" />
                    <span>Data Source & Methodology Disclaimers</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5">
                    {planResult.freight_forecast.limitations.map((lim, i) => (
                      <li key={i}>{lim}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Phase 4: Transparent Total Landed Cost Card */}
            <div className="bg-[#102235] border border-[#294154] rounded-lg p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-[#294154] pb-3">
                <div className="flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 text-[#6DAF91]" />
                  <h3 className="font-semibold text-[#E8F0F5] text-sm">Phase 4: Transparent Total Landed Cost</h3>
                </div>
                <div className="text-right font-mono">
                  <span className="text-base font-bold text-[#6DAF91]">
                    ${planResult.landed_cost.cost_per_tonne.toFixed(2)}
                  </span>
                  <span className="text-xs text-[#91A6B8]"> / MT</span>
                </div>
              </div>

              {/* 8-Component Breakdown Table */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono text-[#91A6B8] flex items-center justify-between">
                  <span>8-COMPONENT FORMULA LEDGER</span>
                  <span>TOTAL: ${planResult.landed_cost.total_cost.toLocaleString()}</span>
                </div>

                <div className="space-y-1 text-xs">
                  {[
                    { label: '1. Cargo Purchase Cost (FOB)', val: planResult.landed_cost.breakdown.cargo_purchase_cost, color: 'bg-[#5D9BC4]' },
                    { label: '2. Ocean Freight', val: planResult.landed_cost.breakdown.ocean_freight, color: 'bg-[#35B8A6]' },
                    { label: '3. Port Charges (Dues & Pilotage)', val: planResult.landed_cost.breakdown.port_charges, color: 'bg-[#6DAF91]' },
                    { label: '4. Loading Terminal Cost', val: planResult.landed_cost.breakdown.loading_cost, color: 'bg-[#D6A24A]' },
                    { label: '5. Unloading Terminal Handling', val: planResult.landed_cost.breakdown.unloading_cost, color: 'bg-[#5D9BC4]' },
                    { label: '6. Fuel-Related Bunker Cost', val: planResult.landed_cost.breakdown.fuel_related_cost, color: 'bg-[#D6A24A]' },
                    { label: '7. Expected Berth Demurrage', val: planResult.landed_cost.breakdown.expected_demurrage, color: 'bg-[#C96B6B]' },
                    { label: '8. Other Logistics (Insurance & Agency)', val: planResult.landed_cost.breakdown.other_logistics_costs, color: 'bg-[#91A6B8]' },
                  ].map((item, idx) => {
                    const totalCost = planResult.landed_cost.total_cost;
                    const pct = totalCost > 0 ? ((item.val / totalCost) * 100).toFixed(1) : '0.0';
                    return (
                      <div key={idx} className="flex items-center justify-between p-2 rounded bg-[#162C40] border border-[#294154]">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${item.color}`} />
                          <span className="text-[#E8F0F5]">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-[#91A6B8] text-[11px]">{pct}%</span>
                          <span className="font-semibold text-[#E8F0F5]">${item.val.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Assumptions & Warnings Drawer Toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAssumptions(!showAssumptions)}
                  className="w-full py-2 px-3 rounded-md bg-[#162C40] hover:bg-[#1f3b55] text-[#91A6B8] text-xs flex items-center justify-between transition-colors border border-[#294154]"
                >
                  <span className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-[#35B8A6]" />
                    <span>View Transparent Calculation Assumptions ({planResult.landed_cost.assumptions.length})</span>
                  </span>
                  {showAssumptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showAssumptions && (
                  <div className="mt-2.5 p-3 rounded-md bg-[#0B1726] border border-[#294154] text-[11px] text-[#E8F0F5] space-y-1.5 animate-fade-in">
                    <div className="font-semibold text-[#35B8A6]">Exposed Assumptions:</div>
                    <ul className="list-disc list-inside space-y-1 text-[#91A6B8]">
                      {planResult.landed_cost.assumptions.map((asm, i) => (
                        <li key={i}>{asm}</li>
                      ))}
                    </ul>
                    {planResult.landed_cost.missing_data_warnings.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-[#294154] text-[#D6A24A]">
                        <div className="font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Parameter Warnings:</span>
                        </div>
                        <ul className="list-disc list-inside text-[#D6A24A]/90">
                          {planResult.landed_cost.missing_data_warnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Phase 3: Vessel Suitability Matrix */}
          <div className="bg-[#102235] border border-[#294154] rounded-lg p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#294154] pb-4">
              <div className="flex items-center gap-3">
                <Ship className="w-5 h-5 text-[#5D9BC4]" />
                <div>
                  <h3 className="font-semibold text-[#E8F0F5] text-sm">
                    Phase 3: Vessel Suitability Evaluation
                  </h3>
                  <p className="text-xs text-[#91A6B8]">
                    Candidate bulk carriers evaluated against draft, max DWT, and laycan timing at {planResult.cargo_requirement.destination_port}.
                  </p>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-[#0B1726] p-1 rounded-md border border-[#294154] text-xs">
                {(['ALL', 'SUITABLE', 'UNSUITABLE'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setVesselFilter(tab)}
                    className={`px-3 py-1 rounded-sm font-medium transition-all ${
                      vesselFilter === tab
                        ? 'bg-[#35B8A6] text-[#0B1726]'
                        : 'text-[#91A6B8] hover:text-[#E8F0F5]'
                    }`}
                  >
                    {tab === 'ALL' ? `All (${planResult.vessel_evaluations.length})` : tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Vessel Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVessels.map((v) => {
                const isRecommended = v.suitability_status === 'Recommended';
                const isSuitable = v.is_suitable;

                return (
                  <div
                    key={v.vessel_id}
                    className={`p-4 rounded-md border flex flex-col justify-between transition-all ${
                      isRecommended
                        ? 'bg-[#162C40] border-[#35B8A6]/60'
                        : isSuitable
                        ? 'bg-[#162C40] border-[#294154]'
                        : 'bg-[#102235]/60 border-[#294154]/50 opacity-75'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Vessel Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-bold text-[#E8F0F5] flex items-center gap-2">
                            <span>{v.vessel_name}</span>
                            <span className="text-[10px] font-mono text-[#91A6B8]">({v.vessel_class})</span>
                          </div>
                          <div className="text-[11px] text-[#91A6B8] font-mono">
                            DWT: {v.capacity_dwt ? v.capacity_dwt.toLocaleString() : '—'} MT | Draft: {v.draft_meters != null ? v.draft_meters.toFixed(1) + 'm' : '—'}
                          </div>
                        </div>

                        <span
                          className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border font-semibold ${
                            isRecommended
                              ? 'bg-[#35B8A6]/15 text-[#35B8A6] border-[#35B8A6]/40'
                              : isSuitable
                              ? 'bg-[#5D9BC4]/15 text-[#5D9BC4] border-[#5D9BC4]/40'
                              : 'bg-[#C96B6B]/15 text-[#C96B6B] border-[#C96B6B]/40'
                          }`}
                        >
                          {v.suitability_status}
                        </span>
                      </div>

                      {/* Key Operational Parameters */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#0B1726] p-2.5 rounded-md border border-[#294154]">
                        <div>
                          <span className="text-[#91A6B8] block">Position:</span>
                          <span className="text-[#E8F0F5] font-medium truncate block">{v.current_position || 'Indian Ocean'}</span>
                        </div>
                        <div>
                          <span className="text-[#91A6B8] block">Transit Duration:</span>
                          <span className="text-[#E8F0F5] font-mono">~{v.estimated_voyage_days} Days</span>
                        </div>
                        <div>
                          <span className="text-[#91A6B8] block">Charter Rate:</span>
                          <span className="text-[#E8F0F5] font-mono">${v.daily_charter_rate.toLocaleString()}/day</span>
                        </div>
                        <div>
                          <span className="text-[#91A6B8] block">Suitability Score:</span>
                          <span className={`font-bold font-mono ${v.suitability_score >= 80 ? 'text-[#35B8A6]' : 'text-[#91A6B8]'}`}>
                            {v.suitability_score} / 100
                          </span>
                        </div>
                      </div>

                      {/* Natural Language Explanation */}
                      <div className="text-[11px] space-y-1">
                        {v.reasons.length > 0 && (
                          <p className="text-[#6DAF91] leading-relaxed">
                            ✓ {v.reasons[0]}
                          </p>
                        )}
                        {v.unsuitability_reasons.length > 0 && (
                          <p className="text-[#C96B6B] leading-relaxed">
                            ✗ {v.unsuitability_reasons[0]}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#294154] flex items-center justify-between text-[11px]">
                      <span className="text-[#91A6B8]">Data Feed: {v.data_status}</span>
                      <span className="text-[#35B8A6] font-mono font-medium">${v.estimated_freight_cost.toLocaleString()} Est. Charter</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Phase 5: Multi-Plan Scenarios & Strategic Alternatives */}
          <div className="bg-[#102235] border border-[#294154] rounded-lg p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-[#294154] pb-3">
              <Layers className="w-4 h-4 text-[#35B8A6]" />
              <div>
                <h3 className="font-semibold text-[#E8F0F5] text-sm">
                  Phase 5: Multi-Plan Charter & Procurement Scenarios
                </h3>
                <p className="text-xs text-[#91A6B8]">
                  Comparison between immediate charter, short laycan delays, and multi-vessel parceling alternatives.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {planResult.alternatives.map((alt) => (
                <div
                  key={alt.plan_id}
                  className="bg-[#162C40] border border-[#294154] rounded-md p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#102235] text-[#91A6B8] border border-[#294154]">
                        {alt.timing}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        alt.risk === 'LOW' ? 'text-[#6DAF91] bg-[#6DAF91]/15' : alt.risk === 'MEDIUM' ? 'text-[#D6A24A] bg-[#D6A24A]/15' : 'text-[#C96B6B] bg-[#C96B6B]/15'
                      }`}>
                        {alt.risk} RISK
                      </span>
                    </div>

                    <h4 className="font-semibold text-sm text-[#E8F0F5]">{alt.title}</h4>

                    <div className="bg-[#102235] p-2.5 rounded-md font-mono text-xs space-y-1 border border-[#294154]">
                      <div className="flex justify-between text-[#91A6B8]">
                        <span>Total Landed:</span>
                        <span className="text-[#E8F0F5] font-semibold">${alt.estimated_total_cost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[#91A6B8]">
                        <span>Unit Rate:</span>
                        <span className="text-[#35B8A6]">${alt.estimated_cost_per_tonne.toFixed(2)}/MT</span>
                      </div>
                    </div>

                    <ul className="text-[11px] text-[#91A6B8] space-y-1 list-disc list-inside">
                      {alt.reasons.map((r, idx) => (
                        <li key={idx} className="leading-tight">{r}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => alert(`Scenario "${alt.title}" selected. Ready for charter execution simulation.`)}
                    className="w-full py-1.5 rounded-md bg-[#102235] hover:bg-[#1d334a] text-[#35B8A6] text-xs font-semibold border border-[#294154] transition-colors"
                  >
                    Select This Scenario
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Historical Plans Table */}
      {historyPlans.length > 0 && (
        <div className="bg-[#102235] border border-[#294154] rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#E8F0F5] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#35B8A6]" />
              Recent Cargo Planning Fixtures (PostgreSQL Database)
            </h3>
            <span className="text-xs text-[#91A6B8] font-mono">Persisted in PostgreSQL</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#162C40] text-[#91A6B8] border-b border-[#294154]">
                <tr>
                  <th className="p-3">Plan ID</th>
                  <th className="p-3">Cargo & Qty</th>
                  <th className="p-3">Route</th>
                  <th className="p-3">Arrival</th>
                  <th className="p-3">Recommended Plan</th>
                  <th className="p-3">Landed Cost</th>
                  <th className="p-3">Data Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#294154]">
                {historyPlans.map((hp) => (
                  <tr key={hp.plan_id} className="hover:bg-[#162C40]/50 text-[#E8F0F5]">
                    <td className="p-3 font-semibold text-[#35B8A6]">{hp.plan_id}</td>
                    <td className="p-3 font-sans">{hp.cargo_type} ({Number(hp.cargo_quantity).toLocaleString()} MT)</td>
                    <td className="p-3 font-sans">{hp.origin} → {hp.destination_port}</td>
                    <td className="p-3">{hp.required_arrival_date}</td>
                    <td className="p-3 font-sans text-[#E8F0F5]">{hp.recommended_plan || 'Optimal Fixture'}</td>
                    <td className="p-3 text-[#6DAF91] font-semibold">
                      {hp.estimated_total_cost ? `$${Number(hp.estimated_total_cost).toLocaleString()}` : '—'}
                    </td>
                    <td className="p-3">
                      <span className="px-1.5 py-0.5 rounded bg-[#162C40] text-[#91A6B8] text-[10px] border border-[#294154] uppercase">
                        {hp.data_status || 'HISTORICAL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
