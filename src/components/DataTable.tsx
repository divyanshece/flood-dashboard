'use client';

import { useState, useMemo } from 'react';
import { FloodEvent, SortField, SortDirection } from '@/types/event';

interface DataTableProps {
  events: FloodEvent[];
  onEventClick?: (event: FloodEvent) => void;
}

type ExtendedSortField = SortField | 'reported_date' | 'latitude' | 'total_affected';

export default function DataTable({ events, onEventClick }: DataTableProps) {
  const [sortField, setSortField] = useState<ExtendedSortField>('event_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const pageSize = 15;

  // Sort events
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      let aVal = a[sortField as keyof FloodEvent];
      let bVal = b[sortField as keyof FloodEvent];

      // Handle null values
      if (aVal === null || aVal === undefined) aVal = sortDirection === 'asc' ? Infinity : -Infinity;
      if (bVal === null || bVal === undefined) bVal = sortDirection === 'asc' ? Infinity : -Infinity;

      // Handle string comparison
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      // Handle number comparison
      if (sortDirection === 'asc') {
        return (aVal as number) - (bVal as number);
      }
      return (bVal as number) - (aVal as number);
    });
  }, [events, sortField, sortDirection]);

  // Paginate
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedEvents.slice(start, start + pageSize);
  }, [sortedEvents, currentPage]);

  const totalPages = Math.ceil(events.length / pageSize);

  const handleSort = (field: ExtendedSortField) => {
    if (field === sortField) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: ExtendedSortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-3.5 h-3.5 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return (
      <svg className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {sortDirection === 'asc' ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        )}
      </svg>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr || dateStr === 'UNAVAILABLE') return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const truncateText = (text: string | null, maxLength: number) => {
    if (!text) return '—';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getSeverityBadge = (affected: number) => {
    if (affected === 0) return 'badge-neutral';
    if (affected < 10) return 'badge-warning';
    if (affected < 50) return 'badge-warning';
    return 'badge-danger';
  };

  const getValidationBadge = (validated: number) => {
    return validated ? 'badge-success' : 'badge-neutral';
  };

  const toggleRowExpand = (eventId: number) => {
    setExpandedRow(expandedRow === eventId ? null : eventId);
  };

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Table Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%)' }}
          >
            <svg className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <div>
            <h3 className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
              Flood Events
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Click any row to view full details
            </p>
          </div>
        </div>
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-mono font-medium" style={{ color: 'var(--accent-primary)' }}>{events.length}</span> events found
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-10"></th>
              <th
                className="cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                onClick={() => handleSort('event_date')}
              >
                <div className="flex items-center gap-2">
                  Event Date
                  <SortIcon field="event_date" />
                </div>
              </th>
              <th
                className="cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                onClick={() => handleSort('location')}
              >
                <div className="flex items-center gap-2">
                  Location
                  <SortIcon field="location" />
                </div>
              </th>
              <th
                className="cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                onClick={() => handleSort('rainfall_mm')}
              >
                <div className="flex items-center gap-2">
                  Rainfall
                  <SortIcon field="rainfall_mm" />
                </div>
              </th>
              <th
                className="cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                onClick={() => handleSort('total_affected')}
              >
                <div className="flex items-center gap-2">
                  Affected
                  <SortIcon field="total_affected" />
                </div>
              </th>
              <th
                className="cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                onClick={() => handleSort('flood_type')}
              >
                <div className="flex items-center gap-2">
                  Type
                  <SortIcon field="flood_type" />
                </div>
              </th>
              <th>Coordinates</th>
              <th>Validated</th>
              <th className="w-10">View</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEvents.map((event) => (
              <>
                <tr
                  key={event.event_id}
                  className="cursor-pointer group"
                  onClick={() => toggleRowExpand(event.event_id)}
                >
                  {/* Expand Icon */}
                  <td className="w-10">
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${expandedRow === event.event_id ? 'rotate-90' : ''}`}
                      style={{ color: 'var(--text-tertiary)' }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </td>

                  {/* Event Date */}
                  <td className="whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium">{formatDate(event.event_date)}</span>
                      {event.reported_date && event.reported_date !== event.event_date && (
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          Reported: {formatDate(event.reported_date)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Location */}
                  <td className="max-w-[200px]">
                    <span title={event.location || undefined} className="truncate-2">
                      {truncateText(event.location, 40)}
                    </span>
                  </td>

                  {/* Rainfall */}
                  <td className="whitespace-nowrap">
                    {event.rainfall_mm !== null ? (
                      <span className="font-mono font-medium" style={{ color: 'var(--accent-secondary)' }}>
                        {event.rainfall_mm} <span className="text-xs font-normal" style={{ color: 'var(--text-tertiary)' }}>mm</span>
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                    )}
                  </td>

                  {/* Affected */}
                  <td className="whitespace-nowrap">
                    <span className={`badge ${getSeverityBadge(event.total_affected)}`}>
                      {event.total_affected}
                    </span>
                  </td>

                  {/* Flood Type */}
                  <td className="whitespace-nowrap">
                    {event.flood_type ? (
                      <span className="badge badge-primary text-xs">
                        {truncateText(event.flood_type, 20)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                    )}
                  </td>

                  {/* Coordinates */}
                  <td className="whitespace-nowrap font-mono text-xs">
                    {event.latitude && event.longitude ? (
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                    )}
                  </td>

                  {/* Validated */}
                  <td className="whitespace-nowrap">
                    <span className={`badge ${getValidationBadge(event.location_validated)}`}>
                      {event.location_validated ? 'Verified' : 'Approx'}
                    </span>
                  </td>

                  {/* View Details Button */}
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      className="p-2 rounded-lg transition-colors hover:bg-[var(--accent-primary)] hover:text-white"
                      style={{ color: 'var(--text-tertiary)' }}
                      title="View full details"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </td>
                </tr>

                {/* Expanded Row Details */}
                {expandedRow === event.event_id && (
                  <tr key={`${event.event_id}-expanded`}>
                    <td colSpan={9} style={{ background: 'var(--bg-tertiary)', padding: 0 }}>
                      <div className="p-4 animate-slide-down">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Trigger Cause */}
                          {event.trigger_cause && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                                Cause
                              </p>
                              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                {event.trigger_cause}
                              </p>
                            </div>
                          )}

                          {/* Damage Description */}
                          {event.damage_description && (
                            <div className="space-y-1 md:col-span-2">
                              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                                Impact & Damage
                              </p>
                              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                {event.damage_description}
                              </p>
                            </div>
                          )}

                          {/* Digipin */}
                          {event.digipin && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                                Digipin Code
                              </p>
                              <p className="text-sm font-mono" style={{ color: 'var(--accent-primary)' }}>
                                {event.digipin}
                              </p>
                            </div>
                          )}

                          {/* Last Updated */}
                          <div className="space-y-1">
                            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                              Last Updated
                            </p>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {formatDate(event.last_updated)}
                            </p>
                          </div>

                          {/* Source URLs */}
                          {event.source_urls && (
                            <div className="space-y-1 lg:col-span-2">
                              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                                Sources ({event.source_urls.split(';').filter(Boolean).length})
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {event.source_urls.split(';').filter(Boolean).slice(0, 3).map((url, idx) => (
                                  <a
                                    key={idx}
                                    href={url.trim()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="badge badge-primary hover:opacity-80 transition-opacity"
                                  >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    Source {idx + 1}
                                  </a>
                                ))}
                                {event.source_urls.split(';').filter(Boolean).length > 3 && (
                                  <span className="badge badge-neutral">
                                    +{event.source_urls.split(';').filter(Boolean).length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* View Full Details Button */}
                        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick?.(event);
                            }}
                            className="btn btn-primary text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Full Details
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Showing <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{(currentPage - 1) * pageSize + 1}</span> to{' '}
          <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{Math.min(currentPage * pageSize, events.length)}</span> of{' '}
          <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{events.length}</span> events
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="btn btn-ghost p-2 disabled:opacity-40"
            title="First page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="btn btn-ghost p-2 disabled:opacity-40"
            title="Previous page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1 mx-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                    currentPage === pageNum
                      ? 'text-white'
                      : 'hover:bg-[var(--bg-tertiary)]'
                  }`}
                  style={{
                    background: currentPage === pageNum ? 'var(--accent-gradient)' : 'transparent',
                    color: currentPage === pageNum ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="btn btn-ghost p-2 disabled:opacity-40"
            title="Next page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="btn btn-ghost p-2 disabled:opacity-40"
            title="Last page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
