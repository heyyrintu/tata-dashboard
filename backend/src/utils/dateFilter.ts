export const isDateInRange = (date: Date, fromDate: Date | null, toDate: Date | null): boolean => {
  if (!fromDate && !toDate) return true;
  
  // Extract date components using UTC (no timezone)
  const dateYear = date.getUTCFullYear();
  const dateMonth = date.getUTCMonth();
  const dateDay = date.getUTCDate();
  const dateTime = new Date(Date.UTC(dateYear, dateMonth, dateDay, 0, 0, 0, 0)).getTime();
  
  if (fromDate && toDate) {
    const fromYear = fromDate.getUTCFullYear();
    const fromMonth = fromDate.getUTCMonth();
    const fromDay = fromDate.getUTCDate();
    const from = new Date(Date.UTC(fromYear, fromMonth, fromDay, 0, 0, 0, 0)).getTime();
    
    const toYear = toDate.getUTCFullYear();
    const toMonth = toDate.getUTCMonth();
    const toDay = toDate.getUTCDate();
    const to = new Date(Date.UTC(toYear, toMonth, toDay, 23, 59, 59, 999)).getTime();
    
    return dateTime >= from && dateTime <= to;
  }
  
  if (fromDate) {
    const fromYear = fromDate.getUTCFullYear();
    const fromMonth = fromDate.getUTCMonth();
    const fromDay = fromDate.getUTCDate();
    const from = new Date(Date.UTC(fromYear, fromMonth, fromDay, 0, 0, 0, 0)).getTime();
    return dateTime >= from;
  }
  
  if (toDate) {
    const toYear = toDate.getUTCFullYear();
    const toMonth = toDate.getUTCMonth();
    const toDay = toDate.getUTCDate();
    const to = new Date(Date.UTC(toYear, toMonth, toDay, 23, 59, 59, 999)).getTime();
    return dateTime <= to;
  }
  
  return true;
};

export const parseDateParam = (dateStr: string | undefined): Date | null => {
  if (!dateStr) return null;
  
  // Handle YYYY-MM-DD format (common from frontend)
  // Parse as UTC date at midnight - pure calendar date, no timezone
  const yyyymmddPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = dateStr.match(yyyymmddPattern);
  
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // Month is 0-indexed
    const day = parseInt(match[3], 10);
    
    // Create date in UTC at midnight - pure calendar date, no timezone dependency
    const date = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    
    // Validate the date
    if (date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day) {
      return date;
    }
  }
  
  // Fallback: try to extract date from other formats
  // If it's an ISO string, extract YYYY-MM-DD portion
  if (dateStr.includes('T')) {
    const dateOnly = dateStr.split('T')[0];
    const yyyymmddMatch = dateOnly.match(yyyymmddPattern);
    if (yyyymmddMatch) {
      const year = parseInt(yyyymmddMatch[1], 10);
      const month = parseInt(yyyymmddMatch[2], 10) - 1;
      const day = parseInt(yyyymmddMatch[3], 10);
      const date = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      if (date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day) {
        return date;
      }
    }
  }
  
  // Last resort: try standard parsing and convert to UTC midnight
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    // Extract date components and create UTC date
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const utcDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    return utcDate;
  }
  
  return null;
};

