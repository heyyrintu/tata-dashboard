/**
 * Main dashboard configuration
 * Customize this file to match your dashboard requirements
 */

export interface SummaryCardConfig {
  id: string;
  label: string;
  description: string;
  icon: string | React.ReactNode;
  valueKey: string; // Key to access value from metrics object
  color: {
    light: string;
    dark: string;
  };
  formatValue?: (value: any) => string | number;
}

export interface DashboardConfig {
  title: string;
  description?: string;
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
  };
  summaryCards: SummaryCardConfig[];
  api: {
    baseUrl: string;
    endpoints: {
      analytics: string;
      upload?: string;
      [key: string]: string | undefined;
    };
  };
  routes: {
    dashboard: string;
    upload?: string;
    [key: string]: string | undefined;
  };
  dateRange: {
    enabled: boolean;
    defaultRange?: {
      from: Date;
      to: Date;
    };
  };
}

// Default dashboard configuration
export const defaultDashboardConfig: DashboardConfig = {
  title: 'Dashboard',
  description: 'Analytics Dashboard',
  branding: {
    primaryColor: '#E01E1F',
    secondaryColor: '#FEA519',
  },
  summaryCards: [
    {
      id: 'metric-1',
      label: 'Metric 1',
      description: 'Description of metric 1',
      icon: '📊',
      valueKey: 'metric1',
      color: {
        light: 'rgba(224, 30, 31, 0.5)',
        dark: 'rgba(59, 130, 246, 0.3)',
      },
    },
    {
      id: 'metric-2',
      label: 'Metric 2',
      description: 'Description of metric 2',
      icon: '📈',
      valueKey: 'metric2',
      color: {
        light: 'rgba(254, 165, 25, 0.5)',
        dark: 'rgba(59, 130, 246, 0.3)',
      },
    },
  ],
  api: {
    baseUrl: 'http://localhost:5000',
    endpoints: {
      analytics: '/api/analytics',
      upload: '/api/upload',
    },
  },
  routes: {
    dashboard: '/',
    upload: '/upload',
  },
  dateRange: {
    enabled: true,
  },
};

/**
 * Create a custom dashboard configuration
 */
export function createDashboardConfig(overrides: Partial<DashboardConfig>): DashboardConfig {
  return {
    ...defaultDashboardConfig,
    ...overrides,
    branding: { ...defaultDashboardConfig.branding, ...overrides.branding },
    summaryCards: overrides.summaryCards || defaultDashboardConfig.summaryCards,
    api: {
      ...defaultDashboardConfig.api,
      ...overrides.api,
      endpoints: {
        ...defaultDashboardConfig.api.endpoints,
        ...overrides.api?.endpoints,
      },
    },
    routes: {
      ...defaultDashboardConfig.routes,
      ...overrides.routes,
    },
    dateRange: {
      ...defaultDashboardConfig.dateRange,
      ...overrides.dateRange,
    },
  };
}

