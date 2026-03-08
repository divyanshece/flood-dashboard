'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import PlotBuilder from '@/components/PlotBuilder';
import { FloodEvent } from '@/types/event';

export default function AnalyticsPage() {
  const [events, setEvents] = useState<FloodEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/events');
        const data = await response.json();
        setEvents(data.events || []);
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

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10 lg:py-14">
        {/* Page Header */}
        <div className="mb-10 animate-fade-up" style={{ opacity: 0, animationFillMode: 'forwards' }}>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p
                className="text-sm font-bold uppercase tracking-widest mb-3"
                style={{ color: 'var(--accent-primary)' }}
              >
                Analytics
              </p>
              <h1
                className="text-4xl lg:text-5xl font-display font-bold mb-3"
                style={{ color: 'var(--text-primary)' }}
              >
                Advanced Visualizations
              </h1>
              <p
                className="text-lg font-medium max-w-xl leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                Create custom charts and explore flood patterns with interactive visualizations.
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
                  className={`w-3 h-3 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}
                />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {loading ? 'Loading...' : `${events.length} events available`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Guide */}
        <div
          className="mb-8 animate-fade-up stagger-1"
          style={{ opacity: 0, animationFillMode: 'forwards' }}
        >
          <div
            className="card p-6"
            style={{ borderLeft: '3px solid var(--accent-primary)' }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--accent-muted)' }}
              >
                <svg
                  className="w-5 h-5"
                  style={{ color: 'var(--accent-primary)' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  How to use the Plot Builder
                </h3>
                <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Select your chart type, configure X and Y axes, and choose aggregation methods to visualize flood patterns.
                  You can add multiple plots, filter by date range or location, and export charts as PNG images.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Plot Builder */}
        {loading ? (
          <div
            className="card p-20 flex flex-col items-center justify-center gap-5 animate-fade-up stagger-2"
            style={{ opacity: 0, animationFillMode: 'forwards' }}
          >
            <div
              className="w-12 h-12 rounded-full animate-spin"
              style={{
                border: '3px solid var(--border-subtle)',
                borderTopColor: 'var(--accent-primary)',
              }}
            />
            <p className="text-base font-medium" style={{ color: 'var(--text-tertiary)' }}>
              Loading data for analysis...
            </p>
          </div>
        ) : (
          <div
            className="animate-fade-up stagger-2"
            style={{ opacity: 0, animationFillMode: 'forwards' }}
          >
            <PlotBuilder events={events} />
          </div>
        )}

        {/* Footer Info */}
        <footer
          className="py-8 mt-12"
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
              Charts can be exported as PNG for reports and presentations
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
