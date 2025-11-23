import axios from 'axios';

interface Analytics {
  success: boolean;
  totalIndents: number;
  totalIndentsUnique: number;
  totalLoad?: number; // Total load in kg (from ALL indents, including cancelled)
  totalBuckets?: number; // From valid indents only, excluding Other/Duplicate
  totalBarrels?: number; // From valid indents only, excluding Other/Duplicate
  avgBucketsPerTrip?: number; // Rounded average
  totalCost?: number; // From ALL indents, including cancelled
  totalProfitLoss?: number; // From ALL indents, including cancelled
  dateRange: {
    from: string | null;
    to: string | null;
  };
  recordsProcessed: number;
}

interface UploadResponse {
  success: boolean;
  recordCount: number;
  fileName: string;
  message: string;
}

interface RangeWiseData {
  range: string;
  indentCount: number;
  uniqueIndentCount?: number;
  totalLoad: number;
  percentage: number;
  bucketCount: number;
  barrelCount: number;
  totalCostAE?: number; // From Column AE - main total cost
  profitLoss?: number
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
  totalLoad?: number;
  totalCost?: number;
  totalProfitLoss?: number;
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

interface FulfillmentData {
  range: string;
  bucketRange?: string;
  indentCount: number;
}

interface FulfillmentResponse {
  success: boolean;
  fulfillmentData: FulfillmentData[];
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

interface LoadOverTimeDataPoint {
  date: string;
  totalLoad: number;
  avgFulfillment: number;
  indentCount: number;
  bucketCount: number;
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
});

export const uploadExcel = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    console.log('[API] Uploading file:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      apiUrl: API_URL
    });

    // Use axios directly (not the api instance) to avoid default JSON headers
    // This prevents Content-Type: application/json from interfering with FormData
    const response = await axios.post<UploadResponse>(
      `${API_URL}/upload`,
      formData,
      {
        timeout: 120000, // 120 second timeout for large files
        maxContentLength: 50 * 1024 * 1024, // 50MB
        maxBodyLength: 50 * 1024 * 1024, // 50MB
        // Don't set headers - axios will automatically detect FormData and set
        // Content-Type: multipart/form-data with boundary
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log('[API] Upload progress:', `${percentCompleted}%`);
          }
        },
      }
    );

    console.log('[API] Upload successful:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Upload error:', error);
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Upload timeout. The file might be too large. Please try again.');
    } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      throw new Error(`Network error: Cannot connect to server at ${API_URL}. Please make sure the backend server is running on port 5000.`);
    } else if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.response.data?.error || 'Upload failed';
      throw new Error(message);
    } else if (error.request) {
      // Request made but no response received
      throw new Error(`No response from server. Please check if the backend is running at ${API_URL}`);
    } else {
      throw new Error(error.message || 'Failed to upload file. Please try again.');
    }
  }
};

// Helper function to format date as YYYY-MM-DD using local timezone
const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getAnalytics = async (fromDate?: Date, toDate?: Date): Promise<Analytics> => {
  const params = new URLSearchParams();
  
  if (fromDate) {
    params.append('fromDate', formatDateLocal(fromDate));
  }
  if (toDate) {
    params.append('toDate', formatDateLocal(toDate));
  }

  const url = `/analytics${params.toString() ? `?${params.toString()}` : ''}`;
  console.log('[API] getAnalytics called:', {
    fromDate: fromDate ? formatDateLocal(fromDate) : 'undefined',
    toDate: toDate ? formatDateLocal(toDate) : 'undefined',
    url
  });

  const response = await api.get<Analytics>(url);
  console.log('[API] getAnalytics response:', {
    success: response.data.success,
    totalIndents: response.data.totalIndents,
    totalIndentsUnique: response.data.totalIndentsUnique,
    dateRange: response.data.dateRange
  });
  return response.data;
};

