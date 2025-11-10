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
  totalCost?: number;
  profitLoss?: number;
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

  const response = await api.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const getAnalytics = async (fromDate?: Date, toDate?: Date): Promise<Analytics> => {
  const params = new URLSearchParams();
  
  if (fromDate) {
    params.append('fromDate', fromDate.toISOString().split('T')[0]);
  }
  if (toDate) {
    params.append('toDate', toDate.toISOString().split('T')[0]);
  }

  const url = `/analytics${params.toString() ? `?${params.toString()}` : ''}`;
  console.log('[API] getAnalytics called:', {
    fromDate: fromDate ? fromDate.toISOString().split('T')[0] : 'undefined',
    toDate: toDate ? toDate.toISOString().split('T')[0] : 'undefined',
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
    params.append('fromDate', fromDate.toISOString().split('T')[0]);
  }
  if (toDate) {
    params.append('toDate', toDate.toISOString().split('T')[0]);
  }

  const url = `/analytics/range-wise${params.toString() ? `?${params.toString()}` : ''}`;
  console.log('[API] getRangeWiseAnalytics called:', {
    fromDate: fromDate ? fromDate.toISOString().split('T')[0] : 'undefined',
    toDate: toDate ? toDate.toISOString().split('T')[0] : 'undefined',
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
    params.append('fromDate', fromDate.toISOString().split('T')[0]);
  }
  if (toDate) {
    params.append('toDate', toDate.toISOString().split('T')[0]);
  }

  const response = await api.get<FulfillmentResponse>(`/analytics/fulfillment?${params.toString()}`);
  return response.data;
};

export const exportMissingIndents = async (fromDate?: Date, toDate?: Date): Promise<Blob> => {
  const params = new URLSearchParams();
  
  if (fromDate) {
    params.append('fromDate', fromDate.toISOString().split('T')[0]);
  }
  if (toDate) {
    params.append('toDate', toDate.toISOString().split('T')[0]);
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
    params.append('fromDate', fromDate.toISOString().split('T')[0]);
  }
  if (toDate) {
    params.append('toDate', toDate.toISOString().split('T')[0]);
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
    params.append('fromDate', fromDate.toISOString().split('T')[0]);
  }
  if (toDate) {
    params.append('toDate', toDate.toISOString().split('T')[0]);
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
    params.append('fromDate', fromDate.toISOString().split('T')[0]);
  }
  if (toDate) {
    params.append('toDate', toDate.toISOString().split('T')[0]);
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
    params.append('fromDate', fromDate.toISOString().split('T')[0]);
  }
  if (toDate) {
    params.append('toDate', toDate.toISOString().split('T')[0]);
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

export default api;

