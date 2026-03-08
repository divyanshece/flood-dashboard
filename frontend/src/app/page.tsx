'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import AuthModal from '@/components/auth/AuthModal';
import { WaterParticles, WaveDivider, FlowingWater, useRipple } from '@/components/WaterEffects';

interface TopLocation {
  location: string;
  count: number;
}

interface Stats {
  totalEvents: number;
  totalAffected: number;
  avgRainfall: number;
  dateRange: { earliest: string; latest: string };
  topLocations: TopLocation[];
}

function HomeContent() {
  const searchParams = useSearchParams();
  const authError = searchParams.get('auth_error');

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  // Show auth modal if there's an auth error in URL
  useEffect(() => {
    if (authError) {
      setAuthErrorMessage(authError);
      setShowAuthModal(true);
      // Clear the URL param
      window.history.replaceState({}, '', '/');
    }
  }, [authError]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Header />

      {/* Hero Section */}
      <section
        className="relative min-h-[calc(100vh-80px)] flex flex-col justify-center overflow-hidden"
        style={{ background: 'var(--bg-secondary)' }}
      >
        {/* Water Particles - Interactive floating droplets */}
        <WaterParticles count={60} maxSize={6} minSize={2} />

        {/* Flowing Water Background Effect */}
        <FlowingWater intensity="medium" />

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Morphing water blob - top right */}
          <div
            className="absolute top-10 right-[20%] w-[400px] h-[400px] water-blob"
            style={{
              background: 'radial-gradient(circle, var(--accent-muted) 0%, transparent 70%)',
              filter: 'blur(60px)',
              opacity: 0.6,
            }}
          />
          {/* Morphing water blob - bottom left */}
          <div
            className="absolute bottom-10 left-[5%] w-[300px] h-[300px] water-blob"
            style={{
              background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
              filter: 'blur(50px)',
              animationDelay: '4s',
            }}
          />
          {/* Additional water blob - center */}
          <div
            className="absolute top-[40%] left-[50%] w-[350px] h-[350px] water-blob"
            style={{
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
              filter: 'blur(70px)',
              animationDelay: '2s',
              transform: 'translate(-50%, -50%)',
            }}
          />

          {/* Grid pattern with subtle water effect */}
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `
                linear-gradient(var(--text-primary) 1px, transparent 1px),
                linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        {/* Wave Divider at bottom */}
        <WaveDivider position="bottom" variant="default" />

        {/* Floating Bubbles - using deterministic values to avoid hydration mismatch */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[
            { size: 10, opacity: 0.2, duration: 10 },
            { size: 8, opacity: 0.15, duration: 12 },
            { size: 12, opacity: 0.18, duration: 9 },
            { size: 7, opacity: 0.22, duration: 11 },
            { size: 9, opacity: 0.16, duration: 13 },
            { size: 11, opacity: 0.2, duration: 10 },
            { size: 8, opacity: 0.17, duration: 12 },
            { size: 10, opacity: 0.19, duration: 9 },
            { size: 13, opacity: 0.15, duration: 11 },
            { size: 9, opacity: 0.21, duration: 14 },
            { size: 7, opacity: 0.18, duration: 10 },
            { size: 11, opacity: 0.16, duration: 12 },
          ].map((bubble, i) => (
            <div
              key={i}
              className="absolute rounded-full bubble"
              style={{
                left: `${5 + i * 8}%`,
                bottom: '-20px',
                width: `${bubble.size}px`,
                height: `${bubble.size}px`,
                background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(59, 130, 246, ${bubble.opacity}))`,
                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.1), 0 0 10px rgba(59, 130, 246, 0.2)',
                '--delay': `${i * 0.8}s`,
                '--duration': `${bubble.duration}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8 lg:py-10 w-full">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Content - 7 columns */}
            <div className="lg:col-span-7 text-left">
              {/* IIT Hyderabad Badge - Fixed tagline */}
              <div className="animate-fade-up" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                <div
                  className="inline-flex items-center gap-3 px-3 py-2 rounded-full mb-5 transition-all hover:scale-105"
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
                    style={{ background: 'white' }}
                  >
                    <Image
                      src="/IIT_Hyderabad_logo.png"
                      alt="IIT Hyderabad"
                      width={28}
                      height={28}
                      className="object-contain"
                      priority
                    />
                  </div>
                  <span className="text-sm font-semibold pr-1" style={{ color: 'var(--text-primary)' }}>
                    A Research Project by IIT Hyderabad
                  </span>
                </div>
              </div>

              {/* Headline */}
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-5 animate-fade-up stagger-1"
                style={{ color: 'var(--text-primary)', lineHeight: '1.1', opacity: 0, animationFillMode: 'forwards' }}
              >
                Flood Analytics for{' '}
                <span className="text-gradient">Urban Resilience</span>
              </h1>

              {/* Subheadline */}
              <p
                className="text-lg lg:text-xl mb-7 max-w-lg animate-fade-up stagger-2 font-medium leading-relaxed"
                style={{ color: 'var(--text-secondary)', opacity: 0, animationFillMode: 'forwards' }}
              >
                India&apos;s first comprehensive city-level flood database with two decades of documented events.
              </p>

              {/* CTA Buttons */}
              <div
                className="flex flex-col sm:flex-row items-start gap-3 animate-fade-up stagger-3"
                style={{ opacity: 0, animationFillMode: 'forwards' }}
              >
                <Link
                  href="/explorer"
                  className="btn btn-primary btn-liquid text-base px-7 py-3.5 group water-glow"
                >
                  <span className="font-bold flex items-center gap-2">
                    <svg
                      className="w-5 h-5 transition-transform group-hover:scale-110"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    Explorer
                    <svg
                      className="w-5 h-5 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
                <Link
                  href="/dashboard"
                  className="btn btn-secondary btn-liquid text-base px-7 py-3.5 font-bold group water-reflection"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Dashboard
                </Link>
              </div>

              {/* Live Status */}
              <div
                className="mt-6 animate-fade-up stagger-4"
                style={{ opacity: 0, animationFillMode: 'forwards' }}
              >
                <div className="inline-flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ background: 'var(--success)' }}
                    />
                    <span
                      className="relative inline-flex rounded-full h-2 w-2"
                      style={{ background: 'var(--success)' }}
                    />
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                    Currently tracking <span style={{ color: 'var(--accent-primary)' }}>Hyderabad, India</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Content - 5 columns with 4 info cards */}
            <div className="lg:col-span-5 hidden lg:block">
              <div
                className="relative animate-fade-up stagger-2"
                style={{ opacity: 0, animationFillMode: 'forwards' }}
              >
                {/* Main container box */}
                <div
                  className="relative rounded-3xl p-5 overflow-hidden"
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-xl)',
                  }}
                >
                  {/* Animated gradient background */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 50%, rgba(6, 182, 212, 0.1) 100%)',
                    }}
                  />

                  {/* 2x2 Grid - Core Features - Fixed unique icons */}
                  <div className="relative grid grid-cols-2 gap-3">
                    {/* Card 1 - Database */}
                    <div
                      className="group relative p-4 rounded-2xl transition-all duration-300 cursor-default overflow-hidden"
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        transformStyle: 'preserve-3d',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px) rotateX(5deg) rotateY(-5deg)';
                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(59, 130, 246, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) rotateX(0) rotateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%)' }} />
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                        style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' }}
                      >
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Database</h4>
                      <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                        1000+ flood events
                      </p>
                    </div>

                    {/* Card 2 - Analytics - Different icon from floating */}
                    <div
                      className="group relative p-4 rounded-2xl transition-all duration-300 cursor-default overflow-hidden"
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        transformStyle: 'preserve-3d',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px) rotateX(5deg) rotateY(5deg)';
                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(139, 92, 246, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) rotateX(0) rotateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, transparent 100%)' }} />
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)' }}
                      >
                        {/* Pie chart icon for Analytics */}
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Analytics</h4>
                      <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                        Custom visualizations
                      </p>
                    </div>

                    {/* Card 3 - Mapping */}
                    <div
                      className="group relative p-4 rounded-2xl transition-all duration-300 cursor-default overflow-hidden"
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        transformStyle: 'preserve-3d',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px) rotateX(-5deg) rotateY(-5deg)';
                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(6, 182, 212, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) rotateX(0) rotateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, transparent 100%)' }} />
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                        style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)' }}
                      >
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Mapping</h4>
                      <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                        Interactive heatmaps
                      </p>
                    </div>

                    {/* Card 4 - Filtering */}
                    <div
                      className="group relative p-4 rounded-2xl transition-all duration-300 cursor-default overflow-hidden"
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        transformStyle: 'preserve-3d',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px) rotateX(-5deg) rotateY(5deg)';
                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(16, 185, 129, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) rotateX(0) rotateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%)' }} />
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                        style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }}
                      >
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Filtering</h4>
                      <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                        Advanced search
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating animated icons - Using unique icons */}
                <div
                  className="absolute -top-3 -right-3 p-3 rounded-xl animate-float-slow z-10"
                  style={{
                    background: 'var(--accent-gradient)',
                    boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  {/* Trend/Chart line icon */}
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>

                <div
                  className="absolute -bottom-2 -left-2 p-3 rounded-xl animate-float z-10"
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                    boxShadow: '0 10px 30px rgba(6, 182, 212, 0.3)',
                    animationDelay: '1s',
                  }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Statistics Section */}
      <section className="relative py-12 lg:py-16 pt-32" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: 'Documented Events',
                value: loading ? '—' : stats?.totalEvents?.toLocaleString() || '1000+',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                color: '#3b82f6',
              },
              {
                label: 'People Affected',
                value: loading ? '—' : stats?.totalAffected ? `${(stats.totalAffected / 1000).toFixed(0)}K+` : '—',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                color: '#ef4444',
              },
              {
                label: 'Avg. Rainfall',
                value: loading ? '—' : stats?.avgRainfall ? `${stats.avgRainfall} mm` : '—',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                ),
                color: '#06b6d4',
              },
              {
                label: 'Years of Data',
                value: loading ? '—' : stats?.dateRange ? `${new Date(stats.dateRange.latest).getFullYear() - new Date(stats.dateRange.earliest).getFullYear()}+` : '20+',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                color: '#8b5cf6',
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="card card-water p-5 text-center"
                style={{ borderTop: `3px solid ${stat.color}` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: `${stat.color}15`, color: stat.color }}
                >
                  {stat.icon}
                </div>
                <div className="text-2xl lg:text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {stat.value}
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Flooded Areas Section */}
      <section className="relative py-12 lg:py-16 overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
        {/* Subtle flowing water background */}
        <FlowingWater intensity="low" />

        {/* Wave divider at bottom */}
        <WaveDivider position="bottom" variant="subtle" />

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <p
              className="text-sm font-bold uppercase tracking-widest mb-3"
              style={{ color: 'var(--accent-primary)' }}
            >
              High-Risk Zones
            </p>
            <h2
              className="text-3xl lg:text-4xl font-display font-bold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Most Flood-Prone Areas
            </h2>
            <p className="text-base font-medium" style={{ color: 'var(--text-secondary)' }}>
              Areas with highest recorded flood incidents in Hyderabad based on historical data
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {loading ? (
              // Skeleton loading
              Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className="card p-5 animate-pulse"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg skeleton" />
                    <div className="h-4 w-20 skeleton rounded" />
                  </div>
                  <div className="h-3 w-16 skeleton rounded" />
                </div>
              ))
            ) : stats?.topLocations?.slice(0, 5).map((loc, idx) => (
              <div
                key={loc.location}
                className="card card-water p-5 group cursor-pointer"
                style={{
                  borderLeft: `4px solid ${idx === 0 ? '#ef4444' : idx === 1 ? '#f97316' : idx === 2 ? '#f59e0b' : idx === 3 ? '#eab308' : '#84cc16'}`,
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                    style={{
                      background: idx === 0 ? '#ef4444' : idx === 1 ? '#f97316' : idx === 2 ? '#f59e0b' : idx === 3 ? '#eab308' : '#84cc16',
                    }}
                  >
                    {idx + 1}
                  </div>
                  <h3 className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }} title={loc.location}>
                    {loc.location}
                  </h3>
                </div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  {loc.count} recorded events
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
              style={{ color: 'var(--accent-primary)' }}
            >
              View all locations in dashboard
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="relative py-16 lg:py-20 pt-32" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p
              className="text-sm font-bold uppercase tracking-widest mb-3"
              style={{ color: 'var(--accent-primary)' }}
            >
              Platform Features
            </p>
            <h2
              className="text-3xl lg:text-4xl font-display font-bold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Tools for Comprehensive Analysis
            </h2>
            <p className="text-base font-medium" style={{ color: 'var(--text-secondary)' }}>
              Purpose-built for researchers, urban planners, and disaster management professionals
            </p>
          </div>

          {/* Features Grid - 6 features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Event Database',
                description: 'Browse thousands of documented flood events with dates, locations, rainfall measurements, and damage assessments.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />,
                gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
              },
              {
                title: 'Smart Filtering',
                description: 'Filter events by date range, location, flood type, rainfall intensity, and number of people affected.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />,
                gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
              },
              {
                title: 'Custom Charts',
                description: 'Build custom visualizations with our plot builder. Create bar charts, line graphs, and analyze trends over time.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
                gradient: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)',
              },
              {
                title: 'Interactive Map',
                description: 'Explore flood events spatially with markers and heatmaps. Zoom, pan, and click for detailed information.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />,
                gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
              },
              {
                title: 'Data Export',
                description: 'Export flood data to CSV or Excel format for further analysis. Download filtered or complete datasets.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />,
                gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
              },
              {
                title: 'Timeline Analysis',
                description: 'Animate through years to see how flood patterns have changed. Identify seasonal and long-term trends.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
                gradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="card card-water p-6 group water-hover"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                  style={{ background: feature.gradient }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {feature.title}
                </h3>
                <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link href="/dashboard" className="btn btn-primary btn-liquid text-base px-8 py-4 group water-glow">
              <span className="font-bold">Start Exploring</span>
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          {/* Main Footer Content */}
          <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--accent-gradient)' }}
                >
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>FloodLens</span>
              </div>
              <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                India&apos;s first comprehensive city-level flood database, enabling data-driven disaster management and urban resilience planning.
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden" style={{ background: 'white' }}>
                  <Image src="/IIT_Hyderabad_logo.png" alt="IIT Hyderabad" width={32} height={32} className="object-contain" />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>IIT Hyderabad</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Research Project</p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>
                Platform
              </h4>
              <ul className="space-y-3">
                {[
                  { href: '/dashboard', label: 'Dashboard' },
                  { href: '/explorer', label: 'Explorer' },
                  { href: '/analytics', label: 'Analytics' },
                  { href: '/map', label: 'Interactive Map' },
                ].map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium transition-colors hover:text-[var(--accent-primary)]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* About */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>
                About
              </h4>
              <ul className="space-y-3">
                {[
                  { href: '#', label: 'About the Project' },
                  { href: '#', label: 'Research Team' },
                  { href: '#', label: 'Methodology' },
                  { href: '#', label: 'Data Sources' },
                ].map(link => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium transition-colors hover:text-[var(--accent-primary)]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>
                Contact
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    IIT Hyderabad, Kandi,<br />Sangareddy, Telangana 502285
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a
                    href="mailto:floodlens@iith.ac.in"
                    className="text-sm font-medium transition-colors hover:text-[var(--accent-primary)]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    floodlens@iith.ac.in
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div
            className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              &copy; {new Date().getFullYear()} FloodLens. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="#"
                className="text-sm font-medium transition-colors hover:text-[var(--accent-primary)]"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                className="text-sm font-medium transition-colors hover:text-[var(--accent-primary)]"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Terms of Use
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal for errors */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setAuthErrorMessage(null);
        }}
      />

      {/* Show error toast if there was an auth error */}
      {authErrorMessage && showAuthModal && (
        <div
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[100000] px-6 py-3 rounded-xl animate-fade-up"
          style={{
            background: 'var(--danger)',
            color: 'white',
            boxShadow: '0 10px 40px rgba(239, 68, 68, 0.3)',
          }}
        >
          <p className="text-sm font-semibold">{authErrorMessage}</p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="animate-spin w-8 h-8 border-2 rounded-full" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
