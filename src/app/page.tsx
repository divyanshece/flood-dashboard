'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { DatabaseStats } from '@/types/event';

export default function Home() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatDateRange = () => {
    if (!stats?.dateRange.earliest || !stats?.dateRange.latest) return '2003 - Present';
    const start = new Date(stats.dateRange.earliest).getFullYear();
    const end = new Date(stats.dateRange.latest).getFullYear();
    return `${start} - ${end}`;
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full opacity-30"
            style={{
              background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />
          <div
            className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, var(--accent-tertiary) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 animate-slide-up" style={{ background: 'var(--bg-tertiary)' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Currently tracking <span style={{ color: 'var(--accent-primary)' }}>Hyderabad, India</span>
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6 animate-slide-up stagger-1" style={{ color: 'var(--text-primary)' }}>
              Comprehensive{' '}
              <span className="text-gradient">Flood Analytics</span>
              <br />
              for Urban Resilience
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto animate-slide-up stagger-2" style={{ color: 'var(--text-secondary)' }}>
              India&apos;s first city-level flood database. Explore over two decades of flood events,
              patterns, and impacts to support disaster management and urban planning.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up stagger-3">
              <Link href="/dashboard" className="btn btn-primary text-base px-8 py-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Explore Dashboard
              </Link>
              <a href="#stats" className="btn btn-secondary text-base px-8 py-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-16 lg:py-24" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Database at a Glance
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Hyderabad flood events from {formatDateRange()}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="h-4 w-24 rounded mb-3" style={{ background: 'var(--bg-tertiary)' }} />
                  <div className="h-10 w-20 rounded" style={{ background: 'var(--bg-tertiary)' }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Events */}
              <div className="card p-6 text-center hover:border-[var(--border-accent)] transition-all">
                <div
                  className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)' }}
                >
                  <svg className="w-7 h-7" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-4xl font-display font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {stats?.totalEvents.toLocaleString() || '—'}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Flood Events</p>
              </div>

              {/* People Affected */}
              <div className="card p-6 text-center hover:border-[var(--border-accent)] transition-all">
                <div
                  className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                >
                  <svg className="w-7 h-7" style={{ color: 'var(--danger)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-4xl font-display font-bold mb-1" style={{ color: 'var(--danger)' }}>
                  {stats?.totalAffected.toLocaleString() || '—'}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>People Affected</p>
              </div>

              {/* Average Rainfall */}
              <div className="card p-6 text-center hover:border-[var(--border-accent)] transition-all">
                <div
                  className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'rgba(6, 182, 212, 0.1)' }}
                >
                  <svg className="w-7 h-7" style={{ color: 'var(--accent-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <p className="text-4xl font-display font-bold mb-1" style={{ color: 'var(--accent-secondary)' }}>
                  {stats?.avgRainfall || '—'}<span className="text-lg font-normal">mm</span>
                </p>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Avg Rainfall</p>
              </div>

              {/* Years of Data */}
              <div className="card p-6 text-center hover:border-[var(--border-accent)] transition-all">
                <div
                  className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'rgba(20, 184, 166, 0.1)' }}
                >
                  <svg className="w-7 h-7" style={{ color: 'var(--accent-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-4xl font-display font-bold mb-1" style={{ color: 'var(--accent-tertiary)' }}>
                  22<span className="text-lg font-normal">+</span>
                </p>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Years of Data</p>
              </div>
            </div>
          )}

          {/* Flood Types & Locations */}
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              {/* Flood Types */}
              <div className="card p-6">
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <svg className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  Flood Types Distribution
                </h3>
                <div className="space-y-3">
                  {stats.floodTypes.slice(0, 5).map((item, idx) => {
                    const maxCount = stats.floodTypes[0]?.count || 1;
                    const colors = ['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e'];
                    return (
                      <div key={item.type}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span style={{ color: 'var(--text-secondary)' }}>{item.type}</span>
                          <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{item.count}</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${(item.count / maxCount) * 100}%`,
                              background: colors[idx],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Locations */}
              <div className="card p-6">
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <svg className="w-5 h-5" style={{ color: 'var(--warning)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Top Affected Areas
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {stats.topLocations.slice(0, 8).map((item, idx) => (
                    <div
                      key={item.location}
                      className="flex items-center gap-2 p-2 rounded-lg"
                      style={{ background: 'var(--bg-tertiary)' }}
                    >
                      <span
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: idx < 3 ? 'var(--warning)' : 'var(--text-tertiary)' }}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{item.location}</span>
                      <span className="text-xs font-mono ml-auto" style={{ color: 'var(--text-tertiary)' }}>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Platform Features
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Tools for comprehensive flood data analysis and visualization
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="card p-6 hover:border-[var(--border-accent)] transition-all group">
              <div
                className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)' }}
              >
                <svg className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <h3 className="font-display font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Detailed Event Data
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Access comprehensive information including dates, locations, rainfall measurements, damage descriptions, and verified coordinates.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card p-6 hover:border-[var(--border-accent)] transition-all group">
              <div
                className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: 'rgba(20, 184, 166, 0.1)' }}
              >
                <svg className="w-6 h-6" style={{ color: 'var(--accent-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <h3 className="font-display font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Advanced Filtering
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Filter events by date range, location, flood type, rainfall amount, and impact severity to find exactly what you need.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card p-6 hover:border-[var(--border-accent)] transition-all group">
              <div
                className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: 'rgba(245, 158, 11, 0.1)' }}
              >
                <svg className="w-6 h-6" style={{ color: 'var(--warning)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="font-display font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Verified Sources
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Each event is linked to original news sources for verification. Data extracted from 13+ major news outlets.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card p-6 hover:border-[var(--border-accent)] transition-all group">
              <div
                className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: 'rgba(239, 68, 68, 0.1)' }}
              >
                <svg className="w-6 h-6" style={{ color: 'var(--danger)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-display font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Geocoded Locations
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Events include validated coordinates and Digipin codes for precise location mapping and spatial analysis.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card p-6 hover:border-[var(--border-accent)] transition-all group">
              <div
                className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: 'rgba(16, 185, 129, 0.1)' }}
              >
                <svg className="w-6 h-6" style={{ color: 'var(--success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="font-display font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Regular Updates
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Database is continuously updated with new events as they occur. New data added 2-3 times per week.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card p-6 hover:border-[var(--border-accent)] transition-all group">
              <div
                className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: 'rgba(139, 92, 246, 0.1)' }}
              >
                <svg className="w-6 h-6" style={{ color: '#8b5cf6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-display font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Expandable Coverage
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Built for scale. Platform architecture supports adding more cities across India and globally.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link href="/dashboard" className="btn btn-primary text-base px-8 py-3">
              Start Exploring Data
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-primary)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--accent-gradient)' }}
                >
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>FloodLens</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Global Flood Analytics</p>
                </div>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                India&apos;s first comprehensive city-level flood database for urban resilience and disaster management.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-display font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/dashboard" className="text-sm hover:underline" style={{ color: 'var(--text-secondary)' }}>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <a href="#stats" className="text-sm hover:underline" style={{ color: 'var(--text-secondary)' }}>
                    Statistics
                  </a>
                </li>
              </ul>
            </div>

            {/* Current Coverage */}
            <div>
              <h4 className="font-display font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Current Coverage</h4>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Hyderabad, India</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                More cities coming soon
              </p>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center" style={{ borderColor: 'var(--border-primary)' }}>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              &copy; {new Date().getFullYear()} FloodLens. Built for urban resilience.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
