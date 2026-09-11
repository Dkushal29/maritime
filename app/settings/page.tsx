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

      <div className="p-6 bg-[#102235] border border-[#294154] rounded-lg space-y-6">
        <div className="flex items-center justify-between border-b border-[#294154] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-[#162C40] border border-[#294154] text-[#35B8A6]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8F0F5]">Enterprise System Preferences</h2>
              <p className="text-xs text-[#91A6B8] font-mono">
                Configure global trading defaults, units, currencies, and model hyper-parameters.
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#35B8A6] hover:bg-[#35B8A6]/90 text-[#0B1726] font-bold text-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>

        {/* Section 1: Default Scenario Configuration */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-semibold text-[#35B8A6] uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            Default Scenarios &amp; Filter Locks
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div>
              <label className="text-[#91A6B8] font-semibold block mb-1">Default Import Origin</label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value as any)}
                className="w-full px-3 py-2 rounded-md bg-[#0B1726] border border-[#294154] text-[#E8F0F5] font-mono outline-none"
              >
                <option value="Australia">Australia</option>
                <option value="Indonesia">Indonesia</option>
                <option value="South Africa">South Africa</option>
              </select>
            </div>

            <div>
              <label className="text-[#91A6B8] font-semibold block mb-1">Default Discharge Port</label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value as any)}
                className="w-full px-3 py-2 rounded-md bg-[#0B1726] border border-[#294154] text-[#E8F0F5] font-mono outline-none"
              >
                <option value="Visakhapatnam">Visakhapatnam</option>
                <option value="Paradip">Paradip</option>
                <option value="Chennai">Chennai</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Units & Display Preferences */}
        <div className="space-y-3 pt-4 border-t border-[#294154]">
          <h3 className="text-xs font-mono font-semibold text-[#35B8A6] uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Currency &amp; Measurement Units
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[#91A6B8] font-semibold block mb-1">Display Currency</label>
              <div className="flex gap-2">
                {(['USD', 'INR'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrency(c)}
                    className={`flex-1 py-2 rounded-md font-mono font-semibold text-xs border transition-colors ${
                      currency === c
                        ? 'bg-[#162C40] text-[#35B8A6] border-[#35B8A6]/40'
                        : 'bg-[#0B1726] text-[#91A6B8] border-[#294154]'
                    }`}
                  >
                    {c} ({c === 'USD' ? '$' : '₹'})
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[#91A6B8] font-semibold block mb-1">Cargo Weight Unit</label>
              <div className="flex gap-2">
                {(['Metric Tonnes', 'Long Tons'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`flex-1 py-2 rounded-md font-mono font-semibold text-xs border transition-colors ${
                      unit === u
                        ? 'bg-[#162C40] text-[#35B8A6] border-[#35B8A6]/40'
                        : 'bg-[#0B1726] text-[#91A6B8] border-[#294154]'
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
        <div className="space-y-3 pt-4 border-t border-[#294154]">
          <h3 className="text-xs font-mono font-semibold text-[#35B8A6] uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            AI Model Risk Profile
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {(['Conservative', 'Balanced', 'Aggressive'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setRiskTolerance(t)}
                className={`p-3 rounded-md border text-left font-mono transition-colors ${
                  riskTolerance === t
                    ? 'bg-[#162C40] text-[#35B8A6] border-[#35B8A6]/40'
                    : 'bg-[#0B1726] text-[#91A6B8] border-[#294154]'
                }`}
              >
                <span className="text-xs font-bold block">{t}</span>
                <span className="text-[10px] text-[#91A6B8] block mt-1">
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
