// Helper function to normalize date to start of day in UTC (timezone-independent)
export const startOfDayUTC = (date: Date): Date => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
};

// Helper function to normalize date to end of day in UTC (timezone-independent)
export const endOfDayUTC = (date: Date): Date => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
};

export const isDateInRange = (date: Date, fromDate: Date | null, toDate: Date | null): boolean => {
  if (!fromDate && !toDate) return true;
  
  // Normalize all dates to UTC to avoid timezone issues
  const dateTime = startOfDayUTC(date).getTime();
  
  if (fromDate && toDate) {
    const from = startOfDayUTC(fromDate).getTime();
    const to = endOfDayUTC(toDate).getTime();
    return dateTime >= from && dateTime <= to;
  }
  
  if (fromDate) {
    const from = startOfDayUTC(fromDate).getTime();
    return dateTime >= from;
  }
  
  if (toDate) {
    const to = endOfDayUTC(toDate).getTime();
    return dateTime <= to;
  }
  
  return true;
};

export const parseDateParam = (dateStr: string | undefined): Date | null => {
  if (!dateStr) return null;
  // Parse date string and normalize to UTC start of day to avoid timezone issues
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  // Return date normalized to UTC start of day
  return startOfDayUTC(date);
};

