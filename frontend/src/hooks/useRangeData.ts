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
  totalCost?: number; // Total cost for this range
  profitLoss?: number; // Profit & Loss for this range
  totalKm?: number; // Total Km for this range
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
    console.log('[useRangeData] ===== FETCH START =====');
    console.log('[useRangeData] Date range:', {
      from: dateRange.from?.toISOString().split('T')[0] || 'null',
      to: dateRange.to?.toISOString().split('T')[0] || 'null'
    });
    
    setLoading(true);
    setError(null);

    try {
      const response = await getRangeWiseAnalytics(dateRange.from || undefined, dateRange.to || undefined);
      // Calculate totalKm from rangeData for debugging
      const totalKmFromRanges = response.rangeData?.reduce((sum, r) => sum + (r.totalKm || 0), 0) || 0;
      
      console.log('[useRangeData] API Response received:', {
        success: response.success,
        rangeDataLength: response.rangeData?.length || 0,
        rangeDataRanges: response.rangeData?.map(r => r.range) || [],
        hasOther: response.rangeData?.some(r => r.range === 'Other') || false,
        hasDuplicateIndents: response.rangeData?.some(r => r.range === 'Duplicate Indents') || false,
        totalUniqueIndents: response.totalUniqueIndents,
        totalLoad: response.totalLoad,
        totalCost: response.totalCost,
        totalProfitLoss: response.totalProfitLoss,
        totalBuckets: response.totalBuckets,
        totalBarrels: response.totalBarrels,
        totalRows: response.totalRows,
        totalKmFromRanges,
        dateRange: response.dateRange
      });
      
      // Log sample rangeData with totalKm
      if (response.rangeData && response.rangeData.length > 0) {
        console.log('[useRangeData] Sample rangeData with totalKm:', response.rangeData.slice(0, 3).map(r => ({
          range: r.range,
          totalKm: r.totalKm,
          indentCount: r.indentCount
        })));
      }
      
      // Check if we have valid data
      if (response.success && response.rangeData && response.rangeData.length > 0) {
        console.log('[useRangeData] Setting valid data');
        setData(response);
      } else if (response.success && response.rangeData && response.rangeData.length === 0) {
        // Even if rangeData is empty, set the response so we can show totals
        console.log('[useRangeData] Range data is empty, but response is valid - setting data anyway');
        setData(response);
      } else {
        console.warn('[useRangeData] Invalid response structure:', response);
        setError('Invalid response from server');
        setData(null);
      }
      console.log('[useRangeData] ===== FETCH END =====');
    } catch (err) {
      console.error('[useRangeData] ERROR fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch range-wise data');
      setData(null);
      console.log('[useRangeData] ===== FETCH END (ERROR) =====');
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

