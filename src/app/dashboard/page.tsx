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

        // Extract flood types and locations for filters
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

      // Update locations for autocomplete
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
                Flood Events Dashboard
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Comprehensive view of all documented flood events with advanced filtering
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="px-4 py-2 rounded-lg flex items-center gap-2"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
              >
                <div
                  className={`w-2 h-2 rounded-full ${eventsLoading ? 'animate-pulse' : ''}`}
                  style={{ background: eventsLoading ? 'var(--warning)' : 'var(--success)' }}
                />
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {eventsLoading ? 'Loading...' : `${events.length} events`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <section className="mb-8">
          <StatsCards stats={stats} loading={loading} />
        </section>

        {/* Filters */}
        <section className="mb-6">
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
            floodTypes={floodTypes}
            locations={locations}
          />
        </section>

        {/* Data Table */}
        <section className="mb-8">
          {eventsLoading ? (
            <div className="card p-12 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div
                  className="w-12 h-12 rounded-full animate-spin"
                  style={{
                    border: '3px solid var(--bg-tertiary)',
                    borderTopColor: 'var(--accent-primary)',
                  }}
                />
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Loading flood events...
              </p>
            </div>
          ) : events.length === 0 ? (
            <div className="card p-12 flex flex-col items-center justify-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--bg-tertiary)' }}
              >
                <svg
                  className="w-8 h-8"
                  style={{ color: 'var(--text-tertiary)' }}
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
              </div>
              <div className="text-center">
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  No events found
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Try adjusting your filters to see more results
                </p>
              </div>
              <button
                onClick={() => setFilters({})}
                className="btn btn-secondary text-sm"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <DataTable events={events} onEventClick={setSelectedEvent} />
          )}
        </section>

        {/* Footer Info */}
        <footer className="text-center py-6 border-t" style={{ borderColor: 'var(--border-primary)' }}>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Data sourced from verified news reports and government records.
            Last database update reflects latest available information.
          </p>
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