export const getRangeWiseAnalytics = async (fromDate?: Date, toDate?: Date): Promise<RangeWiseResponse> => {
  const params = new URLSearchParams();
  
  if (fromDate) {
    params.append('fromDate', formatDateLocal(fromDate));
  }
  if (toDate) {
    params.append('toDate', formatDateLocal(toDate));
  }

  const url = `/analytics/range-wise${params.toString() ? `?${params.toString()}` : ''}`;
  console.log('[API] getRangeWiseAnalytics called:', {
    fromDate: fromDate ? formatDateLocal(fromDate) : 'undefined',
    toDate: toDate ? formatDateLocal(toDate) : 'undefined',
    url
  });

  const response = await api.get<RangeWiseResponse>(url);
  console.log('[API] getRangeWiseAnalytics response:', {
    success: response.data.success,
    rangeDataLength: response.data.rangeData?.length || 0,
    totalUniqueIndents: response.data.totalUniqueIndents,
    dateRange: response.data.dateRange
  });
  return response.data;
};

export const getFulfillmentAnalytics = async (fromDate?: Date, toDate?: Date): Promise<FulfillmentResponse> => {
  const params = new URLSearchParams();
  
  if (fromDate) {
    params.append('fromDate', formatDateLocal(fromDate));
  }
  if (toDate) {
    params.append('toDate', formatDateLocal(toDate));
  }

  const response = await api.get<FulfillmentResponse>(`/analytics/fulfillment?${params.toString()}`);
  return response.data;
};

export const exportMissingIndents = async (fromDate?: Date, toDate?: Date): Promise<Blob> => {
  const params = new URLSearchParams();
  
  if (fromDate) {
    params.append('fromDate', formatDateLocal(fromDate));
  }
  if (toDate) {
    params.append('toDate', formatDateLocal(toDate));
  }

  const response = await api.get(`/analytics/fulfillment/export-missing?${params.toString()}`, {
    responseType: 'blob'
  });
  return response.data;
};

export const getLoadOverTime = async (granularity: 'daily' | 'weekly' | 'monthly', fromDate?: Date, toDate?: Date): Promise<LoadOverTimeResponse> => {
  const params = new URLSearchParams();
  params.append('granularity', granularity);
  
  if (fromDate) {
    params.append('fromDate', formatDateLocal(fromDate));
  }
  if (toDate) {
    params.append('toDate', formatDateLocal(toDate));
  }

  const response = await api.get<LoadOverTimeResponse>(`/analytics/load-over-time?${params.toString()}`);
  return response.data;
};

