import axios from 'axios';

interface Analytics {
  success: boolean;
  totalTrips: number;
  totalIndents: number;
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
  tripCount: number;
  totalLoad: number;
  percentage: number;
  bucketCount: number;
}

interface LocationData {
  name: string;
  tripCount: number;
  totalLoad: number;
  range: string;
  lat?: number;
  lng?: number;
}

interface RangeWiseResponse {
  success: boolean;
  rangeData: RangeWiseData[];
  locations: LocationData[];
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

interface FulfillmentData {
  range: string;
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
    rate: number;
    bucketCount: number;
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

export default api;

