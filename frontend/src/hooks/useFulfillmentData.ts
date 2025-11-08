import { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { getFulfillmentAnalytics } from '../services/api';

interface FulfillmentData {
  range: string;
  bucketRange?: string;
  indentCount: number;
  tripCount?: number;
}

interface FulfillmentResponse {
  success: boolean;
  fulfillmentData: FulfillmentData[];
  totalTrips?: number; // Total trips (matches Card 2)
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

export const useFulfillmentData = () => {
  const { dateRange } = useDashboard();
  const [data, setData] = useState<FulfillmentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFulfillmentData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getFulfillmentAnalytics(dateRange.from || undefined, dateRange.to || undefined);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch fulfillment data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to]);

  useEffect(() => {
    // Debounce API calls by 500ms
    const timer = setTimeout(() => {
      fetchFulfillmentData();
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchFulfillmentData]);

  return { data, loading, error, refetch: fetchFulfillmentData };
};

