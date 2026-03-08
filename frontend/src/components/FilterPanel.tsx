'use client';

import { useState, useRef, useEffect } from 'react';
import { EventFilters } from '@/types/event';

interface FilterPanelProps {
  filters: EventFilters;
  onFilterChange: (filters: EventFilters) => void;
  floodTypes: string[];
  locations: string[];
}

export default function FilterPanel({
  filters,
  onFilterChange,
  floodTypes,
  locations,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [locationSearch, setLocationSearch] = useState(filters.location || '');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          locationInputRef.current && !locationInputRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (key: keyof EventFilters, value: string | number | undefined) => {
    onFilterChange({
      ...filters,
      [key]: value === '' ? undefined : value,
    });
  };

  const handleLocationSelect = (location: string) => {
    setLocationSearch(location);
    handleChange('location', location);
    setShowLocationDropdown(false);
  };

  const clearFilters = () => {
    setLocationSearch('');
    onFilterChange({});
  };

  const filteredLocations = locations.filter(loc =>
    loc.toLowerCase().includes(locationSearch.toLowerCase())
  ).slice(0, 50);

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== '').length;

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-[var(--bg-tertiary)]"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ background: 'var(--bg-secondary)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-200"
            style={{
              background: activeFilterCount > 0 ? 'var(--accent-muted)' : 'var(--bg-tertiary)',
              transform: isExpanded ? 'scale(1)' : 'scale(0.95)'
            }}
          >
            <svg
              className="w-4 h-4"
              style={{ color: activeFilterCount > 0 ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Filters
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {activeFilterCount > 0 ? `${activeFilterCount} active` : 'Refine results'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {activeFilterCount > 0 && (
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold animate-scale-in"
              style={{ background: 'var(--accent-primary)', color: 'white' }}
            >
              {activeFilterCount}
            </span>
          )}
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            style={{ color: 'var(--text-tertiary)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Filter Controls */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-5 border-t" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="w-full"
              />
            </div>

            {/* Location */}
            <div className="space-y-2 relative">
              <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                Location
              </label>
              <input
                ref={locationInputRef}
                type="text"
                value={locationSearch}
                onChange={(e) => {
                  setLocationSearch(e.target.value);
                  handleChange('location', e.target.value);
                  setShowLocationDropdown(true);
                }}
                onFocus={() => setShowLocationDropdown(true)}
                placeholder="Search location..."
                className="w-full"
              />
              {showLocationDropdown && filteredLocations.length > 0 && locationSearch && (
                <div
                  ref={dropdownRef}
                  className="absolute z-50 mt-1 w-full rounded-lg overflow-hidden hide-scrollbar animate-fade-down"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-lg)',
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}
                >
                  {filteredLocations.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => handleLocationSelect(loc)}
                      className="w-full px-3 py-2.5 text-left text-sm transition-colors flex items-center gap-2"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span className="truncate">{loc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Flood Type */}
            <div className="space-y-2">
              <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" />
                </svg>
                Flood Type
              </label>
              <select
                value={filters.floodType || ''}
                onChange={(e) => handleChange('floodType', e.target.value)}
                className="w-full"
              >
                <option value="">All Types</option>
                {floodTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Rainfall */}
            <div className="space-y-2">
              <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
                Min Rainfall (mm)
              </label>
              <input
                type="number"
                value={filters.minRainfall ?? ''}
                onChange={(e) => handleChange('minRainfall', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0"
                min="0"
                className="w-full"
              />
            </div>

            {/* Max Rainfall */}
            <div className="space-y-2">
              <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
                Max Rainfall (mm)
              </label>
              <input
                type="number"
                value={filters.maxRainfall ?? ''}
                onChange={(e) => handleChange('maxRainfall', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="500"
                min="0"
                className="w-full"
              />
            </div>

            {/* Min Affected */}
            <div className="space-y-2">
              <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Min Affected
              </label>
              <input
                type="number"
                value={filters.minAffected ?? ''}
                onChange={(e) => handleChange('minAffected', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                placeholder="0"
                min="0"
                className="w-full"
              />
            </div>

            {/* Clear Button */}
            <div className="space-y-2 flex items-end">
              <button
                onClick={clearFilters}
                disabled={activeFilterCount === 0}
                className="btn w-full transition-all duration-200"
                style={{
                  background: activeFilterCount > 0 ? 'var(--danger)' : 'var(--bg-secondary)',
                  color: activeFilterCount > 0 ? 'white' : 'var(--text-tertiary)',
                  border: activeFilterCount > 0 ? 'none' : '1px solid var(--border-subtle)',
                  opacity: activeFilterCount === 0 ? 0.6 : 1,
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
