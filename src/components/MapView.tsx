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

  // Heatmap data
  const heatmapPoints = useMemo(() => {
    return filteredEvents.map(event => ({
      lat: event.latitude!,
      lng: event.longitude!,
      intensity: event.rainfall_mm || 1,
    }));
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Center map on Hyderabad
  const center: [number, number] = [17.385, 78.4867];

  return (
    <div className="relative h-full">
      {/* Map Controls Panel */}
      <div className="absolute top-4 right-4 z-[1000] space-y-3">
        {/* View Mode Toggle */}
        <div className="card p-3 shadow-lg" style={{ minWidth: '200px' }}>
          <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
            View Mode
          </label>
          <div className="space-y-2">
            <button
              onClick={() => setViewMode('markers')}
              className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'markers' ? 'scale-105' : 'hover:scale-105'
              }`}
              style={{
                background: viewMode === 'markers' ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                color: viewMode === 'markers' ? 'white' : 'var(--text-secondary)',
              }}
            >
              📍 Markers
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'heatmap' ? 'scale-105' : 'hover:scale-105'
              }`}
              style={{
                background: viewMode === 'heatmap' ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                color: viewMode === 'heatmap' ? 'white' : 'var(--text-secondary)',
              }}
            >
              🔥 Heatmap
            </button>
          </div>
        </div>

        {/* Flood Type Filter */}
        <div className="card p-3 shadow-lg">
          <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
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
          <div className="text-center">
            <div className="text-2xl font-bold mb-1" style={{ color: 'var(--accent-primary)' }}>
              {filteredEvents.length}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Events Shown
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="card p-3 shadow-lg">
          <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
            Rainfall (mm)
          </label>
          <div className="space-y-1">
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
          </div>
        </div>
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
            {viewMode === 'markers' && isClient && L && filteredEvents.map((event) => {
              if (!event.latitude || !event.longitude) return null;

              // Create custom icon
              const markerColor = getMarkerColor(event);
              const customIcon = L.divIcon({
                html: `<div style="background: ${markerColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
                className: 'custom-marker',
                iconSize: [12, 12],
                iconAnchor: [6, 6],
              });

              return (
                <Marker
                  key={event.event_id}
                  position={[event.latitude, event.longitude]}
                  icon={customIcon}
                >
                  <Popup>
                    <div className="p-2" style={{ minWidth: '200px' }}>
                      <div className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        {event.location}
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-tertiary)' }}>Date:</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{formatDate(event.event_date)}</span>
                        </div>
                        {event.rainfall_mm && (
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--text-tertiary)' }}>Rainfall:</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{event.rainfall_mm} mm</span>
                          </div>
                        )}
                        {event.flood_type && (
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--text-tertiary)' }}>Type:</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{event.flood_type}</span>
                          </div>
                        )}
                        {event.total_affected > 0 && (
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--text-tertiary)' }}>Affected:</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{event.total_affected}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Heatmap Mode */}
            {viewMode === 'heatmap' && isClient && filteredEvents.map((event) => {
              if (!event.latitude || !event.longitude) return null;

              const radius = event.rainfall_mm ? Math.min(event.rainfall_mm * 20, 2000) : 500;
              const markerColor = getMarkerColor(event);

              return (
                <Circle
                  key={event.event_id}
                  center={[event.latitude, event.longitude]}
                  radius={radius}
                  pathOptions={{
                    fillColor: markerColor,
                    fillOpacity: 0.3,
                    color: markerColor,
                    weight: 1,
                    opacity: 0.6,
                  }}
                >
                  <Popup>
                    <div className="p-2" style={{ minWidth: '200px' }}>
                      <div className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        {event.location}
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-tertiary)' }}>Date:</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{formatDate(event.event_date)}</span>
                        </div>
                        {event.rainfall_mm && (
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--text-tertiary)' }}>Rainfall:</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{event.rainfall_mm} mm</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Circle>
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
          background: var(--bg-secondary) !important;
          border: 1px solid var(--border-default) !important;
          border-radius: 8px !important;
        }

        .leaflet-popup-tip {
          background: var(--bg-secondary) !important;
        }
      `}</style>
    </div>
  );
}
