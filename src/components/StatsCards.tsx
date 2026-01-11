'use client';

import { DatabaseStats } from '@/types/event';

interface StatsCardsProps {
  stats: DatabaseStats | null;
  loading: boolean;
}

export default function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-5">
            <div className="skeleton h-4 w-20 mb-3" />
            <div className="skeleton h-10 w-28 mb-2" />
            <div className="skeleton h-3 w-16" />
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

  const statCards = [
    {
      label: 'Total Events',
      value: stats.totalEvents.toLocaleString(),
      suffix: '',
      description: 'Documented floods',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
      iconBg: 'rgba(59, 130, 246, 0.15)',
      iconColor: '#3b82f6',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      ),
    },
    {
      label: 'Avg Rainfall',
      value: stats.avgRainfall,
      suffix: 'mm',
      description: 'Per event',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
      iconBg: 'rgba(139, 92, 246, 0.15)',
      iconColor: '#8b5cf6',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      ),
    },
    {
      label: 'Time Span',
      value: yearSpan(),
      suffix: 'yrs',
      description: formatDateRange(),
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)',
      iconBg: 'rgba(6, 182, 212, 0.15)',
      iconColor: '#06b6d4',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      ),
    },
    {
      label: 'Data Sources',
      value: '13+',
      suffix: '',
      description: 'News outlets',
      gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      iconBg: 'rgba(16, 185, 129, 0.15)',
      iconColor: '#10b981',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className="card card-hover p-5 transition-all duration-300 group"
        >
          <div className="flex items-start justify-between mb-3">
            <p
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {stat.label}
            </p>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: stat.iconBg }}
            >
              <svg
                className="w-4 h-4"
                style={{ color: stat.iconColor }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                {stat.icon}
              </svg>
            </div>
          </div>
          <p className="stat-number text-3xl lg:text-4xl mb-1" style={{ color: 'var(--text-primary)' }}>
            {stat.value}
            {stat.suffix && (
              <span
                className="text-lg font-sans font-semibold ml-1"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {stat.suffix}
              </span>
            )}
          </p>
          <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            {stat.description}
          </p>
        </div>
      ))}
    </div>
  );
}
