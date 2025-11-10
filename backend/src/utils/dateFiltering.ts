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
    // CRITICAL FIX: Always use the ACTUAL fromDate and toDate provided, NOT month boundaries
    // This ensures 1 day, 7 days, or any custom range works correctly
    console.log(`[filterIndentsByDate] Date range filter: ${fromDate!.toISOString().split('T')[0]} to ${toDate!.toISOString().split('T')[0]}`);
    console.log(`[filterIndentsByDate] Using ACTUAL date range (not month boundaries)`);
    console.log(`[filterIndentsByDate] - fromDate: Serial ${fromDateSerial} (${fromDate!.toISOString().split('T')[0]})`);
    console.log(`[filterIndentsByDate] - toDate: Serial ${toDateSerial} (${toDate!.toISOString().split('T')[0]})`);

    // Extract date components from filter dates (already UTC dates from parseDateParam)
    // No normalization needed - dates are already UTC at midnight
    const normalizedFromSerial = toExcelSerialNumber(fromDate);
    const normalizedToSerial = toExcelSerialNumber(toDate);
    
    console.log(`[filterIndentsByDate] Date range (Excel serial):`);
    console.log(`[filterIndentsByDate] - fromDate: Serial ${normalizedFromSerial} (${fromDate!.toISOString().split('T')[0]})`);
    console.log(`[filterIndentsByDate] - toDate: Serial ${normalizedToSerial} (${toDate!.toISOString().split('T')[0]})`);

    // Debug: Check sample indent dates before filtering
    const sampleIndents = allIndentsFiltered.slice(0, 5).map((indent: any) => {
      const indentSerial = toExcelSerialNumber(indent.indentDate);
      const inRange = indentSerial !== null ? (indentSerial >= normalizedFromSerial! && indentSerial <= normalizedToSerial!) : false;
      return {
        indent: indent.indent,
        indentDateRaw: indent.indentDate,
        indentDateType: typeof indent.indentDate,
        indentDateSerial: indentSerial,
        fromDateSerial: normalizedFromSerial,
        toDateSerial: normalizedToSerial,
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
      if (indentSerial !== null && indentSerial >= normalizedFromSerial! && indentSerial <= normalizedToSerial!) {
        passCount++;
      } else {
        failCount++;
      }
    });
    console.log(`[filterIndentsByDate] Expected results: ${passCount} will pass, ${failCount} will fail`);

    // Filter using ONLY indentDate - compare using Excel serial numbers with ACTUAL date range
    allIndentsFiltered = allIndentsFiltered.filter(indent => {
      if (!indent.indentDate) {
        return false;
      }
      // Convert indent date to Excel serial number
      const indentSerial = toExcelSerialNumber(indent.indentDate);
      
      if (indentSerial === null) {
        return false;
      }

      // Compare using Excel serial numbers with ACTUAL fromDate/toDate (not month boundaries)
      return indentSerial >= normalizedFromSerial! && indentSerial <= normalizedToSerial!;
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
          fromDateSerial: normalizedFromSerial,
          toDateSerial: normalizedToSerial
        };
      });
      console.log(`[filterIndentsByDate] Sample filtered indents (first 3) - AFTER FILTERING:`, sampleAfter);
    }
    
    // Check if it's a single month for month-on-month compatibility (metadata only, not for filtering)
    const fromMonth = format(fromDate!, 'yyyy-MM');
    const toMonth = format(toDate!, 'yyyy-MM');
    if (fromMonth === toMonth) {
      targetMonthKey = fromMonth;
      // Create month boundaries as UTC dates (date-only)
      const [year, month] = fromMonth.split('-').map(Number);
      monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      // Last day of month in UTC
      monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      console.log(`[filterIndentsByDate] Note: This is within a single month (${targetMonthKey}), but using actual date range for filtering`);
    } else {
      console.log(`[filterIndentsByDate] Multi-month range: ${fromMonth} to ${toMonth}`);
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

  // VERIFICATION: Double-check that all filtered indents are actually within the date range
  if (fromDateSerial !== null && toDateSerial !== null) {
    let outOfRangeCount = 0;
    const outOfRangeIndents: any[] = [];
    
    // Use the same Excel serial numbers as filtering (dates are already UTC, date-only)
    const minSerial = fromDateSerial;
    const maxSerial = toDateSerial;
    
    allIndentsFiltered.forEach((indent: any) => {
      const indentSerial = toExcelSerialNumber(indent.indentDate);
      if (indentSerial !== null) {
        // Always use ACTUAL fromDate/toDate (not month boundaries)
        if (indentSerial < minSerial! || indentSerial > maxSerial!) {
          outOfRangeCount++;
          if (outOfRangeIndents.length < 10) {
            const parsed = parseDateValue(indent.indentDate);
            outOfRangeIndents.push({
              indent: indent.indent || 'NO_INDENT',
              indentDate: parsed ? parsed.toISOString().split('T')[0] : 'INVALID',
              indentSerial,
              minSerial,
              maxSerial,
              reason: indentSerial < minSerial! ? 'BEFORE_RANGE' : 'AFTER_RANGE'
            });
          }
        }
      }
    });
    
    if (outOfRangeCount > 0) {
      console.error(`[filterIndentsByDate] ⚠️⚠️⚠️ CRITICAL ERROR: Found ${outOfRangeCount} indents OUTSIDE the date filter range!`);
      console.error(`[filterIndentsByDate] This should NEVER happen - filtering logic has a bug!`);
      console.error(`[filterIndentsByDate] Out of range indents (first 10):`, outOfRangeIndents);
      // Remove out-of-range indents using ACTUAL date range
      allIndentsFiltered = allIndentsFiltered.filter((indent: any) => {
        const indentSerial = toExcelSerialNumber(indent.indentDate);
        if (indentSerial === null) return false;
        return indentSerial >= minSerial! && indentSerial <= maxSerial!;
      });
      console.log(`[filterIndentsByDate] Removed ${outOfRangeCount} out-of-range indents. New count: ${allIndentsFiltered.length}`);
    } else {
      console.log(`[filterIndentsByDate] ✓ Verification passed: All ${allIndentsFiltered.length} filtered indents are within the date range`);
    }
  }

  console.log(`[filterIndentsByDate] Final results:`);
  console.log(`[filterIndentsByDate] - All indents filtered (including cancelled): ${allIndentsFiltered.length}`);
  console.log(`[filterIndentsByDate] - Valid indents (excluding cancelled): ${validIndents.length}`);
  
  // Log summary of filtered indents (only if count is reasonable to avoid log spam)
  if (allIndentsFiltered.length <= 100) {
    console.log(`[filterIndentsByDate] ===== ALL FILTERED INDENTS (${allIndentsFiltered.length} total) =====`);
    allIndentsFiltered.forEach((indent: any, index: number) => {
      const indentSerial = toExcelSerialNumber(indent.indentDate);
      const parsed = parseDateValue(indent.indentDate);
      console.log(`[filterIndentsByDate] Indent ${index + 1}:`, {
        indent: indent.indent || 'NO_INDENT',
        indentDate: parsed ? parsed.toISOString().split('T')[0] : 'NO_DATE',
        indentSerial,
        range: indent.range || 'CANCELLED'
      });
    });
    console.log(`[filterIndentsByDate] ===== END OF ALL FILTERED INDENTS =====`);
  } else {
    console.log(`[filterIndentsByDate] Filtered ${allIndentsFiltered.length} indents (too many to log individually)`);
    // Log sample
    const sample = allIndentsFiltered.slice(0, 5).map((indent: any) => {
      const indentSerial = toExcelSerialNumber(indent.indentDate);
      const parsed = parseDateValue(indent.indentDate);
      return {
        indent: indent.indent || 'NO_INDENT',
        indentDate: parsed ? parsed.toISOString().split('T')[0] : 'NO_DATE',
        indentSerial
      };
    });
    console.log(`[filterIndentsByDate] Sample (first 5):`, sample);
  }
  
  console.log(`[filterIndentsByDate] Valid indents (excluding cancelled): ${validIndents.length}`);
  
  console.log(`[filterIndentsByDate] ===== END =====`);

  return {
    allIndentsFiltered,
    validIndents,
    monthStart,
    monthEnd,
    targetMonthKey
  };
}

