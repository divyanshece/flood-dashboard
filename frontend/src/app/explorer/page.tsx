'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import { useAuth } from '@/components/auth/AuthProvider';
import { FloodEvent } from '@/types/event';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then((mod) => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

interface Stats {
  eventCount: number;
  totalAffected: number;
  totalDeaths: number;
  totalDisplaced: number;
  totalInjured: number;
  avgRainfall: number | null;
  maxRainfall: number | null;
  minRainfall: number | null;
  avgAffected: number | null;
  maxAffected: number | null;
  cityCount: number;
  yearCount: number;
  totalRainfall?: number;
  dateRange: { earliest: string; latest: string };
}

interface Breakdowns {
  byYear: { year: string; count: number; affected: number }[];
  byCity: { city: string; count: number; affected: number; avg_rainfall: number }[];
  byFloodType: { flood_type: string; count: number }[];
}

interface SearchResult {
  events: FloodEvent[];
  stats: Stats | null;
  breakdowns: Breakdowns | null;
  interpretation?: string;
  total?: number;
  error?: string;
}

interface ConversationItem {
  id: string;
  type: 'query' | 'result';
  query?: string;
  result?: SearchResult;
  timestamp: Date;
}

const suggestedQueries = [
  { text: "How many floods occurred in Hyderabad in 2024?", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { text: "Show floods in Kukatpally with highest rainfall", icon: "M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" },
  { text: "Events with more than 1000 people affected", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { text: "Compare floods since 2020 by city", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
];

function BarChart({ data, labelKey, valueKey, color = 'var(--accent-primary)' }: { data: any[]; labelKey: string; valueKey: string; color?: string }) {
  const maxValue = Math.max(...data.map(d => d[valueKey] || 0));
  return (
    <div className="space-y-2">
      {data.slice(0, 8).map((item, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <div className="w-20 text-xs font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{item[labelKey] || 'Unknown'}</div>
          <div className="flex-1 h-5 rounded-md overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
            <div className="h-full rounded-md" style={{ width: `${maxValue ? (item[valueKey] / maxValue) * 100 : 0}%`, background: color, minWidth: item[valueKey] > 0 ? '4px' : '0' }} />
          </div>
          <div className="w-12 text-xs font-bold text-right" style={{ color: 'var(--text-primary)' }}>{item[valueKey]?.toLocaleString() || 0}</div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data, labelKey, valueKey }: { data: any[]; labelKey: string; valueKey: string }) {
  const total = data.reduce((sum, d) => sum + (d[valueKey] || 0), 0);
  const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
  let currentAngle = 0;
  const segments = data.slice(0, 6).map((item, idx) => {
    const percentage = total ? (item[valueKey] / total) * 100 : 0;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return { ...item, percentage, startAngle, angle, color: colors[idx % colors.length] };
  });

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          {segments.map((seg, idx) => {
            const radius = 40;
            const circumference = 2 * Math.PI * radius;
            return (
              <circle key={idx} cx="50" cy="50" r={radius} fill="none" stroke={seg.color} strokeWidth="20"
                strokeDasharray={`${(seg.angle / 360) * circumference} ${circumference}`}
                strokeDashoffset={-(seg.startAngle / 360) * circumference} />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{total}</p>
        </div>
      </div>
      <div className="flex-1 space-y-1">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: seg.color }} />
            <span className="text-xs flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>{seg[labelKey] || 'Unknown'}</span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{seg.percentage.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// FloodLens Logo Component
function FloodLensLogo({ size = 36 }: { size?: number }) {
  return (
    <div
      className="rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, background: 'var(--accent-gradient)' }}
    >
      <svg className="text-white" style={{ width: size * 0.5, height: size * 0.5 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  );
}

export default function ExplorerPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'map' | 'charts' | 'data'>('summary');
  const [mapReady, setMapReady] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const hasConversation = conversation.length > 0;
  const latestResult = useMemo(() => {
    for (let i = conversation.length - 1; i >= 0; i--) {
      if (conversation[i].type === 'result' && conversation[i].result) return conversation[i].result;
    }
    return null;
  }, [conversation]);

  useEffect(() => { if (!authLoading && !user) router.push('/'); }, [user, authLoading, router]);
  useEffect(() => { setMapReady(true); }, []);
  useEffect(() => {
    if (conversationEndRef.current && hasConversation) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation, hasConversation]);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    const queryItem: ConversationItem = { id: `query-${Date.now()}`, type: 'query', query: q, timestamp: new Date() };
    setConversation(prev => [...prev, queryItem]);
    setQuery('');
    setIsSearching(true);
    setActiveTab('summary');

    try {
      const response = await fetch('/api/nl-query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q }) });
      const data = await response.json();
      setConversation(prev => [...prev, { id: `result-${Date.now()}`, type: 'result', result: data, timestamp: new Date() }]);
    } catch {
      setConversation(prev => [...prev, { id: `result-${Date.now()}`, type: 'result', result: { events: [], stats: null, breakdowns: null, error: 'Failed to search.' }, timestamp: new Date() }]);
    } finally {
      setIsSearching(false);
    }
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '—';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr || dateStr === 'UNAVAILABLE') return 'Unknown';
    try { return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return dateStr; }
  };

  const clearConversation = () => { setConversation([]); setActiveTab('summary'); };

  const eventsWithLocation = useMemo(() => latestResult?.events?.filter(e => e.latitude && e.longitude) || [], [latestResult]);
  const totalRainfall = useMemo(() => latestResult?.events?.reduce((sum, e) => sum + (e.rainfall_mm || 0), 0) || 0, [latestResult]);

  if (authLoading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin w-12 h-12 border-4 rounded-full" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Header />

      <main ref={mainContentRef} className="flex-1 flex flex-col overflow-hidden">
        {/* Initial State */}
        {!hasConversation && (
          <div className="flex-1 flex overflow-auto">
            {/* Sidebar with templates */}
            <div className="hidden lg:flex w-64 flex-col p-4 border-r" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-secondary)' }}>
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Quick Templates</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Yearly trends', query: 'Show flood trends by year since 2018' },
                    { label: 'High rainfall events', query: 'Events with rainfall more than 100mm' },
                    { label: 'Recent floods', query: 'Floods in 2024 and 2025' },
                    { label: 'Most affected areas', query: 'Areas with most people affected' },
                  ].map((template) => (
                    <button
                      key={template.label}
                      onClick={() => { setQuery(template.query); handleSearch(template.query); }}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all hover:scale-[1.02]"
                      style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Filter by Location</h3>
                <div className="space-y-2">
                  {['Kukatpally', 'LB Nagar', 'Secunderabad', 'Miyapur'].map((loc) => (
                    <button
                      key={loc}
                      onClick={() => { setQuery(`Floods in ${loc}`); handleSearch(`Floods in ${loc}`); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all"
                      style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
                    >
                      📍 {loc}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-auto">
                <div className="p-3 rounded-xl" style={{ background: 'var(--accent-muted)' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--accent-primary)' }}>Pro Tip</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Try combining filters like "floods in Kukatpally with rainfall above 50mm"
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
              <div className="w-full max-w-3xl">
                {/* Logo and Title SIDE BY SIDE */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-gradient)' }}>
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </div>
                  <h1 className="text-3xl lg:text-4xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>Flood Data Explorer</h1>
                </div>

                {/* Tagline as a question */}
                <p className="text-lg text-center mb-10" style={{ color: 'var(--text-secondary)' }}>
                  How can I help you analyze flood data today?
                </p>

                {/* Search bar - pill shaped, clean single border */}
                <div
                  className="flex items-center mb-8 rounded-full overflow-hidden"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: inputFocused ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
                  }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="Ask anything... e.g., 'How many floods in 2024?'"
                    className="flex-1 px-6 py-4 text-base bg-transparent outline-none border-none"
                    style={{ color: 'var(--text-primary)' }}
                  />
                  <button
                    onClick={() => handleSearch()}
                    disabled={!query.trim()}
                    className="m-1.5 p-3 rounded-full transition-all disabled:opacity-30"
                    style={{ background: 'var(--accent-gradient)', color: 'white' }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestedQueries.map((sq) => (
                    <button key={sq.text} onClick={() => { setQuery(sq.text); handleSearch(sq.text); }} className="flex items-center gap-3 p-4 rounded-xl text-left transition-all hover:scale-[1.02]" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-muted)' }}>
                        <svg className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={sq.icon} /></svg>
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{sq.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Mode */}
        {hasConversation && (
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar with templates - also in chat mode */}
            <div className="hidden lg:flex w-64 flex-col p-4 border-r flex-shrink-0" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-secondary)' }}>
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Quick Templates</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Yearly trends', query: 'Show flood trends by year since 2018' },
                    { label: 'High rainfall events', query: 'Events with rainfall more than 100mm' },
                    { label: 'Recent floods', query: 'Floods in 2024 and 2025' },
                    { label: 'Most affected areas', query: 'Areas with most people affected' },
                  ].map((template) => (
                    <button
                      key={template.label}
                      onClick={() => { setQuery(template.query); handleSearch(template.query); }}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all hover:scale-[1.02]"
                      style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Filter by Location</h3>
                <div className="space-y-2">
                  {['Kukatpally', 'LB Nagar', 'Secunderabad', 'Miyapur'].map((loc) => (
                    <button
                      key={loc}
                      onClick={() => { setQuery(`Floods in ${loc}`); handleSearch(`Floods in ${loc}`); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all"
                      style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
                    >
                      📍 {loc}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-auto">
                <button
                  onClick={clearConversation}
                  className="w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: 'var(--danger-muted)', color: 'var(--danger)' }}
                >
                  🗑️ Clear Conversation
                </button>
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Scrollable Conversation Area */}
              <div className="flex-1 overflow-y-auto" style={{ paddingBottom: '120px' }}>
                <div className="max-w-4xl mx-auto px-4 py-6">
                {conversation.map((item, idx) => (
                  <div key={item.id} className="mb-6">
                    {item.type === 'query' ? (
                      /* USER MESSAGE - RIGHT SIDE */
                      <div className="flex justify-end">
                        <div className="flex items-start gap-3 max-w-[85%]">
                          <div className="px-4 py-3 rounded-2xl rounded-tr-md" style={{ background: 'var(--accent-primary)', color: 'white' }}>
                            <p className="text-sm font-medium">{item.query}</p>
                          </div>
                          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-tertiary)' }}>
                            <svg className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* FLOODLENS RESPONSE - LEFT SIDE */
                      <div className="flex items-start gap-3">
                        <FloodLensLogo size={36} />
                        <div className="flex-1 min-w-0">
                          {item.result?.error ? (
                            <div className="p-4 rounded-xl" style={{ background: 'var(--danger-muted)', border: '1px solid var(--danger)' }}>
                              <p style={{ color: 'var(--danger)' }}>{item.result.error}</p>
                            </div>
                          ) : item.result?.stats ? (
                            <>
                              {/* Interpretation Message - clickable to expand for older results */}
                              <p className="text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
                                {item.result.interpretation || `Found ${item.result.stats.eventCount} flood events matching your query.`}
                              </p>

                              {/* Summary stats for ALL results */}
                              <div className="flex flex-wrap gap-3 mb-3 text-xs">
                                <span className="px-2 py-1 rounded-md" style={{ background: 'var(--accent-muted)', color: 'var(--accent-primary)' }}>
                                  📊 {item.result.stats.eventCount} events
                                </span>
                                <span className="px-2 py-1 rounded-md" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                  👥 {formatNumber(item.result.stats.totalAffected)} affected
                                </span>
                                {item.result.stats.totalDeaths > 0 && (
                                  <span className="px-2 py-1 rounded-md" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                                    ⚠️ {item.result.stats.totalDeaths} deaths
                                  </span>
                                )}
                              </div>

                              {/* Show full UI for the latest result OR when this result's tab is active */}
                              {idx === conversation.length - 1 && (
                                <>
                                  {/* Tabs Row with Date Range */}
                                  <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                                    <div className="flex items-center gap-2">
                                      {[
                                        { id: 'summary', label: 'Summary', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                                        { id: 'map', label: 'Map', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
                                        { id: 'charts', label: 'Charts', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z' },
                                        { id: 'data', label: 'All Data', icon: 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
                                      ].map((tab) => (
                                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: activeTab === tab.id ? 'white' : 'var(--text-secondary)' }}>
                                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} /></svg>
                                          {tab.label}
                                        </button>
                                      ))}
                                    </div>
                                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                      {formatDate(item.result.stats.dateRange?.earliest)} — {formatDate(item.result.stats.dateRange?.latest)}
                                    </div>
                                  </div>

                                  {/* Summary Tab - 2x2 Stats + Map side by side (50/50) */}
                                  {activeTab === 'summary' && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                      {/* Stats Card - 2x2 Grid */}
                                      <div className="card p-4">
                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)', borderLeft: '4px solid var(--accent-primary)' }}>
                                            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Events</p>
                                            <p className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>{formatNumber(item.result.stats.eventCount)}</p>
                                          </div>
                                          <div className="p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)', borderLeft: '4px solid #ef4444' }}>
                                            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Affected</p>
                                            <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{formatNumber(item.result.stats.totalAffected)}</p>
                                          </div>
                                          <div className="p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)', borderLeft: '4px solid #f59e0b' }}>
                                            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Deaths</p>
                                            <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{formatNumber(item.result.stats.totalDeaths)}</p>
                                          </div>
                                          <div className="p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)', borderLeft: '4px solid #06b6d4' }}>
                                            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Total Rainfall</p>
                                            <p className="text-2xl font-bold" style={{ color: '#06b6d4' }}>{formatNumber(totalRainfall)}mm</p>
                                          </div>
                                        </div>
                                        <div className="mt-3 pt-3 border-t flex justify-between text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
                                          <span style={{ color: 'var(--text-muted)' }}>Avg Rainfall</span>
                                          <span className="font-semibold" style={{ color: 'var(--accent-primary)' }}>{item.result.stats.avgRainfall?.toFixed(1) || '—'} mm</span>
                                        </div>
                                      </div>

                                      {/* Map Preview Card - Same width */}
                                      <div className="card p-3 flex flex-col" style={{ minHeight: '220px' }}>
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Locations</span>
                                          <button onClick={() => setActiveTab('map')} className="text-[10px] font-medium" style={{ color: 'var(--accent-primary)' }}>Full Map →</button>
                                        </div>
                                        <div className="flex-1 rounded-lg overflow-hidden relative" style={{ background: 'var(--bg-tertiary)', minHeight: '170px', zIndex: 1 }}>
                                          {mapReady && eventsWithLocation.length > 0 ? (
                                            <MapContainer center={[17.385, 78.4867]} zoom={10} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                                              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                                              {eventsWithLocation.slice(0, 30).map((event) => (
                                                <CircleMarker key={event.id} center={[event.latitude!, event.longitude!]} radius={5} fillColor="#3b82f6" color="#1d4ed8" weight={1} fillOpacity={0.7} />
                                              ))}
                                            </MapContainer>
                                          ) : (
                                            <div className="h-full flex items-center justify-center"><p className="text-xs" style={{ color: 'var(--text-muted)' }}>No location data available</p></div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Map Tab */}
                                  {activeTab === 'map' && (
                                    <div className="card p-4" style={{ zIndex: 1 }}>
                                      <div className="h-[350px] rounded-xl overflow-hidden relative" style={{ background: 'var(--bg-tertiary)', zIndex: 1 }}>
                                        {mapReady && eventsWithLocation.length > 0 ? (
                                          <MapContainer center={[17.385, 78.4867]} zoom={11} style={{ height: '100%', width: '100%' }}>
                                            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                                            {eventsWithLocation.map((event) => (
                                              <CircleMarker key={event.id} center={[event.latitude!, event.longitude!]} radius={Math.max(5, Math.min(12, Math.log10(event.total_affected + 1) * 3))} fillColor={event.total_deaths > 0 ? '#ef4444' : '#3b82f6'} color={event.total_deaths > 0 ? '#dc2626' : '#1d4ed8'} weight={2} fillOpacity={0.7}>
                                                <Popup><div className="p-1"><p className="font-bold text-sm">{event.city || 'Unknown'}</p><p className="text-xs">{formatDate(event.event_date)}</p><p className="text-xs">Affected: {formatNumber(event.total_affected)}</p></div></Popup>
                                              </CircleMarker>
                                            ))}
                                          </MapContainer>
                                        ) : (
                                          <div className="h-full flex items-center justify-center"><p style={{ color: 'var(--text-muted)' }}>No location data</p></div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Charts Tab - Only By Year and Flood Types (removed By City) */}
                                  {activeTab === 'charts' && item.result.breakdowns && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                      {item.result.breakdowns.byYear.length > 0 && (
                                        <div className="card p-4">
                                          <h4 className="text-xs font-bold mb-3" style={{ color: 'var(--text-primary)' }}>By Year</h4>
                                          <BarChart data={item.result.breakdowns.byYear} labelKey="year" valueKey="count" />
                                        </div>
                                      )}
                                      {item.result.breakdowns.byFloodType.length > 0 && (
                                        <div className="card p-4">
                                          <h4 className="text-xs font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Flood Types</h4>
                                          <DonutChart data={item.result.breakdowns.byFloodType} labelKey="flood_type" valueKey="count" />
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Data Tab - ONLY TABLE SCROLLS */}
                                  {activeTab === 'data' && (
                                    <div className="card overflow-hidden">
                                      <div className="p-3 border-b" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
                                        <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>All Events ({item.result.events.length})</p>
                                      </div>
                                      <div className="overflow-auto" style={{ maxHeight: '400px' }}>
                                        <table className="w-full text-xs" style={{ minWidth: '1200px' }}>
                                          <thead className="sticky top-0" style={{ background: 'var(--bg-secondary)', zIndex: 10 }}>
                                            <tr>
                                              {['Date', 'City', 'Location', 'Type', 'Cause', 'Rainfall', 'Affected', 'Deaths', 'Displaced', 'Lat', 'Lng'].map(h => (
                                                <th key={h} className="text-left p-2 font-semibold border-b whitespace-nowrap" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}>{h}</th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {item.result.events.map((event) => (
                                              <tr key={event.id} className="hover:bg-[var(--bg-tertiary)]">
                                                <td className="p-2 border-b whitespace-nowrap" style={{ borderColor: 'var(--border-subtle)' }}>{formatDate(event.event_date)}</td>
                                                <td className="p-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}><span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: 'var(--accent-muted)', color: 'var(--accent-primary)' }}>{event.city || '—'}</span></td>
                                                <td className="p-2 border-b max-w-[120px] truncate" style={{ borderColor: 'var(--border-subtle)' }} title={event.location || ''}>{event.location || '—'}</td>
                                                <td className="p-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>{event.flood_type || '—'}</td>
                                                <td className="p-2 border-b max-w-[100px] truncate" style={{ borderColor: 'var(--border-subtle)' }} title={event.trigger_cause || ''}>{event.trigger_cause || '—'}</td>
                                                <td className="p-2 border-b text-right font-mono" style={{ color: '#06b6d4', borderColor: 'var(--border-subtle)' }}>{event.rainfall_mm || '—'}</td>
                                                <td className="p-2 border-b text-right font-mono" style={{ color: event.total_affected > 0 ? '#ef4444' : 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}>{event.total_affected || 0}</td>
                                                <td className="p-2 border-b text-right font-mono" style={{ color: event.total_deaths > 0 ? '#f59e0b' : 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}>{event.total_deaths || 0}</td>
                                                <td className="p-2 border-b text-right font-mono" style={{ borderColor: 'var(--border-subtle)' }}>{event.total_displaced || 0}</td>
                                                <td className="p-2 border-b text-right font-mono" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}>{event.latitude?.toFixed(3) || '—'}</td>
                                                <td className="p-2 border-b text-right font-mono" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}>{event.longitude?.toFixed(3) || '—'}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </>
                          ) : (
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No events found.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* FloodLens is responding... */}
                {isSearching && (
                  <div className="flex items-start gap-3 mb-6">
                    <FloodLensLogo size={36} />
                    <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--accent-primary)', animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--accent-primary)', animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--accent-primary)', animationDelay: '300ms' }} />
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>FloodLens is analyzing...</p>
                    </div>
                  </div>
                )}

                <div ref={conversationEndRef} />
              </div>
            </div>

              {/* Fixed Bottom Input - Floating pill, NO background strip */}
              <div className="fixed bottom-4 left-4 right-4 lg:left-[calc(256px+1rem)]" style={{ zIndex: 9999 }}>
                <div className="max-w-3xl mx-auto">
                  <div
                    className="flex items-center rounded-full overflow-hidden"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: inputFocused ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)'
                    }}
                  >
                    <button onClick={clearConversation} className="ml-3 p-2 rounded-full transition-all lg:hidden" title="Clear" onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }} style={{ color: 'var(--text-muted)' }}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !isSearching && handleSearch()}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      placeholder="Ask another question..."
                      disabled={isSearching}
                      className="flex-1 px-5 py-3.5 text-sm bg-transparent outline-none border-none"
                      style={{ color: 'var(--text-primary)' }}
                    />
                    <button
                      onClick={() => handleSearch()}
                      disabled={!query.trim() || isSearching}
                      className="m-1.5 p-2.5 rounded-full transition-all disabled:opacity-30"
                      style={{ background: 'var(--accent-gradient)', color: 'white' }}
                    >
                      {isSearching ? <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
