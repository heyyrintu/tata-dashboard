import Trip from '../models/Trip';
import { format } from 'date-fns';
import { normalizeFreightTigerMonth } from './freightTigerMonth';
import { filterIndentsByDate } from './dateFiltering';
import { calculateCardValues } from './cardCalculations';

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
 * LOGIC: Filter by indentDate FIRST, then calculate range-wise data from filtered indents
 * This matches Card 2 (Total Trip) logic - uses validIndents (excludes cancelled)
 */
export async function calculateRangeWiseSummary(
  fromDate: Date | null | undefined,
  toDate: Date | null | undefined
): Promise<RangeWiseCalculationResult> {
  console.log(`[calculateRangeWiseSummary] ===== START =====`);
  console.log(`[calculateRangeWiseSummary] Date params: fromDate=${fromDate?.toISOString().split('T')[0] || 'null'}, toDate=${toDate?.toISOString().split('T')[0] || 'null'}`);

  // Step 1: Query ALL trips from database
  const allIndents = await Trip.find({}).lean();
  console.log(`[calculateRangeWiseSummary] Step 1: Total indents from DB: ${allIndents.length}`);

  // Step 2: Apply date filtering FIRST (using indentDate only, Excel serial numbers)
  console.log(`[calculateRangeWiseSummary] Step 2: Applying date filter using indentDate only...`);
  const dateFilterResult = filterIndentsByDate(allIndents, fromDate, toDate);
  const { allIndentsFiltered, validIndents } = dateFilterResult;
  
  console.log(`[calculateRangeWiseSummary] Step 2: After date filter - allIndentsFiltered=${allIndentsFiltered.length}, validIndents=${validIndents.length}`);
  
  if (dateFilterResult.targetMonthKey) {
    console.log(`[calculateRangeWiseSummary] Single month filter: ${dateFilterResult.targetMonthKey}`);
    console.log(`[calculateRangeWiseSummary] Month boundaries: ${dateFilterResult.monthStart?.toISOString()} to ${dateFilterResult.monthEnd?.toISOString()}`);
  }

  // Step 3: Calculate card values (for totals) - this will filter internally
  console.log(`[calculateRangeWiseSummary] Step 3: Calculating card values...`);
  const cardResults = calculateCardValues(allIndents, fromDate, toDate);
  
  // Step 4: Use card calculation results for totals (ensures consistency)
  // IMPORTANT: These values MUST match the card calculations exactly
  const totalUniqueIndents = cardResults.totalTrips; // Card 2 value
  const totalLoad = cardResults.totalLoad; // Card 3 value (in kg) - from ALL indents (including cancelled)
  const totalCost = cardResults.totalCost; // From ALL indents (including cancelled)
  const totalProfitLoss = cardResults.totalProfitLoss; // From ALL indents (including cancelled)
  const totalBuckets = cardResults.totalBuckets; // Card 4 value (from valid indents only, excluding Other/Duplicate)
  const totalBarrels = cardResults.totalBarrels; // Card 4 value (from valid indents only, excluding Other/Duplicate)
  
  console.log(`[calculateRangeWiseSummary] Step 4: Using card calculation values:`);
  console.log(`[calculateRangeWiseSummary] - totalUniqueIndents (Card 2): ${totalUniqueIndents}`);
  console.log(`[calculateRangeWiseSummary] - totalLoad (Card 3): ${totalLoad} kg = ${(totalLoad / 1000).toFixed(2)} tons`);
  console.log(`[calculateRangeWiseSummary] - totalCost: ₹${totalCost.toLocaleString('en-IN')}`);
  console.log(`[calculateRangeWiseSummary] - totalProfitLoss: ₹${totalProfitLoss.toLocaleString('en-IN')}`);
  console.log(`[calculateRangeWiseSummary] - totalBuckets (Card 4): ${totalBuckets}`);
  console.log(`[calculateRangeWiseSummary] - totalBarrels (Card 4): ${totalBarrels}`);
  
  // Step 5: Calculate total rows (all valid indent rows including duplicates)
  // This is used for percentage calculations
  const totalRows = validIndents.length;
  console.log(`[calculateRangeWiseSummary] Step 5: Total rows (valid indents only, excluding cancelled): ${totalRows}`);

  // Step 6: Define range mappings
  const rangeMappings = [
    { label: '0-100Km' },
    { label: '101-250Km' },
    { label: '251-400Km' },
    { label: '401-600Km' },
  ];

  // Step 7: Calculate range-wise data from FILTERED validIndents
  // IMPORTANT: Use only validIndents (already filtered by date) - excludes cancelled
  console.log(`[calculateRangeWiseSummary] Step 7: Calculating range-wise data from ${validIndents.length} valid indents...`);
  
  const rangeData: RangeWiseData[] = rangeMappings.map(({ label }) => {
    // Filter validIndents by range (already date-filtered)
    const rangeIndents = validIndents.filter((indent: any) => {
      return indent.range === label;
    });
    
    console.log(`[calculateRangeWiseSummary] Range "${label}": ${rangeIndents.length} indents`);
    
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
  
  console.log(`[calculateRangeWiseSummary] Range data created: ${rangeData.length} ranges`);
  console.log(`[calculateRangeWiseSummary] Sample range data:`, rangeData.slice(0, 2).map(r => ({
    range: r.range,
    indentCount: r.indentCount,
    uniqueIndentCount: r.uniqueIndentCount,
    totalCost: r.totalCost
  })));
  console.log(`[calculateRangeWiseSummary] Full range data with costs:`, rangeData.map(r => ({
    range: r.range,
    indentCount: r.indentCount,
    totalCost: r.totalCost
  })));

  // Step 8: Calculate "Other" category for non-matching ranges
  // IMPORTANT: Use only validIndents (already date-filtered)
  const matchedRanges = new Set(rangeMappings.map(({ label }) => label));
  const otherIndents = validIndents.filter((indent: any) => {
    return indent.range && indent.range.trim() !== '' && !matchedRanges.has(indent.range);
  });
  
  console.log(`[calculateRangeWiseSummary] Step 8: Other indents found: ${otherIndents.length}`);
  
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
    console.log(`[calculateRangeWiseSummary] Added "Other" row:`, JSON.stringify(otherRow, null, 2));
  }

  // Step 9: Find and calculate duplicate indents (indents appearing in multiple ranges)
  // IMPORTANT: Use only validIndents (already date-filtered)
  console.log(`[calculateRangeWiseSummary] Step 9: Finding duplicate indents (appearing in multiple ranges)...`);
  
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
  
  console.log(`[calculateRangeWiseSummary] Found ${duplicateIndents.size} indents appearing in multiple ranges`);
  
  // Get all rows for these duplicate indents (from date-filtered validIndents)
  const duplicateIndentRows = validIndents.filter((indent: any) => 
    indent.indent && duplicateIndents.has(indent.indent)
  );
  
  if (duplicateIndentRows.length > 0) {
    console.log(`[calculateRangeWiseSummary] Duplicate indent rows: ${duplicateIndentRows.length}`);
    
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
    console.log(`[calculateRangeWiseSummary] Added "Duplicate Indents" row:`, JSON.stringify(duplicateRow, null, 2));
  }

  // Verify that rangeData totals match card calculation totals
  const rangeDataTotalBuckets = rangeData.reduce((sum, item) => sum + item.bucketCount, 0);
  const rangeDataTotalBarrels = rangeData.reduce((sum, item) => sum + item.barrelCount, 0);
  
  console.log(`[calculateRangeWiseSummary] ===== FINAL RESULTS =====`);
  console.log(`[calculateRangeWiseSummary] Total unique indents (Card 2): ${totalUniqueIndents}`);
  console.log(`[calculateRangeWiseSummary] Total rows: ${totalRows}`);
  console.log(`[calculateRangeWiseSummary] Total load (Card 3): ${totalLoad} kg (${(totalLoad / 1000).toFixed(2)} tons)`);
  console.log(`[calculateRangeWiseSummary] Total buckets (Card 4): ${totalBuckets}`);
  console.log(`[calculateRangeWiseSummary] Total barrels (Card 4): ${totalBarrels}`);
  console.log(`[calculateRangeWiseSummary] Range data buckets sum: ${rangeDataTotalBuckets} (should match Card 4: ${totalBuckets})`);
  console.log(`[calculateRangeWiseSummary] Range data barrels sum: ${rangeDataTotalBarrels} (should match Card 4: ${totalBarrels})`);
  console.log(`[calculateRangeWiseSummary] Range data count: ${rangeData.length}`);
  
  if (rangeDataTotalBuckets !== totalBuckets || rangeDataTotalBarrels !== totalBarrels) {
    console.warn(`[calculateRangeWiseSummary] WARNING: Range data totals don't match card calculation!`);
    console.warn(`[calculateRangeWiseSummary] Buckets: rangeData=${rangeDataTotalBuckets}, card=${totalBuckets}`);
    console.warn(`[calculateRangeWiseSummary] Barrels: rangeData=${rangeDataTotalBarrels}, card=${totalBarrels}`);
  }
  
  console.log(`[calculateRangeWiseSummary] =========================`);

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

