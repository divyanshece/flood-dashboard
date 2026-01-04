'use client';

import { useEffect } from 'react';
import { FloodEvent } from '@/types/event';

interface EventDetailModalProps {
  event: FloodEvent | null;
  onClose: () => void;
}

export default function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (event) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [event]);

  if (!event) return null;

  const formatDate = (dateStr: string | null, format: 'short' | 'long' = 'long') => {
    if (!dateStr || dateStr === 'UNAVAILABLE') return 'Unknown';
    try {
      if (format === 'short') {
        return new Date(dateStr).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
      return new Date(dateStr).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const sourceUrls = event.source_urls?.split(';').filter(Boolean) || [];

  const getHostname = (url: string) => {
    try {
      return new URL(url.trim()).hostname.replace('www.', '');
    } catch {
      return 'Source';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose} />

      {/* Modal Content */}
      <div className="modal-content w-full max-w-3xl">
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-6 py-4 flex items-start justify-between gap-4"
          style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-primary">
                Event #{event.event_id}
              </span>
              {event.flood_type && (
                <span className="badge badge-neutral">
                  {event.flood_type}
                </span>
              )}
            </div>
            <h2 className="text-xl font-display font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {event.location || 'Hyderabad Flood Event'}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {formatDate(event.event_date)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {/* Rainfall */}
            <div
              className="p-4 rounded-xl"
              style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(14, 165, 233, 0.05) 100%)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  Rainfall
                </span>
              </div>
              <p className="text-2xl font-display font-bold" style={{ color: 'var(--accent-secondary)' }}>
                {event.rainfall_mm !== null ? (
                  <>
                    {event.rainfall_mm}
                    <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-tertiary)' }}>mm</span>
                  </>
                ) : (
                  <span style={{ color: 'var(--text-tertiary)' }}>N/A</span>
                )}
              </p>
            </div>

            {/* People Affected */}
            <div
              className="p-4 rounded-xl"
              style={{ background: event.total_affected > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-tertiary)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4" style={{ color: event.total_affected > 0 ? 'var(--danger)' : 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  Affected
                </span>
              </div>
              <p className="text-2xl font-display font-bold" style={{ color: event.total_affected > 0 ? 'var(--danger)' : 'var(--text-tertiary)' }}>
                {event.total_affected}
              </p>
            </div>

            {/* Location Verified */}
            <div
              className="p-4 rounded-xl"
              style={{ background: event.location_validated ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-tertiary)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4" style={{ color: event.location_validated ? 'var(--success)' : 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {event.location_validated ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  Location
                </span>
              </div>
              <p className="text-lg font-display font-bold" style={{ color: event.location_validated ? 'var(--success)' : 'var(--text-tertiary)' }}>
                {event.location_validated ? 'Verified' : 'Approximate'}
              </p>
            </div>

            {/* Sources Count */}
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  Sources
                </span>
              </div>
              <p className="text-2xl font-display font-bold" style={{ color: 'var(--accent-primary)' }}>
                {sourceUrls.length}
              </p>
            </div>
          </div>

          {/* Details Sections */}
          <div className="space-y-6">
            {/* Location Details */}
            <section>
              <h3 className="text-sm font-display font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>
                Location Details
              </h3>
              <div className="card p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Full Location</p>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {event.location || 'Not specified'}
                    </p>
                  </div>
                  {event.latitude && event.longitude && (
                    <div>
                      <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Coordinates (WGS84)</p>
                      <p className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                        {event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}
                      </p>
                      <a
                        href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs mt-1 hover:underline"
                        style={{ color: 'var(--accent-primary)' }}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open in Google Maps
                      </a>
                    </div>
                  )}
                  {event.digipin && (
                    <div>
                      <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Digipin Code</p>
                      <p className="font-mono font-medium" style={{ color: 'var(--accent-primary)' }}>
                        {event.digipin}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Cause & Impact */}
            {(event.trigger_cause || event.damage_description) && (
              <section>
                <h3 className="text-sm font-display font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  Cause & Impact
                </h3>
                <div className="card p-4 space-y-4">
                  {event.trigger_cause && (
                    <div>
                      <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Trigger Cause</p>
                      <p style={{ color: 'var(--text-primary)' }}>{event.trigger_cause}</p>
                    </div>
                  )}
                  {event.damage_description && (
                    <div>
                      <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Damage & Impact</p>
                      <p style={{ color: 'var(--text-primary)' }}>{event.damage_description}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Timeline */}
            <section>
              <h3 className="text-sm font-display font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>
                Timeline
              </h3>
              <div className="card p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Event Date</p>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {formatDate(event.event_date, 'short')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>First Reported</p>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {formatDate(event.reported_date, 'short')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Last Updated</p>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {formatDate(event.last_updated, 'short')}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* News Sources */}
            {sourceUrls.length > 0 && (
              <section>
                <h3 className="text-sm font-display font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  News Sources ({sourceUrls.length})
                </h3>
                <div className="card p-4">
                  <div className="space-y-2">
                    {sourceUrls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)] group"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%)' }}
                        >
                          <svg className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {getHostname(url)}
                          </p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                            {url.trim()}
                          </p>
                        </div>
                        <svg className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="sticky bottom-0 px-6 py-4 flex items-center justify-between gap-4"
          style={{ background: 'var(--bg-tertiary)', borderTop: '1px solid var(--border-primary)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Event ID: {event.event_id}
          </p>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </>
  );
}
