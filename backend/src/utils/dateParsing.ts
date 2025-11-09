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
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  return null;
}

/**
 * Convert any date value to a Date object
 * Handles: Date objects, DD-MM-YYYY strings, ISO strings, Excel serial numbers
 * @param value - Date value (Date, string, number, etc.)
 * @returns Date object or null if invalid
 */
export function parseDateValue(value: any): Date | null {
  if (!value && value !== 0) return null;
  
  // If it's already a Date object
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return value;
  }
  
  // If it's a number (Excel serial date)
  if (typeof value === 'number') {
    const excelEpoch = new Date(1899, 11, 31); // Dec 31, 1899
    const daysSinceEpoch = value - 1;
    const date = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
    if (!isNaN(date.getTime())) {
      return date;
    }
    return null;
  }
  
  // If it's a string
  if (typeof value === 'string') {
    // First try DD-MM-YYYY format (Indian format)
    const ddmmyyyyParsed = parseDDMMYYYY(value);
    if (ddmmyyyyParsed) return ddmmyyyyParsed;
    
    // Handle MongoDB ISO date strings (e.g., "2025-09-10T00:00:00.000Z")
    if (value.includes('T')) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        // Convert UTC to local timezone for consistent comparisons
        // MongoDB stores dates in UTC, but we want to compare in local timezone
        const localDate = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
        return localDate;
      }
    }
    
    // Try standard Date parsing as fallback
    const standardParsed = new Date(value);
    if (!isNaN(standardParsed.getTime())) {
      return standardParsed;
    }
  }
  
  return null;
}

/**
 * Convert a Date object to Excel serial date number
 * Excel epoch: Dec 31, 1899 (serial 0)
 * Excel serial 1 = Jan 1, 1900
 * @param date - Date object
 * @returns Excel serial date number or null if invalid
 */
export function dateToExcelSerial(date: Date | null | undefined): number | null {
  if (!date) return null;
  
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;
  
  // Excel epoch: Dec 31, 1899
  const excelEpoch = new Date(1899, 11, 31);
  excelEpoch.setHours(0, 0, 0, 0);
  
  // Normalize input date to start of day in local timezone
  const normalizedDate = new Date(d);
  normalizedDate.setHours(0, 0, 0, 0);
  
  // Calculate difference in days
  const diffMs = normalizedDate.getTime() - excelEpoch.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  
  // Excel serial = days since epoch + 1
  return diffDays + 1;
}

/**
 * Convert Excel serial date number to Date object
 * @param serial - Excel serial date number
 * @returns Date object or null if invalid
 */
export function excelSerialToDate(serial: number | null | undefined): Date | null {
  if (serial === null || serial === undefined || isNaN(serial)) return null;
  
  // Excel epoch: Dec 31, 1899
  const excelEpoch = new Date(1899, 11, 31);
  excelEpoch.setHours(0, 0, 0, 0);
  
  // Excel serial 1 = Jan 1, 1900
  // So serial - 1 = days since Dec 31, 1899
  const daysSinceEpoch = serial - 1;
  const date = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
  
  if (isNaN(date.getTime())) return null;
  return date;
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
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}-${month}-${year}`;
}

