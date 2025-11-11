import { filterIndentsByDate, DateFilterResult } from './dateFiltering';
import { toExcelSerial } from './dateParsing';

/**
 * Clean card calculation utility - single source of truth for all card values
 * This ensures 100% consistency across all analytics functions
 */

export interface CardCalculationResult {
  // Card 1: Total Indents (including cancelled)
  totalIndents: number;
  
  // Card 2: Total Trip (excluding cancelled)
  totalTrips: number;
  
  // Card 3: Total Load (from ALL indents, including duplicates and cancelled)
  totalLoad: number; // in kg
  
  // Card 4: Bucket & Barrel Count (from valid indents only)
  totalBuckets: number;
  totalBarrels: number;
  
  // Card 5: Avg Buckets/Trip (calculated from Card 4 and Card 2)
  avgBucketsPerTrip: number;
  
  // Additional metrics
  totalCost: number;
  totalProfitLoss: number;
  
  // Debug info
  allIndentsCount: number; // All indents after date filter (including cancelled)
  validIndentsCount: number; // Valid indents after date filter (excluding cancelled)
}

/**
 * Calculate all card values from scratch
 * 
 * @param allIndents - All indents from database
 * @param fromDate - Start date (optional)
 * @param toDate - End date (optional)
 * @returns Card calculation results
 */
