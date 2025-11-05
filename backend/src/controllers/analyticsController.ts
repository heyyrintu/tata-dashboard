import { Request, Response } from 'express';
import Trip from '../models/Trip';
import { parseDateParam } from '../utils/dateFilter';
import { format, startOfWeek, getISOWeek, parse } from 'date-fns';
import { calculateTripsByVehicleDay } from '../utils/tripCount';

// Helper function to normalize Freight Tiger Month to 'yyyy-MM' format
const normalizeFreightTigerMonth = (monthValue: string): string | null => {
  if (!monthValue || typeof monthValue !== 'string') return null;
  
  const trimmed = monthValue.trim();
  if (trimmed === '') return null;
  
  // Try various formats:
  // 1. "May'25" or "May'24" -> "2025-05" (most common from Excel)
  // 2. "May 2025" -> "2025-05"
  // 3. "05-2025" or "05/2025" -> "2025-05"
  // 4. "2025-05" -> "2025-05" (already correct)
  
  // Fix common typos: "0ct" -> "Oct" (zero instead of O)
  const fixedTrimmed = trimmed.replace(/^0ct/i, 'Oct').replace(/^0ctober/i, 'October');
  
  // Format: "May'25" or "May'24" (most common from Excel parsing)
  try {
    const parsed = parse(fixedTrimmed, "MMM''yy", new Date());
    if (!isNaN(parsed.getTime())) {
      return format(parsed, 'yyyy-MM');
    }
  } catch (e) {}
  
  // Format: "May 2025" or "May 2024"
  try {
    const parsed = parse(fixedTrimmed, 'MMMM yyyy', new Date());
    if (!isNaN(parsed.getTime())) {
      return format(parsed, 'yyyy-MM');
    }
  } catch (e) {}
  
  // Format: "05-2025" or "05/2025" or "0ct-25" (with typo)
  // Handle "0ct-25" -> October
  if (/^0ct-?\d{2}$/i.test(trimmed)) {
    const yearMatch = trimmed.match(/-?(\d{2})$/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      const fullYear = year < 50 ? 2000 + year : 1900 + year;
      return `${fullYear}-10`; // October is month 10
    }
  }
  
  const mmYYYYPattern = /^(\d{1,2})[-\/](\d{4})$/;
  const mmMatch = trimmed.match(mmYYYYPattern);
  if (mmMatch) {
    const month = parseInt(mmMatch[1], 10);
    const year = parseInt(mmMatch[2], 10);
    if (month >= 1 && month <= 12) {
      return `${year}-${String(month).padStart(2, '0')}`;
    }
  }
  
  // Format: "2025-05" (already correct)
  const yyyyMMPattern = /^(\d{4})-(\d{2})$/;
  const yyyyMMMatch = trimmed.match(yyyyMMPattern);
  if (yyyyMMMatch) {
    const year = parseInt(yyyyMMMatch[1], 10);
    const month = parseInt(yyyyMMMatch[2], 10);
    if (month >= 1 && month <= 12) {
      return `${year}-${String(month).padStart(2, '0')}`;
    }
  }
  
  // If none match, return null (will fallback to indentDate)
  return null;
};

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const fromDate = parseDateParam(req.query.fromDate as string);
    const toDate = parseDateParam(req.query.toDate as string);

    // Query all trips (we'll filter by Freight Tiger Month or indentDate)
    const allIndents = await Trip.find({});
    console.log(`[getAnalytics] Total indents from DB: ${allIndents.length}`);

    // Filter to only include indents with Range value (canceled indents don't have range)
    let validIndents = allIndents.filter(indent => indent.range && indent.range.trim() !== '');
    console.log(`[getAnalytics] Valid indents (with range): ${validIndents.length}`);

    // Count how many have freightTigerMonth
    const withFreightTiger = validIndents.filter(i => i.freightTigerMonth && i.freightTigerMonth.trim() !== '').length;
    console.log(`[getAnalytics] Indents with Freight Tiger Month: ${withFreightTiger}`);

    // Apply date filtering - prioritize Freight Tiger Month if date range is a single month
    if (fromDate && toDate) {
      // Check if the date range represents a single month
      const fromMonth = format(fromDate, 'yyyy-MM');
      const toMonth = format(toDate, 'yyyy-MM');
      
      console.log(`[getAnalytics] Date filter: ${fromDate?.toISOString().split('T')[0]} to ${toDate?.toISOString().split('T')[0]}`);
      console.log(`[getAnalytics] Month keys: ${fromMonth} to ${toMonth}`);
      
      if (fromMonth === toMonth) {
        // Single month filter - use Freight Tiger Month to match month-on-month logic
        console.log(`[getAnalytics] Single month filter detected: ${fromMonth}, using Freight Tiger Month`);
        const targetMonthKey = fromMonth;
        
        let matchedByFreightTiger = 0;
        let matchedByIndentDate = 0;
        
        validIndents = validIndents.filter(indent => {
          // Primary: Use Freight Tiger Month if available
          if (indent.freightTigerMonth && typeof indent.freightTigerMonth === 'string' && indent.freightTigerMonth.trim() !== '') {
            const normalizedMonth = normalizeFreightTigerMonth(indent.freightTigerMonth.trim());
            if (normalizedMonth === targetMonthKey) {
              matchedByFreightTiger++;
              return true;
            }
          }
          // Fallback: Use indentDate if Freight Tiger Month is not available
          if (indent.indentDate && indent.indentDate instanceof Date && !isNaN(indent.indentDate.getTime())) {
            if (indent.indentDate >= fromDate && indent.indentDate <= toDate) {
              matchedByIndentDate++;
              return true;
            }
          }
          return false;
        });
        
        console.log(`[getAnalytics] Matched by Freight Tiger Month: ${matchedByFreightTiger}`);
        console.log(`[getAnalytics] Matched by indentDate: ${matchedByIndentDate}`);
        
        // If no results using Freight Tiger Month, fallback to indentDate only
        if (validIndents.length === 0) {
          console.log(`[getAnalytics] No matches found, falling back to indentDate only`);
          validIndents = allIndents.filter(indent => 
            indent.range && 
            indent.range.trim() !== '' &&
            indent.indentDate && 
            indent.indentDate instanceof Date && 
            !isNaN(indent.indentDate.getTime()) &&
            indent.indentDate >= fromDate && 
            indent.indentDate <= toDate
          );
          console.log(`[getAnalytics] Fallback to indentDate: ${validIndents.length} indents matched`);
        }
      } else {
        // Multiple months or date range - filter by indentDate (primary) and also check Freight Tiger Month
        console.log(`[getAnalytics] Date range filter: ${fromMonth} to ${toMonth}, using indentDate with Freight Tiger Month fallback`);
        validIndents = validIndents.filter(indent => {
          // Check if indentDate matches the range
          const dateMatches = indent.indentDate && 
                             indent.indentDate instanceof Date && 
                             !isNaN(indent.indentDate.getTime()) &&
                             indent.indentDate >= fromDate && 
                             indent.indentDate <= toDate;
          
          // Also check if Freight Tiger Month matches any month in the range
          let freightTigerMatches = false;
          if (indent.freightTigerMonth && typeof indent.freightTigerMonth === 'string' && indent.freightTigerMonth.trim() !== '') {
            const normalizedMonth = normalizeFreightTigerMonth(indent.freightTigerMonth.trim());
            if (normalizedMonth) {
              // Check if normalized month falls within the date range
              const monthDate = new Date(normalizedMonth + '-01');
              freightTigerMatches = monthDate >= fromDate && monthDate <= toDate;
            }
          }
          
          return dateMatches || freightTigerMatches;
        });
      }
    } else if (fromDate) {
      // Only fromDate - filter by indentDate (primary)
      console.log(`[getAnalytics] From date filter only: ${fromDate?.toISOString().split('T')[0]}`);
      validIndents = validIndents.filter(indent => {
        if (indent.indentDate && indent.indentDate instanceof Date && !isNaN(indent.indentDate.getTime())) {
          return indent.indentDate >= fromDate;
        }
        return false;
      });
    } else if (toDate) {
      // Only toDate - filter by indentDate (primary)
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      console.log(`[getAnalytics] To date filter only: ${toDate?.toISOString().split('T')[0]}`);
      validIndents = validIndents.filter(indent => {
        if (indent.indentDate && indent.indentDate instanceof Date && !isNaN(indent.indentDate.getTime())) {
          return indent.indentDate <= endDate;
        }
        return false;
      });
    } else {
      // No date filter - use all valid indents
      console.log(`[getAnalytics] No date filter - using all valid indents`);
    }
    
    console.log(`[getAnalytics] Final filtered valid indents: ${validIndents.length}`);
    console.log(`[getAnalytics] Sample indents (first 3):`, validIndents.slice(0, 3).map(i => ({
      indent: i.indent,
      freightTigerMonth: i.freightTigerMonth,
      indentDate: i.indentDate?.toISOString().split('T')[0]
    })));
    
    // Total Indents (Card 1): count of unique indent values from valid indents
    const uniqueIndents = new Set(validIndents.filter(t => t.indent).map(t => t.indent));
    const totalIndents = uniqueIndents.size;

    // Total Trips (Card 2): Use indentDate first, then group by vehicle number
    // Logic:
    // 1. Take indentDate (actual date from indent) - this is the primary key
    // 2. Find associated vehicle number for that date
    // 3. Calculate unique vehicle numbers per date (group by date + vehicle)
    // 4. Check remarks: if "2nd trip" → count 2, otherwise count 1
    // 
    // IMPORTANT: We use indentDate for trip grouping, not date filters
    // The validIndents are already filtered by Freight Tiger Month or date range
    // We don't apply additional date filters to trip counting because:
    // - We want to count trips based on indentDate (actual trip date)
    // - Date filters would exclude trips where Freight Tiger Month doesn't match indentDate month
    const tripDocuments = validIndents.map(indent => ({
      indentDate: indent.indentDate, // Use indentDate first - this is used for grouping trips
      vehicleNumber: indent.vehicleNumber,
      remarks: indent.remarks
    }));
    
    console.log(`[getAnalytics] Card 2: Preparing ${tripDocuments.length} trip documents`);
    console.log(`[getAnalytics] Card 2: Using indentDate + vehicleNumber grouping (no date filters)`);
    
    // Don't apply date filters - we've already filtered validIndents above
    // The trip calculation uses indentDate to group trips by date+vehicle
    // This ensures trips are counted based on their actual indentDate, not filtered dates
    const { totalTrips } = calculateTripsByVehicleDay(tripDocuments);

    console.log(`[getAnalytics] Final results: totalIndents=${totalIndents}, totalTrips=${totalTrips}`);
    
    res.json({
      success: true,
      totalIndents,
      totalIndentsUnique: totalTrips,
      dateRange: {
        from: fromDate?.toISOString().split('T')[0] || null,
        to: toDate?.toISOString().split('T')[0] || null
      },
      recordsProcessed: validIndents.length
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
    
    // Filter to only include indents with Range value (canceled indents don't have range)
    const validIndents = indents.filter(indent => indent.range && indent.range.trim() !== '');
    const totalIndents = validIndents.length;

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
      const rangeIndents = validIndents.filter(indent => {
        // Since ranges are normalized during parsing, we can do direct comparison
        return indent.range === label;
      });
      const indentCount = rangeIndents.length;
      
      // NEW: Calculate UNIQUE indent count for visualization (Card 1 logic)
      const uniqueIndentsInRange = new Set(
        rangeIndents.filter(t => t.indent).map(t => t.indent)
      );
      const uniqueIndentCount = uniqueIndentsInRange.size;
      
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
        uniqueIndentCount,
        totalLoad,
        percentage: parseFloat(percentage.toFixed(2)),
        bucketCount,
        barrelCount
      };
    });

    // Calculate "Other" category for indents that have a range but don't match any predefined range
    const matchedRanges = new Set(rangeMappings.map(({ label }) => label));
    const otherIndents = validIndents.filter(indent => {
      return !matchedRanges.has(indent.range);
    });
    
    // Log other indents to console for debugging
    if (otherIndents.length > 0) {
      console.log(`\n=== OTHER INDENTS (${otherIndents.length} total) ===`);
      otherIndents.forEach((indent, index) => {
        console.log(`${index + 1}. Range: "${indent.range}" | Indent: ${indent.indent || 'N/A'} | Location: ${indent.location || 'N/A'}`);
      });
      console.log('==========================================\n');
    }
    
    // Log canceled indents (those without range) for debugging
    const canceledIndents = indents.filter(indent => !indent.range || indent.range.trim() === '');
    if (canceledIndents.length > 0) {
      console.log(`\n=== CANCELED INDENTS (${canceledIndents.length} total - excluded from count) ===`);
      canceledIndents.forEach((indent, index) => {
        console.log(`${index + 1}. Range: "${indent.range || '(null/empty)'}" | Indent: ${indent.indent || 'N/A'} | Location: ${indent.location || 'N/A'}`);
      });
      console.log('==========================================\n');
    }
    
    if (otherIndents.length > 0) {
      const otherIndentCount = otherIndents.length;
      
      // NEW: Calculate UNIQUE indent count for "Other" category
      const uniqueOtherIndents = new Set(
        otherIndents.filter(t => t.indent).map(t => t.indent)
      );
      const uniqueIndentCount = uniqueOtherIndents.size;
      
      const otherTotalLoad = otherIndents.reduce((sum, indent) => sum + (indent.totalLoad || 0), 0);
      const otherPercentage = totalIndents > 0 ? (otherIndentCount / totalIndents) * 100 : 0;
      
      let otherBucketCount = 0;
      let otherBarrelCount = 0;
      
      otherIndents.forEach(indent => {
        const count = indent.noOfBuckets || 0;
        const material = (indent.material || '').trim();
        
        if (material === '20L Buckets') {
          otherBucketCount += count;
        } else if (material === '210L Barrels') {
          otherBarrelCount += count;
        }
      });
      
      rangeData.push({
        range: 'Other',
        indentCount: otherIndentCount,
        uniqueIndentCount,
        totalLoad: otherTotalLoad,
        percentage: parseFloat(otherPercentage.toFixed(2)),
        bucketCount: otherBucketCount,
        barrelCount: otherBarrelCount
      });
    }

    // Calculate location-wise data using Range column from Excel
    const locationMap = new Map<string, { indentCount: number; totalLoad: number; range: string }>();

    validIndents.forEach(indent => {
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

    // Calculate GLOBAL unique indent count (same as Card 1 logic)
    const globalUniqueIndents = new Set(validIndents.filter(t => t.indent).map(t => t.indent));
    const totalUniqueIndents = globalUniqueIndents.size;

    res.json({
      success: true,
      rangeData,
      locations,
      totalUniqueIndents,
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

    // Calculate bucket count for each indent (only count 20L Buckets)
    const MAX_BUCKETS = 300; // Maximum buckets capacity
    
    // Define bucket ranges - these are the primary calculation method
    // Percentage ranges are calculated FROM bucket ranges
    const bucketRanges = [
      { min: 0, max: 150, minPercent: 0, maxPercent: 50 },      // 0-150 → 0-50%
      { min: 151, max: 200, minPercent: 50, maxPercent: 67 },    // 151-200 → 50-67%
      { min: 201, max: 250, minPercent: 67, maxPercent: 83 },    // 201-250 → 67-83%
      { min: 251, max: 300, minPercent: 84, maxPercent: 100 }   // 251-300 → 84-100%
    ];

    // Calculate bucket count for each indent (only 20L Buckets)
    const indentBucketData = indents.map(indent => {
      const material = (indent.material || '').trim();
      const bucketCount = material === '20L Buckets' ? (indent.noOfBuckets || 0) : 0;
      return { bucketCount };
    });

    // Count indents in each bucket range and calculate percentage from bucket range
    const rangeCounts = bucketRanges.map(range => {
      const count = indentBucketData.filter(item => 
        item.bucketCount >= range.min && 
        item.bucketCount <= range.max
      ).length;
      
      // Use exact percentage ranges calculated from bucket ranges
      const percentageLabel = `${range.minPercent} - ${range.maxPercent}%`;
      const bucketLabel = `${range.min} - ${range.max}`;
      
      return {
        range: percentageLabel,
        bucketRange: bucketLabel,
        indentCount: count
      };
    });

    // Always return all ranges, even if counts are 0
    // This ensures the table always displays the 4 bucket ranges
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

    // Truck capacity varies by material type:
    // - 20L Buckets: 6000 kg capacity
    // - 210L Barrels: 6300 kg capacity
    const BUCKET_CAPACITY = 6000;
    const BARREL_CAPACITY = 6300;
    
    const groupedData: Record<string, { totalLoad: number; indentCount: number; totalFulfillment: number; bucketCount: number }> = {};

    // Debug: Log total indents fetched
    console.log(`[getLoadOverTime] Total indents fetched: ${indents.length}`);

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
        groupedData[key] = { totalLoad: 0, indentCount: 0, totalFulfillment: 0, bucketCount: 0 };
      }

      const load = indent.totalLoad || 0;
      const material = String(indent.material || '').trim();
      
      // Determine truck capacity based on material type
      const truckCapacity = material === '210L Barrels' ? BARREL_CAPACITY : BUCKET_CAPACITY;
      const fulfillmentPercentage = (load / truckCapacity) * 100;
      
      // IMPORTANT: Calculate bucket count ONLY from noOfBuckets field, NOT from totalLoad
      // Differentiate between buckets and barrels using Material column
      // Convert barrels to buckets: 1 barrel = 10.5 buckets
      const noOfBuckets = Number(indent.noOfBuckets) || 0;
      let buckets = 0;
      
      // Only count buckets/barrels based on material type
      if (material === '20L Buckets') {
        // Direct bucket count from "No. of Buckets/Barrels" column
        buckets = noOfBuckets;
      } else if (material === '210L Barrels') {
        // Convert barrels to buckets: 1 barrel = 10.5 buckets
        buckets = noOfBuckets * 10.5;
      }
      // For any other material or empty material, buckets = 0

      groupedData[key].totalLoad += load;
      groupedData[key].indentCount += 1;
      groupedData[key].totalFulfillment += fulfillmentPercentage;
      groupedData[key].bucketCount += buckets;
    });

    // Convert to array and format labels
    const sortedKeys = Object.keys(groupedData).sort();
    const timeSeriesData = sortedKeys.map(key => {
      const data = groupedData[key];
      const formattedKey = formatTimeLabel(key, granularity);
      // Round bucket count to 2 decimal places (since barrels convert to 10.5 buckets)
      // Ensure we're using the calculated bucketCount, not deriving from load
      const bucketCount = parseFloat((data.bucketCount || 0).toFixed(2));
      return {
        date: formattedKey,
        totalLoad: Math.round(data.totalLoad),
        avgFulfillment: data.indentCount > 0 ? parseFloat((data.totalFulfillment / data.indentCount).toFixed(2)) : 0,
        indentCount: data.indentCount,
        bucketCount: bucketCount
      };
    });

    // Debug: Log data for Sep 29 specifically and overall summary
    const sep29Data = timeSeriesData.find(item => item.date.includes('Sep 29') || item.date.includes('2024-09-29'));
    if (sep29Data) {
      console.log(`[getLoadOverTime] Sep 29 data:`, {
        date: sep29Data.date,
        bucketCount: sep29Data.bucketCount,
        totalLoad: sep29Data.totalLoad,
        indentCount: sep29Data.indentCount,
        calculatedFrom: 'noOfBuckets field (buckets + barrels*10.5)'
      });
    }
    
    // Log all data points for debugging
    console.log(`[getLoadOverTime] All data points:`, timeSeriesData.map(item => ({
      date: item.date,
      bucketCount: item.bucketCount
    })));

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

export const getMonthOnMonthAnalytics = async (req: Request, res: Response) => {
  try {
    // Query all trips from database (no date filter - show all available months)
    const indents = await Trip.find({});

    console.log(`[getMonthOnMonthAnalytics] Total indents fetched: ${indents.length}`);

    // Filter to only include indents with Range value (same as getAnalytics - canceled indents don't have range)
    const validIndents = indents.filter(indent => indent.range && indent.range.trim() !== '');

    console.log(`[getMonthOnMonthAnalytics] Valid indents (with range): ${validIndents.length}`);

    // Find all unique months using 'Freight Tiger Month' column from Excel
    const monthKeys = new Set<string>();
    let freightTigerMonthCount = 0;
    let indentDateFallbackCount = 0;
    
    validIndents.forEach(indent => {
      // Use 'Freight Tiger Month' column if available, otherwise fallback to indentDate
      if (indent.freightTigerMonth && typeof indent.freightTigerMonth === 'string' && indent.freightTigerMonth.trim() !== '') {
        const monthValue = indent.freightTigerMonth.trim();
        // Normalize month value to standard format (e.g., "May'25" -> "2025-05")
        const normalizedMonth = normalizeFreightTigerMonth(monthValue);
        if (normalizedMonth) {
          monthKeys.add(normalizedMonth);
          freightTigerMonthCount++;
        }
      } else if (indent.indentDate && indent.indentDate instanceof Date && !isNaN(indent.indentDate.getTime())) {
        // Fallback to indentDate if Freight Tiger Month is not available
        monthKeys.add(format(indent.indentDate, 'yyyy-MM'));
        indentDateFallbackCount++;
      }
    });
    
    console.log(`[getMonthOnMonthAnalytics] Using Freight Tiger Month: ${freightTigerMonthCount} indents`);
    console.log(`[getMonthOnMonthAnalytics] Using indentDate fallback: ${indentDateFallbackCount} indents`);
    console.log(`[getMonthOnMonthAnalytics] Unique months found: ${monthKeys.size}`);

    // Always include October and November 2025 in the graph (even if no data exists)
    monthKeys.add('2025-10'); // October 2025
    monthKeys.add('2025-11'); // November 2025
    
    console.log(`[getMonthOnMonthAnalytics] Added Oct 2025 and Nov 2025 to month list`);

    // For each month, calculate using EXACTLY the same logic as getAnalytics
    // This ensures month-on-month values match the cards when filtered to that month
    const sortedMonthKeys = Array.from(monthKeys).sort();
    const monthOnMonthData = sortedMonthKeys.map(monthKey => {
      // Calculate month start and end dates (same as date filter in getAnalytics)
      const monthStart = new Date(monthKey + '-01');
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      console.log(`[getMonthOnMonthAnalytics] Processing month: ${monthKey}`);
      console.log(`[getMonthOnMonthAnalytics] Month range: ${monthStart.toISOString()} to ${monthEnd.toISOString()}`);

      // Filter validIndents to this month using 'Freight Tiger Month' column
      // First try to match by Freight Tiger Month, then fallback to indentDate
      const monthIndents = validIndents.filter(indent => {
        // Primary: Use Freight Tiger Month column if available
        if (indent.freightTigerMonth && typeof indent.freightTigerMonth === 'string' && indent.freightTigerMonth.trim() !== '') {
          const normalizedMonth = normalizeFreightTigerMonth(indent.freightTigerMonth.trim());
          // If normalization succeeds, check if it matches
          if (normalizedMonth === monthKey) {
            return true;
          }
          // If normalization fails (returns null), fall through to indentDate check
          if (normalizedMonth === null) {
            // Fall through to indentDate check below
          } else {
            // Normalized to a different month, exclude this indent
            return false;
          }
        }
        // Fallback: Use indentDate if Freight Tiger Month is not available or failed to normalize
        if (indent.indentDate && indent.indentDate instanceof Date && !isNaN(indent.indentDate.getTime())) {
          return indent.indentDate >= monthStart && indent.indentDate <= monthEnd;
        }
        return false;
      });

      console.log(`[getMonthOnMonthAnalytics] ${monthKey}: Filtered ${monthIndents.length} indents for this month`);
      
      // Sample dates for debugging
      if (monthIndents.length > 0) {
        const sampleDates = monthIndents.slice(0, 3).map(i => ({
          indent: i.indent,
          indentDate: i.indentDate?.toISOString(),
          vehicle: i.vehicleNumber
        }));
        console.log(`[getMonthOnMonthAnalytics] ${monthKey}: Sample dates:`, sampleDates);
      }

      // Calculate Indent Count (Card 1 logic - EXACTLY matching getAnalytics lines 34-35)
      const uniqueIndents = new Set(monthIndents.filter(t => t.indent).map(t => t.indent));
      const indentCount = uniqueIndents.size;

      // Calculate Trip Count: Use indentDate first, then group by vehicle number
      // Logic:
      // 1. Take indentDate (actual date from indent)
      // 2. Find associated vehicle number for that date
      // 3. Calculate unique vehicle numbers per date (group by date + vehicle)
      // 4. Check remarks: if "2nd trip" → count 2, otherwise count 1
      const tripDocuments = monthIndents.map(indent => ({
        indentDate: indent.indentDate, // Use indentDate first (not Freight Tiger Month)
        vehicleNumber: indent.vehicleNumber,
        remarks: indent.remarks
      }));
      
      // Don't pass date filters - we've already filtered by Freight Tiger Month for month grouping
      // The trip calculation itself uses indentDate to group trips by date+vehicle
      console.log(`[getMonthOnMonthAnalytics] ${monthKey}: Counting trips using indentDate + vehicleNumber grouping`);
      console.log(`[getMonthOnMonthAnalytics] ${monthKey}: Trip documents count: ${tripDocuments.length}`);
      const { totalTrips } = calculateTripsByVehicleDay(tripDocuments);

      console.log(`[getMonthOnMonthAnalytics] ${monthKey}: indentCount=${indentCount}, tripCount=${totalTrips}`);

      // Format month label - use Freight Tiger Month format if available, otherwise format from date
      let formattedMonth: string;
      const sampleIndent = monthIndents.find(i => i.freightTigerMonth);
      if (sampleIndent && sampleIndent.freightTigerMonth) {
        // Use the original Freight Tiger Month value (e.g., "May 2025" or "May'25")
        // Normalize to "MMM'yy" format for consistency
        const originalValue = sampleIndent.freightTigerMonth.trim();
        try {
          // Try to parse and format as "MMM'yy"
          const parsed = parse(originalValue, 'MMMM yyyy', new Date());
          if (!isNaN(parsed.getTime())) {
            formattedMonth = format(parsed, "MMM''yy");
          } else {
            const parsed2 = parse(originalValue, "MMMM''yy", new Date());
            if (!isNaN(parsed2.getTime())) {
              formattedMonth = format(parsed2, "MMM''yy");
            } else {
              // Fallback to date formatting
              formattedMonth = format(monthStart, "MMM''yy");
            }
          }
        } catch (e) {
          // If parsing fails, use date formatting
          formattedMonth = format(monthStart, "MMM''yy");
        }
      } else {
        // Fallback to date formatting if no Freight Tiger Month available
        formattedMonth = format(monthStart, "MMM''yy");
      }
      
      return {
        month: formattedMonth,
        indentCount: indentCount, // Unique indent count (Card 1 logic)
        tripCount: totalTrips // Vehicle-day trip count (Card 2 logic)
      };
    });

    console.log(`[getMonthOnMonthAnalytics] Month-on-month data points: ${monthOnMonthData.length}`);
    console.log(`[getMonthOnMonthAnalytics] Sample data:`, monthOnMonthData.slice(0, 3));
    
    // Debug: Verify for a specific month (e.g., May 2025) by simulating getAnalytics call
    const testMonth = '2025-05';
    const testMonthData = monthOnMonthData.find(m => {
      const monthKey = format(new Date(m.month.replace("'", " 20")), 'yyyy-MM');
      return monthKey === testMonth || m.month.includes('May');
    });
    
    if (testMonthData) {
      console.log(`[getMonthOnMonthAnalytics] Test month (May 2025):`, testMonthData);
      // Simulate getAnalytics for May 2025
      const mayStart = new Date('2025-05-01');
      const mayEnd = new Date(2025, 4, 31, 23, 59, 59, 999);
      const mayFilter = { indentDate: { $gte: mayStart, $lte: mayEnd } };
      const mayIndents = await Trip.find(mayFilter);
      const mayValid = mayIndents.filter(i => i.range && i.range.trim() !== '');
      const mayUnique = new Set(mayValid.filter(t => t.indent).map(t => t.indent));
      const mayTripDocs = mayValid.map(i => ({
        indentDate: i.indentDate,
        vehicleNumber: i.vehicleNumber,
        remarks: i.remarks
      }));
      const { totalTrips: mayTrips } = calculateTripsByVehicleDay(mayTripDocs, mayStart, mayEnd);
      console.log(`[getMonthOnMonthAnalytics] Simulated getAnalytics for May 2025: indentCount=${mayUnique.size}, tripCount=${mayTrips}`);
      console.log(`[getMonthOnMonthAnalytics] Month-on-month for May 2025: indentCount=${testMonthData.indentCount}, tripCount=${testMonthData.tripCount}`);
    }
    
    // Debug: Calculate totals to verify they match card logic
    const totalIndentsFromGraph = monthOnMonthData.reduce((sum, item) => sum + item.indentCount, 0);
    const totalTripsFromGraph = monthOnMonthData.reduce((sum, item) => sum + item.tripCount, 0);
    console.log(`[getMonthOnMonthAnalytics] Total indent count (sum of all months): ${totalIndentsFromGraph}`);
    console.log(`[getMonthOnMonthAnalytics] Total trip count (sum of all months): ${totalTripsFromGraph}`);
    console.log(`[getMonthOnMonthAnalytics] Full data:`, monthOnMonthData);

    res.json({
      success: true,
      data: monthOnMonthData
    });
  } catch (error) {
    console.error(`[getMonthOnMonthAnalytics] Error:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch month-on-month analytics'
    });
  }
};

