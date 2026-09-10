'use client';

import React, { useState } from 'react';
import GlobalFilterBar from '@/components/GlobalFilterBar';
import { Settings, Save, User, Bell, Sliders, DollarSign, Scale, Cpu } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function SettingsPage() {
  const { origin, destination, cargo, vesselType, setOrigin, setDestination, setCargo, setVesselType } = useAppStore();

  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [unit, setUnit] = useState<'Metric Tonnes' | 'Long Tons'>('Metric Tonnes');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [riskTolerance, setRiskTolerance] = useState<'Conservative' | 'Balanced' | 'Aggressive'>('Balanced');

  const handleSave = () => {
    alert('Settings and default preferences saved successfully!');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <GlobalFilterBar />

      <div className="p-6 bg-[#131C31] border border-[#1E293B] rounded-xl shadow-md space-y-6">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Enterprise System Preferences</h2>
              <p className="text-xs text-slate-400 font-mono">
                Configure global trading defaults, units, currencies, and model hyper-parameters.
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>

        {/* Section 1: Default Scenario Configuration */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            Default Scenarios &amp; Filter Locks
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Default Import Origin</label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-[#1E293B] text-slate-100 font-mono outline-none"
              >
                <option value="Australia">Australia</option>
                <option value="Indonesia">Indonesia</option>
                <option value="South Africa">South Africa</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Default Discharge Port</label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-[#1E293B] text-slate-100 font-mono outline-none"
              >
                <option value="Visakhapatnam">Visakhapatnam</option>
                <option value="Paradip">Paradip</option>
                <option value="Chennai">Chennai</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Units & Display Preferences */}
        <div className="space-y-3 pt-4 border-t border-[#1E293B]">
          <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Currency &amp; Measurement Units
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Display Currency</label>
              <div className="flex gap-2">
                {(['USD', 'INR'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrency(c)}
                    className={`flex-1 py-2 rounded-lg font-mono font-bold border transition-colors ${
                      currency === c
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-[#0B1120] text-slate-400 border-[#1E293B]'
                    }`}
                  >
                    {c} ({c === 'USD' ? '$' : '₹'})
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Cargo Weight Unit</label>
              <div className="flex gap-2">
                {(['Metric Tonnes', 'Long Tons'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`flex-1 py-2 rounded-lg font-mono font-bold border transition-colors ${
                      unit === u
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-[#0B1120] text-slate-400 border-[#1E293B]'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Model Risk Hyperparameters */}
        <div className="space-y-3 pt-4 border-t border-[#1E293B]">
          <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            AI Model Risk Profile
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {(['Conservative', 'Balanced', 'Aggressive'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setRiskTolerance(t)}
                className={`p-3 rounded-lg border text-left font-mono transition-all ${
                  riskTolerance === t
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                    : 'bg-[#0B1120] text-slate-400 border-[#1E293B]'
                }`}
              >
                <span className="text-xs font-bold block">{t}</span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {t === 'Conservative'
                    ? 'Minimizes rate volatility exposure'
                    : t === 'Balanced'
                    ? 'Optimal rate vs timing trade-off'
                    : 'Maximizes potential spot savings'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
