import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

// Column mappings for the event_attributes table
const COLUMN_MAPPINGS: Record<string, string[]> = {
  'total_affected': ['people affected', 'affected', 'casualties', 'victims', 'impacted', 'people impacted'],
  'total_deaths': ['deaths', 'dead', 'fatalities', 'killed', 'died'],
  'total_displaced': ['displaced', 'homeless', 'evacuated'],
  'total_injured': ['injured', 'hurt', 'wounded'],
  'city': ['city', 'cities', 'town', 'towns'],
  'state': ['state', 'states', 'region', 'regions'],
  'country': ['country', 'nation'],
  'location': ['location', 'area', 'areas', 'place', 'places', 'locality', 'neighborhood'],
  'event_date': ['date', 'when', 'year', 'month', 'time', 'period'],
  'rainfall_mm': ['rainfall', 'rain', 'precipitation', 'mm', 'millimeters'],
  'flood_type': ['type', 'kind', 'flood type', 'category'],
  'trigger_cause': ['cause', 'reason', 'trigger', 'why', 'caused by'],
  'damage_description': ['damage', 'impact', 'destruction', 'loss', 'losses'],
  'confidence_score': ['confidence', 'accuracy', 'reliability'],
};

// Location synonyms and fuzzy matching
const LOCATION_SYNONYMS: Record<string, string[]> = {
  'hyderabad': ['hyderabad', 'hyd', 'hyderbad', 'hyderabd'],
  'kukatpally': ['kukatpally', 'kukkatpally', 'kukatpalli', 'kukutpally', 'kp'],
  'secunderabad': ['secunderabad', 'secundrabad', 'secunderbad', 'sec'],
  'telangana': ['telangana', 'ts', 'telengana'],
  'andhra': ['andhra', 'ap', 'andhra pradesh'],
  'gachibowli': ['gachibowli', 'gachi bowli'],
  'madhapur': ['madhapur', 'madhapoor'],
  'ameerpet': ['ameerpet', 'ameerpet'],
  'begumpet': ['begumpet', 'begumpet'],
  'kondapur': ['kondapur', 'kondapoor'],
  'lb nagar': ['lb nagar', 'lbnagar', 'lb-nagar'],
  'uppal': ['uppal', 'uppala'],
  'dilsukhnagar': ['dilsukhnagar', 'dilsukh nagar', 'dsnagar'],
  'mehdipatnam': ['mehdipatnam', 'mehidipatnam'],
  'tolichowki': ['tolichowki', 'toli chowki'],
  'banjara hills': ['banjara hills', 'banjara', 'banjarahills'],
  'jubilee hills': ['jubilee hills', 'jubilee', 'jubileehills'],
  'himayatnagar': ['himayatnagar', 'himayat nagar'],
  'nampally': ['nampally', 'nampalli'],
  'charminar': ['charminar', 'charminara'],
  'malkajgiri': ['malkajgiri', 'malkajigiri'],
};

interface ParsedQuery {
  conditions: string[];
  params: any[];
  orderBy?: string;
  limit?: number;
  needsStats: boolean;
  statsFields: string[];
}

