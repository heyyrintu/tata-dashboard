import Trip from '../models/Trip';
import { format } from 'date-fns';
import { logger } from './logger';
import { endOfDayUTC } from './dateFilter';

// Helper function to normalize Freight Tiger Month to 'yyyy-MM' format
// Handles formats: "May-25", "May'25", "May-2025", "2025-05", etc.
const normalizeFreightTigerMonth = (monthValue: string): string | null => {
  if (!monthValue || typeof monthValue !== 'string') return null;
  
  const trimmed = monthValue.trim();
  
  // Handle typos like "0ct-25" -> "Oct-25" or "0ct'25" -> "Oct'25"
  const fixedTypo = trimmed.replace(/^0ct/i, 'Oct');
  
  // Try to parse formats like "Oct-25", "Oct'25", "October 2025", etc.
  // First, try common formats with both dash and single quote
  const monthPatterns = [
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-'](\d{2,4})$/i,  // May-25 or May'25
    /^(\d{1,2})[-/](\d{2,4})$/,  // 05-25 or 5-25
  ];
  
  for (const pattern of monthPatterns) {
    const match = fixedTypo.match(pattern);
    if (match) {
      let monthStr = match[1];
      let yearStr = match[2];
      
      // Convert month name to number
      const monthNames: { [key: string]: string } = {
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
        'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
        'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
      };
      
      if (monthNames[monthStr.toLowerCase()]) {
        monthStr = monthNames[monthStr.toLowerCase()];
      } else if (parseInt(monthStr) >= 1 && parseInt(monthStr) <= 12) {
        monthStr = monthStr.padStart(2, '0');
      } else {
        continue;
      }
      
      // Normalize year
      if (yearStr.length === 2) {
        const yearNum = parseInt(yearStr);
        yearStr = yearNum >= 50 ? `19${yearStr}` : `20${yearStr}`;
      }
      
      return `${yearStr}-${monthStr}`;
    }
  }
  
  // Try parsing as date string
  try {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return format(date, 'yyyy-MM');
    }
  } catch (e) {
    // Ignore
  }
  
  return null;
};

interface RangeWiseData {
  range: string;
  indentCount: number; // Total rows in this range
  uniqueIndentCount: number; // Unique indent values in this range
  totalLoad: number; // Total load in kg
  percentage: number; // Percentage of total rows
  bucketCount: number;
  barrelCount: number;
  totalCost: number; // Total cost for this range
  profitLoss: number; // Profit & Loss for this range
}

interface RangeWiseCalculationResult {
  rangeData: RangeWiseData[];
  totalUniqueIndents: number; // Global unique indent count (matching Card 2)
  totalLoad: number; // Total load in kg (from all indents in date range)
  totalRows: number; // Total rows (all indent rows including duplicates)
  totalBuckets: number;
  totalBarrels: number;
  totalCost: number; // Total cost (from all indents in date range)
  totalProfitLoss: number; // Total profit & loss (from all indents in date range)
}

/**
 * Calculate Range-Wise Summary data
 * This matches Card 2 (Total Trip) logic - uses validIndents (excludes cancelled)
 */
