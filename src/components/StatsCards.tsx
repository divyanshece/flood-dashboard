'use client';

import { DatabaseStats } from '@/types/event';

interface StatsCardsProps {
  stats: DatabaseStats | null;
  loading: boolean;
}

// Mini bar chart component for flood types
function FloodTypeChart({ data }: { data: { type: string; count: number }[] }) {
  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className="space-y-2">
      {data.slice(0, 5).map((item, index) => (
        <div key={item.type} className="group">
          <div className="flex items-center justify-between text-xs mb-1">
            <span
              className="truncate max-w-[140px]"
              style={{ color: 'var(--text-secondary)' }}
              title={item.type}
            >
              {item.type}
            </span>
            <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
              {item.count}
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${(item.count / maxCount) * 100}%`,
                background: `linear-gradient(90deg,
                  ${index === 0 ? '#0ea5e9' : index === 1 ? '#06b6d4' : index === 2 ? '#14b8a6' : index === 3 ? '#10b981' : '#22c55e'} 0%,
                  ${index === 0 ? '#38bdf8' : index === 1 ? '#22d3ee' : index === 2 ? '#2dd4bf' : index === 3 ? '#34d399' : '#4ade80'} 100%)`,
                animationDelay: `${index * 100}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Mini horizontal bar chart for top locations
function TopLocationsChart({ data }: { data: { location: string; count: number }[] }) {
  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className="space-y-1.5">
      {data.slice(0, 6).map((item, index) => (
        <div key={item.location} className="flex items-center gap-2">
          <div
            className="h-5 rounded flex items-center px-2 text-xs font-medium text-white transition-all duration-500"
            style={{
              width: `${Math.max((item.count / maxCount) * 100, 30)}%`,
              background: `linear-gradient(90deg,
                ${['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16'][index]} 0%,
                ${['#38bdf8', '#22d3ee', '#2dd4bf', '#34d399', '#4ade80', '#a3e635'][index]} 100%)`,
              animationDelay: `${index * 80}ms`,
            }}
          >
            <span className="truncate">{item.location}</span>
          </div>
          <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="card p-5 animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="h-4 rounded w-24 mb-3" style={{ background: 'var(--bg-tertiary)' }} />
            <div className="h-8 rounded w-20" style={{ background: 'var(--bg-tertiary)' }} />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const formatDateRange = () => {
    if (!stats.dateRange.earliest || !stats.dateRange.latest) return 'N/A';
    const start = new Date(stats.dateRange.earliest).getFullYear();
    const end = new Date(stats.dateRange.latest).getFullYear();
    return `${start} - ${end}`;
  };

  const yearSpan = () => {
    if (!stats.dateRange.earliest || !stats.dateRange.latest) return 0;
    const start = new Date(stats.dateRange.earliest).getFullYear();
    const end = new Date(stats.dateRange.latest).getFullYear();
    return end - start;
  };

  return (
    <div className="space-y-4">
      {/* Primary Stats Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Events */}
        <div className="card p-5 animate-slide-up stagger-1 group hover:border-[var(--border-accent)] transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
                Total Events
              </p>
              <p className="text-3xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
                {stats.totalEvents.toLocaleString()}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                flood events documented
              </p>
            </div>
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)' }}
            >
              <svg className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* People Affected */}
        <div className="card p-5 animate-slide-up stagger-2 group hover:border-[var(--border-accent)] transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
                People Affected
              </p>
              <p className="text-3xl font-display font-bold" style={{ color: 'var(--danger)' }}>
                {stats.totalAffected.toLocaleString()}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                casualties & displaced
              </p>
            </div>
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: 'rgba(239, 68, 68, 0.1)' }}
            >
              <svg className="w-5 h-5" style={{ color: 'var(--danger)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Average Rainfall */}
        <div className="card p-5 animate-slide-up stagger-3 group hover:border-[var(--border-accent)] transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
                Avg Rainfall
              </p>
              <p className="text-3xl font-display font-bold" style={{ color: 'var(--accent-secondary)' }}>
                {stats.avgRainfall}
                <span className="text-lg font-normal ml-1">mm</span>
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                per flood event
              </p>
            </div>
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: 'rgba(6, 182, 212, 0.1)' }}
            >
              <svg className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div className="card p-5 animate-slide-up stagger-4 group hover:border-[var(--border-accent)] transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
                Time Period
              </p>
              <p className="text-3xl font-display font-bold" style={{ color: 'var(--accent-tertiary)' }}>
                {yearSpan()}
                <span className="text-lg font-normal ml-1">yrs</span>
              </p>
              <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-tertiary)' }}>
                {formatDateRange()}
              </p>
            </div>
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: 'rgba(20, 184, 166, 0.1)' }}
            >
              <svg className="w-5 h-5" style={{ color: 'var(--accent-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats Row - Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Flood Types Distribution */}
        <div className="card p-5 animate-slide-up stagger-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
              Flood Types
            </h3>
            <span className="badge badge-primary">
              {stats.floodTypes.length} types
            </span>
          </div>
          <FloodTypeChart data={stats.floodTypes} />
        </div>

        {/* Top Affected Locations */}
        <div className="card p-5 animate-slide-up stagger-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
              Top Affected Areas
            </h3>
            <span className="badge badge-warning">
              Hotspots
            </span>
          </div>
          <TopLocationsChart data={stats.topLocations} />
        </div>
      </div>
    </div>
  );
}
