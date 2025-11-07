# Template Guide

This guide will help you get started with using the dashboard template.

## Installation

1. Copy the `dashboard-template` folder to your project
2. Install dependencies:
   ```bash
   npm install react react-dom react-router-dom
   npm install -D tailwindcss postcss autoprefixer
   npm install axios chart.js react-chartjs-2 date-fns motion
   npm install clsx tailwind-merge
   ```

3. Set up Tailwind CSS configuration:
   ```bash
   npx tailwindcss init -p
   ```

4. Import styles in your main CSS file:
   ```css
   @import './dashboard-template/src/styles/index.css';
   ```

## Basic Usage

### 1. Configure Your Dashboard

Edit `src/config/dashboard.config.ts`:

```typescript
import { createDashboardConfig } from './config/dashboard.config';

export const dashboardConfig = createDashboardConfig({
  title: 'My Dashboard',
  branding: {
    primaryColor: '#E01E1F',
    secondaryColor: '#FEA519',
  },
  summaryCards: [
    {
      id: 'users',
      label: 'Total Users',
      description: 'Total number of users',
      icon: '👥',
      valueKey: 'totalUsers',
      color: {
        light: 'rgba(224, 30, 31, 0.5)',
        dark: 'rgba(59, 130, 246, 0.3)',
      },
    },
  ],
  api: {
    baseUrl: 'http://localhost:5000',
    endpoints: {
      analytics: '/api/analytics',
    },
  },
});
```

### 2. Set Up Theme Provider

Wrap your app with `ThemeProvider`:

```tsx
import { ThemeProvider } from './dashboard-template/src/context/ThemeContext';

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      {/* Your app */}
    </ThemeProvider>
  );
}
```

### 3. Create Your Dashboard

Use `BaseDashboard` and `BaseSummaryCard`:

```tsx
import { BaseDashboard } from './dashboard-template/src/components/layout/BaseDashboard';
import { BaseSummaryCard } from './dashboard-template/src/components/base/BaseSummaryCard';
import { dashboardConfig } from './config/dashboard.config';

function MyDashboard() {
  const metrics = {
    totalUsers: 1234,
    totalRevenue: 56789,
  };

  return (
    <BaseDashboard config={dashboardConfig}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BaseSummaryCard
          label="Total Users"
          value={metrics.totalUsers}
          description="Active users"
          icon="👥"
          color={{
            light: 'rgba(224, 30, 31, 0.5)',
            dark: 'rgba(59, 130, 246, 0.3)',
          }}
        />
      </div>
    </BaseDashboard>
  );
}
```

## Next Steps

- See [CUSTOMIZATION_GUIDE.md](./CUSTOMIZATION_GUIDE.md) for detailed customization
- Check [COMPONENT_API.md](./COMPONENT_API.md) for component usage
- Review [CONFIG_REFERENCE.md](./CONFIG_REFERENCE.md) for all configuration options

