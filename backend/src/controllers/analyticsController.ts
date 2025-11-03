import { Request, Response } from 'express';
import Trip from '../models/Trip';
import { parseDateParam } from '../utils/dateFilter';
import { format, startOfWeek, getISOWeek } from 'date-fns';

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const fromDate = parseDateParam(req.query.fromDate as string);
    const toDate = parseDateParam(req.query.toDate as string);

    // Build date filter query using indentDate
    const dateFilter: any = {};
    if (fromDate || toDate) {
      dateFilter.indentDate = {};
      if (fromDate) {
        dateFilter.indentDate.$gte = fromDate;
      }
      if (toDate) {
        // Set to end of day
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.indentDate.$lte = endDate;
      }
    }

    // Query database with date filter
    const indents = await Trip.find(dateFilter);

    // Total Indents: count of rows with non-empty Indent Date
    const totalIndents = indents.length;

    // Total Unique Indents: count of unique indent values
    const uniqueIndents = new Set(indents.filter(t => t.indent).map(t => t.indent));
    const totalUniqueIndents = uniqueIndents.size;

    res.json({
      success: true,
      totalIndents,
      totalIndentsUnique: totalUniqueIndents,
      dateRange: {
        from: fromDate?.toISOString().split('T')[0] || null,
        to: toDate?.toISOString().split('T')[0] || null
      },
      recordsProcessed: indents.length
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

    // Build date filter query using indentDate
    const dateFilter: any = {};
    if (fromDate || toDate) {
      dateFilter.indentDate = {};
      if (fromDate) {
        dateFilter.indentDate.$gte = fromDate;
      }
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.indentDate.$lte = endDate;
      }
    }

    // Query database with date filter
    const indents = await Trip.find(dateFilter);
    const totalIndents = indents.length;

    // Range labels - now standardized after normalization in parser
    const rangeMappings = [
      { label: '0-100Km' },
      { label: '101-250Km' },
      { label: '251-400Km' },
      { label: '401-600Km' },
    ];

    // Calculate range-wise data using the Range column from Excel
    // Range values are now normalized to standard format during parsing
    const rangeData = rangeMappings.map(({ label }) => {
      const rangeIndents = indents.filter(indent => {
        // Since ranges are normalized during parsing, we can do direct comparison
        return indent.range === label;
      });
      const indentCount = rangeIndents.length;
      const totalLoad = rangeIndents.reduce((sum, indent) => sum + (indent.totalLoad || 0), 0);
      const percentage = totalIndents > 0 ? (indentCount / totalIndents) * 100 : 0;
      
      // Count buckets and barrels separately based on Material column
      let bucketCount = 0;
      let barrelCount = 0;
      
      rangeIndents.forEach(indent => {
        const count = indent.noOfBuckets || 0;
        const material = (indent.material || '').trim();
        
        if (material === '20L Buckets') {
          bucketCount += count;
        } else if (material === '210L Barrels') {
          barrelCount += count;
        }
      });

      return {
        range: label,
        indentCount,
        totalLoad,
        percentage: parseFloat(percentage.toFixed(2)),
        bucketCount,
        barrelCount
      };
    });

    // Calculate location-wise data using Range column from Excel
    const locationMap = new Map<string, { indentCount: number; totalLoad: number; range: string }>();

    indents.forEach(indent => {
      if (indent.location && indent.range) {
        const existing = locationMap.get(indent.location) || { indentCount: 0, totalLoad: 0, range: indent.range };
        existing.indentCount++;
        existing.totalLoad += indent.totalLoad || 0;
        // Range is already normalized during parsing, so use directly
        existing.range = indent.range;
        locationMap.set(indent.location, existing);
      }
    });

    const locations = Array.from(locationMap.entries()).map(([name, data]) => ({
      name,
      indentCount: data.indentCount,
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

    // Build date filter query using indentDate
    const dateFilter: any = {};
    if (fromDate || toDate) {
      dateFilter.indentDate = {};
      if (fromDate) {
        dateFilter.indentDate.$gte = fromDate;
      }
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.indentDate.$lte = endDate;
      }
    }

    // Query database with date filter
    const indents = await Trip.find(dateFilter);

    // Calculate fulfillment percentage for each indent
    const TRUCK_CAPACITY = 6000;
    const ranges = [
      { min: 0, max: 50, label: '0 - 50%' },
      { min: 51, max: 70, label: '51 - 70%' },
      { min: 71, max: 90, label: '71 - 90%' },
      { min: 91, max: 100, label: '91 - 100%' }
    ];

    // Calculate fulfillment for each indent
    const fulfillmentData = indents.map(indent => {
      const fulfillmentPercentage = (indent.totalLoad / TRUCK_CAPACITY) * 100;
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

    // Build date filter query using indentDate
    const dateFilter: any = {};
    if (fromDate || toDate) {
      dateFilter.indentDate = {};
      if (fromDate) {
        dateFilter.indentDate.$gte = fromDate;
      }
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.indentDate.$lte = endDate;
      }
    }

    // Query database with date filter
    const indents = await Trip.find(dateFilter);

    const TRUCK_CAPACITY = 6000;
    const groupedData: Record<string, { totalLoad: number; indentCount: number; totalFulfillment: number }> = {};

    indents.forEach(indent => {
      let key: string;

      // Group by time period based on granularity using indentDate
      switch (granularity) {
        case 'daily':
          key = format(indent.indentDate, 'yyyy-MM-dd');
          break;
        case 'weekly':
          const week = getISOWeek(indent.indentDate);
          const year = indent.indentDate.getFullYear();
          key = `Week ${week}, ${year}`;
          break;
        case 'monthly':
          key = format(indent.indentDate, 'yyyy-MM');
          break;
        default:
          key = format(indent.indentDate, 'yyyy-MM-dd');
      }

      if (!groupedData[key]) {
        groupedData[key] = { totalLoad: 0, indentCount: 0, totalFulfillment: 0 };
      }

      const load = indent.totalLoad || 0;
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
      const bucketCount = Math.round((data.totalLoad / 20) * 100) / 100;
      return {
        date: formattedKey,
        totalLoad: Math.round(data.totalLoad),
        avgFulfillment: parseFloat((data.totalFulfillment / data.indentCount).toFixed(2)),
        indentCount: data.indentCount,
        bucketCount
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

export const getRevenueAnalytics = async (req: Request, res: Response) => {
  try {
    const fromDate = parseDateParam(req.query.fromDate as string);
    const toDate = parseDateParam(req.query.toDate as string);
    const granularity = req.query.granularity as string || 'daily';

    // Build date filter query using indentDate instead of allocationDate
    const dateFilter: any = {};
    if (fromDate || toDate) {
      dateFilter.indentDate = {};
      if (fromDate) {
        dateFilter.indentDate.$gte = fromDate;
      }
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.indentDate.$lte = endDate;
      }
    }

    // Query database with date filter
    const indents = await Trip.find(dateFilter);

    // Bucket rates by range
    const BUCKET_RATES: Record<string, number> = {
      '0-100Km': 21,
      '101-250Km': 40,
      '251-400Km': 68,
      '401-600Km': 105
    };

    // Barrel rates by range
    const BARREL_RATES: Record<string, number> = {
      '0-100Km': 220.5,
      '101-250Km': 420,
      '251-400Km': 714,
      '401-600Km': 1081.5
    };

    // Range mappings - values are normalized during parsing
    const rangeMappings = [
      { label: '0-100Km' },
      { label: '101-250Km' },
      { label: '251-400Km' },
      { label: '401-600Km' },
    ];

    // Calculate revenue by range - count buckets and barrels separately
    const revenueByRange = rangeMappings.map(({ label }) => {
      const rangeIndents = indents.filter(indent => {
        // Since ranges are normalized during parsing, we can do direct comparison
        return indent.range === label;
      });

      let bucketCount = 0;
      let barrelCount = 0;
      let bucketRevenue = 0;
      let barrelRevenue = 0;

      rangeIndents.forEach(indent => {
        const count = indent.noOfBuckets || 0;
        const material = (indent.material || '').trim();
        
        if (material === '20L Buckets') {
          bucketCount += count;
          bucketRevenue += count * BUCKET_RATES[label];
        } else if (material === '210L Barrels') {
          barrelCount += count;
          barrelRevenue += count * BARREL_RATES[label];
        }
      });

      const totalRevenue = bucketRevenue + barrelRevenue;

      return {
        range: label,
        bucketRate: BUCKET_RATES[label],
        barrelRate: BARREL_RATES[label],
        bucketCount: bucketCount,
        barrelCount: barrelCount,
        bucketRevenue: bucketRevenue,
        barrelRevenue: barrelRevenue,
        revenue: totalRevenue
      };
    });

    // Calculate total revenue
    const totalRevenue = revenueByRange.reduce((sum, item) => sum + item.revenue, 0);

    // Calculate revenue over time
    const groupedData: Record<string, number> = {};

    indents.forEach(indent => {
      let key: string;

      // Group by time period based on granularity using indentDate
      switch (granularity) {
        case 'daily':
          key = format(indent.indentDate, 'yyyy-MM-dd');
          break;
        case 'weekly':
          const week = getISOWeek(indent.indentDate);
          const year = indent.indentDate.getFullYear();
          key = `Week ${week}, ${year}`;
          break;
        case 'monthly':
          key = format(indent.indentDate, 'yyyy-MM');
          break;
        default:
          key = format(indent.indentDate, 'yyyy-MM-dd');
      }

      if (!groupedData[key]) {
        groupedData[key] = 0;
      }

      // Calculate revenue based on Material type and count
      const indentRange = indent.range;
      const count = indent.noOfBuckets || 0;
      const material = (indent.material || '').trim();
      
      let revenue = 0;
      if (material === '20L Buckets') {
        revenue = count * (BUCKET_RATES[indentRange] || 0);
      } else if (material === '210L Barrels') {
        revenue = count * (BARREL_RATES[indentRange] || 0);
      }
      
      groupedData[key] += revenue;
    });

    // Convert to array and format labels
    const sortedKeys = Object.keys(groupedData).sort();
    const revenueOverTime = sortedKeys.map(key => {
      const formattedKey = formatTimeLabel(key, granularity);
      return {
        date: formattedKey,
        revenue: groupedData[key]
      };
    });

    console.log('Revenue Analytics Response:', {
      revenueByRangeCount: revenueByRange.length,
      totalRevenue,
      revenueOverTimeCount: revenueOverTime.length,
      indentsCount: indents.length
    });

    res.json({
      success: true,
      revenueByRange,
      totalRevenue,
      revenueOverTime,
      granularity,
      dateRange: {
        from: fromDate?.toISOString().split('T')[0] || null,
        to: toDate?.toISOString().split('T')[0] || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch revenue analytics'
    });
  }
};

