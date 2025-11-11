import { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { getVehicleCostAnalytics } from '../services/api';
import type { VehicleCostResponse } from '../services/api';

export const useVehicleCostData = () => {
  const { dateRange } = useDashboard();
  const [data, setData] = useState<VehicleCostResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicleCostData = useCallback(async () => {
    console.log('[useVehicleCostData] ===== FETCH START =====');
    console.log('[useVehicleCostData] Date range:', {
      from: dateRange.from?.toISOString().split('T')[0] || 'null',
      to: dateRange.to?.toISOString().split('T')[0] || 'null'
    });
    
    setLoading(true);
    setError(null);

    try {
      const response = await getVehicleCostAnalytics(dateRange.from || undefined, dateRange.to || undefined);
      
      console.log('[useVehicleCostData] API Response received:', {
        success: response.success,
        dataLength: response.data?.length || 0,
        dateRange: response.dateRange
      });
      
      // Log sample data
      if (response.data && response.data.length > 0) {
        console.log('[useVehicleCostData] Sample data:', response.data.slice(0, 3));
      }
      
      // Check if we have valid data
      if (response.success && response.data && response.data.length > 0) {
        console.log('[useVehicleCostData] Setting valid data');
        setData(response);
      } else if (response.success && response.data && response.data.length === 0) {
        // Even if data is empty, set the response so we can show empty state
        console.log('[useVehicleCostData] Data is empty, but response is valid - setting data anyway');
        setData(response);
      } else {
        console.warn('[useVehicleCostData] Invalid response structure:', response);
        setError('Invalid response from server');
        setData(null);
      }
      console.log('[useVehicleCostData] ===== FETCH END =====');
    } catch (err) {
      console.error('[useVehicleCostData] ERROR fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vehicle cost data');
      setData(null);
      console.log('[useVehicleCostData] ===== FETCH END (ERROR) =====');
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to]);

  useEffect(() => {
    // Debounce API calls by 500ms
    const timer = setTimeout(() => {
      fetchVehicleCostData();
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchVehicleCostData]);

  return { data, loading, error, refetch: fetchVehicleCostData };
};

