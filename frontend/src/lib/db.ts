import Database from 'better-sqlite3';
import path from 'path';

// Database path - symlink is in parent directory (project root)
const DB_PATH = path.join(process.cwd(), '..', 'flood_hyderabad.db');

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
  id: number;
  event_id: number;
  country: string;
  state: string | null;
  city: string | null;
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
  total_deaths: number;
  total_displaced: number;
  total_injured: number;
  total_affected: number;
  impact_granularity: string | null;
  damage_description: string | null;
  data_source_type: string | null;
  confidence_score: number;
  source_urls: string | null;
  extraction_model: string | null;
  last_updated: string;
}

export interface EventFilters {
  startDate?: string;
  endDate?: string;
  location?: string;
  city?: string;
  state?: string;
  minRainfall?: number;
  maxRainfall?: number;
  floodType?: string;
  minAffected?: number;
}

export interface DatabaseStats {
  totalEvents: number;
  totalAffected: number;
  totalDeaths: number;
  avgRainfall: number;
  dateRange: { earliest: string; latest: string };
  floodTypes: { type: string; count: number }[];
  topCities: { city: string; count: number }[];
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

  if (filters.city) {
    query += ' AND city LIKE @city';
    params.city = `%${filters.city}%`;
  }

  if (filters.state) {
    query += ' AND state LIKE @state';
    params.state = `%${filters.state}%`;
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

  const totalDeaths = db.prepare('SELECT SUM(total_deaths) as sum FROM event_attributes WHERE event_date >= \'2000-01-01\'').get() as { sum: number | null };

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

  // Get top cities
  const topCities = db.prepare(`
    SELECT city, COUNT(*) as count
    FROM event_attributes
    WHERE city IS NOT NULL AND city != '' AND event_date >= '2000-01-01'
    GROUP BY city
    ORDER BY count DESC
    LIMIT 10
  `).all() as { city: string; count: number }[];

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
    totalDeaths: totalDeaths.sum || 0,
    avgRainfall: avgRainfall.avg ? Math.round(avgRainfall.avg * 10) / 10 : 0,
    dateRange,
    floodTypes,
    topCities,
    topLocations,
  };
}

// Get single event by ID
export function getEventById(eventId: number): FloodEvent | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM event_attributes WHERE id = ?');
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

// Get unique cities for filter dropdown
export function getCities(): string[] {
  const db = getDatabase();
  const result = db.prepare(`
    SELECT DISTINCT city
    FROM event_attributes
    WHERE city IS NOT NULL AND city != '' AND event_date >= '2000-01-01'
    ORDER BY city
  `).all() as { city: string }[];
  return result.map(r => r.city);
}

// Get unique states for filter dropdown
export function getStates(): string[] {
  const db = getDatabase();
  const result = db.prepare(`
    SELECT DISTINCT state
    FROM event_attributes
    WHERE state IS NOT NULL AND state != '' AND event_date >= '2000-01-01'
    ORDER BY state
  `).all() as { state: string }[];
  return result.map(r => r.state);
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

// Get quick stats for insights
export function getQuickStats() {
  const db = getDatabase();

  const recentEvents = db.prepare(`
    SELECT * FROM event_attributes
    WHERE event_date >= '2000-01-01'
    ORDER BY event_date DESC
    LIMIT 5
  `).all() as FloodEvent[];

  const mostAffected = db.prepare(`
    SELECT * FROM event_attributes
    WHERE event_date >= '2000-01-01' AND total_affected > 0
    ORDER BY total_affected DESC
    LIMIT 5
  `).all() as FloodEvent[];

  const highestRainfall = db.prepare(`
    SELECT * FROM event_attributes
    WHERE event_date >= '2000-01-01' AND rainfall_mm IS NOT NULL
    ORDER BY rainfall_mm DESC
    LIMIT 5
  `).all() as FloodEvent[];

  const byYear = db.prepare(`
    SELECT strftime('%Y', event_date) as year, COUNT(*) as count
    FROM event_attributes
    WHERE event_date >= '2000-01-01'
    GROUP BY year
    ORDER BY year DESC
  `).all() as { year: string; count: number }[];

  const byCity = db.prepare(`
    SELECT city, COUNT(*) as count, SUM(total_affected) as total_affected
    FROM event_attributes
    WHERE event_date >= '2000-01-01' AND city IS NOT NULL
    GROUP BY city
    ORDER BY count DESC
    LIMIT 10
  `).all() as { city: string; count: number; total_affected: number }[];

  return {
    recentEvents,
    mostAffected,
    highestRainfall,
    byYear,
    byCity,
  };
}
