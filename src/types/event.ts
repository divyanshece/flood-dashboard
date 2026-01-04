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

export interface EventsResponse {
  events: FloodEvent[];
  total: number;
  filters: {
    floodTypes: string[];
    locations: string[];
  };
}

export type SortField = 'event_date' | 'location' | 'rainfall_mm' | 'total_affected' | 'flood_type';
export type SortDirection = 'asc' | 'desc';