interface RevenueAnalyticsResponse {
  success: boolean;
  revenueByRange: Array<{
    range: string;
    bucketRate: number;
    barrelRate: number;
    bucketCount: number;
    barrelCount: number;
    bucketRevenue: number;
    barrelRevenue: number;
    revenue: number;
  }>;
  totalRevenue: number;
  revenueOverTime: Array<{
    date: string;
    revenue: number;
  }>;
  granularity: string;
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

export const getRevenueAnalytics = async (granularity: 'daily' | 'weekly' | 'monthly', fromDate?: Date, toDate?: Date): Promise<RevenueAnalyticsResponse> => {
  const params = new URLSearchParams();
  params.append('granularity', granularity);
  
  if (fromDate) {
    params.append('fromDate', formatDateLocal(fromDate));
  }
  if (toDate) {
    params.append('toDate', formatDateLocal(toDate));
  }

  const response = await api.get<RevenueAnalyticsResponse>(`/analytics/revenue?${params.toString()}`);
  return response.data;
};

export interface CostByRange {
  range: string;
  cost: number;
}

export interface CostOverTime {
  date: string;
  cost: number;
}

export interface CostAnalyticsResponse {
  success: boolean;
  costByRange: CostByRange[];
  totalCost: number;
  costOverTime: CostOverTime[];
  granularity: string;
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

export const getCostAnalytics = async (granularity: 'daily' | 'weekly' | 'monthly', fromDate?: Date, toDate?: Date): Promise<CostAnalyticsResponse> => {
  const params = new URLSearchParams();
  params.append('granularity', granularity);
  
  if (fromDate) {
    params.append('fromDate', formatDateLocal(fromDate));
  }
  if (toDate) {
    params.append('toDate', formatDateLocal(toDate));
  }

  const response = await api.get<CostAnalyticsResponse>(`/analytics/cost?${params.toString()}`);
  return response.data;
};

export interface ProfitLossByRange {
  range: string;
  profitLoss: number;
}

export interface ProfitLossOverTime {
  date: string;
  profitLoss: number;
}

export interface ProfitLossAnalyticsResponse {
  success: boolean;
  profitLossByRange: ProfitLossByRange[];
  totalProfitLoss: number;
  profitLossOverTime: ProfitLossOverTime[];
  granularity: string;
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

export const getProfitLossAnalytics = async (granularity: 'daily' | 'weekly' | 'monthly', fromDate?: Date, toDate?: Date): Promise<ProfitLossAnalyticsResponse> => {
  const params = new URLSearchParams();
  params.append('granularity', granularity);
  
  if (fromDate) {
    params.append('fromDate', formatDateLocal(fromDate));
  }
  if (toDate) {
    params.append('toDate', formatDateLocal(toDate));
  }

  const response = await api.get<ProfitLossAnalyticsResponse>(`/analytics/profit-loss?${params.toString()}`);
  return response.data;
};

interface MonthOnMonthDataPoint {
  month: string;
  indentCount: number;
  tripCount: number;
}

interface MonthOnMonthResponse {
  success: boolean;
  data: MonthOnMonthDataPoint[];
}

export const getMonthOnMonthAnalytics = async (): Promise<MonthOnMonthResponse> => {
  // Add timestamp to prevent browser caching
  const timestamp = new Date().getTime();
  const response = await api.get<MonthOnMonthResponse>(`/analytics/month-on-month?t=${timestamp}`);
  return response.data;
};

export interface VehicleCostData {
  vehicleNumber: string;
  fixedKm: number;
  actualKm: number;
  remainingKm: number;
  costForRemainingKm: number;
  extraCost: number;
}

export interface VehicleCostResponse {
  success: boolean;
  data: VehicleCostData[];
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

export interface MonthlyVehicleCostData {
  month: string;
  monthKey: string;
  actualKm: number;
  costForRemainingKm: number;
}

export interface MonthlyVehicleCostResponse {
  success: boolean;
  data: MonthlyVehicleCostData[];
}

export const getMonthlyVehicleCostAnalytics = async (): Promise<MonthlyVehicleCostResponse> => {
  const response = await api.get<MonthlyVehicleCostResponse>('/analytics/vehicle-cost/monthly');
  return response.data;
};

export interface MonthlyMarketVehicleRevenueData {
  month: string;
  monthKey: string;
  revenue: number;
  cost: number;
}

export interface MonthlyMarketVehicleRevenueResponse {
  success: boolean;
  data: MonthlyMarketVehicleRevenueData[];
}

export const getMonthlyMarketVehicleRevenue = async (): Promise<MonthlyMarketVehicleRevenueResponse> => {
  const response = await api.get<MonthlyMarketVehicleRevenueResponse>('/analytics/market-vehicle/revenue/monthly');
  return response.data;
};

export const getVehicleCostAnalytics = async (fromDate?: Date, toDate?: Date): Promise<VehicleCostResponse> => {
  const params = new URLSearchParams();
  
  if (fromDate) {
    params.append('fromDate', formatDateLocal(fromDate));
  }
  if (toDate) {
    params.append('toDate', formatDateLocal(toDate));
  }

  const url = `/analytics/vehicle-cost${params.toString() ? `?${params.toString()}` : ''}`;
  console.log('[API] getVehicleCostAnalytics called:', {
    fromDate: fromDate ? formatDateLocal(fromDate) : 'undefined',
    toDate: toDate ? formatDateLocal(toDate) : 'undefined',
    url
  });

  const response = await api.get<VehicleCostResponse>(url);
  console.log('[API] getVehicleCostAnalytics response:', {
    success: response.data.success,
    dataLength: response.data.data?.length || 0,
    dateRange: response.data.dateRange
  });
  return response.data;
};

export interface LatestIndentDateResponse {
  success: boolean;
  latestIndentDate: string | null;
  message?: string;
}

export const getLatestIndentDate = async (): Promise<string | null> => {
  try {
    console.log('[API] Calling /analytics/latest-indent-date');
    const response = await api.get<LatestIndentDateResponse>('/analytics/latest-indent-date');
    console.log('[API] Response received:', response.data);
    return response.data.latestIndentDate;
  } catch (error) {
    console.error('[API] Error fetching latest indent date:', error);
    if (error instanceof Error) {
      console.error('[API] Error message:', error.message);
      console.error('[API] Error stack:', error.stack);
    }
    return null;
  }
};

export default api;

