# Flood Data Explorer - Natural Language to SQL Pipeline

This document explains how the Explorer feature converts plain English questions into SQL queries, executes them against the flood database, and returns structured results.

## Architecture Overview

The explorer uses a **rule-based parser** (regex + pattern matching) to convert natural language into parameterized SQL queries. There is no ML/LLM involved — it's purely deterministic string parsing.

```
User Input (text)
    |
    v
POST /api/nl-query
    |
    v
parseNaturalLanguageQuery()   <-- Regex-based parser
    |
    v
SQL WHERE clauses + params
    |
    v
SQLite (flood_hyderabad.db)
    |
    v
JSON response (events + stats + breakdowns)
    |
    v
Explorer UI (tabs: Summary, Map, Charts, Data)
```

## Key Files

| File | Role |
|------|------|
| `frontend/src/app/explorer/page.tsx` | Chat-like UI, result display with tabs |
| `frontend/src/app/api/nl-query/route.ts` | NL parser + SQL generation + DB execution |
| `flood_hyderabad.db` | SQLite database with `event_attributes` table |

---

## Step-by-Step Flow

### 1. User Input

The explorer page (`explorer/page.tsx`) presents a search bar and suggested queries. When the user submits a query, it sends a POST request:

```typescript
const response = await fetch('/api/nl-query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: q })
});
```

### 2. Natural Language Parsing

The `parseNaturalLanguageQuery()` function in `api/nl-query/route.ts` breaks the input into SQL conditions through several pattern-matching layers:

#### A. Aggregation Detection

Detects what kind of answer the user wants:

| User says | Detected intent |
|-----------|----------------|
| "how many", "count" | `count` |
| "average", "mean" | `avg_rainfall` or `avg_affected` |
| "maximum", "highest" | `max_rainfall`, `max_affected` |
| "minimum", "lowest" | `min_rainfall`, `min_affected` |
| "total deaths" | `total_deaths` |

These populate a `statsFields` array that controls which aggregate values are highlighted in the response.

#### B. Location Matching

Uses a `LOCATION_SYNONYMS` dictionary that handles misspellings and abbreviations:

```typescript
const LOCATION_SYNONYMS = {
  'hyderabad': ['hyderabad', 'hyd', 'hyderbad'],
  'kukatpally': ['kukatpally', 'kukkatpally', 'kukatpalli'],
  'secunderabad': ['secunderabad', 'secundrabad'],
  'telangana': ['telangana', 'ts', 'telengana'],
  // ... more locations
};
```

When a location is found, it generates:

```sql
(LOWER(city) LIKE '%hyderabad%' OR LOWER(state) LIKE '%hyderabad%' OR LOWER(location) LIKE '%hyderabad%')
```

#### C. Date/Time Parsing

Regex patterns handle various date expressions:

| User says | SQL condition |
|-----------|--------------|
| "in 2024" | `strftime('%Y', event_date) = '2024'` |
| "since 2020" | `event_date >= '2020-01-01'` |
| "before 2025" | `event_date < '2025-01-01'` |
| "between 2020 and 2024" | `event_date >= '2020-01-01' AND event_date <= '2024-12-31'` |

Month names ("january", "jan", etc.) are also parsed and mapped to month numbers.

#### D. Numerical Thresholds

Patterns like "more than X people affected" or "rainfall above X mm":

| User says | SQL condition |
|-----------|--------------|
| "more than 1000 people affected" | `total_affected > 1000` |
| "rainfall above 50mm" | `rainfall_mm > 50` |

#### E. Special Filters

| User says | SQL condition |
|-----------|--------------|
| "deaths", "fatal", "died" | `total_deaths > 0` |
| "flash flood" | `LOWER(flood_type) LIKE '%flash%'` |
| "urban flood" | `LOWER(flood_type) LIKE '%urban%'` |

#### F. Ordering

| User says | ORDER BY |
|-----------|----------|
| "recent", "latest" | `event_date DESC` |
| "oldest", "earliest" | `event_date ASC` |
| "most affected", "worst" | `total_affected DESC` |
| "heaviest rain" | `rainfall_mm DESC` |
| "deadliest" | `total_deaths DESC` |

#### G. Result Limits

- "top 5" or "show 10" → `LIMIT N`
- "all" → no limit
- Default → `LIMIT 100`

### 3. Parsed Output

The parser returns a structured object:

