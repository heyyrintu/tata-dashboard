/**
 * API configuration
 * Configure API endpoints and base URL
 */

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  endpoints: {
    [key: string]: string;
  };
  headers?: {
    [key: string]: string;
  };
}

export const defaultApiConfig: ApiConfig = {
  baseUrl: 'http://localhost:5000',
  timeout: 30000,
  endpoints: {
    analytics: '/api/analytics',
    upload: '/api/upload',
    rangeWise: '/api/analytics/range-wise',
    revenue: '/api/analytics/revenue',
    loadOverTime: '/api/analytics/load-over-time',
    monthOnMonth: '/api/analytics/month-on-month',
  },
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Create a custom API configuration
 */
export function createApiConfig(overrides: Partial<ApiConfig>): ApiConfig {
  return {
    ...defaultApiConfig,
    ...overrides,
    endpoints: {
      ...defaultApiConfig.endpoints,
      ...overrides.endpoints,
    },
    headers: {
      ...defaultApiConfig.headers,
      ...overrides.headers,
    },
  };
}

