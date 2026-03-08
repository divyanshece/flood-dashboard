import { NextResponse } from 'next/server';
import { getQuickStats, getStats } from '@/lib/db';

export async function GET() {
  try {
    const quickStats = getQuickStats();
    const overallStats = getStats();

    return NextResponse.json({
      ...quickStats,
      overview: {
        totalEvents: overallStats.totalEvents,
        totalAffected: overallStats.totalAffected,
        totalDeaths: overallStats.totalDeaths,
        avgRainfall: overallStats.avgRainfall,
        dateRange: overallStats.dateRange,
        floodTypes: overallStats.floodTypes,
      },
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}