export function calculateCardValues(
  allIndents: any[],
  fromDate: Date | null | undefined,
  toDate: Date | null | undefined
): CardCalculationResult {
  console.log(`[DEBUG calculateCardValues] Input: ${allIndents.length} trips, fromDate=${fromDate?.toISOString().split('T')[0] || 'null'}, toDate=${toDate?.toISOString().split('T')[0] || 'null'}`);

  // DIAGNOSTIC: Check for duplicate rows in database (same indent + indentDate combination)
  const indentDateMap = new Map<string, number>();
  allIndents.forEach((indent: any) => {
    const key = `${indent.indent || 'NO_INDENT'}_${indent.indentDate ? (indent.indentDate instanceof Date ? indent.indentDate.toISOString().split('T')[0] : String(indent.indentDate)) : 'NO_DATE'}`;
    indentDateMap.set(key, (indentDateMap.get(key) || 0) + 1);
  });
  const duplicateRows = Array.from(indentDateMap.entries()).filter(([_, count]) => count > 1);
  if (duplicateRows.length > 0) {
    console.log(`[calculateCardValues] ⚠️ WARNING: Found ${duplicateRows.length} duplicate indent+date combinations in database:`);
    duplicateRows.slice(0, 10).forEach(([key, count]) => {
      console.log(`[calculateCardValues]   - "${key}" appears ${count} times`);
    });
    if (duplicateRows.length > 10) {
      console.log(`[calculateCardValues]   ... and ${duplicateRows.length - 10} more duplicates`);
    }
  } else {
    console.log(`[calculateCardValues] ✓ No duplicate indent+date combinations found`);
  }

  // Step 1: Apply date filtering (same as all other functions)
  const dateFilterResult = filterIndentsByDate(allIndents, fromDate, toDate);
  const { allIndentsFiltered, validIndents } = dateFilterResult;
  
  console.log(`[calculateCardValues] After date filter: allIndentsFiltered=${allIndentsFiltered.length}, validIndents=${validIndents.length}`);
  
  // DIAGNOSTIC: Verify date filtering - check if any filtered indents are outside the date range
  if (fromDate && toDate) {
    const fromSerial = toExcelSerial(fromDate);
    const toSerial = toExcelSerial(toDate);
    
    let outOfRangeCount = 0;
    allIndentsFiltered.forEach((indent: any) => {
      const indentSerial = toExcelSerial(indent.indentDate);
      if (indentSerial !== null && (indentSerial < fromSerial! || indentSerial > toSerial!)) {
        outOfRangeCount++;
        if (outOfRangeCount <= 5) {
          console.log(`[calculateCardValues] ⚠️ WARNING: Indent "${indent.indent}" has date serial ${indentSerial} which is OUTSIDE range [${fromSerial}, ${toSerial}]`);
        }
      }
    });
    if (outOfRangeCount > 0) {
      console.log(`[calculateCardValues] ⚠️ WARNING: Found ${outOfRangeCount} indents OUTSIDE the date filter range!`);
    } else {
      console.log(`[calculateCardValues] ✓ All filtered indents are within the date range`);
    }
  }

  // Step 2: Calculate Card 1 - Total Indents (unique indent values from ALL indents, including cancelled)
  const uniqueIndentsAll = new Set(
    allIndentsFiltered
      .filter((indent: any) => indent.indent && indent.indent.trim() !== '')
      .map((indent: any) => indent.indent)
  );
  const totalIndents = uniqueIndentsAll.size;
  console.log(`[calculateCardValues] Card 1 (Total Indents): ${totalIndents} unique indents from ${allIndentsFiltered.length} total indents (including cancelled)`);

  // Step 3: Calculate Card 2 - Total Trip (unique indent values from valid indents only, excluding cancelled)
  const uniqueIndentsValid = new Set(
    validIndents
      .filter((indent: any) => indent.indent && indent.indent.trim() !== '')
      .map((indent: any) => indent.indent)
  );
  const totalTrips = uniqueIndentsValid.size;
  console.log(`[calculateCardValues] Card 2 (Total Trip): ${totalTrips} unique indents from ${validIndents.length} valid indents (excluding cancelled)`);

  // Step 4: Calculate Card 3 - Total Load (sum from ALL indents in date range, including duplicates and cancelled)
  const totalLoad = allIndentsFiltered.reduce((sum: number, indent: any) => {
    return sum + (indent.totalLoad || 0);
  }, 0);
  console.log(`[calculateCardValues] Card 3 (Total Load): ${totalLoad} kg (${(totalLoad / 1000).toFixed(2)} tons) from ${allIndentsFiltered.length} indents (including duplicates and cancelled)`);

  // Step 5: Calculate Card 4 - Bucket & Barrel Count (from valid indents only, excluding "Other" and "Duplicate Indents")
  // IMPORTANT: Exclude indents that would be categorized as "Other" or "Duplicate Indents" in range-wise summary
  // Standard ranges: '0-100Km', '101-250Km', '251-400Km', '401-600Km'
  const standardRanges = new Set(['0-100Km', '101-250Km', '251-400Km', '401-600Km']);
  
  // Find duplicate indents (indents appearing in multiple standard ranges)
  const indentRangeMap = new Map<string, Set<string>>();
  validIndents.forEach((indent: any) => {
    if (indent.indent && indent.range && standardRanges.has(indent.range)) {
      if (!indentRangeMap.has(indent.indent)) {
        indentRangeMap.set(indent.indent, new Set());
      }
      indentRangeMap.get(indent.indent)!.add(indent.range);
    }
  });
  
  const duplicateIndents = new Set<string>();
  indentRangeMap.forEach((ranges, indent) => {
    if (ranges.size > 1) {
      duplicateIndents.add(indent);
    }
  });
  
  // Filter to only include standard ranges and exclude duplicate indents
  const standardValidIndents = validIndents.filter((indent: any) => {
    // Must have a standard range
    if (!indent.range || !standardRanges.has(indent.range)) {
      return false;
    }
    // Must not be a duplicate indent (appearing in multiple ranges)
    if (indent.indent && duplicateIndents.has(indent.indent)) {
      return false;
    }
    return true;
  });
  
  let totalBuckets = 0;
  let totalBarrels = 0;
  
  standardValidIndents.forEach((indent: any) => {
    const count = indent.noOfBuckets || 0;
    const material = (indent.material || '').trim();
    
    if (material === '20L Buckets') {
      totalBuckets += count;
    } else if (material === '210L Barrels') {
      totalBarrels += count;
    }
  });
  
  // Step 6: Calculate Card 5 - Avg Buckets/Trip
  // Formula: (totalBuckets + totalBarrels * 10.5) / totalTrips
  const totalBucketsIncludingBarrels = totalBuckets + (totalBarrels * 10.5);
  const avgBucketsPerTrip = totalTrips > 0 ? totalBucketsIncludingBarrels / totalTrips : 0;
  const avgBucketsPerTripRounded = Math.round(avgBucketsPerTrip);

  // Step 7: Calculate additional metrics (Total Cost from Column AE and Total Profit/Loss from ALL indents)
  const totalCost = allIndentsFiltered.reduce((sum: number, indent: any) => {
    return sum + (Number(indent.totalCostAE) || 0); // Use Column AE (31st column) only
  }, 0);
  const totalProfitLoss = allIndentsFiltered.reduce((sum: number, indent: any) => {
    return sum + (indent.profitLoss || 0);
  }, 0);
  
  // Log all unique indents used for Card 1 (removed verbose logging)
  Array.from(uniqueIndentsAll).forEach((indentValue, index) => {
    const indentRows = allIndentsFiltered.filter((indent: any) => indent.indent === indentValue);
    console.log(`[calculateCardValues] Card 1 - Unique Indent ${index + 1}: "${indentValue}" (appears in ${indentRows.length} rows)`);
  });
  console.log(`[calculateCardValues] ===== END CARD 1 INDENTS =====`);
  
  // Log all unique indents used for Card 2
  console.log(`[calculateCardValues] ===== CARD 2 - VALID UNIQUE INDENTS (${totalTrips} total) =====`);
  Array.from(uniqueIndentsValid).forEach((indentValue, index) => {
    const indentRows = validIndents.filter((indent: any) => indent.indent === indentValue);
    console.log(`[calculateCardValues] Card 2 - Unique Indent ${index + 1}: "${indentValue}" (appears in ${indentRows.length} rows)`);
  });
  console.log(`[calculateCardValues] ===== END CARD 2 INDENTS =====`);
  
  // Log all indents contributing to Card 3 (Total Load)
  console.log(`[calculateCardValues] ===== CARD 3 - ALL INDENTS CONTRIBUTING TO TOTAL LOAD =====`);
  allIndentsFiltered.forEach((indent: any, index: number) => {
    if (indent.totalLoad && indent.totalLoad > 0) {
      console.log(`[calculateCardValues] Card 3 - Load ${index + 1}:`, {
        indent: indent.indent || 'NO_INDENT',
        indentDate: indent.indentDate ? (indent.indentDate instanceof Date ? indent.indentDate.toISOString().split('T')[0] : String(indent.indentDate)) : 'NO_DATE',
        totalLoad: indent.totalLoad,
        range: indent.range || 'CANCELLED'
      });
    }
  });
  console.log(`[calculateCardValues] ===== END CARD 3 LOAD =====`);
  
  // Log all indents contributing to Card 4 (Buckets/Barrels)
  console.log(`[calculateCardValues] ===== CARD 4 - STANDARD VALID INDENTS CONTRIBUTING TO BUCKETS/BARRELS =====`);
  standardValidIndents.forEach((indent: any, index: number) => {
    const count = indent.noOfBuckets || 0;
    const material = (indent.material || '').trim();
    if (count > 0) {
      console.log(`[calculateCardValues] Card 4 - ${material} ${index + 1}:`, {
        indent: indent.indent || 'NO_INDENT',
        indentDate: indent.indentDate ? (indent.indentDate instanceof Date ? indent.indentDate.toISOString().split('T')[0] : String(indent.indentDate)) : 'NO_DATE',
        range: indent.range || 'NO_RANGE',
        material: material,
        count: count,
        contributesTo: material === '20L Buckets' ? 'Buckets' : material === '210L Barrels' ? 'Barrels' : 'None'
      });
    }
  });
  console.log(`[calculateCardValues] ===== END CARD 4 BUCKETS/BARRELS =====`);
  
  console.log(`[calculateCardValues] ===== END =====`);

  return {
    totalIndents,
    totalTrips,
    totalLoad,
    totalBuckets,
    totalBarrels,
    avgBucketsPerTrip: avgBucketsPerTripRounded,
    totalCost,
    totalProfitLoss,
    allIndentsCount: allIndentsFiltered.length,
    validIndentsCount: validIndents.length
  };
}

