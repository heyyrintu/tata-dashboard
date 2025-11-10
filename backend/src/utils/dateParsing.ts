/**
 * Utility functions for parsing dates in DD-MM-YYYY format
 * This is the format used in Excel files (Indian date format)
 */

/**
 * Parse a date string in DD-MM-YYYY or DD/MM/YYYY format
 * @param dateStr - Date string in DD-MM-YYYY or DD/MM/YYYY format
 * @returns Date object or null if invalid
 */
export function parseDDMMYYYY(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  
  const trimmed = String(dateStr).trim();
  
  // Try DD-MM-YYYY or DD/MM/YYYY pattern (Indian format)
  const ddmmyyyyPattern = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/;
  const match = trimmed.match(ddmmyyyyPattern);
  
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    
    // Validate ranges
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
      // Create UTC date at midnight - pure calendar date, no timezone
      const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  return null;
}

/**
 * Convert any date value to a Date object (UTC, date-only, no timezone)
 * Handles: Date objects, DD-MM-YYYY strings, ISO strings, Excel serial numbers
 * All dates are converted to UTC at midnight - pure calendar dates
 * @param value - Date value (Date, string, number, etc.)
 * @returns Date object (UTC) or null if invalid
 */
export function parseDateValue(value: any): Date | null {
  if (!value && value !== 0) return null;
  
  // If it's already a Date object, extract date components and create UTC date
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    // Extract date components using UTC to avoid timezone
    const year = value.getUTCFullYear();
    const month = value.getUTCMonth();
    const day = value.getUTCDate();
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  }
  
  // If it's a number (Excel serial date)
  if (typeof value === 'number') {
    // Excel serial 1 = Jan 1, 1900
    // Excel epoch: Dec 31, 1899 (serial 0)
    const daysSinceEpoch = value - 1;
    const excelEpoch = new Date(Date.UTC(1899, 11, 31, 0, 0, 0, 0));
    const date = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
    if (!isNaN(date.getTime())) {
      // Extract date components and create UTC date
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      const day = date.getUTCDate();
      return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    }
    return null;
  }
  
  // If it's a string
  if (typeof value === 'string') {
    // First try DD-MM-YYYY format (Indian format)
    const ddmmyyyyParsed = parseDDMMYYYY(value);
    if (ddmmyyyyParsed) {
      // Convert to UTC date
      const year = ddmmyyyyParsed.getUTCFullYear();
      const month = ddmmyyyyParsed.getUTCMonth();
      const day = ddmmyyyyParsed.getUTCDate();
      return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    }
    
    // Handle MongoDB ISO date strings (e.g., "2025-09-10T00:00:00.000Z")
    // Extract YYYY-MM-DD portion only - ignore time and timezone
    if (value.includes('T')) {
      const dateOnly = value.split('T')[0]; // "2025-09-10"
      const yyyymmddPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
      const match = dateOnly.match(yyyymmddPattern);
      if (match) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1; // 0-indexed
        const day = parseInt(match[3], 10);
        return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      }
    }
    
    // Try YYYY-MM-DD format
    const yyyymmddPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = value.match(yyyymmddPattern);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    }
    
    // Last resort: try standard Date parsing and extract date components
    const standardParsed = new Date(value);
    if (!isNaN(standardParsed.getTime())) {
      const year = standardParsed.getUTCFullYear();
      const month = standardParsed.getUTCMonth();
      const day = standardParsed.getUTCDate();
      return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    }
  }
  
  return null;
}

/**
 * Calculate days between two dates using date components only (no timezone)
 * @param date1 - First date {year, month, day}
 * @param date2 - Second date {year, month, day}
 * @returns Number of days between dates
 */
function daysBetween(date1: { year: number; month: number; day: number }, date2: { year: number; month: number; day: number }): number {
  // Convert to days since a fixed epoch (year 0)
  function toDays(date: { year: number; month: number; day: number }): number {
    const m = date.month;
    const y = date.year;
    const d = date.day;
    
    // Account for leap years
    const leapYears = Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400);
    const daysInYear = y * 365 + leapYears;
    
    // Days in months (non-leap year)
    const daysInMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    const daysInMonths = daysInMonth[m];
    
    // Add extra day if leap year and month > February
    const isLeap = (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
    const extraDay = isLeap && m > 1 ? 1 : 0;
    
    return daysInYear + daysInMonths + d + extraDay;
  }
  
  return toDays(date2) - toDays(date1);
}

/**
 * Convert a Date object to Excel serial date number
 * Excel epoch: Dec 31, 1899 (serial 0)
 * Excel serial 1 = Jan 1, 1900
 * Uses date components only - no timezone dependency
 * @param date - Date object
 * @returns Excel serial date number or null if invalid
 */
export function dateToExcelSerial(date: Date | null | undefined): number | null {
  if (!date) return null;
  
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;
  
  // Extract date components using UTC to avoid timezone issues
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1; // 1-12
  const day = d.getUTCDate();
  
  // Excel epoch: Dec 31, 1899
  const excelEpoch = { year: 1899, month: 12, day: 31 };
  const targetDate = { year, month, day };
  
  // Calculate days between using date components only
  const daysDiff = daysBetween(excelEpoch, targetDate);
  
  // Excel serial = days since epoch + 1
  return daysDiff + 1;
}

/**
 * Convert Excel serial date number to Date object
 * @param serial - Excel serial date number
 * @returns Date object or null if invalid
 */
export function excelSerialToDate(serial: number | null | undefined): Date | null {
  if (serial === null || serial === undefined || isNaN(serial)) return null;
  
  // Excel epoch: Dec 31, 1899 (UTC)
  const excelEpoch = new Date(Date.UTC(1899, 11, 31, 0, 0, 0, 0));
  
  // Excel serial 1 = Jan 1, 1900
  // So serial - 1 = days since Dec 31, 1899
  const daysSinceEpoch = serial - 1;
  const date = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
  
  if (isNaN(date.getTime())) return null;
  
  // Extract date components and create UTC date (date-only)
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
}

/**
 * Convert any date value to Excel serial date number
 * This is the preferred method for date comparisons (no timezone issues)
 * @param value - Date value (Date, string, number, etc.)
 * @returns Excel serial date number or null if invalid
 */
export function toExcelSerial(value: any): number | null {
  if (!value && value !== 0) return null;
  
  // If it's already a number and looks like Excel serial (reasonable range)
  if (typeof value === 'number') {
    // Excel serial dates are typically between 1 (Jan 1, 1900) and ~100000 (year 2173)
    // But we'll accept any positive number that could be a date
    if (value > 0 && value < 1000000) {
      return value;
    }
    // If it's a very large number, it might be milliseconds - convert to date first
    if (value > 1000000000000) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return dateToExcelSerial(date);
      }
    }
  }
  
  // Parse to Date first, then convert to Excel serial
  const date = parseDateValue(value);
  if (!date) return null;
  
  return dateToExcelSerial(date);
}

/**
 * Format date to DD-MM-YYYY string
 * @param date - Date object
 * @returns Formatted string or empty string if invalid
 */
export function formatDDMMYYYY(date: Date | null | undefined): string {
  if (!date) return '';
  
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  
  // Use UTC components to avoid timezone shifts
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  
  return `${day}-${month}-${year}`;
}


