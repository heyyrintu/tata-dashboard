import { Request, Response } from 'express';
import Trip from '../models/Trip';
import { parseDateParam } from '../utils/dateFilter';
import { format, startOfWeek, getISOWeek, parse } from 'date-fns';
import { calculateTripsByVehicleDay, type TripDocument } from '../utils/tripCount';
import { normalizeFreightTigerMonth } from '../utils/freightTigerMonth';
import { filterIndentsByDate } from '../utils/dateFiltering';
import { calculateCardValues } from '../utils/cardCalculations';
import * as XLSX from 'xlsx';

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    console.log(`[getAnalytics] ===== START =====`);
    const fromDate = parseDateParam(req.query.fromDate as string);
    const toDate = parseDateParam(req.query.toDate as string);
    console.log(`[getAnalytics] Input params: fromDate=${fromDate?.toISOString().split('T')[0] || 'null'}, toDate=${toDate?.toISOString().split('T')[0] || 'null'}`);
    console.log(`[getAnalytics] Raw query params: fromDate=${req.query.fromDate || 'undefined'}, toDate=${req.query.toDate || 'undefined'}`);

    // Query all trips from database
    const allIndents = await Trip.find({});
    console.log(`[getAnalytics] Total indents from DB: ${allIndents.length}`);
    
    // Debug: Check sample indent dates from DB
    if (allIndents.length > 0) {
      const sampleIndents = allIndents.slice(0, 3).map((indent: any) => ({
        indent: indent.indent,
        indentDate: indent.indentDate,
        indentDateType: typeof indent.indentDate,
        indentDateIsDate: indent.indentDate instanceof Date,
        indentDateISO: indent.indentDate instanceof Date ? indent.indentDate.toISOString() : String(indent.indentDate)
      }));
      console.log(`[getAnalytics] Sample indents from DB (first 3):`, sampleIndents);
    }

    // Use clean card calculation utility (single source of truth)
    const cardResults = calculateCardValues(allIndents, fromDate, toDate);
    
    // COMPARISON: If single month filter, compare with month-on-month logic
    if (fromDate && toDate) {
      const fromMonth = format(fromDate, 'yyyy-MM');
      const toMonth = format(toDate as Date, 'yyyy-MM');
      if (fromMonth === toMonth) {
        console.log(`[getAnalytics] ===== COMPARISON WITH MONTH-ON-MONTH =====`);
        console.log(`[getAnalytics] Month: ${fromMonth}`);
        console.log(`[getAnalytics] Card 1 (Total Indents): ${cardResults.totalIndents}`);
        console.log(`[getAnalytics] Card 2 (Total Trips): ${cardResults.totalTrips}`);
        console.log(`[getAnalytics] NOTE: These should match month-on-month chart for ${fromMonth}`);
        
        // Run debug comparison
        try {
          const { debugCompareCalculations } = await import('../utils/debugComparison');
          await debugCompareCalculations(fromMonth);
        } catch (e) {
          console.log(`[getAnalytics] Debug comparison failed:`, e);
        }
        
        console.log(`[getAnalytics] ===== END COMPARISON =====`);
      }
    }
    
    console.log(`[getAnalytics] ===== END =====`);
    
    res.json({
      success: true,
      totalIndents: cardResults.totalIndents,
      totalIndentsUnique: cardResults.totalTrips,
      totalLoad: cardResults.totalLoad, // Total load in kg (from ALL indents, including cancelled)
      totalBuckets: cardResults.totalBuckets, // From valid indents only, excluding Other/Duplicate
      totalBarrels: cardResults.totalBarrels, // From valid indents only, excluding Other/Duplicate
      avgBucketsPerTrip: cardResults.avgBucketsPerTrip, // Rounded average
      totalCost: cardResults.totalCost, // From ALL indents, including cancelled
      totalProfitLoss: cardResults.totalProfitLoss, // From ALL indents, including cancelled
      dateRange: {
        from: fromDate?.toISOString().split('T')[0] || null,
        to: toDate?.toISOString().split('T')[0] || null
      },
      recordsProcessed: cardResults.validIndentsCount
    });
  } catch (error) {
    console.error(`[getAnalytics] ERROR:`, error);
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

    console.log(`[getRangeWiseAnalytics] ===== START =====`);
    console.log(`[getRangeWiseAnalytics] Date params: fromDate=${fromDate?.toISOString().split('T')[0] || 'null'}, toDate=${toDate?.toISOString().split('T')[0] || 'null'}`);

    // Use the new utility function for all calculations
    const { calculateRangeWiseSummary } = await import('../utils/rangeWiseCalculations');
    let result;
    try {
      result = await calculateRangeWiseSummary(fromDate || undefined, toDate || undefined);
      console.log(`[getRangeWiseAnalytics] Calculation result:`, {
        rangeDataLength: result.rangeData.length,
        totalUniqueIndents: result.totalUniqueIndents,
        totalLoad: result.totalLoad,
        totalCost: result.totalCost,
        totalProfitLoss: result.totalProfitLoss,
        totalRows: result.totalRows
      });
    } catch (calcError) {
      console.error(`[getRangeWiseAnalytics] Error in calculateRangeWiseSummary:`, calcError);
      throw calcError;
    }

    // Calculate location-wise data using clean date filtering utility
    const allIndents = await Trip.find({});
    const dateFilterResult = filterIndentsByDate(allIndents, fromDate, toDate);
    const { allIndentsFiltered, validIndents } = dateFilterResult;

    const locationMap = new Map<string, { indentCount: number; totalLoad: number; range: string }>();
    validIndents.forEach(indent => {
      if (indent.location && indent.range) {
        const existing = locationMap.get(indent.location) || { indentCount: 0, totalLoad: 0, range: indent.range };
        existing.indentCount++;
        existing.totalLoad += indent.totalLoad || 0;
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

    // Get all indents in date range for total load details
    // IMPORTANT: Use ONLY Indent Date column (column 'B') - same as filterIndentsByDate
    // This ensures consistency with all other analytics functions
    const dateFilterResultForLoad = filterIndentsByDate(allIndents, fromDate, toDate);
    const allIndentsInDateRange = dateFilterResultForLoad.allIndentsFiltered;
    
    console.log(`[getRangeWiseAnalytics] Total Load Details: allIndentsInDateRange.length=${allIndentsInDateRange.length} (using same date filtering as calculateRangeWiseSummary)`);

    const indentsWithLoad = allIndentsInDateRange.filter((indent: any) => (indent.totalLoad || 0) > 0).length;
    const indentsWithoutRange = allIndentsInDateRange.filter((indent: any) => !indent.range || indent.range.trim() === '').length;
    const uniqueIndentValues = new Set(allIndentsInDateRange.map((indent: any) => indent.indent).filter(Boolean));

    // Ensure rangeData is always an array (should never be empty due to 4 predefined ranges)
    const finalRangeData = result.rangeData || [];
    
    if (false) {
      console.warn(`[getRangeWiseAnalytics] ⚠️ WARNING: Total Km is 0! Check database and Excel parsing.`);
    }
    console.log(`[getRangeWiseAnalytics] =========================`);
    
    console.log(`[getRangeWiseAnalytics] Final response:`, {
      rangeDataLength: finalRangeData.length,
      totalUniqueIndents: result.totalUniqueIndents,
      totalLoad: result.totalLoad,
      totalCost: result.totalCost,
      totalProfitLoss: result.totalProfitLoss,
      totalRows: result.totalRows
    });

    // Get card values for comparison
    const cardResults = calculateCardValues(allIndents, fromDate, toDate);
    
    console.log(`[getRangeWiseAnalytics] ===== FINAL RESPONSE =====`);
    console.log(`[getRangeWiseAnalytics] IMPORTANT: These values MUST match Card calculations:`);
    console.log(`[getRangeWiseAnalytics] Card 1 (Total Indents): ${cardResults.totalIndents}`);
    console.log(`[getRangeWiseAnalytics] Card 2 (Total Trip): ${cardResults.totalTrips} - should match totalUniqueIndents: ${result.totalUniqueIndents}`);
    console.log(`[getRangeWiseAnalytics] Card 3 (Total Load): ${cardResults.totalLoad} kg = ${(cardResults.totalLoad / 1000).toFixed(2)} tons - should match: ${result.totalLoad} kg`);
    console.log(`[getRangeWiseAnalytics] Card 4 (Buckets): ${cardResults.totalBuckets} - should match: ${result.totalBuckets}`);
    console.log(`[getRangeWiseAnalytics] Card 4 (Barrels): ${cardResults.totalBarrels} - should match: ${result.totalBarrels}`);
    console.log(`[getRangeWiseAnalytics] Card 5 (Avg Buckets/Trip): ${cardResults.avgBucketsPerTrip}`);
    console.log(`[getRangeWiseAnalytics] rangeData.length: ${finalRangeData.length}`);
    console.log(`[getRangeWiseAnalytics] totalRows: ${result.totalRows || 0}`);
    
    // Verify values match
    if (result.totalUniqueIndents !== cardResults.totalTrips) {
      console.warn(`[getRangeWiseAnalytics] WARNING: totalUniqueIndents (${result.totalUniqueIndents}) != Card 2 (${cardResults.totalTrips})`);
    }
    if (result.totalLoad !== cardResults.totalLoad) {
      console.warn(`[getRangeWiseAnalytics] WARNING: totalLoad (${result.totalLoad}) != Card 3 (${cardResults.totalLoad})`);
    }
    if (result.totalBuckets !== cardResults.totalBuckets) {
      console.warn(`[getRangeWiseAnalytics] WARNING: totalBuckets (${result.totalBuckets}) != Card 4 (${cardResults.totalBuckets})`);
    }
    if (result.totalBarrels !== cardResults.totalBarrels) {
      console.warn(`[getRangeWiseAnalytics] WARNING: totalBarrels (${result.totalBarrels}) != Card 4 (${cardResults.totalBarrels})`);
    }
    
    console.log(`[getRangeWiseAnalytics] ===== END =====`);

    res.json({
      success: true,
      rangeData: finalRangeData,
      locations: locations || [],
      totalUniqueIndents: result.totalUniqueIndents || 0,
      totalLoad: result.totalLoad || 0, // Total load in kg
      totalCost: result.totalCost || 0, // Total cost
      totalProfitLoss: result.totalProfitLoss || 0, // Total profit & loss
      totalBuckets: result.totalBuckets || 0,
      totalBarrels: result.totalBarrels || 0,
      totalRows: result.totalRows || 0,
      totalLoadDetails: {
        totalRows: allIndentsInDateRange.length,
        rowsWithLoad: indentsWithLoad,
        rowsWithoutRange: indentsWithoutRange,
        uniqueIndents: uniqueIndentValues.size,
        duplicates: allIndentsInDateRange.length - uniqueIndentValues.size
      },
      dateRange: {
        from: fromDate?.toISOString().split('T')[0] || null,
        to: toDate?.toISOString().split('T')[0] || null
      }
    });
  } catch (error) {
    console.error(`[getRangeWiseAnalytics] ERROR:`, error);
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

    // STEP 1: Fetch all indents from database
    const allIndents = await Trip.find({});
    console.log(`[getFulfillmentAnalytics] Step 1: Total indents from DB: ${allIndents.length}`);

    // STEP 2: Use clean date filtering utility (same as all other analytics functions)
    console.log(`[getFulfillmentAnalytics] Step 2: Applying date filter: fromDate=${fromDate?.toISOString().split('T')[0] || 'null'}, toDate=${toDate?.toISOString().split('T')[0] || 'null'}`);
    const dateFilterResult = filterIndentsByDate(allIndents, fromDate, toDate);
    const filteredIndents = dateFilterResult.allIndentsFiltered;
    
    console.log(`[getFulfillmentAnalytics] Step 2: Filtered indents after date filter: ${filteredIndents.length}`);

    // STEP 3: Filter for non-blank range (exclude cancelled indents - same as trip count logic)
    const indents = dateFilterResult.validIndents;
    console.log(`[getFulfillmentAnalytics] Step 3: Valid indents (with non-blank range, including duplicates): ${indents.length}`);

    // STEP 4: Define bucket ranges
    const bucketRanges = [
      { min: 0, max: 150, label: '0 - 150' },
      { min: 151, max: 200, label: '151 - 200' },
      { min: 201, max: 250, label: '201 - 250' },
      { min: 251, max: 300, label: '251 - 300' }
    ];
    const OTHER_RANGE = { min: 301, max: Infinity, label: '300+' };

    // STEP 5: Group indents by bucket range
    // Structure: Map<rangeKey, { allIndents: TripDocument[], uniqueIndents: Set<string> }>
    const rangeGroups = new Map<string, { 
      allIndents: TripDocument[], 
      uniqueIndents: Set<string>,
      indentValues: string[]  // Track all indent values (including duplicates) for indent count
    }>();
    
    // Initialize all ranges
    bucketRanges.forEach(range => {
      rangeGroups.set(range.label, {
        allIndents: [],
        uniqueIndents: new Set(),
        indentValues: []
      });
    });
    rangeGroups.set('Other', {
      allIndents: [],
      uniqueIndents: new Set(),
      indentValues: []
    });

    // STEP 6: Calculate bucket count for each indent and assign to range
    for (const indent of indents) {
      // Skip if no indent value
      if (!indent.indent) continue;
      
      // Calculate bucket count
      const material = (indent.material || '').trim();
      const noOfBuckets = indent.noOfBuckets || 0;
      let bucketCount = 0;
      
      if (material === '20L Buckets') {
        bucketCount = noOfBuckets;
      } else if (material === '210L Barrels') {
        bucketCount = noOfBuckets * 10.5; // Convert: 1 barrel = 10.5 buckets
      }
      // If material missing/unknown, bucketCount = 0 (falls into 0-150 range)
      
      // Find which range this indent belongs to
      let assigned = false;
      for (const range of bucketRanges) {
        if (bucketCount >= range.min && bucketCount <= range.max) {
          const group = rangeGroups.get(range.label)!;
          group.allIndents.push({
            indentDate: indent.indentDate,
            vehicleNumber: indent.vehicleNumber || '',
            remarks: indent.remarks || ''
          });
          group.uniqueIndents.add(indent.indent);
          group.indentValues.push(indent.indent);
          assigned = true;
          break;
        }
      }
      
      // If not assigned, check if it goes to "Other" (bucketCount > 300)
      if (!assigned) {
        if (bucketCount > 300) {
          const group = rangeGroups.get('Other')!;
          group.allIndents.push({
            indentDate: indent.indentDate,
            vehicleNumber: indent.vehicleNumber || '',
            remarks: indent.remarks || ''
          });
          group.uniqueIndents.add(indent.indent);
          group.indentValues.push(indent.indent);
        } else {
          // Fallback: assign to first range (0-150) if bucketCount is 0 or negative
          const group = rangeGroups.get('0 - 150')!;
          group.allIndents.push({
            indentDate: indent.indentDate,
            vehicleNumber: indent.vehicleNumber || '',
            remarks: indent.remarks || ''
          });
          group.uniqueIndents.add(indent.indent);
          group.indentValues.push(indent.indent);
          console.warn(`[getFulfillmentAnalytics] Step 6: Indent ${indent.indent} with bucketCount ${bucketCount} assigned to 0-150 as fallback`);
        }
      }
    }

    // STEP 7: Calculate metrics for each range
    const rangeCounts = bucketRanges.map(range => {
      const group = rangeGroups.get(range.label)!;
      
      // Calculate indent count (total rows including duplicates)
      const indentCount = group.indentValues.length;
      
      // Calculate unique indent count
      const uniqueIndentCount = group.uniqueIndents.size;
      
      // Calculate trip count using vehicle-day logic
      const { totalTrips } = calculateTripsByVehicleDay(group.allIndents);
      
      console.log(`[getFulfillmentAnalytics] Step 7: Range ${range.label} - Indent Count: ${indentCount}, Unique Indent Count: ${uniqueIndentCount}, Trip Count: ${totalTrips}`);
      
      return {
        range: range.label,
        bucketRange: range.label,
        tripCount: totalTrips,
        indentCount: indentCount,        // For debugging/logging
        uniqueIndentCount: uniqueIndentCount  // For debugging/logging
      };
    });
    
    // Calculate metrics for "Other" range
    const otherGroup = rangeGroups.get('Other')!;
    const otherIndentCount = otherGroup.indentValues.length;
    const otherUniqueIndentCount = otherGroup.uniqueIndents.size;
    const { totalTrips: otherTrips } = calculateTripsByVehicleDay(otherGroup.allIndents);
    
    console.log(`[getFulfillmentAnalytics] Step 7: Range Other (300+) - Indent Count: ${otherIndentCount}, Unique Indent Count: ${otherUniqueIndentCount}, Trip Count: ${otherTrips}`);
    
    // Always include "Other" row (even if 0 trips)
    rangeCounts.push({
      range: 'Other',
      bucketRange: '300+',
      tripCount: otherTrips,
      indentCount: otherIndentCount,
      uniqueIndentCount: otherUniqueIndentCount
    });

    // STEP 8: Calculate total trip count (sum of all ranges)
    const totalTripCount = rangeCounts.reduce((sum, range) => sum + range.tripCount, 0);
    console.log(`[getFulfillmentAnalytics] Step 8: Total trip count (sum of all ranges): ${totalTripCount}`);

    // Return response
    res.json({
      success: true,
      fulfillmentData: rangeCounts,
      totalTrips: totalTripCount,
      dateRange: {
        from: fromDate?.toISOString().split('T')[0] || null,
        to: toDate?.toISOString().split('T')[0] || null
      }
    });
  } catch (error) {
    console.error(`[getFulfillmentAnalytics] Error:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch fulfillment analytics'
    });
  }
};

export const exportMissingIndents = async (req: Request, res: Response) => {
  try {
    // Store original query params for display
    const originalFromDateStr = req.query.fromDate as string | undefined;
    const originalToDateStr = req.query.toDate as string | undefined;
    
    // Parse dates as UTC (no timezone shifts)
    const fromDate = parseDateParam(originalFromDateStr);
    const toDate = parseDateParam(originalToDateStr);

    console.log(`[exportMissingIndents] ===== START =====`);
    console.log(`[exportMissingIndents] Date params: fromDate=${fromDate?.toISOString().split('T')[0] || 'null'}, toDate=${toDate?.toISOString().split('T')[0] || 'null'}`);
    console.log(`[exportMissingIndents] Raw query params: fromDate=${originalFromDateStr || 'undefined'}, toDate=${originalToDateStr || 'undefined'}`);

    // STEP 1: Get all indents that match Card 2 criteria (non-blank range, date filtered)
    const allIndents = await Trip.find({});
    console.log(`[exportMissingIndents] Total indents in database: ${allIndents.length}`);
    
    let filteredIndents = [...allIndents];
    
    // Apply same date filtering as getAnalytics
    if (fromDate && toDate) {
      const fromMonth = format(fromDate, 'yyyy-MM');
      const toMonth = format(toDate, 'yyyy-MM');
      
      if (fromMonth === toMonth) {
        const targetMonthKey = fromMonth;
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        
        filteredIndents = filteredIndents.filter(indent => {
          if (indent.freightTigerMonth && typeof indent.freightTigerMonth === 'string' && indent.freightTigerMonth.trim() !== '') {
            const normalizedMonth = normalizeFreightTigerMonth(indent.freightTigerMonth.trim());
            if (normalizedMonth === targetMonthKey) {
              return true;
            }
          }
          if (indent.indentDate && indent.indentDate instanceof Date && !isNaN(indent.indentDate.getTime())) {
            return indent.indentDate >= fromDate && indent.indentDate <= endDate;
          }
          return false;
        });
        
        if (filteredIndents.length === 0) {
          filteredIndents = allIndents.filter(indent => {
            if (!indent.indentDate || !(indent.indentDate instanceof Date) || isNaN(indent.indentDate.getTime())) return false;
            return indent.indentDate >= fromDate && indent.indentDate <= endDate;
          });
        }
      } else {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        
        filteredIndents = filteredIndents.filter(indent => {
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
    } else if (fromDate) {
      filteredIndents = filteredIndents.filter(indent => {
        if (indent.indentDate && indent.indentDate instanceof Date && !isNaN(indent.indentDate.getTime())) {
          return indent.indentDate >= fromDate;
        }
        return false;
      });
    } else if (toDate) {
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      filteredIndents = filteredIndents.filter(indent => {
        if (indent.indentDate && indent.indentDate instanceof Date && !isNaN(indent.indentDate.getTime())) {
          return indent.indentDate <= endDate;
        }
        return false;
      });
    }

    console.log(`[exportMissingIndents] Filtered indents after date filter: ${filteredIndents.length}`);
    
    // Log sample dates from filtered indents
    if (filteredIndents.length > 0) {
      const sampleDates = filteredIndents.slice(0, 5).map(indent => ({
        indent: indent.indent,
        indentDate: indent.indentDate ? format(indent.indentDate, 'yyyy-MM-dd') : 'N/A',
        freightTigerMonth: indent.freightTigerMonth || 'N/A'
      }));
      console.log(`[exportMissingIndents] Sample dates from filtered indents:`, sampleDates);
    }

    // Filter for non-blank range (Card 2 criteria)
    const card2Indents = filteredIndents.filter(indent => indent.range && indent.range.trim() !== '');
    console.log(`[exportMissingIndents] Card 2 indents (non-blank range, date filtered): ${card2Indents.length}`);

    // STEP 2: Get all unique indents that are assigned to bucket ranges in Fulfillment Trends
    // We need to replicate the exact logic from getFulfillmentAnalytics
    const fulfillmentIndents = new Set<string>();
    
    // Define bucket ranges (same as getFulfillmentAnalytics)
    const bucketRanges = [
      { min: 0, max: 150, label: '0 - 150' },
      { min: 151, max: 200, label: '151 - 200' },
      { min: 201, max: 250, label: '201 - 250' },
      { min: 251, max: 300, label: '251 - 300' }
    ];
    
    // Process each indent and assign to bucket range (same logic as getFulfillmentAnalytics)
    let processedCount = 0;
    let assignedCount = 0;
    
    for (const indent of card2Indents) {
      if (!indent.indent) continue;
      processedCount++;
      
      const material = (indent.material || '').trim();
      const noOfBuckets = indent.noOfBuckets || 0;
      let bucketCount = 0;
      
      if (material === '20L Buckets') {
        bucketCount = noOfBuckets;
      } else if (material === '210L Barrels') {
        bucketCount = noOfBuckets * 10.5;
      }
      // If material missing/unknown, bucketCount = 0 (falls into 0-150 range)
      
      // Check if this indent would be assigned to a bucket range (same logic as getFulfillmentAnalytics)
      let assigned = false;
      for (const range of bucketRanges) {
        if (bucketCount >= range.min && bucketCount <= range.max) {
          assigned = true;
          fulfillmentIndents.add(indent.indent);
          assignedCount++;
          break;
        }
      }
      
      // Check if it goes to "Other" (bucketCount > 300)
      if (!assigned && bucketCount > 300) {
        assigned = true;
        fulfillmentIndents.add(indent.indent);
        assignedCount++;
      }
      
      // If bucketCount is 0 or negative, it still gets assigned to 0-150 as fallback
      if (!assigned && bucketCount <= 0) {
        assigned = true; // Gets assigned to 0-150 as fallback
        fulfillmentIndents.add(indent.indent);
        assignedCount++;
      }
      
      // Log unassigned indents for debugging
      if (!assigned) {
        console.log(`[exportMissingIndents] WARNING: Indent ${indent.indent} not assigned! bucketCount=${bucketCount}, material=${material}, noOfBuckets=${noOfBuckets}`);
      }
    }
    
    console.log(`[exportMissingIndents] Processed indents: ${processedCount}, Assigned to ranges: ${assignedCount}`);
    console.log(`[exportMissingIndents] Unique indents in Fulfillment Trends: ${fulfillmentIndents.size}`);

    // STEP 3: Find missing indents (in Card 2 but not in Fulfillment Trends)
    const card2UniqueIndents = new Set(card2Indents.filter(t => t.indent).map(t => t.indent));
    const missingIndents = card2Indents.filter(indent => {
      if (!indent.indent) return false;
      // Include if it's a unique indent that's not in fulfillment trends
      return !fulfillmentIndents.has(indent.indent);
    });

    // Remove duplicates (keep only unique indent values)
    const uniqueMissingIndents = new Map<string, TripDocument>();
    for (const indent of missingIndents) {
      if (indent.indent && !uniqueMissingIndents.has(indent.indent)) {
        uniqueMissingIndents.set(indent.indent, indent);
      }
    }

    const missingIndentsArray = Array.from(uniqueMissingIndents.values());
    console.log(`[exportMissingIndents] Missing indents (unique): ${missingIndentsArray.length}`);
    console.log(`[exportMissingIndents] Card 2 total: ${card2UniqueIndents.size}, Fulfillment Trends: ${fulfillmentIndents.size}, Missing: ${missingIndentsArray.length}`);
    
    // Log sample missing indents for debugging
    if (missingIndentsArray.length > 0) {
    console.log(`[exportMissingIndents] Sample missing indents (first 3):`, missingIndentsArray.slice(0, 3).map((i: any) => ({
      indent: i.indent,
      material: i.material,
      noOfBuckets: i.noOfBuckets,
      range: i.range
    })));
    } else {
      console.log(`[exportMissingIndents] No missing indents found. All Card 2 indents are in Fulfillment Trends.`);
    }

    // STEP 4: Export to Excel
    // If no missing indents, still create a file with headers and a message
    let excelData: any[];
    
    if (missingIndentsArray.length === 0) {
      // Create a single row with a message
      excelData = [{
        'S.No': 1,
        'Indent Date': '',
        'Indent': 'No missing indents found',
        'Allocation Date': '',
        'Customer Name': 'All indents from Card 2 are included in Fulfillment Trends',
        'Location': '',
        'Vehicle Model': '',
        'Vehicle Number': '',
        'Vehicle Based': '',
        'LR No': '',
        'Material': '',
        'Load Per Bucket': 0,
        'No. of Buckets': 0,
        'Total Load (Kgs)': 0,
        'POD Received': '',
        'Loading Charge': 0,
        'Unloading Charge': 0,
        'Actual Running': 0,
        'Billable Running': 0,
        'Range': '',
        'Remarks': '',
        'Freight Tiger Month': ''
      }];
    } else {
      excelData = missingIndentsArray.map((indent: any, index) => ({
        'S.No': index + 1,
        'Indent Date': indent.indentDate ? format(indent.indentDate, 'yyyy-MM-dd') : '',
        'Indent': indent.indent || '',
        'Allocation Date': indent.allocationDate ? format(indent.allocationDate, 'yyyy-MM-dd') : '',
        'Customer Name': indent.customerName || '',
        'Location': indent.location || '',
        'Vehicle Model': indent.vehicleModel || '',
        'Vehicle Number': indent.vehicleNumber || '',
        'Vehicle Based': indent.vehicleBased || '',
        'LR No': indent.lrNo || '',
        'Material': indent.material || '',
        'Load Per Bucket': indent.loadPerBucket || 0,
        'No. of Buckets': indent.noOfBuckets || 0,
        'Total Load (Kgs)': indent.totalLoad || 0,
        'POD Received': indent.podReceived || '',
        'Loading Charge': indent.loadingCharge || 0,
        'Unloading Charge': indent.unloadingCharge || 0,
        'Actual Running': indent.actualRunning || 0,
        'Billable Running': indent.billableRunning || 0,
        'Range': indent.range || '',
        'Remarks': indent.remarks || '',
        'Freight Tiger Month': indent.freightTigerMonth || ''
      }));
    }

    console.log(`[exportMissingIndents] Excel data rows: ${excelData.length}`);
    console.log(`[exportMissingIndents] Date filter applied: ${fromDate ? format(fromDate, 'yyyy-MM-dd') : 'None'} to ${toDate ? format(toDate, 'yyyy-MM-dd') : 'None'}`);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Create Summary sheet with filter information
    const summaryData = [
      ['Export Information', ''],
      ['Generated Date', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
      ['Date Range Filter', ''],
      ['From Date', originalFromDateStr || 'All Dates'],
      ['To Date', originalToDateStr || 'All Dates'],
      ['', ''],
      ['Calculation Summary', ''],
      ['Total Card 2 Indents (Unique)', card2UniqueIndents.size],
      ['Indents in Fulfillment Trends (Unique)', fulfillmentIndents.size],
      ['Missing Indents (Unique)', missingIndentsArray.length],
      ['Total Rows Processed', processedCount],
      ['Rows Assigned to Ranges', assignedCount],
      ['', ''],
      ['Note', 'Missing indents are those counted in Card 2 (Total Trip) but not included in Fulfillment Trends bucket ranges.']
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Create Missing Indents sheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths for better readability
    const colWidths = [
      { wch: 8 },   // S.No
      { wch: 12 },  // Indent Date
      { wch: 15 },  // Indent
      { wch: 12 },  // Allocation Date
      { wch: 20 },  // Customer Name
      { wch: 20 },  // Location
      { wch: 15 },  // Vehicle Model
      { wch: 15 },  // Vehicle Number
      { wch: 15 },  // Vehicle Based
      { wch: 12 },  // LR No
      { wch: 15 },  // Material
      { wch: 15 },  // Load Per Bucket
      { wch: 15 },  // No. of Buckets
      { wch: 15 },  // Total Load (Kgs)
      { wch: 12 },  // POD Received
      { wch: 15 },  // Loading Charge
      { wch: 15 },  // Unloading Charge
      { wch: 15 },  // Actual Running
      { wch: 15 },  // Billable Running
      { wch: 15 },  // Range
      { wch: 20 },  // Remarks
      { wch: 18 }   // Freight Tiger Month
    ];
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Missing Indents');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    console.log(`[exportMissingIndents] Excel buffer size: ${excelBuffer.length} bytes`);

    // Set response headers
    const dateRangeStr = fromDate && toDate 
      ? `${format(fromDate, 'yyyy-MM-dd')}_to_${format(toDate, 'yyyy-MM-dd')}`
      : 'all_dates';
    const filename = `Missing_Indents_${dateRangeStr}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length.toString());

    // Send Excel file
    res.send(excelBuffer);

    console.log(`[exportMissingIndents] ===== END =====`);
  } catch (error) {
    console.error(`[exportMissingIndents] Error:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export missing indents'
    });
  }
};

/**
 * Export all indents filtered by date range to Excel
 * Includes ALL columns from the database, sorted by indentDate
 */
export const exportAllIndents = async (req: Request, res: Response) => {
  try {
    console.log(`[exportAllIndents] ===== START =====`);
    const fromDate = parseDateParam(req.query.fromDate as string);
    const toDate = parseDateParam(req.query.toDate as string);
    console.log(`[exportAllIndents] Date filter: fromDate=${fromDate?.toISOString().split('T')[0] || 'null'}, toDate=${toDate?.toISOString().split('T')[0] || 'null'}`);

    // Get all indents from database
    const allIndents = await Trip.find({}).lean();
    console.log(`[exportAllIndents] Total indents from DB: ${allIndents.length}`);

    // Filter by date using the same logic as other analytics
    const dateFilterResult = filterIndentsByDate(allIndents, fromDate, toDate);
    const filteredIndents = dateFilterResult.allIndentsFiltered;
    
    console.log(`[exportAllIndents] Filtered indents: ${filteredIndents.length}`);

    // Sort by indentDate (ascending)
    filteredIndents.sort((a: any, b: any) => {
      const dateA = a.indentDate instanceof Date ? a.indentDate : new Date(a.indentDate);
      const dateB = b.indentDate instanceof Date ? b.indentDate : new Date(b.indentDate);
      return dateA.getTime() - dateB.getTime();
    });

    // Prepare Excel data with ALL columns from Trip model
    const excelData = filteredIndents.map((indent: any, index: number) => {
      return {
        'S.No': index + 1,
        'Indent Date': indent.indentDate 
          ? (indent.indentDate instanceof Date 
              ? format(indent.indentDate, 'dd-MM-yyyy') 
              : format(new Date(indent.indentDate), 'dd-MM-yyyy'))
          : '',
        'Indent': indent.indent || '',
        'Allocation Date': indent.allocationDate
          ? (indent.allocationDate instanceof Date
              ? format(indent.allocationDate, 'dd-MM-yyyy')
              : format(new Date(indent.allocationDate), 'dd-MM-yyyy'))
          : '',
        'Customer Name': indent.customerName || '',
        'Location': indent.location || '',
        'Vehicle Model': indent.vehicleModel || '',
        'Vehicle Number': indent.vehicleNumber || '',
        'Vehicle Based': indent.vehicleBased || '',
        'LR No': indent.lrNo || '',
        'Material': indent.material || '',
        'Load Per Bucket': indent.loadPerBucket || 0,
        'No. of Buckets': indent.noOfBuckets || 0,
        'Total Load (Kgs)': indent.totalLoad || 0,
        'POD Received': indent.podReceived || '',
        'Loading Charge': indent.loadingCharge || 0,
        'Unloading Charge': indent.unloadingCharge || 0,
        'Actual Running': indent.actualRunning || 0,
        'Billable Running': indent.billableRunning || 0,
        'Range': indent.range || '',
        'Remarks': indent.remarks || '',
        'Freight Tiger Month': indent.freightTigerMonth || '',
        'Total Cost': indent.totalCostAE || 0,
        'Profit/Loss': indent.profitLoss || 0,
        'Created At': indent.createdAt
          ? (indent.createdAt instanceof Date
              ? format(indent.createdAt, 'dd-MM-yyyy HH:mm:ss')
              : format(new Date(indent.createdAt), 'dd-MM-yyyy HH:mm:ss'))
          : '',
        'Updated At': indent.updatedAt
          ? (indent.updatedAt instanceof Date
              ? format(indent.updatedAt, 'dd-MM-yyyy HH:mm:ss')
              : format(new Date(indent.updatedAt), 'dd-MM-yyyy HH:mm:ss'))
          : ''
      };
    });

    console.log(`[exportAllIndents] Prepared ${excelData.length} rows for export`);

    // Create Excel workbook
    const workbook = XLSX.utils.book_new();
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths for better readability
    const colWidths = [
      { wch: 8 },   // S.No
      { wch: 12 },  // Indent Date
      { wch: 15 },  // Indent
      { wch: 12 },  // Allocation Date
      { wch: 20 },  // Customer Name
      { wch: 20 },  // Location
      { wch: 15 },  // Vehicle Model
      { wch: 15 },  // Vehicle Number
      { wch: 15 },  // Vehicle Based
      { wch: 12 },  // LR No
      { wch: 15 },  // Material
      { wch: 15 },  // Load Per Bucket
      { wch: 15 },  // No. of Buckets
      { wch: 15 },  // Total Load (Kgs)
      { wch: 12 },  // POD Received
      { wch: 15 },  // Loading Charge
      { wch: 15 },  // Unloading Charge
      { wch: 15 },  // Actual Running
      { wch: 15 },  // Billable Running
      { wch: 15 },  // Range
      { wch: 20 },  // Remarks
      { wch: 18 },  // Freight Tiger Month
      { wch: 15 },  // Total Cost
      { wch: 15 },  // Profit/Loss
      { wch: 20 },  // Created At
      { wch: 20 }   // Updated At
    ];
    worksheet['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'All Indents');
    
    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    console.log(`[exportAllIndents] Excel buffer size: ${excelBuffer.length} bytes`);

    // Set response headers
    const dateRangeStr = fromDate && toDate 
      ? `${format(fromDate, 'yyyy-MM-dd')}_to_${format(toDate, 'yyyy-MM-dd')}`
      : fromDate
      ? `${format(fromDate, 'yyyy-MM-dd')}_onwards`
      : toDate
      ? `up_to_${format(toDate, 'yyyy-MM-dd')}`
      : 'all_dates';
    const filename = `All_Indents_${dateRangeStr}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length.toString());

    // Send Excel file
    res.send(excelBuffer);

    console.log(`[exportAllIndents] ===== END =====`);
  } catch (error) {
    console.error(`[exportAllIndents] Error:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export indents'
    });
  }
};

export const getLoadOverTime = async (req: Request, res: Response) => {
  try {
    const fromDate = parseDateParam(req.query.fromDate as string);
    const toDate = parseDateParam(req.query.toDate as string);
    const granularity = req.query.granularity as string || 'daily';

    // Query all indents first (we'll filter in memory to match 4th card logic)
    // This matches the same date filtering logic as calculateRangeWiseSummary
    let allIndents = await Trip.find({});
    
    console.log(`[getLoadOverTime] Total indents fetched: ${allIndents.length}`);
    console.log(`[getLoadOverTime] Granularity: ${granularity}`);
    
    // For monthly granularity, show all available months (like month-on-month graphs)
    // For daily/weekly, apply date filtering
    let filteredIndents = [...allIndents];
    
    if (granularity === 'monthly') {
      // For monthly granularity, ignore date filters and show all available months
      console.log(`[getLoadOverTime] Monthly granularity detected - showing all available months (ignoring date filter)`);
      // Don't filter by date - use all indents
      filteredIndents = allIndents;
    } else {
      // For daily/weekly, apply date filtering
      if (fromDate && toDate) {
      // Check if the date range represents a single month
      const fromMonth = format(fromDate, 'yyyy-MM');
      const toMonth = format(toDate, 'yyyy-MM');
      
      console.log(`[getLoadOverTime] Date filter: ${fromDate?.toISOString().split('T')[0]} to ${toDate?.toISOString().split('T')[0]}`);
      console.log(`[getLoadOverTime] Month keys: ${fromMonth} to ${toMonth}`);
      
      if (fromMonth === toMonth) {
        // Single month filter - use Freight Tiger Month to match 4th card logic
        console.log(`[getLoadOverTime] Single month filter detected: ${fromMonth}, using Freight Tiger Month`);
        const targetMonthKey = fromMonth;
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        
        filteredIndents = filteredIndents.filter(indent => {
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
        if (filteredIndents.length === 0) {
          console.log(`[getLoadOverTime] No matches found with Freight Tiger Month, falling back to indentDate only`);
          filteredIndents = allIndents.filter(indent => {
            if (!indent.indentDate || !(indent.indentDate instanceof Date) || isNaN(indent.indentDate.getTime())) return false;
            return indent.indentDate >= fromDate && indent.indentDate <= endDate;
          });
        }
      } else {
        // Multiple months or date range - filter by indentDate (primary) and also check Freight Tiger Month
        console.log(`[getLoadOverTime] Date range filter: ${fromMonth} to ${toMonth}, using indentDate with Freight Tiger Month fallback`);
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        
        filteredIndents = filteredIndents.filter(indent => {
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
    } else if (fromDate) {
      // Only fromDate - filter by indentDate
      console.log(`[getLoadOverTime] From date filter only: ${fromDate?.toISOString().split('T')[0]}`);
      filteredIndents = filteredIndents.filter(indent => {
        if (!indent.indentDate || !(indent.indentDate instanceof Date) || isNaN(indent.indentDate.getTime())) {
          return false;
        }
        return indent.indentDate >= fromDate;
      });
    } else if (toDate) {
      // Only toDate - filter by indentDate
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      console.log(`[getLoadOverTime] To date filter only: ${toDate?.toISOString().split('T')[0]}`);
      filteredIndents = filteredIndents.filter(indent => {
        if (!indent.indentDate || !(indent.indentDate instanceof Date) || isNaN(indent.indentDate.getTime())) {
          return false;
        }
        return indent.indentDate <= endDate;
      });
      }
      // else: No date filter - use all indents (already set above)
    }
    
    console.log(`[getLoadOverTime] Filtered indents after date filter: ${filteredIndents.length}`);
    
    const indents = filteredIndents;

    // Truck capacity varies by material type:
    // - 20L Buckets: 6000 kg capacity
    // - 210L Barrels: 6300 kg capacity
    const BUCKET_CAPACITY = 6000;
    const BARREL_CAPACITY = 6300;
    
    const groupedData: Record<string, { totalLoad: number; indentCount: number; totalFulfillment: number; bucketCount: number; barrelCount: number }> = {};

    // Debug: Log total indents fetched
    console.log(`[getLoadOverTime] Total indents fetched: ${indents.length}`);

    indents.forEach(indent => {
      let key: string;

      // Group by time period based on granularity
      // For monthly, use Freight Tiger Month if available (like month-on-month graphs)
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
          // For monthly, prioritize Freight Tiger Month (like month-on-month graphs)
          if (indent.freightTigerMonth && typeof indent.freightTigerMonth === 'string' && indent.freightTigerMonth.trim() !== '') {
            const normalizedMonth = normalizeFreightTigerMonth(indent.freightTigerMonth.trim());
            if (normalizedMonth) {
              key = normalizedMonth;
            } else {
              // Fallback to indentDate if normalization fails
              key = format(indent.indentDate, 'yyyy-MM');
            }
          } else {
            // Fallback to indentDate if Freight Tiger Month is not available
            key = format(indent.indentDate, 'yyyy-MM');
          }
          break;
        default:
          key = format(indent.indentDate, 'yyyy-MM-dd');
      }

      if (!groupedData[key]) {
        groupedData[key] = { totalLoad: 0, indentCount: 0, totalFulfillment: 0, bucketCount: 0, barrelCount: 0 };
      }

      const load = indent.totalLoad || 0;
      const material = String(indent.material || '').trim();
      
      // Determine truck capacity based on material type
      const truckCapacity = material === '210L Barrels' ? BARREL_CAPACITY : BUCKET_CAPACITY;
      const fulfillmentPercentage = (load / truckCapacity) * 100;
      
      // IMPORTANT: Calculate bucket and barrel counts separately to match 4th card calculation
      // Count buckets and barrels separately (no conversion)
      // This matches the 4th card which shows buckets and barrels separately
      const noOfBuckets = Number(indent.noOfBuckets) || 0;
      let buckets = 0;
      let barrels = 0;
      
      // Count buckets and barrels separately
      if (material === '20L Buckets') {
        // Direct bucket count from "No. of Buckets/Barrels" column
        buckets = noOfBuckets;
      } else if (material === '210L Barrels') {
        // Direct barrel count from "No. of Buckets/Barrels" column
        barrels = noOfBuckets;
      }
      // For any other material, both buckets and barrels = 0

      groupedData[key].totalLoad += load;
      groupedData[key].indentCount += 1;
      groupedData[key].totalFulfillment += fulfillmentPercentage;
      groupedData[key].bucketCount += buckets;
      groupedData[key].barrelCount += barrels;
    });

    // Convert to array and format labels
    const sortedKeys = Object.keys(groupedData).sort();
    const timeSeriesData = sortedKeys.map(key => {
      const data = groupedData[key];
      let formattedKey: string;
      if (granularity === 'monthly') {
        // Format monthly labels like month-on-month graphs (MMM'yy format)
        try {
          const monthDate = new Date(key + '-01');
          formattedKey = format(monthDate, "MMM''yy");
        } catch (e) {
          formattedKey = key;
        }
      } else {
        formattedKey = formatTimeLabel(key, granularity);
      }
      // Bucket and barrel counts are separate (no conversion) to match 4th card
      const bucketCount = Math.round(data.bucketCount || 0);
      const barrelCount = Math.round(data.barrelCount || 0);
      return {
        date: formattedKey,
        totalLoad: Math.round(data.totalLoad),
        avgFulfillment: data.indentCount > 0 ? parseFloat((data.totalFulfillment / data.indentCount).toFixed(2)) : 0,
        indentCount: data.indentCount,
        bucketCount: bucketCount,
        barrelCount: barrelCount
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
        calculatedFrom: 'noOfBuckets field (buckets only, no barrel conversion) - matches 4th card'
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

    // Query all indents first
    let allIndents = await Trip.find({});
    
    // For monthly granularity, show all available months (like month-on-month graphs)
    // For daily/weekly, apply date filtering
    let indents = [...allIndents];
    
    if (granularity === 'monthly') {
      // For monthly granularity, ignore date filters and show all available months
      console.log(`[getRevenueAnalytics] Monthly granularity detected - showing all available months (ignoring date filter)`);
      // Don't filter by date - use all indents
      indents = allIndents;
    } else {
      // For daily/weekly, apply date filtering
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
      indents = await Trip.find(dateFilter);
    }

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

      // Group by time period based on granularity
      // For monthly, use Freight Tiger Month if available (like month-on-month graphs)
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
          // For monthly, prioritize Freight Tiger Month (like month-on-month graphs)
          if (indent.freightTigerMonth && typeof indent.freightTigerMonth === 'string' && indent.freightTigerMonth.trim() !== '') {
            const normalizedMonth = normalizeFreightTigerMonth(indent.freightTigerMonth.trim());
            if (normalizedMonth) {
              key = normalizedMonth; // Use normalized month key (e.g., '2025-05')
            } else {
              // Fallback to indentDate if normalization fails
              key = format(indent.indentDate, 'yyyy-MM');
            }
          } else {
            // Fallback to indentDate if Freight Tiger Month is not available
            key = format(indent.indentDate, 'yyyy-MM');
          }
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
      let formattedKey: string;
      if (granularity === 'monthly') {
        // Format monthly keys as "MMM'yy" (e.g., "May'25")
        try {
          const [year, month] = key.split('-');
          const monthNum = parseInt(month, 10);
          const yearShort = year.slice(-2);
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          formattedKey = `${monthNames[monthNum - 1]}'${yearShort}`;
        } catch (e) {
          formattedKey = formatTimeLabel(key, granularity);
        }
      } else {
        formattedKey = formatTimeLabel(key, granularity);
      }
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

export const getCostAnalytics = async (req: Request, res: Response) => {
  try {
    const fromDate = parseDateParam(req.query.fromDate as string);
    const toDate = parseDateParam(req.query.toDate as string);
    const granularity = req.query.granularity as string || 'daily';

    // Query all indents first
    let allIndents = await Trip.find({});
    
    // For monthly granularity, show all available months (like month-on-month graphs)
    // For daily/weekly, apply date filtering
    let indents = [...allIndents];
    
    if (granularity === 'monthly') {
      // For monthly granularity, ignore date filters and show all available months
      console.log(`[getCostAnalytics] Monthly granularity detected - showing all available months (ignoring date filter)`);
      // Don't filter by date - use all indents
      indents = allIndents;
    } else {
      // For daily/weekly, apply date filtering
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
      indents = await Trip.find(dateFilter);
    }

    // Range mappings - values are normalized during parsing
    const rangeMappings = [
      { label: '0-100Km' },
      { label: '101-250Km' },
      { label: '251-400Km' },
      { label: '401-600Km' },
    ];

    // Calculate cost by range - sum totalCost from indents
    const costByRange = rangeMappings.map(({ label }) => {
      const rangeIndents = indents.filter(indent => {
        // Since ranges are normalized during parsing, we can do direct comparison
        return indent.range === label;
      });

      // Sum totalCost from all indents in this range (use Column AE for cost analytics)
      const totalCost = rangeIndents.reduce((sum, indent) => {
        return sum + (indent.totalCostAE || 0);
      }, 0);

      return {
        range: label,
        cost: totalCost
      };
    });

    // Calculate total cost
    const totalCost = costByRange.reduce((sum, item) => sum + item.cost, 0);

    // Calculate cost over time
    const groupedData: Record<string, number> = {};

    indents.forEach(indent => {
      let key: string;

      // Group by time period based on granularity
      // For monthly, use Freight Tiger Month if available (like month-on-month graphs)
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
          // For monthly, prioritize Freight Tiger Month (like month-on-month graphs)
          if (indent.freightTigerMonth && typeof indent.freightTigerMonth === 'string' && indent.freightTigerMonth.trim() !== '') {
            const normalizedMonth = normalizeFreightTigerMonth(indent.freightTigerMonth.trim());
            if (normalizedMonth) {
              key = normalizedMonth; // Use normalized month key (e.g., '2025-05')
            } else {
              // Fallback to indentDate if normalization fails
              key = format(indent.indentDate, 'yyyy-MM');
            }
          } else {
            // Fallback to indentDate if Freight Tiger Month is not available
            key = format(indent.indentDate, 'yyyy-MM');
          }
          break;
        default:
          key = format(indent.indentDate, 'yyyy-MM-dd');
      }

      if (!groupedData[key]) {
        groupedData[key] = 0;
      }

      // Sum totalCost directly (use Column AE for cost analytics)
      groupedData[key] += indent.totalCostAE || 0;
    });

    // Convert to array and format labels
    const sortedKeys = Object.keys(groupedData).sort();
    const costOverTime = sortedKeys.map(key => {
      let formattedKey: string;
      if (granularity === 'monthly') {
        // Format monthly keys as "MMM'yy" (e.g., "May'25")
        try {
          const [year, month] = key.split('-');
          const monthNum = parseInt(month, 10);
          const yearShort = year.slice(-2);
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          formattedKey = `${monthNames[monthNum - 1]}'${yearShort}`;
        } catch (e) {
          formattedKey = formatTimeLabel(key, granularity);
        }
      } else {
        formattedKey = formatTimeLabel(key, granularity);
      }
      return {
        date: formattedKey,
        cost: groupedData[key]
      };
    });

    console.log('Cost Analytics Response:', {
      costByRangeCount: costByRange.length,
      totalCost,
      costOverTimeCount: costOverTime.length,
      indentsCount: indents.length
    });

    res.json({
      success: true,
      costByRange,
      totalCost,
      costOverTime,
      granularity,
      dateRange: {
        from: fromDate?.toISOString().split('T')[0] || null,
        to: toDate?.toISOString().split('T')[0] || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch cost analytics'
    });
  }
};

export const getProfitLossAnalytics = async (req: Request, res: Response) => {
  try {
    const fromDate = parseDateParam(req.query.fromDate as string);
    const toDate = parseDateParam(req.query.toDate as string);
    const granularity = req.query.granularity as string || 'daily';

    // Query all indents first
    let allIndents = await Trip.find({});
    
    // For monthly granularity, show all available months (like month-on-month graphs)
    // For daily/weekly, apply date filtering
    let indents = [...allIndents];
    
    if (granularity === 'monthly') {
      // For monthly granularity, ignore date filters and show all available months
      console.log(`[getProfitLossAnalytics] Monthly granularity detected - showing all available months (ignoring date filter)`);
      // Don't filter by date - use all indents
      indents = allIndents;
    } else {
      // For daily/weekly, apply date filtering
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
      indents = await Trip.find(dateFilter);
    }

    // Range mappings - values are normalized during parsing
    const rangeMappings = [
      { label: '0-100Km' },
      { label: '101-250Km' },
      { label: '251-400Km' },
      { label: '401-600Km' },
    ];

    // Calculate profit/loss by range - sum profitLoss from indents
    const profitLossByRange = rangeMappings.map(({ label }) => {
      const rangeIndents = indents.filter(indent => {
        // Since ranges are normalized during parsing, we can do direct comparison
        return indent.range === label;
      });

      // Sum profitLoss from all indents in this range
      const totalProfitLoss = rangeIndents.reduce((sum, indent) => {
        return sum + (indent.profitLoss || 0);
      }, 0);

      return {
        range: label,
        profitLoss: totalProfitLoss
      };
    });

    // Calculate total profit/loss
    const totalProfitLoss = profitLossByRange.reduce((sum, item) => sum + item.profitLoss, 0);

    // Calculate profit/loss over time
    const groupedData: Record<string, number> = {};

    indents.forEach(indent => {
      let key: string;

      // Group by time period based on granularity
      // For monthly, use Freight Tiger Month if available (like month-on-month graphs)
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
          // For monthly, prioritize Freight Tiger Month (like month-on-month graphs)
          if (indent.freightTigerMonth && typeof indent.freightTigerMonth === 'string' && indent.freightTigerMonth.trim() !== '') {
            const normalizedMonth = normalizeFreightTigerMonth(indent.freightTigerMonth.trim());
            if (normalizedMonth) {
              key = normalizedMonth; // Use normalized month key (e.g., '2025-05')
            } else {
              // Fallback to indentDate if normalization fails
              key = format(indent.indentDate, 'yyyy-MM');
            }
          } else {
            // Fallback to indentDate if Freight Tiger Month is not available
            key = format(indent.indentDate, 'yyyy-MM');
          }
          break;
        default:
          key = format(indent.indentDate, 'yyyy-MM-dd');
      }
      if (!groupedData[key]) groupedData[key] = 0;
      groupedData[key] += indent.profitLoss || 0;
    });

    // Format time labels
    const formatTimeLabel = (key: string, granularity: string): string => {
      if (granularity === 'weekly') {
        return key; // Already formatted as "Week X, YYYY"
      } else if (granularity === 'monthly') {
        try {
          const [year, month] = key.split('-');
          const monthNum = parseInt(month, 10);
          const yearShort = year.slice(-2);
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return `${monthNames[monthNum - 1]}'${yearShort}`;
        } catch (e) {
          return key;
        }
      } else {
        // Daily
        try {
          const date = parse(key, 'yyyy-MM-dd', new Date());
          return format(date, 'dd MMM');
        } catch (e) {
          return key;
        }
      }
    };

    const sortedKeys = Object.keys(groupedData).sort();
    const profitLossOverTime = sortedKeys.map(key => {
      let formattedKey: string;
      if (granularity === 'monthly') {
        try {
          const [year, month] = key.split('-');
          const monthNum = parseInt(month, 10);
          const yearShort = year.slice(-2);
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          formattedKey = `${monthNames[monthNum - 1]}'${yearShort}`;
        } catch (e) {
          formattedKey = formatTimeLabel(key, granularity);
        }
      } else {
        formattedKey = formatTimeLabel(key, granularity);
      }
      return {
        date: formattedKey,
        profitLoss: groupedData[key]
      };
    });

    console.log('Profit & Loss Analytics Response:', {
      profitLossByRangeCount: profitLossByRange.length,
      totalProfitLoss,
      profitLossOverTimeCount: profitLossOverTime.length,
      indentsCount: indents.length
    });

    res.json({
      success: true,
      profitLossByRange,
      totalProfitLoss,
      profitLossOverTime,
      granularity,
      dateRange: {
        from: fromDate?.toISOString().split('T')[0] || null,
        to: toDate?.toISOString().split('T')[0] || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch profit & loss analytics'
    });
  }
};

export const getMonthOnMonthAnalytics = async (req: Request, res: Response) => {
  try {
    // Query all trips from database (no date filter - show all available months)
    const allIndents = await Trip.find({});

    console.log(`[getMonthOnMonthAnalytics] Total indents fetched: ${allIndents.length}`);

    // For Card 1 (Indent Count): Use ALL indents (including cancelled ones with blank range)
    // For Card 2 (Trip Count): Filter to only include indents with Range value (canceled indents don't have range)
    const validIndents = allIndents.filter(indent => indent.range && indent.range.trim() !== '');

    console.log(`[getMonthOnMonthAnalytics] All indents (including cancelled): ${allIndents.length}`);
    console.log(`[getMonthOnMonthAnalytics] Valid indents (with range, excluding cancelled): ${validIndents.length}`);

    // Find all unique months using 'Freight Tiger Month' column from Excel
    // Use ALL indents (including cancelled) to find all available months - matches Card 1 logic
    const monthKeys = new Set<string>();
    let freightTigerMonthCount = 0;
    let indentDateFallbackCount = 0;
    
    allIndents.forEach(indent => {
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

      // Use clean date filtering utility (same as getAnalytics and calculateRangeWiseSummary)
      const dateFilterResult = filterIndentsByDate(allIndents, monthStart, monthEnd);
      const allIndentsForMonth = dateFilterResult.allIndentsFiltered;
      const validIndentsForMonth = dateFilterResult.validIndents;

      console.log(`[getMonthOnMonthAnalytics] ${monthKey}: All indents (including cancelled): ${allIndentsForMonth.length}`);
      console.log(`[getMonthOnMonthAnalytics] ${monthKey}: Valid indents (excluding cancelled): ${validIndentsForMonth.length}`);
      
      // Sample dates for debugging
      if (allIndentsForMonth.length > 0) {
        const sampleDates = allIndentsForMonth.slice(0, 3).map(i => ({
          indent: i.indent,
          indentDate: i.indentDate?.toISOString(),
          vehicle: i.vehicleNumber,
          hasRange: !!i.range
        }));
        console.log(`[getMonthOnMonthAnalytics] ${monthKey}: Sample dates:`, sampleDates);
      }

      // Calculate Indent Count (Card 1 logic): count unique indents from ALL indents (including cancelled)
      const uniqueIndents = new Set(allIndentsForMonth.filter(t => t.indent).map(t => t.indent));
      const indentCount = uniqueIndents.size;
      console.log(`[getMonthOnMonthAnalytics] ${monthKey}: Indent count (Card 1 logic): ${indentCount}`);

      // Calculate Trip Count (Card 2 logic): Use validIndents (excluding cancelled)
      // Apply OLD Card 1 logic - count unique indent values from validIndents (excluded cancelled)
      // This matches Card 2 logic exactly
      const uniqueIndentsForTrips = new Set(validIndentsForMonth.filter(t => t.indent).map(t => t.indent));
      const tripCount = uniqueIndentsForTrips.size;
      console.log(`[getMonthOnMonthAnalytics] ${monthKey}: Trip count (Card 2 logic): ${tripCount}`);

      console.log(`[getMonthOnMonthAnalytics] ${monthKey}: indentCount=${indentCount}, tripCount=${tripCount}`);

      // Format month label - use Freight Tiger Month format if available, otherwise format from date
      let formattedMonth: string;
      const sampleIndent = allIndentsForMonth.find(i => i.freightTigerMonth);
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
        indentCount: indentCount, // Unique indent count (Card 1 logic - including cancelled)
        tripCount: tripCount // Unique indent count (Card 2 logic - excluding cancelled)
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

export const getVehicleCostAnalytics = async (req: Request, res: Response) => {
  try {
    console.log(`[getVehicleCostAnalytics] ===== START =====`);
    const fromDate = parseDateParam(req.query.fromDate as string);
    const toDate = parseDateParam(req.query.toDate as string);
    console.log(`[getVehicleCostAnalytics] Date params: fromDate=${fromDate?.toISOString().split('T')[0] || 'null'}, toDate=${toDate?.toISOString().split('T')[0] || 'null'}`);

    // Query all trips from database
    const allTrips = await Trip.find({});
    console.log(`[getVehicleCostAnalytics] Total trips from DB: ${allTrips.length}`);

    // Calculate vehicle costs
    const { calculateVehicleCosts } = await import('../utils/vehicleCostCalculations');
    const vehicleCostData = calculateVehicleCosts(allTrips, fromDate || undefined, toDate || undefined);

    console.log(`[getVehicleCostAnalytics] Calculated vehicle cost data: ${vehicleCostData.length} rows`);
    console.log(`[getVehicleCostAnalytics] ===== END =====`);

    res.json({
      success: true,
      data: vehicleCostData,
      dateRange: {
        from: fromDate?.toISOString().split('T')[0] || null,
        to: toDate?.toISOString().split('T')[0] || null
      }
    });
  } catch (error) {
    console.error(`[getVehicleCostAnalytics] ERROR:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch vehicle cost analytics'
    });
  }
};


