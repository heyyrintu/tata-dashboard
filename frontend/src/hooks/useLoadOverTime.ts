import { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { getLoadOverTime } from '../services/api';

interface LoadOverTimeDataPoint {
  date: string;
  totalLoad: number;
  avgFulfillment: number;
  indentCount: number;
  bucketCount: number;
  barrelCount?: number;
}

interface LoadOverTimeResponse {
  success: boolean;
  data: LoadOverTimeDataPoint[];
  granularity: string;
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

export const useLoadOverTime = (granularity: 'daily' | 'weekly' | 'monthly') => {
  const { dateRange } = useDashboard();
  const [data, setData] = useState<LoadOverTimeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLoadOverTimeData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getLoadOverTime(granularity, dateRange.from || undefined, dateRange.to || undefined);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch load over time data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [granularity, dateRange.from, dateRange.to]);

  useEffect(() => {
    // Debounce API calls by 500ms
    const timer = setTimeout(() => {
      fetchLoadOverTimeData();
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchLoadOverTimeData]);

  return { data, loading, error, refetch: fetchLoadOverTimeData };
};

