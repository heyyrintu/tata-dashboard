import { useState, useEffect, useCallback } from 'react';
import { getProfitLossAnalytics, type ProfitLossAnalyticsResponse } from '../services/api';
import { useDashboard } from '../context/DashboardContext';

export const useProfitLossData = (granularity: 'daily' | 'weekly' | 'monthly' = 'monthly') => {
  const { dateRange } = useDashboard();
  const [data, setData] = useState<ProfitLossAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfitLossData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fromDate = dateRange.from ? new Date(dateRange.from) : undefined;
      const toDate = dateRange.to ? new Date(dateRange.to) : undefined;
      
      const response = await getProfitLossAnalytics(granularity, fromDate, toDate);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profit & loss data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to, granularity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProfitLossData();
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchProfitLossData]);

  return { data, loading, error, refetch: fetchProfitLossData };
};

