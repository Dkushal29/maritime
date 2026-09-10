'use client';

import React, { useState } from 'react';
import { X, Send, Bot, Sparkles, User, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  reasoningPoints?: string[];
}

const presetQueries = [
  'Why are freight rates increasing?',
  'Should I charter now?',
  'Which route is cheapest?',
  'What happens if bunker prices rise 15%?',
  'How much coal should I procure?',
];

export default function AICopilotDrawer() {
  const { isCopilotOpen, setCopilotOpen, origin, destination, cargo, vesselType } = useAppStore();
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: `Hello! I am your Freight AI Copilot. I am currently monitoring the active scenario: ${origin} → ${destination} | ${cargo} | ${vesselType}. Ask me anything about freight forecasts, chartering windows, or cargo demand!`,
      timestamp: 'Just now',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  if (!isCopilotOpen) return null;

  const handleSend = (textToSend?: string) => {
    const queryText = textToSend || inputQuery;
    if (!queryText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsTyping(true);

    // AI Reasoning engine simulation grounded in scenario mock data
    setTimeout(() => {
      let aiText = '';
      let points: string[] | undefined = undefined;

      const lower = queryText.toLowerCase();

      if (lower.includes('why') && lower.includes('increas')) {
        aiText = `Freight rates on ${origin} → ${destination} are projected to rise from $31.8/MT to $35.4/MT (+11.3%) due to three primary compounding drivers:`;
        points = [
          'Port Congestion (34% weight): East Coast India ports averaging 3.8-day delays creating vessel turn-around bottlenecks.',
          'Bunker Fuel Surge (28% weight): Singapore VLSFO price climbing to $620/MT (+4.8%).',
          'Vessel Availability Tightening (18% weight): Open Panamax tonnage in the Bay of Bengal down 22% month-over-month.',
        ];
      } else if (lower.includes('should i charter') || lower.includes('charter now')) {
        aiText = `Yes, our MILP Optimization Engine strongly recommends chartering within 7 days.`;
        points = [
          'Expected landed freight: $32.4/MT if chartered within 7 days vs $35.4/MT in 30 days.',
          'Estimated Net Savings: $420,000 across your 230,000 MT coal shipment requirement.',
          'Vessel Fit Recommendation: MV Ocean Star (94% fit) & MV Southern Cross (91% fit) are currently open with ideal laycans.',
        ];
      } else if (lower.includes('cheapest') || lower.includes('route')) {
        aiText = `Based on our route analytics engine, Paradip currently offers the lowest landed cost for bulk imports:`;
        points = [
          'Australia → Paradip: $30.9/MT freight rate ($141.2/MT landed cost) with low port congestion.',
          'Australia → Visakhapatnam: $31.8/MT freight rate ($142.8/MT landed cost) with medium congestion.',
          'Indonesia → Paradip: $19.4/MT freight rate (short haul, lower caloric grade coal).',
        ];
      } else if (lower.includes('bunker') || lower.includes('15%')) {
        aiText = `If bunker fuel prices rise by +15% (to ~$713/MT):`;
        points = [
          'Freight rate impact: Estimated +$3.20/MT increase on Australia → Visakhapatnam (to ~$38.6/MT).',
          'Total Voyage Cost: Increases total 230k MT charter budget requirement by approx $736,000.',
          'Recommendation: Lock in fuel surcharge hedges or execute charter contracts before bunker adjustments take effect.',
        ];
      } else if (lower.includes('procure') || lower.includes('how much') || lower.includes('coal')) {
        aiText = `Cargo Demand Forecasting recommends procuring approximately 150,000 MT of coal within the next 10 days:`;
        points = [
          'Current stock at Visakhapatnam terminal: 82,000 MT (provides only 11 days of plant coverage).',
          'Projected 30-day demand: 230,000 MT (+8.4% demand surge from regional steel production).',
          'Procurement timing avoids the late-month $35.4/MT freight spike.',
        ];
      } else {
        aiText = `I have analyzed the current market parameters for ${cargo} on the ${origin} → ${destination} route. Freight rates are trending upward to $35.4/MT (+11.3%). We recommend executing vessel charter within 7 days to secure $420,000 in net cost savings.`;
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiText,
        reasoningPoints: points,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-[#131C31] border-l border-[#1E293B] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-[#0B1120] border-b border-[#1E293B]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>Freight AI Copilot</span>
              <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                XGBoost v1.0
              </span>
            </h3>
            <p className="text-[10px] font-mono text-slate-400">Scoped to {origin} → {destination}</p>
          </div>
        </div>
        <button
          onClick={() => setCopilotOpen(false)}
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-[#131C31]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Preset Queries Pills */}
      <div className="p-3 bg-[#090E1C] border-b border-[#1E293B] overflow-x-auto">
        <span className="text-[10px] font-mono text-slate-400 uppercase mb-1.5 block">Suggested Queries:</span>
        <div className="flex flex-wrap gap-1.5">
          {presetQueries.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-full bg-[#131C31] hover:bg-cyan-500/20 border border-[#1E293B] hover:border-cyan-500/40 text-[11px] text-slate-300 hover:text-cyan-300 transition-colors text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn('flex flex-col max-w-[90%]', msg.sender === 'user' ? 'ml-auto items-end' : 'items-start')}
          >
            <div
              className={cn(
                'p-3 rounded-xl text-xs space-y-2',
                msg.sender === 'user'
                  ? 'bg-cyan-500 text-slate-950 font-medium rounded-br-none'
                  : 'bg-[#0B1120] border border-[#1E293B] text-slate-200 rounded-bl-none'
              )}
            >
              <p className="leading-relaxed">{msg.text}</p>

              {msg.reasoningPoints && (
                <div className="space-y-1.5 pt-2 border-t border-[#1E293B]">
                  {msg.reasoningPoints.map((pt, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[9px] font-mono text-slate-500 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#0B1120] border border-[#1E293B] text-xs text-slate-400 w-fit">
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>Analyzing XGBoost model &amp; MILP solver...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-3 bg-[#0B1120] border-t border-[#1E293B]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask Freight AI Copilot..."
            className="flex-1 px-3 py-2 rounded-lg bg-[#131C31] border border-[#1E293B] text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-500/50"
          />
          <button
            type="submit"
            className="p-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