```typescript
interface ParsedQuery {
  conditions: string[];    // SQL WHERE fragments
  params: any[];           // Parameterized values (prevents SQL injection)
  orderBy?: string;        // ORDER BY clause
  limit?: number;          // LIMIT value
  needsStats: boolean;     // Whether to compute aggregates
  statsFields: string[];   // Which stats to highlight
}
```

### 4. SQL Generation & Execution

The parsed output is assembled into multiple SQL queries executed against SQLite:

**Events query:**
```sql
SELECT * FROM event_attributes
WHERE event_date >= '2000-01-01'
  AND [parsed conditions joined with AND]
ORDER BY [orderBy]
LIMIT [limit]
```

**Stats query** (if `needsStats` is true):
```sql
SELECT
  COUNT(*) as event_count,
  SUM(total_affected) as total_affected,
  SUM(total_deaths) as total_deaths,
  AVG(rainfall_mm) as avg_rainfall,
  MAX(rainfall_mm) as max_rainfall,
  COUNT(DISTINCT city) as city_count,
  MIN(event_date) as earliest_date,
  MAX(event_date) as latest_date
  -- ... more aggregates
FROM event_attributes
WHERE [same conditions]
```

**Breakdown queries** (always run):
- **By year:** `GROUP BY strftime('%Y', event_date)` — for bar charts
- **By city:** `GROUP BY city ORDER BY count DESC LIMIT 10` — for location analysis
- **By flood type:** `GROUP BY flood_type ORDER BY count DESC` — for donut chart

All queries use parameterized values (`db.prepare(sql).all(...params)`) to prevent SQL injection.

### 5. Response Structure

The API returns:

```json
{
  "events": [...],
  "stats": {
    "eventCount": 45,
    "totalAffected": 12500,
    "totalDeaths": 8,
    "avgRainfall": 85.5,
    "maxRainfall": 220,
    "cityCount": 5,
    "dateRange": { "earliest": "2020-06-15", "latest": "2024-09-22" }
  },
  "breakdowns": {
    "byYear": [{ "year": "2024", "count": 18, "affected": 4500 }],
    "byCity": [{ "city": "Hyderabad", "count": 32, "avg_rainfall": 95.2 }],
    "byFloodType": [{ "flood_type": "Urban Flood", "count": 28 }]
  },
  "interpretation": "Found 45 flood events...",
  "total": 45
}
```

The `interpretation` string is dynamically built based on `statsFields` (e.g., if the user asked "how many", it emphasizes the count; if they asked "highest rainfall", it highlights the max).

### 6. Frontend Display

The explorer page renders results in a chat-bubble format with four tabs:

| Tab | Content |
|-----|---------|
| **Summary** | 2x2 stats grid (events, affected, deaths, rainfall) + mini map |
| **Map** | Interactive Leaflet map with circle markers (red = deaths, blue = no deaths) |
| **Charts** | Bar chart (events by year) + Donut chart (flood type distribution) |
| **Data** | Scrollable table with all event attributes, color-coded columns |

---

## Example Walkthrough

**User types:** `"Show floods in Kukatpally with rainfall above 50mm since 2020"`

**Parser extracts:**
1. Location: "kukatpally" (matched via synonyms)
2. Rainfall threshold: `rainfall_mm > 50`
3. Date filter: `event_date >= '2020-01-01'`
4. Default order: `event_date DESC`
5. Default limit: `100`

**SQL generated:**
```sql
SELECT * FROM event_attributes
WHERE event_date >= '2000-01-01'
  AND (LOWER(city) LIKE '%kukatpally%' OR LOWER(state) LIKE '%kukatpally%' OR LOWER(location) LIKE '%kukatpally%')
  AND rainfall_mm > 50
  AND event_date >= '2020-01-01'
ORDER BY event_date DESC
LIMIT 100
```

**Parameters:** `['%kukatpally%', '%kukatpally%', '%kukatpally%', 50, '2020-01-01']`

---

## Limitations

- **Rule-based only:** Cannot understand arbitrary phrasing outside the defined regex patterns. For example, "which area was hit the hardest last monsoon season" won't fully parse.
- **No conversational context:** Each query is independent; it doesn't remember previous questions.
- **Fixed location list:** Only locations defined in `LOCATION_SYNONYMS` are matched. New cities require manually adding entries.
- **No semantic understanding:** "devastating floods" or "mild flooding" are not differentiated — it only matches structural patterns.
