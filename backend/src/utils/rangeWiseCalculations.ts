import Trip from '../models/Trip';
import { format } from 'date-fns';
import { filterIndentsByDate } from './dateFiltering';
import { calculateCardValues } from './cardCalculations';

interface RangeWiseData {
  range: string;
  indentCount: number;
  uniqueIndentCount: number;
  totalLoad: number;
  percentage: number;
  bucketCount: number;
  barrelCount: number;
  totalCostAE: number; // From Column AE - main total cost
  profitLoss: number;
  totalKm: number; // From Column U (21st column, index 20) - Total Km
}

interface RangeWiseCalculationResult {
  rangeData: RangeWiseData[];
  totalUniqueIndents: number;
  totalLoad: number;
  totalRows: number;
  totalBuckets: number;
  totalBarrels: number;
  totalCost: number;
  totalProfitLoss: number;
}

export async function calculateRangeWiseSummary(
  fromDate: Date | null | undefined,
  toDate: Date | null | undefined
): Promise<RangeWiseCalculationResult> {
  console.log(`[calculateRangeWiseSummary] Date range: ${fromDate?.toISOString().split('T')[0] || 'null'} to ${toDate?.toISOString().split('T')[0] || 'null'}`);

  // Step 1: Get all indents from database
  const allIndents = await Trip.find({}).lean();
  console.log(`[calculateRangeWiseSummary] Total indents in DB: ${allIndents.length}`);
  
  // Step 2: Filter by date
  const dateFilterResult = filterIndentsByDate(allIndents, fromDate, toDate);
  const validIndents = dateFilterResult.allIndentsFiltered.filter((indent: any) => {
    const remarks = (indent.remarks || '').toLowerCase().trim();
    return !remarks.includes('cancelled') && !remarks.includes('cancel');
  });
  
  console.log(`[calculateRangeWiseSummary] Valid indents after date filter: ${validIndents.length}`);
  
  // Step 3: Calculate totals - includes ALL rows including duplicates
  const totalRows = validIndents.length; // Total row count including all duplicates
  const uniqueIndents = new Set(validIndents.map((indent: any) => indent.indent).filter(Boolean));
  const totalUniqueIndents = uniqueIndents.size;
  
  // Sum ALL rows including duplicates - no filtering
  const totalLoad = validIndents.reduce((sum: number, indent: any) => sum + (Number(indent.totalLoad) || 0), 0);
  const totalCost = validIndents.reduce((sum: number, indent: any) => sum + (Number(indent.totalCostAE) || 0), 0); // From Column AE - includes all rows
  const totalProfitLoss = validIndents.reduce((sum: number, indent: any) => sum + (Number(indent.profitLoss) || 0), 0);
  
  let totalBuckets = 0;
  let totalBarrels = 0;
  
  // Count buckets and barrels from ALL rows including duplicates
  validIndents.forEach((indent: any) => {
    const count = indent.noOfBuckets || 0;
    const material = (indent.material || '').trim();
    if (material === '20L Buckets') totalBuckets += count;
    else if (material === '210L Barrels') totalBarrels += count;
  });
  
  // Step 4: Calculate range-wise data
  const rangeMappings = [
    { label: '0-100Km' },
    { label: '101-250Km' },
    { label: '251-400Km' },
    { label: '401-600Km' }
  ];
  
  const rangeData: RangeWiseData[] = rangeMappings.map(({ label }) => {
    // Include ALL rows for this range, including duplicates
    const rangeIndents = validIndents.filter((indent: any) => indent.range === label);
    const indentCount = rangeIndents.length; // Total row count including duplicates
    const uniqueIndentsInRange = new Set(rangeIndents.filter((t: any) => t.indent).map((t: any) => t.indent));
    const uniqueIndentCount = uniqueIndentsInRange.size;
    
    // Sum ALL rows including duplicates - no filtering
    const totalLoadInRange = rangeIndents.reduce((sum: number, indent: any) => sum + (Number(indent.totalLoad) || 0), 0);
    const totalCostAEInRange = rangeIndents.reduce((sum: number, indent: any) => sum + (Number(indent.totalCostAE) || 0), 0); // From Column AE - includes all rows
    const profitLossInRange = rangeIndents.reduce((sum: number, indent: any) => sum + (Number(indent.profitLoss) || 0), 0);
    const totalKmInRange = rangeIndents.reduce((sum: number, indent: any) => sum + (Number(indent.totalKm) || 0), 0); // From Column U (21st column, index 20) - includes ALL rows including duplicates
    
    const percentage = totalRows > 0 ? (indentCount / totalRows) * 100 : 0;
    
    let bucketCount = 0;
    let barrelCount = 0;
    
    rangeIndents.forEach((indent: any) => {
      const count = indent.noOfBuckets || 0;
      const material = (indent.material || '').trim();
      if (material === '20L Buckets') bucketCount += count;
      else if (material === '210L Barrels') barrelCount += count;
    });
    
    return {
      range: label,
      indentCount,
      uniqueIndentCount,
      totalLoad: totalLoadInRange,
      percentage: parseFloat(percentage.toFixed(2)),
      bucketCount,
      barrelCount,
      totalCostAE: totalCostAEInRange, // From Column AE
      profitLoss: profitLossInRange,
      totalKm: totalKmInRange // From Column U (21st column, index 20)
    };
  });
  
  // Step 5: Add "Other" range
  const otherIndents = validIndents.filter((indent: any) => {
    const range = (indent.range || '').trim();
    return range && !rangeMappings.some(m => m.label === range);
  });
  
  if (otherIndents.length > 0) {
    const uniqueOtherIndents = new Set(otherIndents.filter((t: any) => t.indent).map((t: any) => t.indent));
    const otherIndentCount = otherIndents.length;
    const uniqueIndentCount = uniqueOtherIndents.size;
    
    // Sum ALL rows including duplicates for "Other" range
    const otherTotalLoad = otherIndents.reduce((sum: number, indent: any) => sum + (Number(indent.totalLoad) || 0), 0);
    const otherTotalCostAE = otherIndents.reduce((sum: number, indent: any) => sum + (Number(indent.totalCostAE) || 0), 0); // From Column AE - includes all rows
    const otherProfitLoss = otherIndents.reduce((sum: number, indent: any) => sum + (Number(indent.profitLoss) || 0), 0);
    const otherTotalKm = otherIndents.reduce((sum: number, indent: any) => sum + (Number(indent.totalKm) || 0), 0); // From Column U (21st column, index 20) - includes ALL rows including duplicates
    const otherPercentage = totalRows > 0 ? (otherIndentCount / totalRows) * 100 : 0;
    
    let otherBucketCount = 0;
    let otherBarrelCount = 0;
    
    otherIndents.forEach((indent: any) => {
      const count = indent.noOfBuckets || 0;
      const material = (indent.material || '').trim();
      if (material === '20L Buckets') otherBucketCount += count;
      else if (material === '210L Barrels') otherBarrelCount += count;
    });
    
    rangeData.push({
      range: 'Other',
      indentCount: otherIndentCount,
      uniqueIndentCount,
      totalLoad: otherTotalLoad,
      percentage: parseFloat(otherPercentage.toFixed(2)),
      bucketCount: otherBucketCount,
      barrelCount: otherBarrelCount,
      totalCostAE: otherTotalCostAE, // From Column AE
      profitLoss: otherProfitLoss,
      totalKm: otherTotalKm // From Column U (21st column, index 20)
    });
  }
  
  console.log(`[calculateRangeWiseSummary] Range data created: ${rangeData.length} ranges`);
  
  return {
    rangeData,
    totalUniqueIndents,
    totalLoad,
    totalRows,
    totalBuckets,
    totalBarrels,
    totalCost,
    totalProfitLoss
  };
}
