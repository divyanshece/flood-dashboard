'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import StatsCards from '@/components/StatsCards';
import FilterPanel from '@/components/FilterPanel';
import DataTable from '@/components/DataTable';
import EventDetailModal from '@/components/EventDetailModal';
import { FloodEvent, EventFilters, DatabaseStats } from '@/types/event';

export default function DashboardPage() {
  const [events, setEvents] = useState<FloodEvent[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [filters, setFilters] = useState<EventFilters>({});
  const [floodTypes, setFloodTypes] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<FloodEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Fetch stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        setStats(data);

        if (data.floodTypes) {
          setFloodTypes(data.floodTypes.map((f: { type: string }) => f.type));
        }
        if (data.topLocations) {
          setLocations(data.topLocations.map((l: { location: string }) => l.location));
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Fetch events with filters
  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const params = new URLSearchParams();

      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.location) params.append('location', filters.location);
      if (filters.floodType) params.append('floodType', filters.floodType);
      if (filters.minRainfall !== undefined) params.append('minRainfall', filters.minRainfall.toString());
      if (filters.maxRainfall !== undefined) params.append('maxRainfall', filters.maxRainfall.toString());
      if (filters.minAffected !== undefined) params.append('minAffected', filters.minAffected.toString());

      const response = await fetch(`/api/events?${params.toString()}`);
      const data = await response.json();
      setEvents(data.events || []);

      if (data.events) {
        const uniqueLocations = [...new Set(data.events.map((e: FloodEvent) => e.location).filter(Boolean))] as string[];
        setLocations(prev => [...new Set([...prev, ...uniqueLocations])]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Fetch all locations for autocomplete
  useEffect(() => {
    async function fetchLocations() {
      try {
        const response = await fetch('/api/events?limit=1000');
        const data = await response.json();
        if (data.events) {
          const uniqueLocations = [...new Set(data.events.map((e: FloodEvent) => e.location).filter(Boolean))] as string[];
          setLocations(uniqueLocations);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    }
    fetchLocations();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Header />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10 lg:py-14">
        {/* Page Header */}
        <div className="mb-10 animate-fade-up" style={{ opacity: 0, animationFillMode: 'forwards' }}>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <p
                className="text-sm font-bold uppercase tracking-widest mb-3"
                style={{ color: 'var(--accent-primary)' }}
              >
                Dashboard
              </p>
              <h1
                className="text-4xl lg:text-5xl font-display font-bold mb-3"
                style={{ color: 'var(--text-primary)' }}
              >
                Flood Events Database
              </h1>
              <p
                className="text-lg font-medium max-w-xl leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                Explore documented flood events with advanced filtering and detailed insights.
              </p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div
                className="inline-flex items-center gap-3 px-5 py-3 rounded-full"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <span
                  className={`w-3 h-3 rounded-full ${eventsLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}
                />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {eventsLoading ? 'Loading...' : `${events.length} events`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <section className="mb-8 animate-fade-up stagger-1" style={{ opacity: 0, animationFillMode: 'forwards' }}>
          <StatsCards stats={stats} loading={loading} />
        </section>

        {/* Filters */}
        <section className="mb-8 animate-fade-up stagger-2" style={{ opacity: 0, animationFillMode: 'forwards' }}>
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
            floodTypes={floodTypes}
            locations={locations}
          />
        </section>

        {/* Data Table */}
        <section className="mb-10 animate-fade-up stagger-3" style={{ opacity: 0, animationFillMode: 'forwards' }}>
          {eventsLoading ? (
            <div className="card p-20 flex flex-col items-center justify-center gap-5">
              <div
                className="w-12 h-12 rounded-full animate-spin"
                style={{
                  border: '3px solid var(--border-subtle)',
                  borderTopColor: 'var(--accent-primary)',
                }}
              />
              <p className="text-base font-medium" style={{ color: 'var(--text-tertiary)' }}>
                Loading flood events...
              </p>
            </div>
          ) : events.length === 0 ? (
            <div className="empty-state card py-20">
              <svg
                className="empty-state-icon"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="empty-state-title">No events found</p>
              <p className="empty-state-description">
                Try adjusting your filters to see more results
              </p>
              <button
                onClick={() => setFilters({})}
                className="btn btn-primary mt-6"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <DataTable events={events} onEventClick={setSelectedEvent} />
          )}
        </section>

        {/* Footer Info */}
        <footer
          className="py-8 mt-8"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div
              className="flex items-center gap-4 px-5 py-3 rounded-2xl"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
            >
              <img
                src="/IIT_Hyderabad_logo.png"
                alt="IIT Hyderabad"
                className="h-10 w-auto object-contain"
              />
              <div className="h-8 w-px" style={{ background: 'var(--border-subtle)' }} />
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  IIT Hyderabad
                </p>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Research Initiative
                </p>
              </div>
            </div>
            <p className="text-sm font-semibold text-center" style={{ color: 'var(--text-tertiary)' }}>
              Data sourced from verified news reports and government records
            </p>
          </div>
        </footer>
      </main>

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
