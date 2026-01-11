'use client';

import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Header />

      {/* Hero Section */}
      <section
        className="relative min-h-[calc(100vh-80px)] flex flex-col justify-center overflow-hidden"
        style={{ background: 'var(--bg-secondary)' }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-10 right-[20%] w-[400px] h-[400px] rounded-full animate-float-slow"
            style={{
              background: 'radial-gradient(circle, var(--accent-muted) 0%, transparent 70%)',
              filter: 'blur(60px)',
              opacity: 0.5,
            }}
          />
          <div
            className="absolute bottom-10 left-[5%] w-[300px] h-[300px] rounded-full animate-float"
            style={{
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
              filter: 'blur(50px)',
              animationDelay: '2s',
            }}
          />

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(var(--text-primary) 1px, transparent 1px),
                linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8 lg:py-10 w-full">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Content - 7 columns */}
            <div className="lg:col-span-7 text-left">
              {/* IIT Hyderabad Badge */}
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
                    IIT Hyderabad Research
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
                  href="/dashboard"
                  className="btn btn-primary text-base px-7 py-3.5 group"
                >
                  <span className="font-bold flex items-center gap-2">
                    Explore Dashboard
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
                  href="/map"
                  className="btn btn-secondary text-base px-7 py-3.5 font-bold group"
                >
                  <svg
                    className="w-5 h-5 transition-transform group-hover:scale-110"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  View Map
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

                  {/* 2x2 Grid - Core Features */}
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

                    {/* Card 2 - Analytics */}
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
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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

                {/* Floating animated icons */}
                <div
                  className="absolute -top-3 -right-3 p-3 rounded-xl animate-float-slow z-10"
                  style={{
                    background: 'var(--accent-gradient)',
                    boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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

      {/* Platform Features Section */}
      <section className="py-16 lg:py-20" style={{ background: 'var(--bg-primary)' }}>
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
                title: 'Export & Share',
                description: 'Export charts as high-quality PNG images for use in reports, presentations, and publications.',
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
                className="card card-hover p-6 transition-all duration-300 group"
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
            <Link href="/dashboard" className="btn btn-primary text-base px-8 py-4 group">
              <span className="font-bold">Start Exploring</span>
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Brand & IIT */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--accent-gradient)' }}
                >
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>FloodLens</span>
              </div>

              <div className="h-6 w-px" style={{ background: 'var(--border-subtle)' }} />

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden" style={{ background: 'white' }}>
                  <Image src="/IIT_Hyderabad_logo.png" alt="IIT Hyderabad" width={28} height={28} className="object-contain" />
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>IIT Hyderabad</span>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-6">
              {[{ href: '/dashboard', label: 'Dashboard' }, { href: '/analytics', label: 'Analytics' }, { href: '/map', label: 'Map' }].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium transition-colors hover:text-[var(--accent-primary)]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Copyright */}
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              &copy; {new Date().getFullYear()} FloodLens
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
