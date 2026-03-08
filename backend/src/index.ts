import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { db } from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get flood statistics
app.get('/api/stats', (req, res) => {
  try {
    const totalEvents = db.prepare("SELECT COUNT(*) as count FROM event_attributes WHERE event_date >= '2000-01-01'").get() as { count: number };
    const totalAffected = db.prepare("SELECT SUM(total_affected) as sum FROM event_attributes WHERE event_date >= '2000-01-01'").get() as { sum: number | null };
    const totalDeaths = db.prepare("SELECT SUM(total_deaths) as sum FROM event_attributes WHERE event_date >= '2000-01-01'").get() as { sum: number | null };
    const avgRainfall = db.prepare("SELECT AVG(rainfall_mm) as avg FROM event_attributes WHERE rainfall_mm IS NOT NULL AND event_date >= '2000-01-01'").get() as { avg: number | null };

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

    const topCities = db.prepare(`
      SELECT city, COUNT(*) as count
      FROM event_attributes
      WHERE city IS NOT NULL AND city != '' AND event_date >= '2000-01-01'
      GROUP BY city
      ORDER BY count DESC
      LIMIT 10
    `).all() as { city: string; count: number }[];

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

    res.json({
      totalEvents: totalEvents.count,
      totalAffected: totalAffected.sum || 0,
      totalDeaths: totalDeaths.sum || 0,
      avgRainfall: avgRainfall.avg ? Math.round(avgRainfall.avg * 10) / 10 : 0,
      dateRange,
      floodTypes,
      topCities,
      topLocations,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get flood events with filters
app.get('/api/events', (req, res) => {
  try {
    const { startDate, endDate, location, floodType, minRainfall, maxRainfall, minAffected, limit } = req.query;

    let query = "SELECT * FROM event_attributes WHERE event_date >= '2000-01-01'";
    const params: Record<string, unknown> = {};

    if (startDate) {
      query += ' AND event_date >= @startDate';
      params.startDate = startDate;
    }

    if (endDate) {
      query += ' AND event_date <= @endDate';
      params.endDate = endDate;
    }

    if (location) {
      query += ' AND location LIKE @location';
      params.location = `%${location}%`;
    }

    if (floodType) {
      query += ' AND flood_type LIKE @floodType';
      params.floodType = `%${floodType}%`;
    }

    if (minRainfall !== undefined) {
      query += ' AND rainfall_mm >= @minRainfall';
      params.minRainfall = parseFloat(minRainfall as string);
    }

    if (maxRainfall !== undefined) {
      query += ' AND rainfall_mm <= @maxRainfall';
      params.maxRainfall = parseFloat(maxRainfall as string);
    }

    if (minAffected !== undefined) {
      query += ' AND total_affected >= @minAffected';
      params.minAffected = parseInt(minAffected as string, 10);
    }

    query += ' ORDER BY event_date DESC';

    if (limit) {
      query += ' LIMIT @limit';
      params.limit = parseInt(limit as string, 10);
    }

    const events = db.prepare(query).all(params);

    // Get filter options
    const floodTypes = db.prepare(`
      SELECT DISTINCT flood_type FROM event_attributes
      WHERE flood_type IS NOT NULL AND flood_type != '' AND event_date >= '2000-01-01'
      ORDER BY flood_type
    `).all() as { flood_type: string }[];

    const locations = db.prepare(`
      SELECT DISTINCT location FROM event_attributes
      WHERE location IS NOT NULL AND event_date >= '2000-01-01'
      LIMIT 100
    `).all() as { location: string }[];

    res.json({
      events,
      total: events.length,
      filters: {
        floodTypes: floodTypes.map(f => f.flood_type),
        locations: locations.map(l => l.location),
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events', events: [] });
  }
});

// Get all flood data for download (no filters, all data)
app.get('/api/flood-data', (req, res) => {
  try {
    const events = db.prepare(`
      SELECT
        event_id, country, state, city, event_date, reported_date,
        location, latitude, longitude, flood_type, trigger_cause,
        rainfall_mm, total_deaths, total_displaced, total_injured,
        total_affected, damage_description,
        data_source_type, confidence_score, source_urls, last_updated
      FROM event_attributes
      WHERE event_date >= '2000-01-01'
      ORDER BY event_date DESC
    `).all();

    res.json({ events, total: events.length });
  } catch (error) {
    console.error('Error fetching flood data:', error);
    res.status(500).json({ error: 'Failed to fetch flood data', events: [] });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

export default app;
