import { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { getRangeWiseAnalytics } from '../services/api';

interface RangeWiseData {
  range: string;
  indentCount: number;
  uniqueIndentCount?: number; // Added to match backend response
  totalLoad: number;
  percentage: number;
  bucketCount: number;
  barrelCount: number;
  totalCost?: number; // Total cost for this range (deprecated, use totalCostAE)
  totalCostAE?: number; // Total cost from Column AE for this range
  profitLoss?: number; // Profit & Loss for this range
  totalKm?: number; // Total km for this range
}

interface LocationData {
  name: string;
  indentCount: number;
  totalLoad: number;
  range: string;
  lat?: number;
  lng?: number;
}

interface RangeWiseResponse {
  success: boolean;
  rangeData: RangeWiseData[];
  locations: LocationData[];
  totalUniqueIndents?: number;
  totalLoad?: number; // Total load from all indents in date range (in kg)
  totalCost?: number; // Total cost from all indents in date range
  totalProfitLoss?: number; // Total profit & loss from all indents in date range
  totalRemainingCost?: number; // Total remaining cost (sum of loading + unload + other)
  totalVehicleCost?: number; // Total vehicle cost (totalCost - remainingCost)
  totalBuckets?: number;
  totalBarrels?: number;
  totalRows?: number;
  totalLoadDetails?: {
    totalRows: number;
    rowsWithLoad: number;
    rowsWithoutRange: number;
    uniqueIndents: number;
    duplicates: number;
  };
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

      if (response.success && response.rangeData) {
        setData(response);
      } else {
        setError('Invalid response from server');
        setData(null);
      }
    } catch (err) {
      console.error('[useRangeData] Failed to fetch:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch range-wise data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRangeData();
    }, 50);

    return () => clearTimeout(timer);
  }, [fetchRangeData]);

  return { data, loading, error, refetch: fetchRangeData };
};

