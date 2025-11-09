/**
 * Clean date filtering utility - uses ONLY Indent Date column (column 'B')
 * This ensures 100% consistency across all analytics functions
 * 
 * IMPORTANT: Only uses indentDate - does NOT use Freight Tiger Month
 * 
 * Date Format: Handles DD-MM-YYYY format (Indian date format)
 */

import { parseDateValue, toExcelSerial } from './dateParsing';
import { format } from 'date-fns';

/**
 * Convert date to Excel serial number for reliable numeric comparison
 * This avoids all timezone and time component issues
 * @param date - Date value (Date, string, number, etc.)
 * @returns Excel serial date number or null if invalid
 */
function toExcelSerialNumber(date: Date | null | undefined): number | null {
  return toExcelSerial(date);
}

export interface DateFilterResult {
  allIndentsFiltered: any[]; // All indents (including cancelled) after date filter
  validIndents: any[]; // Valid indents (excluding cancelled) after date filter
  monthStart?: Date; // Month start (if single month)
  monthEnd?: Date; // Month end (if single month)
  targetMonthKey?: string; // Month key (if single month)
}

/**
 * Filter indents by date - uses ONLY Indent Date column
 * 
 * @param allIndents - All indents from database
 * @param fromDate - Start date (optional)
 * @param toDate - End date (optional)
 * @returns Filtered indents
 */
