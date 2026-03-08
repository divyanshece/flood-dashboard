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
  houses_damaged?: number;
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

export interface EventsResponse {
  events: FloodEvent[];
  total: number;
  filters: {
    floodTypes: string[];
    cities: string[];
    states: string[];
    locations: string[];
  };
}

export type SortField = 'event_date' | 'location' | 'city' | 'state' | 'rainfall_mm' | 'total_affected' | 'flood_type';
export type SortDirection = 'asc' | 'desc';
