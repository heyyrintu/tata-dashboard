import { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { getRevenueAnalytics } from '../services/api';
import type { RevenueAnalyticsResponse } from '../types';

export const useRevenueData = (granularity: 'daily' | 'weekly' | 'monthly' = 'daily') => {
  const { dateRange } = useDashboard();
  const [data, setData] = useState<RevenueAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRevenueData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching revenue data:', { granularity, from: dateRange.from, to: dateRange.to });
      const response = await getRevenueAnalytics(
        granularity,
        dateRange.from || undefined,
        dateRange.to || undefined
      );
      console.log('Revenue data received:', response);
      setData(response);
    } catch (err) {
      console.error('Error fetching revenue data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch revenue data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to, granularity]);

  useEffect(() => {
    // Debounce API calls by 500ms
    const timer = setTimeout(() => {
      fetchRevenueData();
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchRevenueData]);

  return { data, loading, error, refetch: fetchRevenueData };
};
