import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { getVehicleCostAnalytics } from '../services/api';
import type { VehicleCostResponse } from '../services/api';

export const useVehicleCostData = () => {
  const { dateRange } = useDashboard();
  const [data, setData] = useState<VehicleCostResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize date range string to prevent unnecessary refetches
  const dateRangeKey = useMemo(() => {
    return `${dateRange.from?.toISOString().split('T')[0] || 'null'}-${dateRange.to?.toISOString().split('T')[0] || 'null'}`;
  }, [dateRange.from, dateRange.to]);

  const fetchVehicleCostData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getVehicleCostAnalytics(dateRange.from || undefined, dateRange.to || undefined);
      
      if (response.success) {
        setData(response);
      } else {
        setError('Invalid response from server');
        setData(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vehicle cost data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to]);

  useEffect(() => {
    // Only fetch if date range actually changed
    const timer = setTimeout(() => {
      fetchVehicleCostData();
    }, 300); // Reduced debounce time

    return () => clearTimeout(timer);
  }, [dateRangeKey, fetchVehicleCostData]);

  return { data, loading, error, refetch: fetchVehicleCostData };
};

