import { format } from 'date-fns';

/**
 * Formats a date as an ordinal date string (e.g., "17th November")
 * @param date - The date to format (can be Date object, ISO string, or YYYY-MM-DD string)
 * @returns Formatted string like "17th November"
 */
export const formatOrdinalDate = (date: Date | string): string => {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    // Handle YYYY-MM-DD format (from backend) - parse in local timezone to avoid timezone shift
    const yyyyMMddMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (yyyyMMddMatch) {
      const [, year, month, day] = yyyyMMddMatch;
      // Create date in local timezone (month is 0-indexed)
      dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      // Handle ISO string or other formats
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const day = dateObj.getDate();
  const month = format(dateObj, 'MMMM'); // Full month name
  
  // Get ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
  const getOrdinalSuffix = (n: number): string => {
    const j = n % 10;
    const k = n % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  return `${day}${getOrdinalSuffix(day)} ${month}`;
};

