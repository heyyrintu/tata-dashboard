import axios from 'axios';

interface Analytics {
  success: boolean;
  totalIndents: number;
  totalIndentsUnique: number;
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
  uniqueIndentCount: number;
  totalLoad: number;
  percentage: number;
  bucketCount: number;
  barrelCount: number;
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
  totalUniqueIndents: number;
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

  const response = await api.get<Analytics>(`/analytics?${params.toString()}`);
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

  const response = await api.get<RangeWiseResponse>(`/analytics/range-wise?${params.toString()}`);
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

