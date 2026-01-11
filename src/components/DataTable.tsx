'use client';

import { useState, useMemo, Fragment } from 'react';
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
  const [pageSize, setPageSize] = useState(10);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      let aVal = a[sortField as keyof FloodEvent];
      let bVal = b[sortField as keyof FloodEvent];

      if (aVal === null || aVal === undefined) aVal = sortDirection === 'asc' ? Infinity : -Infinity;
      if (bVal === null || bVal === undefined) bVal = sortDirection === 'asc' ? Infinity : -Infinity;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      if (sortDirection === 'asc') {
        return (aVal as number) - (bVal as number);
      }
      return (bVal as number) - (aVal as number);
    });
  }, [events, sortField, sortDirection]);

  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedEvents.slice(start, start + pageSize);
  }, [sortedEvents, currentPage, pageSize]);

  const totalPages = useMemo(() => Math.ceil(events.length / pageSize), [events.length, pageSize]);

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
        <svg className="w-3 h-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return (
      <svg className="w-3 h-3" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
      return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const truncateText = (text: string | null, maxLength: number) => {
    if (!text) return '—';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getValidationBadge = (validated: number) => {
    return validated ? 'badge-success' : 'badge-neutral';
  };

  const toggleRowExpand = (eventId: number) => {
    setExpandedRow(expandedRow === eventId ? null : eventId);
  };

  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-muted)' }}>
            <svg className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Event Records
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Click row to expand details
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Show:</label>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="py-1.5 px-3 rounded-lg text-xs font-medium"
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="px-3 py-1.5 rounded-full" style={{ background: 'var(--accent-muted)' }}>
            <span className="text-xs font-medium" style={{ color: 'var(--accent-primary)' }}>
              {events.length} total
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th style={{ width: '50px' }}>#</th>
              <th className="cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors" onClick={() => handleSort('event_date')}>
                <div className="flex items-center gap-1.5">Date <SortIcon field="event_date" /></div>
              </th>
              <th className="cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors" onClick={() => handleSort('location')}>
                <div className="flex items-center gap-1.5">Location <SortIcon field="location" /></div>
              </th>
              <th className="cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors" onClick={() => handleSort('rainfall_mm')}>
                <div className="flex items-center gap-1.5">Rainfall <SortIcon field="rainfall_mm" /></div>
              </th>
              <th className="cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors" onClick={() => handleSort('flood_type')}>
                <div className="flex items-center gap-1.5">Type <SortIcon field="flood_type" /></div>
              </th>
              <th>Cause</th>
              <th>Status</th>
              <th style={{ width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {paginatedEvents.map((event, index) => (
              <Fragment key={event.event_id}>
                <tr
                  className="cursor-pointer group transition-colors"
                  onClick={() => toggleRowExpand(event.event_id)}
                  style={{ background: expandedRow === event.event_id ? 'var(--bg-tertiary)' : 'transparent' }}
                >
                  <td style={{ width: '40px' }}>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${expandedRow === event.event_id ? 'rotate-90' : ''}`}
                      style={{ color: 'var(--text-muted)' }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </td>
                  <td className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    {(currentPage - 1) * pageSize + index + 1}
                  </td>
                  <td className="whitespace-nowrap">
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatDate(event.event_date)}</span>
                  </td>
                  <td style={{ maxWidth: '200px' }}>
                    <span className="truncate block text-sm" title={event.location || undefined}>{truncateText(event.location, 30)}</span>
                  </td>
                  <td className="whitespace-nowrap">
                    {event.rainfall_mm !== null ? (
                      <span className="font-mono font-medium" style={{ color: 'var(--accent-primary)' }}>
                        {event.rainfall_mm}<span className="text-xs ml-0.5" style={{ color: 'var(--text-muted)' }}>mm</span>
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    {event.flood_type ? (
                      <span className="badge badge-primary">{truncateText(event.flood_type, 15)}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td style={{ maxWidth: '180px' }}>
                    <span className="text-sm truncate block" title={event.trigger_cause || undefined}>
                      {truncateText(event.trigger_cause, 30)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getValidationBadge(event.location_validated)}`}>
                      {event.location_validated ? 'Verified' : 'Approx'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={(e) => { e.stopPropagation(); onEventClick?.(event); }}
                      className="p-2 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-muted)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      title="View full details"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </td>
                </tr>

                {/* Expanded Details */}
                {expandedRow === event.event_id && (
                  <tr>
                    <td colSpan={9} style={{ background: 'var(--bg-tertiary)', padding: 0 }}>
                      <div className="p-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          {/* Affected */}
                          <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                              People Affected
                            </p>
                            <p className="stat-number text-3xl" style={{ color: event.total_affected > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                              {event.total_affected.toLocaleString()}
                            </p>
                          </div>

                          {/* Coordinates */}
                          {event.latitude && event.longitude && (
                            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                              <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                                Coordinates
                              </p>
                              <p className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                                {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
                              </p>
                            </div>
                          )}

                          {/* Digipin */}
                          {event.digipin && (
                            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                              <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                                Digipin Code
                              </p>
                              <p className="font-mono text-sm" style={{ color: 'var(--accent-primary)' }}>
                                {event.digipin}
                              </p>
                            </div>
                          )}

                          {/* Last Updated */}
                          <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                              Last Updated
                            </p>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {formatDate(event.last_updated)}
                            </p>
                          </div>
                        </div>

                        {/* Damage Description */}
                        {event.damage_description && (
                          <div className="mt-4 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                              Impact & Damage
                            </p>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                              {event.damage_description}
                            </p>
                          </div>
                        )}

                        {/* Sources */}
                        {event.source_urls && (
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                              {event.source_urls.split(';').filter(Boolean).slice(0, 4).map((url, idx) => (
                                <a
                                  key={idx}
                                  href={url.trim()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="badge badge-primary transition-all duration-200 hover:scale-105"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  Source {idx + 1}
                                </a>
                              ))}
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); onEventClick?.(event); }}
                              className="btn btn-primary text-sm"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Full Details
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Showing <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{(currentPage - 1) * pageSize + 1}</span> to{' '}
          <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{Math.min(currentPage * pageSize, events.length)}</span> of{' '}
          <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{events.length}</span>
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="btn btn-ghost p-2 disabled:opacity-30"
            title="First page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="btn btn-ghost p-2 disabled:opacity-30"
            title="Previous"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-1 mx-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className="w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    background: currentPage === pageNum ? 'var(--accent-gradient)' : 'transparent',
                    color: currentPage === pageNum ? 'white' : 'var(--text-tertiary)',
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
            className="btn btn-ghost p-2 disabled:opacity-30"
            title="Next"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="btn btn-ghost p-2 disabled:opacity-30"
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
