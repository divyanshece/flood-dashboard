'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { FloodEvent } from '@/types/event';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);

interface MapViewProps {
  events: FloodEvent[];
}

type ViewMode = 'markers' | 'heatmap' | 'clusters';

export default function MapView({ events }: MapViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('markers');
  const [timeRange, setTimeRange] = useState({ start: 0, end: 100 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [floodTypeFilter, setFloodTypeFilter] = useState<string>('all');
  const [isClient, setIsClient] = useState(false);
  const [L, setL] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FloodEvent | null>(null);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Ensure we're on the client side and load Leaflet
  useEffect(() => {
    setIsClient(true);

    // Dynamically import Leaflet only on client side
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  // Get year range from events
  const yearRange = useMemo(() => {
    if (events.length === 0) return { min: 2000, max: 2025 };

    const years = events
      .map(e => e.event_date ? new Date(e.event_date).getFullYear() : null)
      .filter(y => y !== null && !isNaN(y)) as number[];

    if (years.length === 0) return { min: 2000, max: 2025 };

    return {
      min: Math.min(...years),
      max: Math.max(...years)
    };
  }, [events]);

  // Get unique flood types
  const floodTypes = useMemo(() => {
    const types = new Set(
      events
        .map(e => e.flood_type)
        .filter((type): type is string => type !== null && type !== undefined)
    );
    return ['all', ...Array.from(types)];
  }, [events]);

  // Filter events based on time range and filters
  const filteredEvents = useMemo(() => {
    const startYear = yearRange.min + ((yearRange.max - yearRange.min) * timeRange.start / 100);
    const endYear = yearRange.min + ((yearRange.max - yearRange.min) * timeRange.end / 100);

    return events.filter(event => {
      if (!event.event_date || !event.latitude || !event.longitude) return false;

      const eventYear = new Date(event.event_date).getFullYear();
      const inTimeRange = eventYear >= startYear && eventYear <= endYear;

      if (selectedYear !== null && eventYear !== selectedYear) return false;

      const matchesFloodType = floodTypeFilter === 'all' || event.flood_type === floodTypeFilter;

      return inTimeRange && matchesFloodType;
    });
  }, [events, timeRange, selectedYear, floodTypeFilter, yearRange]);

  // Cluster data for cluster view
  const clusterData = useMemo(() => {
    const clusters: { [key: string]: { lat: number; lng: number; count: number; events: FloodEvent[] } } = {};
    const gridSize = 0.02; // Roughly 2km grid

    filteredEvents.forEach(event => {
      if (!event.latitude || !event.longitude) return;

      const gridLat = Math.floor(event.latitude / gridSize) * gridSize;
      const gridLng = Math.floor(event.longitude / gridSize) * gridSize;
      const key = `${gridLat},${gridLng}`;

      if (!clusters[key]) {
        clusters[key] = {
          lat: gridLat + gridSize / 2,
          lng: gridLng + gridSize / 2,
          count: 0,
          events: []
        };
      }
      clusters[key].count++;
      clusters[key].events.push(event);
    });

    return Object.values(clusters);
  }, [filteredEvents]);

  // Animation logic
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setTimeRange(prev => {
          const newStart = prev.start + 2;
          const newEnd = prev.end + 2;

          if (newEnd >= 100) {
            setIsPlaying(false);
            return { start: 0, end: 10 };
          }

          return { start: newStart, end: newEnd };
        });
      }, 500);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying]);

  const getMarkerColor = (event: FloodEvent) => {
    if (!event.rainfall_mm) return '#94a3b8';
    if (event.rainfall_mm < 50) return '#10b981';
    if (event.rainfall_mm < 100) return '#f59e0b';
    if (event.rainfall_mm < 200) return '#f97316';
    return '#ef4444';
  };

  const getClusterColor = (count: number) => {
    if (count < 3) return '#10b981';
    if (count < 5) return '#f59e0b';
    if (count < 10) return '#f97316';
    return '#ef4444';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleEventClick = (event: FloodEvent) => {
    setSelectedEvent(event);
    setInfoPanelOpen(true);
    // Don't collapse sidebar - keep view controls independent
  };

  // Center map on Hyderabad
  const center: [number, number] = [17.385, 78.4867];

  return (
    <div className="relative h-full">
      {/* Collapsible Map Controls Panel */}
      <div
        className={`absolute top-4 z-[1000] transition-all duration-300 ${
          sidebarCollapsed ? 'right-0' : 'right-4'
        }`}
        style={{ width: sidebarCollapsed ? 'auto' : '220px' }}
      >
        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -left-10 top-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
            style={{ color: 'var(--text-secondary)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {!sidebarCollapsed && (
          <div className="space-y-3">
            {/* View Mode Toggle */}
            <div className="card p-3 shadow-lg">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Mode
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setViewMode('markers')}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    viewMode === 'markers' ? 'scale-105' : 'hover:scale-105'
                  }`}
                  style={{
                    background: viewMode === 'markers' ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                    color: viewMode === 'markers' ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Markers
                </button>
                <button
                  onClick={() => setViewMode('heatmap')}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    viewMode === 'heatmap' ? 'scale-105' : 'hover:scale-105'
                  }`}
                  style={{
                    background: viewMode === 'heatmap' ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                    color: viewMode === 'heatmap' ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Intensity
                </button>
                <button
                  onClick={() => setViewMode('clusters')}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    viewMode === 'clusters' ? 'scale-105' : 'hover:scale-105'
                  }`}
                  style={{
                    background: viewMode === 'clusters' ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                    color: viewMode === 'clusters' ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Clusters
                </button>
              </div>
            </div>

            {/* Flood Type Filter */}
            <div className="card p-3 shadow-lg">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Flood Type
              </label>
              <select
                value={floodTypeFilter}
                onChange={(e) => setFloodTypeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              >
                {floodTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </option>
                ))}
              </select>
            </div>

            {/* Stats */}
            <div className="card p-3 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Statistics
                </span>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1" style={{ color: 'var(--accent-primary)' }}>
                  {filteredEvents.length}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Events Displayed
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="card p-3 shadow-lg">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                {viewMode === 'clusters' ? 'Event Density' : 'Rainfall (mm)'}
              </label>
              <div className="space-y-1.5">
                {viewMode === 'clusters' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ background: '#10b981' }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>1-2 events</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ background: '#f59e0b' }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>3-4 events</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ background: '#f97316' }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>5-9 events</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ background: '#ef4444' }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>10+ events</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ background: '#10b981' }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>&lt; 50</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ background: '#f59e0b' }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>50-100</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ background: '#f97316' }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>100-200</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ background: '#ef4444' }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>&gt; 200</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Info Panel (Collapsible from left) */}
      <div
        className={`absolute top-4 left-4 z-[1000] transition-all duration-300 ${
          infoPanelOpen && selectedEvent ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        }`}
        style={{ width: '320px', maxHeight: 'calc(100% - 120px)' }}
      >
        {selectedEvent && (
          <div className="card shadow-2xl overflow-hidden" style={{ maxHeight: '100%' }}>
            {/* Header */}
            <div
              className="p-4 flex items-start justify-between"
              style={{ background: 'var(--accent-gradient)' }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                  Event Details
                </p>
                <h3 className="text-base font-bold text-white truncate">
                  {selectedEvent.location || 'Unknown Location'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setInfoPanelOpen(false);
                  setSelectedEvent(null);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/20"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: '400px' }}>
              {/* Date */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--accent-muted)' }}
                >
                  <svg className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Event Date</p>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatDate(selectedEvent.event_date)}</p>
                </div>
              </div>

              {/* Rainfall */}
              {selectedEvent.rainfall_mm && (
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(6, 182, 212, 0.1)' }}
                  >
                    <svg className="w-5 h-5" style={{ color: '#06b6d4' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Rainfall</p>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedEvent.rainfall_mm} mm</p>
                  </div>
                </div>
              )}

              {/* Flood Type */}
              {selectedEvent.flood_type && (
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(139, 92, 246, 0.1)' }}
                  >
                    <svg className="w-5 h-5" style={{ color: '#8b5cf6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Flood Type</p>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedEvent.flood_type}</p>
                  </div>
                </div>
              )}

              {/* People Affected */}
              {selectedEvent.total_affected > 0 && (
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                  >
                    <svg className="w-5 h-5" style={{ color: '#ef4444' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>People Affected</p>
                    <p className="font-semibold" style={{ color: '#ef4444' }}>{selectedEvent.total_affected.toLocaleString()}</p>
                  </div>
                </div>
              )}

              {/* Coordinates */}
              {selectedEvent.latitude && selectedEvent.longitude && (
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(16, 185, 129, 0.1)' }}
                  >
                    <svg className="w-5 h-5" style={{ color: '#10b981' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Coordinates</p>
                    <p className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                      {selectedEvent.latitude.toFixed(4)}, {selectedEvent.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>
              )}

              {/* Cause */}
              {selectedEvent.trigger_cause && (
                <div
                  className="p-3 rounded-lg"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Trigger Cause</p>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{selectedEvent.trigger_cause}</p>
                </div>
              )}

              {/* Damage Description */}
              {selectedEvent.damage_description && (
                <div
                  className="p-3 rounded-lg"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Impact & Damage</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{selectedEvent.damage_description}</p>
                </div>
              )}

              {/* Sources */}
              {selectedEvent.source_urls && (
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>News Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.source_urls.split(';').filter(Boolean).slice(0, 3).map((url, idx) => (
                      <a
                        key={idx}
                        href={url.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="badge badge-primary text-xs transition-all hover:scale-105"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Source {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="p-3 flex items-center justify-between"
              style={{ borderTop: '1px solid var(--border-subtle)' }}
            >
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                ID: {selectedEvent.event_id}
              </span>
              <a
                href={`https://www.google.com/maps?q=${selectedEvent.latitude},${selectedEvent.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium flex items-center gap-1 transition-colors hover:text-[var(--accent-primary)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                Open in Maps
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Time Control Panel */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[1000] w-full max-w-4xl px-4">
        <div className="card p-4 shadow-2xl">
          <div className="flex items-center gap-4">
            {/* Play/Pause Button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{
                background: isPlaying ? 'var(--danger)' : 'var(--accent-gradient)',
                color: 'white',
              }}
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Timeline */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {Math.round(yearRange.min + ((yearRange.max - yearRange.min) * timeRange.start / 100))} -
                  {Math.round(yearRange.min + ((yearRange.max - yearRange.min) * timeRange.end / 100))}
                </span>
                <button
                  onClick={() => {
                    setTimeRange({ start: 0, end: 100 });
                    setSelectedYear(null);
                  }}
                  className="text-xs px-3 py-1 rounded-lg transition-all hover:scale-105"
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Reset
                </button>
              </div>

              {/* Dual Range Slider */}
              <div className="relative h-2 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
                <div
                  className="absolute h-full rounded-full"
                  style={{
                    background: 'var(--accent-gradient)',
                    left: `${timeRange.start}%`,
                    right: `${100 - timeRange.end}%`,
                  }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={timeRange.start}
                  onChange={(e) => {
                    const newStart = parseInt(e.target.value);
                    if (newStart < timeRange.end - 5) {
                      setTimeRange({ ...timeRange, start: newStart });
                    }
                  }}
                  className="absolute w-full h-2 appearance-none bg-transparent pointer-events-auto"
                  style={{
                    zIndex: 3,
                  }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={timeRange.end}
                  onChange={(e) => {
                    const newEnd = parseInt(e.target.value);
                    if (newEnd > timeRange.start + 5) {
                      setTimeRange({ ...timeRange, end: newEnd });
                    }
                  }}
                  className="absolute w-full h-2 appearance-none bg-transparent pointer-events-auto"
                  style={{
                    zIndex: 4,
                  }}
                />
              </div>

              {/* Year Markers */}
              <div className="flex justify-between mt-2">
                {[yearRange.min, Math.round((yearRange.min + yearRange.max) / 2), yearRange.max].map((year, index) => (
                  <button
                    key={`year-${year}-${index}`}
                    onClick={() => setSelectedYear(selectedYear === year ? null : year)}
                    className={`text-xs px-2 py-1 rounded transition-all ${
                      selectedYear === year ? 'scale-110' : ''
                    }`}
                    style={{
                      background: selectedYear === year ? 'var(--accent-primary)' : 'transparent',
                      color: selectedYear === year ? 'white' : 'var(--text-tertiary)',
                    }}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaflet Map */}
      <div className="h-full w-full">
        {isClient && (
          <MapContainer
            center={center}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              maxZoom={20}
            />

            {/* Markers Mode */}
            {viewMode === 'markers' && isClient && L && filteredEvents.map((event, index) => {
              if (!event.latitude || !event.longitude) return null;

              // Create custom icon
              const markerColor = getMarkerColor(event);
              const customIcon = L.divIcon({
                html: `<div style="background: ${markerColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3); cursor: pointer;"></div>`,
                className: 'custom-marker',
                iconSize: [12, 12],
                iconAnchor: [6, 6],
              });

              return (
                <Marker
                  key={`marker-${event.event_id}-${index}`}
                  position={[event.latitude, event.longitude]}
                  icon={customIcon}
                  eventHandlers={{
                    click: () => handleEventClick(event),
                  }}
                />
              );
            })}

            {/* Heatmap/Intensity Mode */}
            {viewMode === 'heatmap' && isClient && filteredEvents.map((event, index) => {
              if (!event.latitude || !event.longitude) return null;

              const radius = event.rainfall_mm ? Math.min(event.rainfall_mm * 20, 2000) : 500;
              const markerColor = getMarkerColor(event);

              return (
                <Circle
                  key={`circle-${event.event_id}-${index}`}
                  center={[event.latitude, event.longitude]}
                  radius={radius}
                  pathOptions={{
                    fillColor: markerColor,
                    fillOpacity: 0.3,
                    color: markerColor,
                    weight: 1,
                    opacity: 0.6,
                  }}
                  eventHandlers={{
                    click: () => handleEventClick(event),
                  }}
                />
              );
            })}

            {/* Cluster Mode */}
            {viewMode === 'clusters' && isClient && L && clusterData.map((cluster, idx) => {
              const clusterColor = getClusterColor(cluster.count);
              const radius = Math.min(300 + cluster.count * 100, 1500);

              const customIcon = L.divIcon({
                html: `<div style="background: ${clusterColor}; width: ${Math.min(24 + cluster.count * 4, 48)}px; height: ${Math.min(24 + cluster.count * 4, 48)}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: ${Math.min(10 + cluster.count, 16)}px; cursor: pointer;">${cluster.count}</div>`,
                className: 'cluster-marker',
                iconSize: [Math.min(24 + cluster.count * 4, 48), Math.min(24 + cluster.count * 4, 48)],
                iconAnchor: [Math.min(12 + cluster.count * 2, 24), Math.min(12 + cluster.count * 2, 24)],
              });

              return (
                <Marker
                  key={`cluster-${idx}`}
                  position={[cluster.lat, cluster.lng]}
                  icon={customIcon}
                >
                  <Popup>
                    <div className="p-2" style={{ minWidth: '200px' }}>
                      <div className="font-bold mb-2 text-sm" style={{ color: '#1f2937' }}>
                        {cluster.count} Events in this Area
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {cluster.events.slice(0, 5).map((event, eventIdx) => (
                          <button
                            key={event.event_id}
                            onClick={() => handleEventClick(event)}
                            className="w-full text-left p-2 rounded text-xs hover:bg-gray-100 transition-colors"
                          >
                            <div className="font-medium" style={{ color: '#374151' }}>
                              {event.location?.split(',')[0] || 'Unknown'}
                            </div>
                            <div style={{ color: '#6b7280' }}>{formatDate(event.event_date)}</div>
                          </button>
                        ))}
                        {cluster.events.length > 5 && (
                          <p className="text-xs text-center pt-1" style={{ color: '#6b7280' }}>
                            +{cluster.events.length - 5} more events
                          </p>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>

      <style jsx global>{`
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }

        .cluster-marker {
          background: transparent !important;
          border: none !important;
        }

        input[type="range"] {
          -webkit-appearance: none;
          background: transparent;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 0 0 2px var(--accent-primary);
        }

        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid var(--accent-primary);
        }

        .leaflet-popup-content-wrapper {
          background: white !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important;
        }

        .leaflet-popup-tip {
          background: white !important;
        }

        .leaflet-popup-content {
          margin: 0 !important;
        }
      `}</style>
    </div>
  );
}
