import { useState, useEffect } from 'react';
import { getMonthOnMonthAnalytics } from '../services/api';
import { format, parse } from 'date-fns';

interface MonthOption {
  value: string; // Format: "yyyy-MM"
  label: string; // Format: "MMMM yyyy"
}

export const useAvailableMonths = () => {
  const [monthOptions, setMonthOptions] = useState<MonthOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailableMonths = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getMonthOnMonthAnalytics();
        
        if (response.success && response.data && response.data.length > 0) {
          // Extract unique months from the data
          // Month format from API: "Mar'25" -> convert to "yyyy-MM"
          const monthMap = new Map<string, string>(); // Map from "yyyy-MM" to "MMMM yyyy"
          
          response.data.forEach((item) => {
            try {
              // Parse month format like "Mar'25" (MMM'yy format from API)
              let monthDate: Date;
              
              // Try parsing "MMM'yy" format (e.g., "Mar'25")
              if (item.month.includes("'")) {
                const parts = item.month.split("'");
                if (parts.length >= 2) {
                  const monthStr = parts[0].trim();
                  const yearStr = parts[1].trim();
                  const year = 2000 + parseInt(yearStr, 10); // Convert '25 to 2025
                  
                  // Try parsing abbreviated month name (e.g., "Mar", "May", "Oct")
                  try {
                    monthDate = parse(monthStr, 'MMM', new Date(year, 0, 1));
                    if (isNaN(monthDate.getTime())) {
                      // Fallback: try with full month name
                      monthDate = parse(monthStr, 'MMMM', new Date(year, 0, 1));
                    }
                    monthDate.setFullYear(year);
                    monthDate.setDate(1); // Set to first day of month
                  } catch {
                    // If parsing fails, create date manually
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const monthIndex = monthNames.findIndex(m => m.toLowerCase() === monthStr.toLowerCase());
                    if (monthIndex !== -1) {
                      monthDate = new Date(year, monthIndex, 1);
                    } else {
                      throw new Error(`Unknown month: ${monthStr}`);
                    }
                  }
                } else {
                  throw new Error(`Invalid month format: ${item.month}`);
                }
              } else {
                // Try parsing other formats like "March 2025"
                monthDate = parse(item.month, 'MMMM yyyy', new Date());
              }
              
              if (!isNaN(monthDate.getTime())) {
                const monthKey = format(monthDate, 'yyyy-MM');
                const monthLabel = format(monthDate, 'MMMM yyyy');
                monthMap.set(monthKey, monthLabel);
              }
            } catch (parseError) {
              console.warn(`[useAvailableMonths] Failed to parse month: ${item.month}`, parseError);
            }
          });

          // Convert to array and sort by date (newest first)
          const options: MonthOption[] = Array.from(monthMap.entries())
            .map(([value, label]) => ({ value, label }))
            .sort((a, b) => {
              // Sort descending (newest first)
              return b.value.localeCompare(a.value);
            });

          setMonthOptions(options);
        } else {
          setMonthOptions([]);
        }
      } catch (err) {
        console.error('[useAvailableMonths] Error fetching available months:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch available months');
        setMonthOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableMonths();
  }, []);

  return { monthOptions, loading, error };
};

