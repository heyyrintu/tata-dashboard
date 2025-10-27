import { Request, Response } from 'express';
import Trip from '../models/Trip';
import { parseDateParam } from '../utils/dateFilter';

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const fromDate = parseDateParam(req.query.fromDate as string);
    const toDate = parseDateParam(req.query.toDate as string);

    // Build date filter query
    const dateFilter: any = {};
    if (fromDate || toDate) {
      dateFilter.allocationDate = {};
      if (fromDate) {
        dateFilter.allocationDate.$gte = fromDate;
      }
      if (toDate) {
        // Set to end of day
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.allocationDate.$lte = endDate;
      }
    }

    // Query database with date filter
    const trips = await Trip.find(dateFilter);

    // Total Trips: count of rows with non-empty Allocation Date
    const totalTrips = trips.length;

    // Total Indents: count of unique indent values
    const uniqueIndents = new Set(trips.filter(t => t.indent).map(t => t.indent));
    const totalIndents = uniqueIndents.size;

    res.json({
      success: true,
      totalTrips,
      totalIndents,
      dateRange: {
        from: fromDate?.toISOString().split('T')[0] || null,
        to: toDate?.toISOString().split('T')[0] || null
      },
      recordsProcessed: trips.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analytics'
    });
  }
};

export const getRangeWiseAnalytics = async (req: Request, res: Response) => {
  try {
    const fromDate = parseDateParam(req.query.fromDate as string);
    const toDate = parseDateParam(req.query.toDate as string);

    // Build date filter query
    const dateFilter: any = {};
    if (fromDate || toDate) {
      dateFilter.allocationDate = {};
      if (fromDate) {
        dateFilter.allocationDate.$gte = fromDate;
      }
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.allocationDate.$lte = endDate;
      }
    }

    // Query database with date filter
    const trips = await Trip.find(dateFilter);
    const totalTrips = trips.length;

    // Range labels - handle case-insensitive matching
    const rangeMappings = [
      { label: '0-100Km', patterns: ['0-100km', '0-100Km', '0-100KM'] },
      { label: '101-250Km', patterns: ['101-250km', '101-250Km', '101-250KM'] },
      { label: '251-400Km', patterns: ['251-400km', '251-400Km', '251-400KM'] },
      { label: '401-600Km', patterns: ['401-600km', '401-600Km', '401-600KM'] },
    ];

    // Calculate range-wise data using the Range column from Excel
    const rangeData = rangeMappings.map(({ label, patterns }) => {
      const rangeTrips = trips.filter(trip => {
        if (!trip.range) return false;
        const normalized = trip.range.toLowerCase();
        return patterns.some(p => p.toLowerCase() === normalized);
      });
      const tripCount = rangeTrips.length;
      const totalLoad = rangeTrips.reduce((sum, trip) => sum + (trip.totalLoad || 0), 0);
      const percentage = totalTrips > 0 ? (tripCount / totalTrips) * 100 : 0;

      return {
        range: label,
        tripCount,
        totalLoad,
        percentage: parseFloat(percentage.toFixed(2))
      };
    });

    // Calculate location-wise data using Range column from Excel
    const locationMap = new Map<string, { tripCount: number; totalLoad: number; range: string }>();

    trips.forEach(trip => {
      if (trip.location && trip.range) {
        const existing = locationMap.get(trip.location) || { tripCount: 0, totalLoad: 0, range: trip.range };
        existing.tripCount++;
        existing.totalLoad += trip.totalLoad || 0;
        // Normalize range to standard format
        const normalizedRange = trip.range.toLowerCase();
        if (normalizedRange.startsWith('0-100')) existing.range = '0-100Km';
        else if (normalizedRange.startsWith('101-250')) existing.range = '101-250Km';
        else if (normalizedRange.startsWith('251-400')) existing.range = '251-400Km';
        else if (normalizedRange.startsWith('401-600')) existing.range = '401-600Km';
        else existing.range = trip.range;
        locationMap.set(trip.location, existing);
      }
    });

    const locations = Array.from(locationMap.entries()).map(([name, data]) => ({
      name,
      tripCount: data.tripCount,
      totalLoad: data.totalLoad,
      range: data.range
    }));

    res.json({
      success: true,
      rangeData,
      locations,
      dateRange: {
        from: fromDate?.toISOString().split('T')[0] || null,
        to: toDate?.toISOString().split('T')[0] || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch range-wise analytics'
    });
  }
};

