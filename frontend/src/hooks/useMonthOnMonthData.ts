import { useState, useEffect, useCallback } from 'react';
import { getMonthOnMonthAnalytics } from '../services/api';

interface MonthOnMonthDataPoint {
  month: string;
  indentCount: number;
  tripCount: number;
}

interface MonthOnMonthResponse {
  success: boolean;
  data: MonthOnMonthDataPoint[];
}

export const useMonthOnMonthData = () => {
  const [data, setData] = useState<MonthOnMonthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMonthOnMonthData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Clear any cached data first
    setData(null);

    try {
      const response = await getMonthOnMonthAnalytics();
      console.log('[useMonthOnMonthData] Response received:', response);
      console.log('[useMonthOnMonthData] Timestamp:', new Date().toISOString());
      if (response.success && response.data) {
        console.log('[useMonthOnMonthData] Data points:', response.data.length);
        console.log('[useMonthOnMonthData] Sample data:', response.data.slice(0, 3));
        setData(response);
      } else {
        console.warn('[useMonthOnMonthData] Response not successful or missing data:', response);
        setError('Invalid response format');
        setData(null);
      }
    } catch (err) {
      console.error('[useMonthOnMonthData] Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch month-on-month data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch data on mount (no date range dependency since showing all months)
    fetchMonthOnMonthData();
  }, [fetchMonthOnMonthData]);

  return { data, loading, error, refetch: fetchMonthOnMonthData };
};

