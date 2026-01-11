'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import MapView from '@/components/MapView';
import { FloodEvent } from '@/types/event';
import 'leaflet/dist/leaflet.css';

export default function MapPage() {
  const [events, setEvents] = useState<FloodEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/events');
        const data = await response.json();
        const validEvents = (data.events || []).filter(
          (e: FloodEvent) => e.latitude && e.longitude
        );
        setEvents(validEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Header />

      <main className="relative h-[calc(100vh-4rem)]">
        {/* Floating Info Badge - Top Left, Compact */}
        <div className="absolute top-4 left-4 z-[1000]">
          <div
            className="card p-3 shadow-lg flex items-center gap-3"
            style={{ background: 'var(--bg-secondary)', maxWidth: '280px' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--accent-gradient)' }}
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                Flood Map
              </h1>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}
                />
                <span className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                  {loading ? 'Loading...' : `${events.length} locations`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Map Container */}
        {loading ? (
          <div className="h-full flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
            <div className="text-center">
              <div
                className="w-10 h-10 rounded-full animate-spin mx-auto mb-4"
                style={{
                  border: '2px solid var(--border-subtle)',
                  borderTopColor: 'var(--accent-primary)',
                }}
              />
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Loading map data...
              </p>
            </div>
          </div>
        ) : (
          <MapView events={events} />
        )}
      </main>
    </div>
  );
}
