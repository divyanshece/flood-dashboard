'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FloodEvent } from '@/types/event';

interface EventDetailModalProps {
  event: FloodEvent | null;
  onClose: () => void;
}

function EventDetailModalContent({ event, onClose }: EventDetailModalProps) {
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
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '600px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          maxHeight: 'calc(100vh - 32px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header - Compact */}
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--bg-tertiary)',
            borderBottom: '1px solid var(--border-subtle)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Badges Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: 'var(--accent-muted)',
                    color: 'var(--accent-primary)',
                  }}
                >
                  #{event.id}
                </span>
                {event.city && (
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      background: 'var(--accent-primary)',
                      color: 'white',
                    }}
                  >
                    {event.city}
                  </span>
                )}
                {event.flood_type && (
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: 'var(--warning-muted)',
                      color: 'var(--warning)',
                    }}
                  >
                    {event.flood_type}
                  </span>
                )}
              </div>
              {/* Title */}
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {event.location || 'Flood Event'}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                {formatDate(event.event_date)}
              </p>
            </div>
            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {/* Metrics Grid - Compact 2x2 or 3 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
            {/* Rainfall */}
            <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--accent-muted)' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Rainfall</p>
              <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-primary)', margin: 0 }}>
                {event.rainfall_mm !== null ? `${event.rainfall_mm}mm` : '—'}
              </p>
            </div>

            {/* Affected */}
            <div style={{ padding: '12px', borderRadius: '12px', background: event.total_affected > 0 ? 'var(--danger-muted)' : 'var(--bg-tertiary)' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Affected</p>
              <p style={{ fontSize: '20px', fontWeight: 700, color: event.total_affected > 0 ? 'var(--danger)' : 'var(--text-primary)', margin: 0 }}>
                {event.total_affected?.toLocaleString() || 0}
              </p>
            </div>

            {/* Deaths */}
            <div style={{ padding: '12px', borderRadius: '12px', background: event.total_deaths > 0 ? 'var(--danger-muted)' : 'var(--bg-tertiary)' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Deaths</p>
              <p style={{ fontSize: '20px', fontWeight: 700, color: event.total_deaths > 0 ? 'var(--danger)' : 'var(--text-muted)', margin: 0 }}>
                {event.total_deaths || 0}
              </p>
            </div>
          </div>

          {/* Additional Stats Row */}
          {(event.total_displaced > 0 || event.total_injured > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
              {event.total_displaced > 0 && (
                <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--warning-muted)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Displaced</p>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--warning)', margin: 0 }}>
                    {event.total_displaced?.toLocaleString()}
                  </p>
                </div>
              )}
              {event.total_injured > 0 && (
                <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-tertiary)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Injured</p>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {event.total_injured}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Location Details */}
          <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Location Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {event.city && (
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>City</p>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-primary)', margin: 0 }}>{event.city}</p>
                </div>
              )}
              {event.state && (
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>State</p>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{event.state}</p>
                </div>
              )}
              {event.latitude && event.longitude && (
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Coordinates</p>
                  <p style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-primary)', margin: 0 }}>
                    {event.latitude.toFixed(5)}, {event.longitude.toFixed(5)}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '11px', color: 'var(--accent-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}
                  >
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open in Maps
                  </a>
                </div>
              )}
              {event.digipin && (
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Digipin</p>
                  <p style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-primary)', margin: 0 }}>{event.digipin}</p>
                </div>
              )}
            </div>
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                Location {event.location_validated ? '(Verified)' : '(Approximate)'}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>{event.location || 'Not specified'}</p>
            </div>
          </div>

          {/* Cause & Impact */}
          {(event.trigger_cause || event.damage_description) && (
            <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Cause & Impact
              </h3>
              {event.trigger_cause && (
                <div style={{ marginBottom: event.damage_description ? '12px' : 0 }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Trigger Cause</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>{event.trigger_cause}</p>
                </div>
              )}
              {event.damage_description && (
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Damage & Impact</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>{event.damage_description}</p>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Timeline
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Event Date</p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{formatDate(event.event_date, 'short')}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Reported</p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{formatDate(event.reported_date, 'short')}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Updated</p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{formatDate(event.last_updated, 'short')}</p>
              </div>
            </div>
          </div>

          {/* Sources */}
          {sourceUrls.length > 0 && (
            <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Sources ({sourceUrls.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sourceUrls.slice(0, 3).map((url, idx) => (
                  <a
                    key={idx}
                    href={url.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-secondary)',
                      textDecoration: 'none',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--accent-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="14" height="14" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getHostname(url)}</p>
                    </div>
                    <svg width="14" height="14" style={{ color: 'var(--text-muted)', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            background: 'var(--bg-tertiary)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <p style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-muted)', margin: 0 }}>ID: {event.id}</p>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EventDetailModal(props: EventDetailModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !props.event) return null;

  return createPortal(<EventDetailModalContent {...props} />, document.body);
}

// Add useState import
import { useState } from 'react';
