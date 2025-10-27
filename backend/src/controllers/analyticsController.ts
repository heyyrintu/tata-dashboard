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

