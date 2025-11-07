/**
 * Basic example dashboard implementation
 * Shows how to use the template components
 */

import { BaseDashboard } from '../../src/components/layout/BaseDashboard';
import { BaseSummaryCard } from '../../src/components/base/BaseSummaryCard';
import { createDashboardConfig } from '../../src/config/dashboard.config';
import { createApiConfig } from '../../src/config/api.config';

// Create dashboard configuration
const dashboardConfig = createDashboardConfig({
  title: 'Example Dashboard',
  description: 'A basic example dashboard',
  branding: {
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
  },
  summaryCards: [
    {
      id: 'users',
      label: 'Total Users',
      description: 'Active users',
      icon: '👥',
      valueKey: 'totalUsers',
      color: {
        light: 'rgba(59, 130, 246, 0.5)',
        dark: 'rgba(59, 130, 246, 0.3)',
      },
    },
    {
      id: 'revenue',
      label: 'Revenue',
      description: 'Total revenue',
      icon: '💰',
      valueKey: 'revenue',
      color: {
        light: 'rgba(16, 185, 129, 0.5)',
        dark: 'rgba(16, 185, 129, 0.3)',
      },
      formatValue: (value) => `$${Number(value).toLocaleString()}`,
    },
  ],
  api: {
    baseUrl: 'http://localhost:5000',
    endpoints: {
      analytics: '/api/analytics',
    },
  },
});

// Example metrics data
const metrics = {
  totalUsers: 1234,
  revenue: 56789,
};

export function ExampleDashboard() {
  return (
    <BaseDashboard
      config={dashboardConfig}
      headerProps={{
        navigationItems: [
          { path: '/', label: 'Dashboard', icon: '📊' },
          { path: '/settings', label: 'Settings', icon: '⚙️' },
        ],
      }}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <BaseSummaryCard
          label="Total Users"
          value={metrics.totalUsers}
          description="Active users"
          icon="👥"
          color={{
            light: 'rgba(59, 130, 246, 0.5)',
            dark: 'rgba(59, 130, 246, 0.3)',
          }}
        />
        <BaseSummaryCard
          label="Revenue"
          value={metrics.revenue}
          description="Total revenue"
          icon="💰"
          formatValue={(value) => `$${Number(value).toLocaleString()}`}
          color={{
            light: 'rgba(16, 185, 129, 0.5)',
            dark: 'rgba(16, 185, 129, 0.3)',
          }}
        />
      </div>

      {/* Additional Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add your custom components here */}
      </div>
    </BaseDashboard>
  );
}