export async function calculateRangeWiseSummary(
  fromDate: Date | null | undefined,
  toDate: Date | null | undefined
): Promise<RangeWiseCalculationResult> {
  logger.debug('calculateRangeWiseSummary started', {
    fromDate: fromDate?.toISOString().split('T')[0] || 'null',
    toDate: toDate?.toISOString().split('T')[0] || 'null'
  });

  // Step 1: Query ALL trips from database (includes ALL rows, including duplicates)
  // This gets every single row/document, so duplicate indents are included
  const allIndents = await Trip.find({});
  logger.debug('Total indents from DB', { count: allIndents.length });

  // Step 2: Filter to only include indents with Range value (canceled indents don't have range)
  let validIndents = allIndents.filter((indent: any) => indent.range && indent.range.trim() !== '');
  logger.debug('Valid indents with range', { count: validIndents.length });

  // Step 3: Apply date filtering - use same logic as getAnalytics (Card 1 & Card 2)
  // This includes Freight Tiger Month filtering for single-month selections
  if (fromDate && toDate) {
    // Check if the date range represents a single month
    const fromMonth = format(fromDate, 'yyyy-MM');
    const toMonth = format(toDate, 'yyyy-MM');
    
    logger.debug('Date filter applied', {
      fromDate: fromDate?.toISOString().split('T')[0],
      toDate: toDate?.toISOString().split('T')[0],
      fromMonth,
      toMonth
    });
    
    if (fromMonth === toMonth) {
      // Single month filter - use Freight Tiger Month to match Card 1 & Card 2 logic
      logger.debug('Single month filter detected', { month: fromMonth });
      const targetMonthKey = fromMonth;
      const endDate = endOfDayUTC(toDate);
      
      validIndents = validIndents.filter((indent: any) => {
        // Primary: Use Freight Tiger Month if available
        if (indent.freightTigerMonth && typeof indent.freightTigerMonth === 'string' && indent.freightTigerMonth.trim() !== '') {
          const normalizedMonth = normalizeFreightTigerMonth(indent.freightTigerMonth.trim());
          if (normalizedMonth === targetMonthKey) {
            return true;
          }
        }
        // Fallback: Use indentDate if Freight Tiger Month is not available
        if (indent.indentDate && indent.indentDate instanceof Date && !isNaN(indent.indentDate.getTime())) {
          return indent.indentDate >= fromDate && indent.indentDate <= endDate;
        }
        return false;
      });
      
      // If no results using Freight Tiger Month, fallback to indentDate only
      if (validIndents.length === 0) {
        logger.debug('No matches with Freight Tiger Month, falling back to indentDate');
        validIndents = allIndents.filter((indent: any) => {
          if (!indent.range || indent.range.trim() === '') return false;
          if (!indent.indentDate || !(indent.indentDate instanceof Date) || isNaN(indent.indentDate.getTime())) return false;
          return indent.indentDate >= fromDate && indent.indentDate <= endDate;
        });
      }
    } else {
      // Multiple months or date range - filter by indentDate (primary) and also check Freight Tiger Month
      logger.debug('Date range filter', { fromMonth, toMonth });
      const endDate = endOfDayUTC(toDate);
      
      validIndents = validIndents.filter((indent: any) => {
        // Check if indentDate matches the range
        const dateMatches = indent.indentDate && 
                           indent.indentDate instanceof Date && 
                           !isNaN(indent.indentDate.getTime()) &&
                           indent.indentDate >= fromDate && 
                           indent.indentDate <= endDate;
        
        // Also check if Freight Tiger Month matches any month in the range
        let freightTigerMatches = false;
        if (indent.freightTigerMonth && typeof indent.freightTigerMonth === 'string' && indent.freightTigerMonth.trim() !== '') {
          const normalizedMonth = normalizeFreightTigerMonth(indent.freightTigerMonth.trim());
          if (normalizedMonth) {
            // Check if normalized month falls within the date range
            const monthDate = new Date(normalizedMonth + '-01');
            freightTigerMatches = monthDate >= fromDate && monthDate <= endDate;
          }
        }
        
        return dateMatches || freightTigerMatches;
      });
    }
    
    logger.debug('After date filter', { matchedCount: validIndents.length });
  } else if (fromDate) {
    logger.debug('From date filter only', { fromDate: fromDate?.toISOString().split('T')[0] });
    validIndents = validIndents.filter((indent: any) => {
      if (!indent.indentDate || !(indent.indentDate instanceof Date) || isNaN(indent.indentDate.getTime())) {
        return false;
      }
      return indent.indentDate >= fromDate;
    });
  } else if (toDate) {
    const endDate = endOfDayUTC(toDate);
    logger.debug('To date filter only', { toDate: toDate?.toISOString().split('T')[0] });
    validIndents = validIndents.filter((indent: any) => {
      if (!indent.indentDate || !(indent.indentDate instanceof Date) || isNaN(indent.indentDate.getTime())) {
        return false;
      }
      return indent.indentDate <= endDate;
    });
  } else {
    logger.debug('No date filter - using all valid indents');
  }
  
  logger.debug('Final filtered valid indents', { count: validIndents.length });

  // Step 4: Get ALL indents in date range for total load/cost calculation (includes cancelled AND duplicates)
  // IMPORTANT: This must include ALL rows, including duplicate indents, to match Excel sheet totals
  // Use same filtering logic as validIndents, but include cancelled indents (no range filter)
  let allIndentsInDateRange: any[] = [];
  
  if (fromDate && toDate) {
    const fromMonth = format(fromDate, 'yyyy-MM');
    const toMonth = format(toDate, 'yyyy-MM');
    const endDate = endOfDayUTC(toDate);
    
    if (fromMonth === toMonth) {
      // Single month - use Freight Tiger Month (same logic as validIndents)
      const targetMonthKey = fromMonth;
      allIndentsInDateRange = allIndents.filter((indent: any) => {
        // Primary: Use Freight Tiger Month if available
        if (indent.freightTigerMonth && typeof indent.freightTigerMonth === 'string' && indent.freightTigerMonth.trim() !== '') {
          const normalizedMonth = normalizeFreightTigerMonth(indent.freightTigerMonth.trim());
          if (normalizedMonth === targetMonthKey) {
            return true;
          }
        }
        // Fallback: Use indentDate
        if (indent.indentDate && indent.indentDate instanceof Date && !isNaN(indent.indentDate.getTime())) {
          return indent.indentDate >= fromDate && indent.indentDate <= endDate;
        }
        return false;
      });
      
      // Fallback to indentDate if no results
      if (allIndentsInDateRange.length === 0) {
        logger.debug('Total Load: No matches with Freight Tiger Month, using indentDate fallback');
        allIndentsInDateRange = await Trip.find({
          indentDate: {
            $gte: fromDate,
            $lte: endDate
          }
        });
      }
    } else {
      // Multiple months - use indentDate with Freight Tiger Month fallback
      allIndentsInDateRange = allIndents.filter((indent: any) => {
        const dateMatches = indent.indentDate && 
                           indent.indentDate instanceof Date && 
                           !isNaN(indent.indentDate.getTime()) &&
                           indent.indentDate >= fromDate && 
                           indent.indentDate <= endDate;
        
        let freightTigerMatches = false;
        if (indent.freightTigerMonth && typeof indent.freightTigerMonth === 'string' && indent.freightTigerMonth.trim() !== '') {
          const normalizedMonth = normalizeFreightTigerMonth(indent.freightTigerMonth.trim());
          if (normalizedMonth) {
            const monthDate = new Date(normalizedMonth + '-01');
            freightTigerMatches = monthDate >= fromDate && monthDate <= endDate;
          }
        }
        
        return dateMatches || freightTigerMatches;
      });
    }
    
    logger.debug('Total Load Query', {
      fromDate: fromDate.toISOString(),
      toDate: endDate.toISOString()
    });
  } else if (fromDate) {
    allIndentsInDateRange = await Trip.find({
      indentDate: {
        $gte: fromDate
      }
    });
  } else if (toDate) {
    const endDate = endOfDayUTC(toDate);
    allIndentsInDateRange = await Trip.find({
      indentDate: {
        $lte: endDate
      }
    });
  } else {
    allIndentsInDateRange = allIndents;
  }
  
  logger.debug('Indents in date range', {
    allIndentsCount: allIndentsInDateRange.length,
    validIndentsCount: validIndents.length
  });

  // Step 5: Calculate total rows (all indent rows including duplicates)
  const totalRows = validIndents.length;
  console.log(`[calculateRangeWiseSummary] Total rows (all indent rows including duplicates): ${totalRows}`);

  // Step 6: Calculate global unique indent count (matching Card 2 logic)
  const globalUniqueIndents = new Set(validIndents.filter((t: any) => t.indent).map((t: any) => t.indent));
  const totalUniqueIndents = globalUniqueIndents.size;
  console.log(`[calculateRangeWiseSummary] Total unique indents (excluding cancelled, matching Card 2): ${totalUniqueIndents}`);

  // Step 7: Calculate total load and total cost from ALL indents in date range (includes cancelled AND duplicates)
  // IMPORTANT: This includes ALL rows, including duplicate indents, to match Excel sheet total
  const totalLoad = allIndentsInDateRange.reduce((sum: number, indent: any) => {
    return sum + (indent.totalLoad || 0);
  }, 0);
  const totalCost = allIndentsInDateRange.reduce((sum: number, indent: any) => {
    return sum + (indent.totalCost || 0);
  }, 0);
  const totalProfitLoss = allIndentsInDateRange.reduce((sum: number, indent: any) => {
    return sum + (indent.profitLoss || 0);
  }, 0);
  
  // Count duplicates for verification
  const indentCounts = new Map<string, number>();
  allIndentsInDateRange.forEach((indent: any) => {
    const key = indent.indent || 'NO_INDENT';
    indentCounts.set(key, (indentCounts.get(key) || 0) + 1);
  });
  const duplicateIndentValues = Array.from(indentCounts.entries()).filter(([_, count]) => count > 1);
  
  logger.debug('Total load and cost', {
    totalLoad: `${totalLoad} kg (${(totalLoad / 1000).toFixed(2)} tons)`,
    totalCost: `₹${totalCost.toLocaleString('en-IN')}`
  });
  logger.debug('Total profit & loss and rows', {
    totalProfitLoss: `₹${totalProfitLoss.toLocaleString('en-IN')}`,
    totalRowsCounted: allIndentsInDateRange.length,
    duplicateIndentValues: duplicateIndentValues.length
  });

  // Step 8: Define range mappings
  const rangeMappings = [
    { label: '0-100Km' },
    { label: '101-250Km' },
    { label: '251-400Km' },
    { label: '401-600Km' },
  ];

  // Step 9: Calculate range-wise data
  // Always create range data even if validIndents is empty (to show 0 values)
  const rangeData: RangeWiseData[] = rangeMappings.map(({ label }) => {
    const rangeIndents = validIndents.filter((indent: any) => {
      return indent.range === label;
    });
    
    // Total rows in this range (including duplicates)
    const indentCount = rangeIndents.length;
    
    // Unique indent count in this range
    const uniqueIndentsInRange = new Set(
      rangeIndents.filter((t: any) => t.indent).map((t: any) => t.indent)
    );
    const uniqueIndentCount = uniqueIndentsInRange.size;
    
    // Total load in this range (sum of all rows)
    const totalLoadInRange = rangeIndents.reduce((sum: number, indent: any) => sum + (indent.totalLoad || 0), 0);
    const totalCostInRange = rangeIndents.reduce((sum: number, indent: any) => sum + (indent.totalCost || 0), 0);
    const profitLossInRange = rangeIndents.reduce((sum: number, indent: any) => sum + (indent.profitLoss || 0), 0);
    
    // Percentage based on total rows
    const percentage = totalRows > 0 ? (indentCount / totalRows) * 100 : 0;
    
    // Count buckets and barrels separately
    let bucketCount = 0;
    let barrelCount = 0;
    
    rangeIndents.forEach((indent: any) => {
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
      totalLoad: totalLoadInRange,
      percentage: parseFloat(percentage.toFixed(2)),
      bucketCount,
      barrelCount,
      totalCost: totalCostInRange,
      profitLoss: profitLossInRange
    };
  });
  
  logger.debug('Range data created', {
    rangeCount: rangeData.length,
    sampleRanges: rangeData.slice(0, 2).map(r => ({
      range: r.range,
      indentCount: r.indentCount,
      uniqueIndentCount: r.uniqueIndentCount,
      totalCost: r.totalCost
    }))
  });

  // Step 10: Calculate "Other" category for non-matching ranges
  const matchedRanges = new Set(rangeMappings.map(({ label }) => label));
  const otherIndents = validIndents.filter((indent: any) => {
    return indent.range && indent.range.trim() !== '' && !matchedRanges.has(indent.range);
  });
  
  logger.debug('Other indents found', { count: otherIndents.length });
  
  if (otherIndents.length > 0) {
    const otherIndentCount = otherIndents.length;
    const uniqueOtherIndents = new Set(
      otherIndents.filter((t: any) => t.indent).map((t: any) => t.indent)
    );
    const uniqueIndentCount = uniqueOtherIndents.size;
    
    const otherTotalLoad = otherIndents.reduce((sum: number, indent: any) => sum + (indent.totalLoad || 0), 0);
    const otherTotalCost = otherIndents.reduce((sum: number, indent: any) => sum + (indent.totalCost || 0), 0);
    const otherProfitLoss = otherIndents.reduce((sum: number, indent: any) => sum + (indent.profitLoss || 0), 0);
    const otherPercentage = totalRows > 0 ? (otherIndentCount / totalRows) * 100 : 0;
    
    let otherBucketCount = 0;
    let otherBarrelCount = 0;
    
    otherIndents.forEach((indent: any) => {
      const count = indent.noOfBuckets || 0;
      const material = (indent.material || '').trim();
      
      if (material === '20L Buckets') {
        otherBucketCount += count;
      } else if (material === '210L Barrels') {
        otherBarrelCount += count;
      }
    });
    
    const otherRow: RangeWiseData = {
      range: 'Other',
      indentCount: otherIndentCount,
      uniqueIndentCount,
      totalLoad: otherTotalLoad,
      percentage: parseFloat(otherPercentage.toFixed(2)),
      bucketCount: otherBucketCount,
      barrelCount: otherBarrelCount,
      totalCost: otherTotalCost,
      profitLoss: otherProfitLoss
    };
    
    rangeData.push(otherRow);
    logger.debug('Added Other row', { otherRow });
  }

  // Step 11: Find and calculate duplicate indents (indents appearing in multiple ranges)
  const indentRangeMap = new Map<string, Set<string>>(); // indent -> set of ranges
  validIndents.forEach((indent: any) => {
    if (indent.indent && indent.range) {
      if (!indentRangeMap.has(indent.indent)) {
        indentRangeMap.set(indent.indent, new Set());
      }
      indentRangeMap.get(indent.indent)!.add(indent.range);
    }
  });
  
  // Find indents that appear in 2+ different ranges
  const duplicateIndents = new Set<string>();
  indentRangeMap.forEach((ranges, indent) => {
    if (ranges.size > 1) {
      duplicateIndents.add(indent);
    }
  });
  
  logger.debug('Found duplicate indents', { count: duplicateIndents.size });
  
  // Get all rows for these duplicate indents
  const duplicateIndentRows = validIndents.filter((indent: any) => 
    indent.indent && duplicateIndents.has(indent.indent)
  );
  
  if (duplicateIndentRows.length > 0) {
    logger.debug('Duplicate indent rows', { count: duplicateIndentRows.length });
    
    const duplicateIndentCount = duplicateIndentRows.length;
    const uniqueDuplicateIndents = new Set(duplicateIndentRows.map((t: any) => t.indent).filter(Boolean));
    const uniqueIndentCount = uniqueDuplicateIndents.size;
    
    const duplicateTotalLoad = duplicateIndentRows.reduce((sum: number, indent: any) => sum + (indent.totalLoad || 0), 0);
    const duplicateTotalCost = duplicateIndentRows.reduce((sum: number, indent: any) => sum + (indent.totalCost || 0), 0);
    const duplicateProfitLoss = duplicateIndentRows.reduce((sum: number, indent: any) => sum + (indent.profitLoss || 0), 0);
    const duplicatePercentage = totalRows > 0 ? (duplicateIndentCount / totalRows) * 100 : 0;
    
    let duplicateBucketCount = 0;
    let duplicateBarrelCount = 0;
    
    duplicateIndentRows.forEach((indent: any) => {
      const count = indent.noOfBuckets || 0;
      const material = (indent.material || '').trim();
      
      if (material === '20L Buckets') {
        duplicateBucketCount += count;
      } else if (material === '210L Barrels') {
        duplicateBarrelCount += count;
      }
    });
    
    const duplicateRow: RangeWiseData = {
      range: 'Duplicate Indents',
      indentCount: duplicateIndentCount,
      uniqueIndentCount,
      totalLoad: duplicateTotalLoad,
      percentage: parseFloat(duplicatePercentage.toFixed(2)),
      bucketCount: duplicateBucketCount,
      barrelCount: duplicateBarrelCount,
      totalCost: duplicateTotalCost,
      profitLoss: duplicateProfitLoss
    };
    
    rangeData.push(duplicateRow);
    logger.debug('Added Duplicate Indents row', { duplicateRow });
  }

  // Step 12: Calculate totals from rangeData (matching Range-Wise Summary table logic)
  // This ensures bucket/barrel counts match the Range-Wise Summary table's total row
  // The frontend excludes "Other" and "Duplicate Indents" rows from the total
  const standardRanges = rangeData.filter(item => 
    item.range !== 'Other' && item.range !== 'Duplicate Indents'
  );
  
  const totalBuckets = standardRanges.reduce((sum, item) => sum + item.bucketCount, 0);
  const totalBarrels = standardRanges.reduce((sum, item) => sum + item.barrelCount, 0);
  
  logger.info('calculateRangeWiseSummary completed', {
    totalUniqueIndents,
    totalRows,
    totalLoad: `${totalLoad} kg (${(totalLoad / 1000).toFixed(2)} tons)`,
    totalBuckets,
    totalBarrels,
    rangeDataCount: rangeData.length
  });

  return {
    rangeData,
    totalUniqueIndents,
    totalLoad,
    totalCost,
    totalProfitLoss,
    totalRows,
    totalBuckets,
    totalBarrels
  };
}

