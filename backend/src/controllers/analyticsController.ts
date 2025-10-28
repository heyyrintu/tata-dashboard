import { Request, Response } from 'express';
import Trip from '../models/Trip';
import { parseDateParam } from '../utils/dateFilter';
import { format, startOfWeek, getISOWeek } from 'date-fns';

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

export const getFulfillmentAnalytics = async (req: Request, res: Response) => {
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

    // Calculate fulfillment percentage for each trip
    const TRUCK_CAPACITY = 6000;
    const ranges = [
      { min: 0, max: 50, label: '0 - 50%' },
      { min: 51, max: 70, label: '51 - 70%' },
      { min: 71, max: 90, label: '71 - 90%' },
      { min: 91, max: 100, label: '91 - 100%' }
    ];

    // Calculate fulfillment for each indent
    const fulfillmentData = trips.map(trip => {
      const fulfillmentPercentage = (trip.totalLoad / TRUCK_CAPACITY) * 100;
      return { fulfillmentPercentage };
    });

    // Count indents in each range
    const rangeCounts = ranges.map(range => {
      const count = fulfillmentData.filter(f => 
        f.fulfillmentPercentage >= range.min && 
        f.fulfillmentPercentage <= range.max
      ).length;
      return {
        range: range.label,
        indentCount: count
      };
    });

    res.json({
      success: true,
      fulfillmentData: rangeCounts,
      dateRange: {
        from: fromDate?.toISOString().split('T')[0] || null,
        to: toDate?.toISOString().split('T')[0] || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch fulfillment analytics'
    });
  }
};

export const getLoadOverTime = async (req: Request, res: Response) => {
  try {
    const fromDate = parseDateParam(req.query.fromDate as string);
    const toDate = parseDateParam(req.query.toDate as string);
    const granularity = req.query.granularity as string || 'daily';

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

    const TRUCK_CAPACITY = 6000;
    const groupedData: Record<string, { totalLoad: number; indentCount: number; totalFulfillment: number }> = {};

    trips.forEach(trip => {
      let key: string;

      // Group by time period based on granularity
      switch (granularity) {
        case 'daily':
          key = format(trip.allocationDate, 'yyyy-MM-dd');
          break;
        case 'weekly':
          const week = getISOWeek(trip.allocationDate);
          const year = trip.allocationDate.getFullYear();
          key = `Week ${week}, ${year}`;
          break;
        case 'monthly':
          key = format(trip.allocationDate, 'yyyy-MM');
          break;
        default:
          key = format(trip.allocationDate, 'yyyy-MM-dd');
      }

      if (!groupedData[key]) {
        groupedData[key] = { totalLoad: 0, indentCount: 0, totalFulfillment: 0 };
      }

      const load = trip.totalLoad || 0;
      const fulfillmentPercentage = (load / TRUCK_CAPACITY) * 100;

      groupedData[key].totalLoad += load;
      groupedData[key].indentCount += 1;
      groupedData[key].totalFulfillment += fulfillmentPercentage;
    });

    // Convert to array and format labels
    const sortedKeys = Object.keys(groupedData).sort();
    const timeSeriesData = sortedKeys.map(key => {
      const data = groupedData[key];
      const formattedKey = formatTimeLabel(key, granularity);
      return {
        date: formattedKey,
        totalLoad: Math.round(data.totalLoad),
        avgFulfillment: parseFloat((data.totalFulfillment / data.indentCount).toFixed(2)),
        indentCount: data.indentCount
      };
    });

    res.json({
      success: true,
      data: timeSeriesData,
      granularity,
      dateRange: {
        from: fromDate?.toISOString().split('T')[0] || null,
        to: toDate?.toISOString().split('T')[0] || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch load over time data'
    });
  }
};

// Helper function to format time labels
function formatTimeLabel(key: string, granularity: string): string {
  switch (granularity) {
    case 'daily':
      return format(new Date(key), 'MMM dd');
    case 'weekly':
      return key; // Already formatted as "Week X, YYYY"
    case 'monthly':
      return format(new Date(key + '-01'), 'MMMM yyyy');
    default:
      return key;
  }
}

