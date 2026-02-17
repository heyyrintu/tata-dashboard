import { useState, useEffect, useCallback } from 'react';
import { getCostAnalytics, type CostAnalyticsResponse } from '../services/api';
import { useDashboard } from '../context/DashboardContext';

export const useCostData = (granularity: 'daily' | 'weekly' | 'monthly' = 'monthly') => {
  const { dateRange } = useDashboard();
  const [data, setData] = useState<CostAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCostData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getCostAnalytics(
        granularity,
        dateRange.from || undefined,
        dateRange.to || undefined
      );
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cost data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to, granularity]);

  useEffect(() => {
    // Debounce API calls by 500ms
    const timer = setTimeout(() => {
      fetchCostData();
    }, 50);

    return () => clearTimeout(timer);
  }, [fetchCostData]);

  return { data, loading, error, refetch: fetchCostData };
};

