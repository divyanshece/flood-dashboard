import { NextRequest, NextResponse } from 'next/server';
import { getEvents, getFloodTypes, getUniqueLocations, EventFilters } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse filters from query params
    const filters: EventFilters = {};

    const startDate = searchParams.get('startDate');
    if (startDate) filters.startDate = startDate;

    const endDate = searchParams.get('endDate');
    if (endDate) filters.endDate = endDate;

    const location = searchParams.get('location');
    if (location) filters.location = location;

    const minRainfall = searchParams.get('minRainfall');
    if (minRainfall) filters.minRainfall = parseFloat(minRainfall);

    const maxRainfall = searchParams.get('maxRainfall');
    if (maxRainfall) filters.maxRainfall = parseFloat(maxRainfall);

    const floodType = searchParams.get('floodType');
    if (floodType) filters.floodType = floodType;

    const minAffected = searchParams.get('minAffected');
    if (minAffected) filters.minAffected = parseInt(minAffected, 10);

    // Fetch events with filters
    const events = getEvents(filters);

    // Get metadata for filters
    const floodTypes = getFloodTypes();
    const locations = getUniqueLocations();

    return NextResponse.json({
      events,
      total: events.length,
      filters: {
        floodTypes,
        locations: locations.slice(0, 100), // Limit for performance
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
