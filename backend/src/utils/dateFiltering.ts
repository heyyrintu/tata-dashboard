/**
 * Clean date filtering utility - uses ONLY Indent Date column (column 'B')
 * This ensures 100% consistency across all analytics functions
 * 
 * IMPORTANT: Only uses indentDate - does NOT use Freight Tiger Month
 * 
 * Date Format: Handles DD-MM-YYYY format (Indian date format)
 */

import { format } from 'date-fns';

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
  // If no dates provided, return all indents immediately
  if (!fromDate && !toDate) {
    const validIndents = allIndents.filter(indent => indent.range && indent.range.trim() !== '');
    return {
      allIndentsFiltered: allIndents,
      validIndents,
      monthStart: undefined,
      monthEnd: undefined,
      targetMonthKey: undefined
    };
  }

  // Start with all indents
  let allIndentsFiltered = [...allIndents];
  let monthStart: Date | undefined;
  let monthEnd: Date | undefined;
  let targetMonthKey: string | undefined;

  // Apply date filtering using simple date comparison (old logic)
  if (fromDate && toDate) {
    // Set end date to end of day
    const endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999);

    // Filter using simple date comparison
    allIndentsFiltered = allIndentsFiltered.filter(indent => {
      if (!indent.indentDate) {
        return false;
      }
      
      const indentDate = indent.indentDate instanceof Date 
        ? indent.indentDate 
        : new Date(indent.indentDate);
      
      if (isNaN(indentDate.getTime())) {
        return false;
      }

      // Simple date comparison
      return indentDate >= fromDate && indentDate <= endDate;
    });

    // Check if it's a single month for month-on-month compatibility
    const fromMonth = format(fromDate, 'yyyy-MM');
    const toMonth = format(toDate, 'yyyy-MM');
    if (fromMonth === toMonth) {
      targetMonthKey = fromMonth;
      const [year, month] = fromMonth.split('-').map(Number);
      monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    }
  } else if (fromDate) {
    // Only fromDate
    allIndentsFiltered = allIndentsFiltered.filter(indent => {
      if (!indent.indentDate) {
        return false;
      }
      
      const indentDate = indent.indentDate instanceof Date 
        ? indent.indentDate 
        : new Date(indent.indentDate);
      
      if (isNaN(indentDate.getTime())) {
        return false;
      }

      return indentDate >= fromDate;
    });
  } else if (toDate) {
    // Only toDate
    const endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999);
    
    allIndentsFiltered = allIndentsFiltered.filter(indent => {
      if (!indent.indentDate) {
        return false;
      }
      
      const indentDate = indent.indentDate instanceof Date 
        ? indent.indentDate 
        : new Date(indent.indentDate);
      
      if (isNaN(indentDate.getTime())) {
        return false;
      }

      return indentDate <= endDate;
    });
  }

  // Filter out cancelled indents (no range) for validIndents
  const validIndents = allIndentsFiltered.filter(indent => indent.range && indent.range.trim() !== '');

  return {
    allIndentsFiltered,
    validIndents,
    monthStart,
    monthEnd,
    targetMonthKey
  };
}

