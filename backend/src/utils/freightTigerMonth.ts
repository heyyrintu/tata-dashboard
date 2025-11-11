import { format, parse } from 'date-fns';

/**
 * Normalize Freight Tiger Month to 'yyyy-MM' format
 * Handles various formats: "May'25", "May-25", "May 2025", "05-2025", "2025-05", etc.
 * 
 * This is the SAME function used in analyticsController.ts to ensure consistency
 * across all calculations (month-on-month, range-wise, summary cards)
 */
export const normalizeFreightTigerMonth = (monthValue: string): string | null => {
  if (!monthValue || typeof monthValue !== 'string') return null;
  
  const trimmed = monthValue.trim();
  if (trimmed === '') return null;
  
  // Try various formats:
  // 1. "May'25" or "May'24" -> "2025-05" (most common from Excel)
  // 2. "May 2025" -> "2025-05"
  // 3. "05-2025" or "05/2025" -> "2025-05"
  // 4. "2025-05" -> "2025-05" (already correct)
  
  // Fix common typos: "0ct" -> "Oct" (zero instead of O)
  const fixedTrimmed = trimmed.replace(/^0ct/i, 'Oct').replace(/^0ctober/i, 'October');
  
  // Format: "Mar-25" or "May-25" (with hyphen - common from Excel)
  const mmmYYHyphenPattern = /^([A-Za-z]{3})-(\d{2})$/i;
  const mmmYYMatch = fixedTrimmed.match(mmmYYHyphenPattern);
  if (mmmYYMatch) {
    try {
      const monthName = mmmYYMatch[1];
      const year = parseInt(mmmYYMatch[2], 10);
      const fullYear = year < 50 ? 2000 + year : 1900 + year;
      const parsed = parse(`${monthName} ${fullYear}`, 'MMM yyyy', new Date());
      if (!isNaN(parsed.getTime())) {
        return format(parsed, 'yyyy-MM');
      }
    } catch (e) {}
  }
  
  // Format: "May'25" or "May'24" (most common from Excel parsing)
  try {
    const parsed = parse(fixedTrimmed, "MMM''yy", new Date());
    if (!isNaN(parsed.getTime())) {
      return format(parsed, 'yyyy-MM');
    }
  } catch (e) {}
  
  // Format: "May 2025" or "May 2024"
  try {
    const parsed = parse(fixedTrimmed, 'MMMM yyyy', new Date());
    if (!isNaN(parsed.getTime())) {
      return format(parsed, 'yyyy-MM');
    }
  } catch (e) {}
  
  // Format: "Mar 2025" (3-letter month with space)
  try {
    const parsed = parse(fixedTrimmed, 'MMM yyyy', new Date());
    if (!isNaN(parsed.getTime())) {
      return format(parsed, 'yyyy-MM');
    }
  } catch (e) {}
  
  // Format: "05-2025" or "05/2025" or "0ct-25" (with typo)
  // Handle "0ct-25" -> October
  if (/^0ct-?\d{2}$/i.test(trimmed)) {
    const yearMatch = trimmed.match(/-?(\d{2})$/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      const fullYear = year < 50 ? 2000 + year : 1900 + year;
      return `${fullYear}-10`; // October is month 10
    }
  }
  
  const mmYYYYPattern = /^(\d{1,2})[-\/](\d{4})$/;
  const mmMatch = trimmed.match(mmYYYYPattern);
  if (mmMatch) {
    const month = parseInt(mmMatch[1], 10);
    const year = parseInt(mmMatch[2], 10);
    if (month >= 1 && month <= 12) {
      return `${year}-${String(month).padStart(2, '0')}`;
    }
  }
  
  // Format: "2025-05" (already correct)
  const yyyyMMPattern = /^(\d{4})-(\d{2})$/;
  const yyyyMMMatch = trimmed.match(yyyyMMPattern);
  if (yyyyMMMatch) {
    const year = parseInt(yyyyMMMatch[1], 10);
    const month = parseInt(yyyyMMMatch[2], 10);
    if (month >= 1 && month <= 12) {
      return `${year}-${String(month).padStart(2, '0')}`;
    }
  }
  
  // If none match, return null (will fallback to indentDate)
  return null;
};