function parseNaturalLanguageQuery(query: string): ParsedQuery {
  const lowerQuery = query.toLowerCase().trim();
  const conditions: string[] = [];
  const params: any[] = [];
  let orderBy: string | undefined;
  let limit: number | undefined;
  let needsStats = false;
  const statsFields: string[] = [];

  // Check for aggregation/stats queries
  if (lowerQuery.includes('how many') || lowerQuery.includes('count') || lowerQuery.includes('total number') || lowerQuery.includes('number of')) {
    needsStats = true;
    statsFields.push('count');
  }
  if (lowerQuery.includes('average') || lowerQuery.includes('avg') || lowerQuery.includes('mean')) {
    needsStats = true;
    if (lowerQuery.includes('rainfall') || lowerQuery.includes('rain')) {
      statsFields.push('avg_rainfall');
    }
    if (lowerQuery.includes('affected') || lowerQuery.includes('people')) {
      statsFields.push('avg_affected');
    }
  }
  if (lowerQuery.includes('total affected') || lowerQuery.includes('total people')) {
    needsStats = true;
    statsFields.push('total_affected');
  }
  if (lowerQuery.includes('total deaths') || lowerQuery.includes('total fatalities')) {
    needsStats = true;
    statsFields.push('total_deaths');
  }
  if (lowerQuery.includes('maximum') || lowerQuery.includes('highest') || lowerQuery.includes('max') || lowerQuery.includes('most')) {
    needsStats = true;
    if (lowerQuery.includes('rainfall') || lowerQuery.includes('rain')) {
      statsFields.push('max_rainfall');
      orderBy = 'rainfall_mm DESC';
    }
    if (lowerQuery.includes('affected')) {
      statsFields.push('max_affected');
      orderBy = 'total_affected DESC';
    }
    if (lowerQuery.includes('deaths') || lowerQuery.includes('fatalities')) {
      statsFields.push('max_deaths');
      orderBy = 'total_deaths DESC';
    }
  }
  if (lowerQuery.includes('minimum') || lowerQuery.includes('lowest') || lowerQuery.includes('min') || lowerQuery.includes('least')) {
    needsStats = true;
    if (lowerQuery.includes('rainfall')) {
      statsFields.push('min_rainfall');
    }
    if (lowerQuery.includes('affected')) {
      statsFields.push('min_affected');
    }
  }

  // Parse location mentions - direct location check for known areas
  const matchedLocations: string[] = [];
  for (const [canonical, variations] of Object.entries(LOCATION_SYNONYMS)) {
    for (const variation of variations) {
      if (lowerQuery.includes(variation)) {
        matchedLocations.push(canonical);
        break;
      }
    }
  }

  // Add location conditions
  if (matchedLocations.length > 0) {
    const locationConditions = matchedLocations.map(() =>
      '(LOWER(city) LIKE ? OR LOWER(state) LIKE ? OR LOWER(location) LIKE ?)'
    );
    conditions.push(`(${locationConditions.join(' OR ')})`);
    matchedLocations.forEach(loc => {
      params.push(`%${loc}%`, `%${loc}%`, `%${loc}%`);
    });
  }

  // Parse date/year mentions
  const yearMatch = lowerQuery.match(/(?:in|since|from|after|during|for)\s+(\d{4})/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    if (lowerQuery.includes('since') || lowerQuery.includes('from') || lowerQuery.includes('after')) {
      conditions.push("event_date >= ?");
      params.push(`${year}-01-01`);
    } else if (lowerQuery.includes('before')) {
      conditions.push("event_date < ?");
      params.push(`${year}-01-01`);
    } else {
      // Specific year
      conditions.push("strftime('%Y', event_date) = ?");
      params.push(year.toString());
    }
  }

  // Parse date range (between X and Y)
  const rangeMatch = lowerQuery.match(/between\s+(\d{4})\s+and\s+(\d{4})/);
  if (rangeMatch) {
    conditions.push("event_date >= ? AND event_date <= ?");
    params.push(`${rangeMatch[1]}-01-01`, `${rangeMatch[2]}-12-31`);
  }

  // Parse month mentions
  const months: Record<string, string> = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04',
    'may': '05', 'june': '06', 'july': '07', 'august': '08',
    'september': '09', 'october': '10', 'november': '11', 'december': '12',
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
    'jun': '06', 'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
  };

  for (const [monthName, monthNum] of Object.entries(months)) {
    if (lowerQuery.includes(monthName)) {
      conditions.push("strftime('%m', event_date) = ?");
      params.push(monthNum);
      break;
    }
  }

  // Parse affected people thresholds
  const affectedMatch = lowerQuery.match(/(?:more|greater|over|above)\s*(?:than)?\s*(\d+)\s*(?:people|affected|victims)/);
  if (affectedMatch) {
    conditions.push("total_affected > ?");
    params.push(parseInt(affectedMatch[1]));
  }

  const affectedLessMatch = lowerQuery.match(/(?:less|fewer|under|below)\s*(?:than)?\s*(\d+)\s*(?:people|affected|victims)/);
  if (affectedLessMatch) {
    conditions.push("total_affected < ?");
    params.push(parseInt(affectedLessMatch[1]));
  }

  // Parse rainfall thresholds
  const rainfallMatch = lowerQuery.match(/(?:more|greater|over|above)\s*(?:than)?\s*(\d+)\s*(?:mm|millimeter|rainfall)/);
  if (rainfallMatch) {
    conditions.push("rainfall_mm > ?");
    params.push(parseInt(rainfallMatch[1]));
  }

  const rainfallLessMatch = lowerQuery.match(/(?:less|under|below)\s*(?:than)?\s*(\d+)\s*(?:mm|millimeter|rainfall)/);
  if (rainfallLessMatch) {
    conditions.push("rainfall_mm < ?");
    params.push(parseInt(rainfallLessMatch[1]));
  }

  // Parse death-related queries
  if (lowerQuery.includes('death') || lowerQuery.includes('fatal') || lowerQuery.includes('died') || lowerQuery.includes('killed')) {
    if (!lowerQuery.includes('total deaths') && !lowerQuery.includes('maximum') && !lowerQuery.includes('highest')) {
      conditions.push("total_deaths > 0");
    }
  }

  // Parse flood type
  const floodTypes = ['flash flood', 'urban flood', 'river flood', 'pluvial', 'coastal', 'fluvial'];
  for (const type of floodTypes) {
    if (lowerQuery.includes(type)) {
      conditions.push("LOWER(flood_type) LIKE ?");
      params.push(`%${type}%`);
      break;
    }
  }

  // Parse ordering
  if (!orderBy) {
    if (lowerQuery.includes('recent') || lowerQuery.includes('latest') || lowerQuery.includes('newest')) {
      orderBy = 'event_date DESC';
    } else if (lowerQuery.includes('oldest') || lowerQuery.includes('earliest')) {
      orderBy = 'event_date ASC';
    } else if (lowerQuery.includes('most affected') || lowerQuery.includes('worst')) {
      orderBy = 'total_affected DESC';
    } else if (lowerQuery.includes('heaviest rain')) {
      orderBy = 'rainfall_mm DESC';
    } else if (lowerQuery.includes('deadliest') || lowerQuery.includes('most deaths')) {
      orderBy = 'total_deaths DESC';
    }
  }

  // Parse limit
  const limitMatch = lowerQuery.match(/(?:top|first|last|show)\s*(\d+)/);
  if (limitMatch) {
    limit = parseInt(limitMatch[1]);
  } else if (lowerQuery.includes('all')) {
    limit = undefined;
  } else {
    limit = 100; // Default limit
  }

  return { conditions, params, orderBy, limit, needsStats, statsFields };
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please provide a valid search query' },
        { status: 400 }
      );
    }

    // Parse the natural language query
    const parsed = parseNaturalLanguageQuery(query);

    // Connect to database
    const dbPath = path.join(process.cwd(), '..', 'flood_hyderabad.db');
    let db: Database.Database;

    try {
      db = new Database(dbPath, { readonly: true });
    } catch {
      try {
        db = new Database(path.join(process.cwd(), 'flood_hyderabad.db'), { readonly: true });
      } catch {
        return NextResponse.json(
          { error: 'Database not found', events: [], stats: null },
          { status: 200 }
        );
      }
    }

    // Build WHERE clause
    let whereClause = "event_date >= '2000-01-01'";
    if (parsed.conditions.length > 0) {
      whereClause += ` AND ${parsed.conditions.join(' AND ')}`;
    }

    // Always get the events first
    let eventsSql = `SELECT * FROM event_attributes WHERE ${whereClause}`;
    if (parsed.orderBy) {
      eventsSql += ` ORDER BY ${parsed.orderBy}`;
    } else {
      eventsSql += ` ORDER BY event_date DESC`;
    }
    if (parsed.limit) {
      eventsSql += ` LIMIT ${parsed.limit}`;
    }

    const events = db.prepare(eventsSql).all(...parsed.params);

    // Now calculate comprehensive statistics
    const statsSql = `
      SELECT
        COUNT(*) as event_count,
        SUM(total_affected) as total_affected,
        SUM(total_deaths) as total_deaths,
        SUM(total_displaced) as total_displaced,
        SUM(total_injured) as total_injured,
        AVG(rainfall_mm) as avg_rainfall,
        MAX(rainfall_mm) as max_rainfall,
        MIN(rainfall_mm) as min_rainfall,
        AVG(total_affected) as avg_affected,
        MAX(total_affected) as max_affected,
        MIN(total_affected) as min_affected,
        MAX(total_deaths) as max_deaths,
        COUNT(DISTINCT city) as city_count,
        COUNT(DISTINCT strftime('%Y', event_date)) as year_count,
        MIN(event_date) as earliest_date,
        MAX(event_date) as latest_date
      FROM event_attributes
      WHERE ${whereClause}
    `;

    const statsResult = db.prepare(statsSql).get(...parsed.params) as any;

    // Get year-wise breakdown
    const yearBreakdownSql = `
      SELECT strftime('%Y', event_date) as year, COUNT(*) as count, SUM(total_affected) as affected
      FROM event_attributes
      WHERE ${whereClause}
      GROUP BY year
      ORDER BY year DESC
    `;
    const yearBreakdown = db.prepare(yearBreakdownSql).all(...parsed.params);

    // Get city-wise breakdown (top 10)
    const cityBreakdownSql = `
      SELECT city, COUNT(*) as count, SUM(total_affected) as affected, AVG(rainfall_mm) as avg_rainfall
      FROM event_attributes
      WHERE ${whereClause} AND city IS NOT NULL
      GROUP BY city
      ORDER BY count DESC
      LIMIT 10
    `;
    const cityBreakdown = db.prepare(cityBreakdownSql).all(...parsed.params);

    // Get flood type breakdown
    const floodTypeBreakdownSql = `
      SELECT flood_type, COUNT(*) as count
      FROM event_attributes
      WHERE ${whereClause} AND flood_type IS NOT NULL
      GROUP BY flood_type
      ORDER BY count DESC
    `;
    const floodTypeBreakdown = db.prepare(floodTypeBreakdownSql).all(...parsed.params);

    db.close();

    // Build interpretation message
    let interpretation = '';
    if (parsed.needsStats && parsed.statsFields.length > 0) {
      const parts: string[] = [];
      if (parsed.statsFields.includes('count')) {
        parts.push(`Found ${statsResult.event_count} flood events`);
      }
      if (parsed.statsFields.includes('avg_rainfall')) {
        parts.push(`Average rainfall: ${statsResult.avg_rainfall ? statsResult.avg_rainfall.toFixed(1) : 0}mm`);
      }
      if (parsed.statsFields.includes('max_rainfall')) {
        parts.push(`Highest rainfall: ${statsResult.max_rainfall || 0}mm`);
      }
      if (parsed.statsFields.includes('min_rainfall')) {
        parts.push(`Lowest rainfall: ${statsResult.min_rainfall || 0}mm`);
      }
      if (parsed.statsFields.includes('total_affected')) {
        parts.push(`Total affected: ${(statsResult.total_affected || 0).toLocaleString()}`);
      }
      if (parsed.statsFields.includes('avg_affected')) {
        parts.push(`Average affected: ${statsResult.avg_affected ? Math.round(statsResult.avg_affected).toLocaleString() : 0}`);
      }
      if (parsed.statsFields.includes('max_affected')) {
        parts.push(`Most affected in single event: ${(statsResult.max_affected || 0).toLocaleString()}`);
      }
      if (parsed.statsFields.includes('total_deaths')) {
        parts.push(`Total deaths: ${statsResult.total_deaths || 0}`);
      }
      if (parsed.statsFields.includes('max_deaths')) {
        parts.push(`Most deaths in single event: ${statsResult.max_deaths || 0}`);
      }
      interpretation = parts.join('. ') + '.';
    } else {
      interpretation = `Found ${statsResult.event_count} flood events matching your query.`;
    }

    return NextResponse.json({
      events,
      stats: {
        eventCount: statsResult.event_count || 0,
        totalAffected: statsResult.total_affected || 0,
        totalDeaths: statsResult.total_deaths || 0,
        totalDisplaced: statsResult.total_displaced || 0,
        totalInjured: statsResult.total_injured || 0,
        avgRainfall: statsResult.avg_rainfall ? Math.round(statsResult.avg_rainfall * 10) / 10 : null,
        maxRainfall: statsResult.max_rainfall || null,
        minRainfall: statsResult.min_rainfall || null,
        avgAffected: statsResult.avg_affected ? Math.round(statsResult.avg_affected) : null,
        maxAffected: statsResult.max_affected || null,
        cityCount: statsResult.city_count || 0,
        yearCount: statsResult.year_count || 0,
        dateRange: {
          earliest: statsResult.earliest_date,
          latest: statsResult.latest_date,
        },
      },
      breakdowns: {
        byYear: yearBreakdown,
        byCity: cityBreakdown,
        byFloodType: floodTypeBreakdown,
      },
      sql: eventsSql,
      interpretation,
      total: events.length,
      queryParsed: {
        needsStats: parsed.needsStats,
        statsFields: parsed.statsFields,
        conditions: parsed.conditions.length,
      },
    });
  } catch (error) {
    console.error('NL Query error:', error);
    return NextResponse.json(
      { error: 'Failed to process query', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
