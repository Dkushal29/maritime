'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { getSourcesStatus } from '@/lib/api';
import { SourcesStatusResponse, SourceStatusItem, DataStatus } from '@/types';

export default function SourcesPage() {
  const [sourcesData, setSourcesData] = useState<SourcesStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<string>('');

  const fetchStatus = () => {
    setIsLoading(true);
    getSourcesStatus()
      .then((res) => {
        setSourcesData(res);
        setLastChecked(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Sources status fetch error:', err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const renderNaturalStatus = (status: DataStatus, errorMsg?: string | null) => {
    if (status === 'LIVE') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#35B8A6] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#35B8A6]" />
          Live
        </span>
      );
    }
    if (status === 'HISTORICAL' || status === 'CACHED') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5D9BC4] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5D9BC4]" />
          Configured
        </span>
      );
    }
    if (status === 'SIMULATED') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D6A24A] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D6A24A]" />
          Calibrated fallback
        </span>
      );
    }
    // UNAVAILABLE
    if (errorMsg && errorMsg.toLowerCase().includes('subscription')) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#91A6B8] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#91A6B8]" />
          Subscription required
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C96B6B] shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-[#C96B6B]" />
        Unavailable
      </span>
    );
  };

  const sources = sourcesData?.sources || [];
  const liveCount = sources.filter((s) => s.status === 'LIVE').length;
  const isOverallLive = sourcesData?.overall_data_mode === 'LIVE';

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12 animate-fade-in">
      {/* 1. Clear Page Heading with Restrained Hierarchy */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 pb-4 border-b border-[#294154]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#E8F0F5] tracking-tight m-0">
            Data Sources & Ingestion Provenance
          </h1>
          <p className="text-xs sm:text-sm text-[#91A6B8] mt-1 m-0 font-sans">
            Audit trail, update cadences, and connector health for external maritime telemetry, weather buoys, and commodity benchmarks.
          </p>
        </div>
        <div className="text-xs text-[#91A6B8] shrink-0 font-sans">
          Active feeds: <span className="font-semibold text-[#35B8A6]">{liveCount}</span> of {sources.length || 6} live
        </div>
      </div>

      {/* 2. Top Runtime Banner (Simplified Operational Layout) */}
      <div className="bg-[#102235] border border-[#294154] rounded-lg p-5 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="text-[#91A6B8] font-normal">Runtime data mode</span>
            <span className="text-[#294154]">|</span>
            {isOverallLive ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-[#35B8A6]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#35B8A6]" />
                Live API data mode
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-medium text-[#D6A24A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D6A24A]" />
                Calibrated fallback mode
              </span>
            )}
          </div>
          <p className="text-xs text-[#91A6B8] leading-relaxed m-0 font-sans">
            Every external request is audited and recorded. Live data is used only when the relevant provider is configured.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {lastChecked && (
            <span className="text-xs text-[#91A6B8] font-sans">
              Last checked: <span className="font-mono text-[#E8F0F5]">{lastChecked}</span>
            </span>
          )}
          <button
            onClick={fetchStatus}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#162C40] hover:bg-[#1a3750] text-[#35B8A6] border border-[#294154] hover:border-[#35B8A6]/40 text-xs font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Audit feeds
          </button>
        </div>
      </div>

      {/* 3. Structured Six-Card Provider Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map((src) => (
          <div
            key={src.name}
            className="bg-[#102235] hover:bg-[#162C40]/80 rounded-lg p-5 sm:p-6 border border-[#294154] transition-colors flex flex-col justify-between"
          >
            <div>
              {/* Top Row: Provider Name and Status */}
              <div className="flex items-start justify-between gap-3 min-h-[28px]">
                <h3 className="font-sans font-semibold text-sm text-[#E8F0F5] m-0 leading-snug">
                  {src.name}
                </h3>
                {renderNaturalStatus(src.status, src.error_message)}
              </div>

              {/* Short Provider Description */}
              <p className="text-xs text-[#91A6B8] mt-1 mb-3 font-sans">
                {src.category} • <span className="text-[#E8F0F5]/80">{src.provider}</span>
                {src.latency_ms !== null && src.latency_ms !== undefined && (
                  <span className="font-mono text-[#35B8A6] text-[11px] ml-2">
                    ({src.latency_ms} ms)
                  </span>
                )}
              </p>

              {/* Optional Warning Message (Amber Left Border Panel) */}
              {src.error_message && (
                <div className="mb-3 px-3 py-2 rounded-r-md bg-[#162C40] border-l-2 border-l-[#D6A24A] border-y border-r border-[#294154] text-[11px] text-[#D6A24A] leading-relaxed flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#D6A24A]" />
                  <span>{src.error_message}</span>
                </div>
              )}
            </div>

            {/* Bottom Section */}
            <div className="space-y-3 pt-3 border-t border-[#294154] mt-3">
              {/* Two-Column Metadata Area: Update Cadence & Last Sync */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block text-[11px] text-[#91A6B8] font-normal font-sans">Update cadence</span>
                  <span className="text-[#E8F0F5] font-medium text-xs mt-0.5 block font-sans">
                    {src.freq}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-[#91A6B8] font-normal font-sans">Last sync</span>
                  <span className="text-[#E8F0F5] font-mono text-[11px] mt-0.5 block">
                    {src.last_updated
                      ? new Date(src.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' UTC'
                      : '—'}
                  </span>
                </div>
              </div>

              {/* Coverage Tags */}
              <div>
                <span className="block text-[11px] text-[#91A6B8] mb-1.5 font-normal font-sans">Coverage scope</span>
                <div className="flex flex-wrap gap-1.5">
                  {src.coverage.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded text-[11px] text-[#91A6B8] bg-[#0B1726] border border-[#294154]"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
