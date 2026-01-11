'use client';

import { useEffect } from 'react';
import { FloodEvent } from '@/types/event';

interface EventDetailModalProps {
  event: FloodEvent | null;
  onClose: () => void;
}

export default function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (event) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [event]);

  if (!event) return null;

  const formatDate = (dateStr: string | null, format: 'short' | 'long' = 'long') => {
    if (!dateStr || dateStr === 'UNAVAILABLE') return 'Unknown';
    try {
      if (format === 'short') {
        return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
      }
      return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
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
      <div className="modal-backdrop" onClick={onClose} />

      <div className="modal-content w-full max-w-2xl">
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-6 py-5"
          style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge badge-primary">Event #{event.event_id}</span>
                {event.flood_type && <span className="badge badge-neutral">{event.flood_type}</span>}
              </div>
              <h2 className="text-xl font-display truncate" style={{ color: 'var(--text-primary)' }}>
                {event.location || 'Flood Event'}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {formatDate(event.event_date)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors flex-shrink-0"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {/* Rainfall */}
            <div className="p-4 rounded-xl" style={{ background: 'var(--accent-muted)' }}>
              <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Rainfall</p>
              <p className="stat-number text-2xl" style={{ color: 'var(--accent-primary)' }}>
                {event.rainfall_mm !== null ? (
                  <>{event.rainfall_mm}<span className="text-sm font-sans ml-0.5" style={{ color: 'var(--text-tertiary)' }}>mm</span></>
                ) : '—'}
              </p>
            </div>

            {/* People Affected */}
            <div className="p-4 rounded-xl" style={{ background: event.total_affected > 0 ? 'var(--danger-muted)' : 'var(--bg-tertiary)' }}>
              <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Affected</p>
              <p className="stat-number text-2xl" style={{ color: event.total_affected > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                {event.total_affected}
              </p>
            </div>

            {/* Location Verified */}
            <div className="p-4 rounded-xl" style={{ background: event.location_validated ? 'var(--success-muted)' : 'var(--bg-tertiary)' }}>
              <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Location</p>
              <p className="text-base font-medium" style={{ color: event.location_validated ? 'var(--success)' : 'var(--text-tertiary)' }}>
                {event.location_validated ? 'Verified' : 'Approx'}
              </p>
            </div>

            {/* Sources */}
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
              <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Sources</p>
              <p className="stat-number text-2xl" style={{ color: 'var(--text-primary)' }}>
                {sourceUrls.length}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Location */}
            <div className="card p-5">
              <h3 className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
                Location Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Full Location</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{event.location || 'Not specified'}</p>
                </div>
                {event.latitude && event.longitude && (
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Coordinates</p>
                    <p className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                      {event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}
                    </p>
                    <a
                      href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs mt-1.5 transition-opacity hover:opacity-70"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open in Maps
                    </a>
                  </div>
                )}
                {event.digipin && (
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Digipin Code</p>
                    <p className="font-mono text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>{event.digipin}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cause & Impact */}
            {(event.trigger_cause || event.damage_description) && (
              <div className="card p-5">
                <h3 className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
                  Cause & Impact
                </h3>
                <div className="space-y-4">
                  {event.trigger_cause && (
                    <div>
                      <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Trigger Cause</p>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{event.trigger_cause}</p>
                    </div>
                  )}
                  {event.damage_description && (
                    <div>
                      <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Damage & Impact</p>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{event.damage_description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="card p-5">
              <h3 className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
                Timeline
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Event Date</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatDate(event.event_date, 'short')}</p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Reported</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatDate(event.reported_date, 'short')}</p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Updated</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatDate(event.last_updated, 'short')}</p>
                </div>
              </div>
            </div>

            {/* Sources */}
            {sourceUrls.length > 0 && (
              <div className="card p-5">
                <h3 className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
                  News Sources ({sourceUrls.length})
                </h3>
                <div className="space-y-2">
                  {sourceUrls.map((url, idx) => (
                    <a
                      key={idx}
                      href={url.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl transition-colors group"
                      style={{ background: 'var(--bg-tertiary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-muted)' }}>
                        <svg className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{getHostname(url)}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{url.trim()}</p>
                      </div>
                      <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="sticky bottom-0 px-6 py-4 flex items-center justify-between"
          style={{ background: 'var(--bg-tertiary)', borderTop: '1px solid var(--border-subtle)' }}
        >
          <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>ID: {event.event_id}</p>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </>
  );
}
