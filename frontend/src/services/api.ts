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

export default api;

