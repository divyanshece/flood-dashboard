'use client';

import { useState, useMemo, Fragment, useCallback, useRef, useEffect } from 'react';
import { FloodEvent, SortField, SortDirection } from '@/types/event';

interface DataTableProps {
  events: FloodEvent[];
  onEventClick?: (event: FloodEvent) => void;
  canDownload?: boolean;
  onRequestAccess?: () => void;
  userId?: string;
  requestId?: string | null;
  downloadInfo?: { count: number; max: number } | null;
}

type ExtendedSortField = SortField | 'reported_date' | 'latitude' | 'total_affected';

// Helper to parse date and handle invalid/missing dates
const parseDate = (dateStr: string | null): Date | null => {
  if (!dateStr || dateStr === 'UNAVAILABLE' || dateStr === '' || dateStr === 'null') {
    return null;
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
};

export default function DataTable({ events, onEventClick, canDownload = false, onRequestAccess, userId, requestId, downloadInfo }: DataTableProps) {
  const [sortField, setSortField] = useState<ExtendedSortField>('event_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [exporting, setExporting] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Create unique key for each event
  const getEventKey = (event: FloodEvent, index: number) => `${event.id}-${index}`;

  const sortedEvents = useMemo(() => {
    // First, add original index to each event for unique identification
    const eventsWithIndex = events.map((event, idx) => ({ ...event, _originalIndex: idx }));

    return eventsWithIndex.sort((a, b) => {
      // Special handling for date fields
      if (sortField === 'event_date') {
        const aDate = parseDate(a.event_date);
        const bDate = parseDate(b.event_date);

        // Null dates: at the beginning when ascending, at the end when descending
        if (aDate === null && bDate === null) return 0;
        if (aDate === null) return sortDirection === 'asc' ? -1 : 1;
        if (bDate === null) return sortDirection === 'asc' ? 1 : -1;

        return sortDirection === 'asc'
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      }

      let aVal = a[sortField as keyof FloodEvent];
      let bVal = b[sortField as keyof FloodEvent];

      // Handle null/undefined values
      const aIsNull = aVal === null || aVal === undefined || aVal === '';
      const bIsNull = bVal === null || bVal === undefined || bVal === '';

      if (aIsNull && bIsNull) return 0;
      if (aIsNull) return sortDirection === 'asc' ? -1 : 1;
      if (bIsNull) return sortDirection === 'asc' ? 1 : -1;

      // String comparison
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      // Numeric comparison
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

  const totalPages = useMemo(() => Math.ceil(sortedEvents.length / pageSize), [sortedEvents.length, pageSize]);

  const handleSort = (field: ExtendedSortField) => {
    if (field === sortField) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
    setExpandedRowKey(null);
  };

  // Export via API (tracks downloads properly)
  const handleExport = useCallback(async (format: 'csv' | 'excel') => {
    if (!userId || !requestId) {
      setDownloadError('No approved request found');
      return;
    }

    setExporting(true);
    setShowExportDropdown(false);
    setDownloadError(null);

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          userId,
          format,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Download failed');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `floodlens_data_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      // Reload page to update download count
      window.location.reload();
    } catch (error) {
      console.error('Export failed:', error);
      setDownloadError(error instanceof Error ? error.message : 'Download failed');
    } finally {
      setExporting(false);
    }
  }, [userId, requestId]);

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
    if (!dateStr || dateStr === 'UNAVAILABLE' || dateStr === '' || dateStr === 'null') return '—';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '—';
      return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '—';
    }
  };

  const truncateText = (text: string | null, maxLength: number) => {
    if (!text) return '—';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const toggleRowExpand = (key: string) => {
    setExpandedRowKey(expandedRowKey === key ? null : key);
  };

  // Calculate the serial number for each row
  const getSerialNumber = (pageIndex: number) => {
    return (currentPage - 1) * pageSize + pageIndex + 1;
  };

  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
        <div className="flex items-center gap-3 flex-wrap">
          {/* Export Button with Dropdown or Request Access */}
          <div className="flex items-center gap-2">
            {canDownload ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  disabled={exporting || events.length === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                    color: 'white'
                  }}
                >
                  {exporting ? (
                    <>
                      <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export Data
                      <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>

                {showExportDropdown && !exporting && (
                  <div className="absolute right-0 mt-2 w-36 rounded-xl shadow-lg z-20 overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <svg className="w-4 h-4" style={{ color: '#10b981' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      CSV
                    </button>
                    <button
                      onClick={() => handleExport('excel')}
                      className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 transition-colors"
                      style={{ color: 'var(--text-primary)', borderTop: '1px solid var(--border-subtle)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <svg className="w-4 h-4" style={{ color: '#10b981' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Excel
                    </button>
                  </div>
                )}

                {downloadInfo && (
                  <p className="text-xs mt-1 text-center" style={{ color: 'var(--text-muted)' }}>
                    {downloadInfo.count}/{downloadInfo.max} used
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={onRequestAccess}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                style={{
                  background: 'var(--accent-muted)',
                  border: '1px solid var(--accent-primary)',
                  color: 'var(--accent-primary)'
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Request Data Access
              </button>
            )}
          </div>
          {downloadError && (
            <p className="text-xs" style={{ color: 'var(--danger)' }}>{downloadError}</p>
          )}
          <div className="h-6 w-px" style={{ background: 'var(--border-subtle)' }} />
          <div className="flex items-center gap-2">
            <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Show:</label>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); setExpandedRowKey(null); }}
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
              {sortedEvents.length} total
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
              <th style={{ width: '60px' }}>S.No</th>
              <th className="cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors" onClick={() => handleSort('event_date')}>
                <div className="flex items-center gap-1.5">Date <SortIcon field="event_date" /></div>
              </th>
              <th>City</th>
              <th>State</th>
              <th className="cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors" onClick={() => handleSort('location')}>
                <div className="flex items-center gap-1.5">Location <SortIcon field="location" /></div>
              </th>
              <th className="cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors" onClick={() => handleSort('rainfall_mm')}>
                <div className="flex items-center gap-1.5">Rainfall <SortIcon field="rainfall_mm" /></div>
              </th>
              <th className="cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors" onClick={() => handleSort('flood_type')}>
                <div className="flex items-center gap-1.5">Type <SortIcon field="flood_type" /></div>
              </th>
              <th className="cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors" onClick={() => handleSort('total_affected')}>
                <div className="flex items-center gap-1.5">Affected <SortIcon field="total_affected" /></div>
              </th>
              <th style={{ width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {paginatedEvents.map((event, index) => {
              const rowKey = `${event.id}-${(event as any)._originalIndex}`;
              const serialNumber = getSerialNumber(index);

              return (
                <Fragment key={rowKey}>
                  <tr
                    className="cursor-pointer group transition-colors"
                    onClick={() => toggleRowExpand(rowKey)}
                    style={{ background: expandedRowKey === rowKey ? 'var(--bg-tertiary)' : 'transparent' }}
                  >
                    <td style={{ width: '40px' }}>
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${expandedRowKey === rowKey ? 'rotate-90' : ''}`}
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
                      {serialNumber}
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatDate(event.event_date)}</span>
                    </td>
                    <td>
                      {event.city ? (
                        <span className="badge badge-primary">{truncateText(event.city, 15)}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      {event.state ? (
                        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{truncateText(event.state, 15)}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ maxWidth: '180px' }}>
                      <span className="truncate block text-sm" title={event.location || undefined}>{truncateText(event.location, 25)}</span>
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
                        <span className="badge badge-warning">{truncateText(event.flood_type, 15)}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap">
                      {event.total_affected > 0 ? (
                        <span className="font-mono font-medium" style={{ color: event.total_affected >= 1000 ? 'var(--danger)' : event.total_affected >= 100 ? 'var(--warning)' : 'var(--text-primary)' }}>
                          {event.total_affected.toLocaleString()}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
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
                  {expandedRowKey === rowKey && (
                    <tr>
                      <td colSpan={10} style={{ background: 'var(--bg-tertiary)', padding: 0 }}>
                        <div className="p-6 animate-fade-in">
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                            {/* City */}
                            {event.city && (
                              <div className="p-4 rounded-xl" style={{ background: 'var(--accent-muted)' }}>
                                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                                  City
                                </p>
                                <p className="text-lg font-bold" style={{ color: 'var(--accent-primary)' }}>
                                  {event.city}
                                </p>
                              </div>
                            )}

                            {/* State */}
                            {event.state && (
                              <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                                  State
                                </p>
                                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                                  {event.state}
                                </p>
                              </div>
                            )}

                            {/* Affected */}
                            <div className="p-4 rounded-xl" style={{ background: event.total_affected > 0 ? 'var(--danger-muted)' : 'var(--bg-secondary)' }}>
                              <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                                People Affected
                              </p>
                              <p className="stat-number text-2xl" style={{ color: event.total_affected > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
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

                          {/* Trigger Cause & Damage */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {event.trigger_cause && (
                              <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                                  Trigger Cause
                                </p>
                                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                                  {event.trigger_cause}
                                </p>
                              </div>
                            )}
                            {event.damage_description && (
                              <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                                  Impact & Damage
                                </p>
                                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                                  {event.damage_description}
                                </p>
                              </div>
                            )}
                          </div>

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
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Showing <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{(currentPage - 1) * pageSize + 1}</span> to{' '}
          <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{Math.min(currentPage * pageSize, sortedEvents.length)}</span> of{' '}
          <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{sortedEvents.length}</span>
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setCurrentPage(1); setExpandedRowKey(null); }}
            disabled={currentPage === 1}
            className="btn btn-ghost p-2 disabled:opacity-30"
            title="First page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => { setCurrentPage(prev => Math.max(1, prev - 1)); setExpandedRowKey(null); }}
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
                  onClick={() => { setCurrentPage(pageNum); setExpandedRowKey(null); }}
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
            onClick={() => { setCurrentPage(prev => Math.min(totalPages, prev + 1)); setExpandedRowKey(null); }}
            disabled={currentPage === totalPages}
            className="btn btn-ghost p-2 disabled:opacity-30"
            title="Next"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => { setCurrentPage(totalPages); setExpandedRowKey(null); }}
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
