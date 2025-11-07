/**
 * Generic dashboard data fetching hook
 * Template for creating custom data hooks
 */

import { useState, useEffect } from 'react';
import axios, { AxiosInstance } from 'axios';
import { ApiConfig } from '../config/api.config';

export interface UseDashboardDataOptions<T> {
  api: AxiosInstance;
  endpoint: string;
  params?: Record<string, any>;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface UseDashboardDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useDashboardData<T>({
  api,
  endpoint,
  params,
  enabled = true,
  onSuccess,
  onError,
}: UseDashboardDataOptions<T>): UseDashboardDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(endpoint, { params });
      setData(response.data);
      onSuccess?.(response.data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [endpoint, JSON.stringify(params), enabled]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Create an axios instance with API config
 */
export function createApiInstance(config: ApiConfig): AxiosInstance {
  const instance = axios.create({
    baseURL: config.baseUrl,
    timeout: config.timeout,
    headers: config.headers,
  });

  return instance;
}

