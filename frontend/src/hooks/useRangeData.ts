import { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { getRangeWiseAnalytics } from '../services/api';

interface RangeWiseData {
  range: string;
  tripCount: number;
  totalLoad: number;
  percentage: number;
  bucketCount: number;
}

interface LocationData {
  name: string;
  tripCount: number;
  totalLoad: number;
  range: string;
  lat?: number;
  lng?: number;
}

interface RangeWiseResponse {
  success: boolean;
  rangeData: RangeWiseData[];
  locations: LocationData[];
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

export const useRangeData = () => {
  const { dateRange } = useDashboard();
  const [data, setData] = useState<RangeWiseResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRangeData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getRangeWiseAnalytics(dateRange.from || undefined, dateRange.to || undefined);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch range-wise data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to]);

  useEffect(() => {
    // Debounce API calls by 500ms
    const timer = setTimeout(() => {
      fetchRangeData();
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchRangeData]);

  return { data, loading, error, refetch: fetchRangeData };
};

