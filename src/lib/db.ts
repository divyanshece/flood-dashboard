import Database from 'better-sqlite3';
import path from 'path';

// Database path - using symlink in project root
const DB_PATH = path.join(process.cwd(), 'flood_hyderabad.db');

// Create a singleton database connection
let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true });
  }
  return db;
}

// Types for database queries
export interface FloodEvent {
  event_id: number;
  event_date: string;
  reported_date: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  digipin: string | null;
  location_validated: number;
  flood_type: string | null;
  trigger_cause: string | null;
  rainfall_mm: number | null;
  total_affected: number;
  damage_description: string | null;
  source_urls: string | null;
  extraction_model: string | null;
  last_updated: string;
}

export interface EventFilters {
  startDate?: string;
  endDate?: string;
  location?: string;
  minRainfall?: number;
  maxRainfall?: number;
  floodType?: string;
  minAffected?: number;
}

export interface DatabaseStats {
  totalEvents: number;
  totalAffected: number;
  avgRainfall: number;
  dateRange: { earliest: string; latest: string };
  floodTypes: { type: string; count: number }[];
  topLocations: { location: string; count: number }[];
}

// Fetch all events with optional filters
export function getEvents(filters: EventFilters = {}): FloodEvent[] {
  const db = getDatabase();

  let query = 'SELECT * FROM event_attributes WHERE event_date >= \'2000-01-01\'';
  const params: Record<string, unknown> = {};

  if (filters.startDate) {
    query += ' AND event_date >= @startDate';
    params.startDate = filters.startDate;
  }

  if (filters.endDate) {
    query += ' AND event_date <= @endDate';
    params.endDate = filters.endDate;
  }

  if (filters.location) {
    query += ' AND location LIKE @location';
    params.location = `%${filters.location}%`;
  }

  if (filters.minRainfall !== undefined) {
    query += ' AND rainfall_mm >= @minRainfall';
    params.minRainfall = filters.minRainfall;
  }

  if (filters.maxRainfall !== undefined) {
    query += ' AND rainfall_mm <= @maxRainfall';
    params.maxRainfall = filters.maxRainfall;
  }

  if (filters.floodType) {
    query += ' AND flood_type LIKE @floodType';
    params.floodType = `%${filters.floodType}%`;
  }

  if (filters.minAffected !== undefined) {
    query += ' AND total_affected >= @minAffected';
    params.minAffected = filters.minAffected;
  }

  query += ' ORDER BY event_date DESC';

  const stmt = db.prepare(query);
  return stmt.all(params) as FloodEvent[];
}

// Get database statistics
export function getStats(): DatabaseStats {
  const db = getDatabase();

  const totalEvents = db.prepare('SELECT COUNT(*) as count FROM event_attributes WHERE event_date >= \'2000-01-01\'').get() as { count: number };

  const totalAffected = db.prepare('SELECT SUM(total_affected) as sum FROM event_attributes WHERE event_date >= \'2000-01-01\'').get() as { sum: number | null };

  const avgRainfall = db.prepare('SELECT AVG(rainfall_mm) as avg FROM event_attributes WHERE rainfall_mm IS NOT NULL AND event_date >= \'2000-01-01\'').get() as { avg: number | null };

  const dateRange = db.prepare(`
    SELECT MIN(event_date) as earliest, MAX(event_date) as latest
    FROM event_attributes
    WHERE event_date IS NOT NULL AND event_date != 'UNAVAILABLE' AND event_date >= '2000-01-01'
  `).get() as { earliest: string; latest: string };

  const floodTypes = db.prepare(`
    SELECT flood_type as type, COUNT(*) as count
    FROM event_attributes
    WHERE flood_type IS NOT NULL AND flood_type != '' AND event_date >= '2000-01-01'
    GROUP BY flood_type
    ORDER BY count DESC
  `).all() as { type: string; count: number }[];

  // Get top locations by splitting comma-separated values
  const allLocations = db.prepare(`
    SELECT location FROM event_attributes WHERE location IS NOT NULL AND event_date >= '2000-01-01'
  `).all() as { location: string }[];

  const locationCounts: Record<string, number> = {};
  allLocations.forEach(row => {
    if (row.location) {
      row.location.split(',').forEach(loc => {
        const trimmed = loc.trim();
        if (trimmed && trimmed !== 'Hyderabad') {
          locationCounts[trimmed] = (locationCounts[trimmed] || 0) + 1;
        }
      });
    }
  });

  const topLocations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([location, count]) => ({ location, count }));

  return {
    totalEvents: totalEvents.count,
    totalAffected: totalAffected.sum || 0,
    avgRainfall: avgRainfall.avg ? Math.round(avgRainfall.avg * 10) / 10 : 0,
    dateRange,
    floodTypes,
    topLocations,
  };
}

// Get single event by ID
export function getEventById(eventId: number): FloodEvent | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM event_attributes WHERE event_id = ?');
  return stmt.get(eventId) as FloodEvent | null;
}

// Get unique flood types for filter dropdown
export function getFloodTypes(): string[] {
  const db = getDatabase();
  const result = db.prepare(`
    SELECT DISTINCT flood_type
    FROM event_attributes
    WHERE flood_type IS NOT NULL AND flood_type != '' AND event_date >= '2000-01-01'
    ORDER BY flood_type
  `).all() as { flood_type: string }[];
  return result.map(r => r.flood_type);
}

// Get unique locations for autocomplete
export function getUniqueLocations(): string[] {
  const db = getDatabase();
  const allLocations = db.prepare(`
    SELECT DISTINCT location FROM event_attributes WHERE location IS NOT NULL AND event_date >= '2000-01-01'
  `).all() as { location: string }[];

  const uniqueLocations = new Set<string>();
  allLocations.forEach(row => {
    if (row.location) {
      row.location.split(',').forEach(loc => {
        const trimmed = loc.trim();
        if (trimmed) {
          uniqueLocations.add(trimmed);
        }
      });
    }
  });

  return Array.from(uniqueLocations).sort();
}
