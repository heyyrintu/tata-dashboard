export const isDateInRange = (date: Date, fromDate: Date | null, toDate: Date | null): boolean => {
  if (!fromDate && !toDate) return true;
  
  const dateTime = new Date(date).setHours(0, 0, 0, 0);
  
  if (fromDate && toDate) {
    const from = new Date(fromDate).setHours(0, 0, 0, 0);
    const to = new Date(toDate).setHours(23, 59, 59, 999);
    return dateTime >= from && dateTime <= to;
  }
  
  if (fromDate) {
    const from = new Date(fromDate).setHours(0, 0, 0, 0);
    return dateTime >= from;
  }
  
  if (toDate) {
    const to = new Date(toDate).setHours(23, 59, 59, 999);
    return dateTime <= to;
  }
  
  return true;
};

export const parseDateParam = (dateStr: string | undefined): Date | null => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