export function filterIndentsByDate(
  allIndents: any[],
  fromDate: Date | null | undefined,
  toDate: Date | null | undefined
): DateFilterResult {
  console.log(`[filterIndentsByDate] ===== START =====`);
  console.log(`[filterIndentsByDate] Using ONLY Indent Date column (column 'B')`);
  console.log(`[filterIndentsByDate] Input: totalIndents=${allIndents.length}`);
  console.log(`[filterIndentsByDate] fromDate: ${fromDate ? fromDate.toISOString() : 'null'}`);
  console.log(`[filterIndentsByDate] toDate: ${toDate ? toDate.toISOString() : 'null'}`);

  // If no dates provided, return all indents immediately
  if (!fromDate && !toDate) {
    console.log(`[filterIndentsByDate] No date filter - returning ALL indents`);
    const validIndents = allIndents.filter(indent => indent.range && indent.range.trim() !== '');
    console.log(`[filterIndentsByDate] All indents: ${allIndents.length}, Valid indents: ${validIndents.length}`);
    return {
      allIndentsFiltered: allIndents,
      validIndents,
      monthStart: undefined,
      monthEnd: undefined,
      targetMonthKey: undefined
    };
  }

  // Convert filter dates to Excel serial numbers for reliable numeric comparison
  const fromDateSerial = toExcelSerialNumber(fromDate);
  const toDateSerial = toExcelSerialNumber(toDate);
  
  console.log(`[filterIndentsByDate] Date filter (Excel serial numbers):`);
  console.log(`[filterIndentsByDate] - fromDate: ${fromDateSerial ? `Serial ${fromDateSerial} (${fromDate?.toISOString().split('T')[0]})` : 'null'}`);
  console.log(`[filterIndentsByDate] - toDate: ${toDateSerial ? `Serial ${toDateSerial} (${toDate?.toISOString().split('T')[0]})` : 'null'}`);

  // Start with all indents
  let allIndentsFiltered = [...allIndents];
  let monthStart: Date | undefined;
  let monthEnd: Date | undefined;
  let targetMonthKey: string | undefined;

  // Apply date filtering using ONLY indentDate
  if (fromDateSerial !== null && toDateSerial !== null) {
    const fromMonth = format(fromDate!, 'yyyy-MM');
    const toMonth = format(toDate!, 'yyyy-MM');

    if (fromMonth === toMonth) {
      // SINGLE MONTH - Use month boundaries from indentDate
      targetMonthKey = fromMonth;
      monthStart = new Date(fromMonth + '-01');
      monthStart.setHours(0, 0, 0, 0);
      monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      console.log(`[filterIndentsByDate] Single month filter: ${targetMonthKey}`);
      console.log(`[filterIndentsByDate] Month boundaries: ${monthStart.toISOString()} to ${monthEnd.toISOString()}`);

      // Convert month boundaries to Excel serial numbers
      const monthStartSerial = toExcelSerialNumber(monthStart);
      const monthEndSerial = toExcelSerialNumber(monthEnd);
      
      console.log(`[filterIndentsByDate] Month boundaries (Excel serial):`);
      console.log(`[filterIndentsByDate] - monthStart: Serial ${monthStartSerial} (${monthStart!.toISOString().split('T')[0]})`);
      console.log(`[filterIndentsByDate] - monthEnd: Serial ${monthEndSerial} (${monthEnd!.toISOString().split('T')[0]})`);

      // Debug: Check sample indent dates before filtering
      const sampleIndents = allIndentsFiltered.slice(0, 5).map((indent: any) => {
        const indentSerial = toExcelSerialNumber(indent.indentDate);
        const inRange = indentSerial !== null ? (indentSerial >= monthStartSerial! && indentSerial <= monthEndSerial!) : false;
        return {
          indent: indent.indent,
          indentDateRaw: indent.indentDate,
          indentDateType: typeof indent.indentDate,
          indentDateSerial: indentSerial,
          monthStartSerial: monthStartSerial,
          monthEndSerial: monthEndSerial,
          inRange: inRange,
          reason: indentSerial === null ? 'PARSE_FAILED' : !inRange ? 'OUT_OF_RANGE' : 'IN_RANGE'
        };
      });
      console.log(`[filterIndentsByDate] Sample indent dates (first 5) - BEFORE FILTERING:`, sampleIndents);
      
      // Count how many will pass/fail
      let passCount = 0;
      let failCount = 0;
      allIndentsFiltered.forEach((indent: any) => {
        const indentSerial = toExcelSerialNumber(indent.indentDate);
        if (indentSerial !== null && indentSerial >= monthStartSerial! && indentSerial <= monthEndSerial!) {
          passCount++;
        } else {
          failCount++;
        }
      });
      console.log(`[filterIndentsByDate] Expected results: ${passCount} will pass, ${failCount} will fail`);

      // Filter using ONLY indentDate - compare using Excel serial numbers
      allIndentsFiltered = allIndentsFiltered.filter(indent => {
        if (!indent.indentDate) {
          return false;
        }
        // Convert indent date to Excel serial number
        const indentSerial = toExcelSerialNumber(indent.indentDate);
        
        if (indentSerial === null) {
          return false;
        }

        // Compare using Excel serial numbers (simple integer comparison)
        return indentSerial >= monthStartSerial! && indentSerial <= monthEndSerial!;
      });

      console.log(`[filterIndentsByDate] Filtered indents for single month: ${allIndentsFiltered.length}`);
      
      // Log sample dates after filtering
      if (allIndentsFiltered.length > 0) {
        const sampleAfter = allIndentsFiltered.slice(0, 3).map((indent: any) => {
          const indentSerial = toExcelSerialNumber(indent.indentDate);
          const parsed = parseDateValue(indent.indentDate);
          return {
            indent: indent.indent,
            indentDateSerial: indentSerial,
            indentDateFormatted: parsed ? parsed.toISOString().split('T')[0] : 'FAILED',
            monthStartSerial: monthStartSerial,
            monthEndSerial: monthEndSerial
          };
        });
        console.log(`[filterIndentsByDate] Sample filtered indents (first 3) - AFTER FILTERING:`, sampleAfter);
      }
    } else {
      // MULTI-MONTH RANGE - Use indentDate only
      console.log(`[filterIndentsByDate] Multi-month range filter: ${fromMonth} to ${toMonth}`);

      // Debug: Check sample indent dates before filtering
      const sampleIndentsMulti = allIndentsFiltered.slice(0, 5).map((indent: any) => {
        const indentSerial = toExcelSerialNumber(indent.indentDate);
        const parsed = parseDateValue(indent.indentDate);
        const inRange = indentSerial !== null ? (indentSerial >= fromDateSerial! && indentSerial <= toDateSerial!) : false;
        return {
          indent: indent.indent,
          indentDateRaw: indent.indentDate,
          indentDateType: typeof indent.indentDate,
          indentDateSerial: indentSerial,
          indentDateFormatted: parsed ? parsed.toISOString().split('T')[0] : 'FAILED',
          fromDateSerial: fromDateSerial,
          toDateSerial: toDateSerial,
          inRange: inRange,
          reason: indentSerial === null ? 'PARSE_FAILED' : !inRange ? 'OUT_OF_RANGE' : 'IN_RANGE'
        };
      });
      console.log(`[filterIndentsByDate] Sample indent dates (first 5) - BEFORE FILTERING:`, sampleIndentsMulti);
      
      // Count how many will pass/fail
      let passCountMulti = 0;
      let failCountMulti = 0;
      allIndentsFiltered.forEach((indent: any) => {
        const indentSerial = toExcelSerialNumber(indent.indentDate);
        if (indentSerial !== null && indentSerial >= fromDateSerial! && indentSerial <= toDateSerial!) {
          passCountMulti++;
        } else {
          failCountMulti++;
        }
      });
      console.log(`[filterIndentsByDate] Expected results: ${passCountMulti} will pass, ${failCountMulti} will fail`);

      allIndentsFiltered = allIndentsFiltered.filter(indent => {
        if (!indent.indentDate) {
          return false;
        }
        // Convert indent date to Excel serial number
        const indentSerial = toExcelSerialNumber(indent.indentDate);
        
        if (indentSerial === null) {
          return false;
        }

        // Compare using Excel serial numbers (simple integer comparison)
        return indentSerial >= fromDateSerial! && indentSerial <= toDateSerial!;
      });

      console.log(`[filterIndentsByDate] Filtered indents for date range: ${allIndentsFiltered.length}`);
      
      // Log sample dates after filtering
      if (allIndentsFiltered.length > 0) {
        const sampleAfter = allIndentsFiltered.slice(0, 3).map((indent: any) => {
          const indentSerial = toExcelSerialNumber(indent.indentDate);
          const parsed = parseDateValue(indent.indentDate);
          return {
            indent: indent.indent,
            indentDateSerial: indentSerial,
            indentDateFormatted: parsed ? parsed.toISOString().split('T')[0] : 'FAILED',
            fromDateSerial: fromDateSerial,
            toDateSerial: toDateSerial
          };
        });
        console.log(`[filterIndentsByDate] Sample filtered indents (first 3) - AFTER FILTERING:`, sampleAfter);
      }
    }
  } else if (fromDateSerial !== null) {
    // Only fromDate - use indentDate only
    console.log(`[filterIndentsByDate] From date filter only: Serial ${fromDateSerial} (${fromDate!.toISOString().split('T')[0]})`);
    allIndentsFiltered = allIndentsFiltered.filter(indent => {
      if (!indent.indentDate) {
        return false;
      }
      // Convert indent date to Excel serial number
      const indentSerial = toExcelSerialNumber(indent.indentDate);
      
      if (indentSerial === null) {
        return false;
      }

      // Compare using Excel serial numbers
      return indentSerial >= fromDateSerial;
    });
    console.log(`[filterIndentsByDate] Filtered indents: ${allIndentsFiltered.length}`);
  } else if (toDateSerial !== null) {
    // Only toDate - use indentDate only
    console.log(`[filterIndentsByDate] To date filter only: Serial ${toDateSerial} (${toDate!.toISOString().split('T')[0]})`);
    allIndentsFiltered = allIndentsFiltered.filter(indent => {
      if (!indent.indentDate) {
        return false;
      }
      // Convert indent date to Excel serial number
      const indentSerial = toExcelSerialNumber(indent.indentDate);
      
      if (indentSerial === null) {
        return false;
      }

      // Compare using Excel serial numbers
      return indentSerial <= toDateSerial;
    });
    console.log(`[filterIndentsByDate] Filtered indents: ${allIndentsFiltered.length}`);
  } else {
    // No date filter - use all indents
    console.log(`[filterIndentsByDate] No date filter - using all indents`);
    console.log(`[filterIndentsByDate] Total indents without filter: ${allIndentsFiltered.length}`);
  }

  // Filter out cancelled indents (no range) for validIndents
  const validIndents = allIndentsFiltered.filter(indent => indent.range && indent.range.trim() !== '');

  console.log(`[filterIndentsByDate] Final results:`);
  console.log(`[filterIndentsByDate] - All indents filtered (including cancelled): ${allIndentsFiltered.length}`);
  console.log(`[filterIndentsByDate] - Valid indents (excluding cancelled): ${validIndents.length}`);
  
  // Log ALL filtered indents with details
  console.log(`[filterIndentsByDate] ===== ALL FILTERED INDENTS (${allIndentsFiltered.length} total) =====`);
  allIndentsFiltered.forEach((indent: any, index: number) => {
    console.log(`[filterIndentsByDate] Indent ${index + 1}:`, {
      indent: indent.indent || 'NO_INDENT',
      indentDate: indent.indentDate ? (indent.indentDate instanceof Date ? indent.indentDate.toISOString().split('T')[0] : String(indent.indentDate)) : 'NO_DATE',
      range: indent.range || 'CANCELLED',
      material: indent.material || 'NO_MATERIAL',
      noOfBuckets: indent.noOfBuckets || 0,
      totalLoad: indent.totalLoad || 0,
      totalCost: indent.totalCost || 0,
      profitLoss: indent.profitLoss || 0,
      location: indent.location || 'NO_LOCATION',
      vehicleNumber: indent.vehicleNumber || 'NO_VEHICLE'
    });
  });
  console.log(`[filterIndentsByDate] ===== END OF ALL FILTERED INDENTS =====`);
  
  // Log VALID indents (excluding cancelled) with details
  console.log(`[filterIndentsByDate] ===== VALID INDENTS (${validIndents.length} total, excluding cancelled) =====`);
  validIndents.forEach((indent: any, index: number) => {
    console.log(`[filterIndentsByDate] Valid Indent ${index + 1}:`, {
      indent: indent.indent || 'NO_INDENT',
      indentDate: indent.indentDate ? (indent.indentDate instanceof Date ? indent.indentDate.toISOString().split('T')[0] : String(indent.indentDate)) : 'NO_DATE',
      range: indent.range || 'NO_RANGE',
      material: indent.material || 'NO_MATERIAL',
      noOfBuckets: indent.noOfBuckets || 0,
      totalLoad: indent.totalLoad || 0,
      totalCost: indent.totalCost || 0,
      profitLoss: indent.profitLoss || 0,
      location: indent.location || 'NO_LOCATION',
      vehicleNumber: indent.vehicleNumber || 'NO_VEHICLE'
    });
  });
  console.log(`[filterIndentsByDate] ===== END OF VALID INDENTS =====`);
  
  console.log(`[filterIndentsByDate] ===== END =====`);

  return {
    allIndentsFiltered,
    validIndents,
    monthStart,
    monthEnd,
    targetMonthKey
  };
}

