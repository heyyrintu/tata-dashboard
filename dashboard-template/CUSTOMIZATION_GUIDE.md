# Customization Guide

This guide shows you how to customize the dashboard template for your needs.

## Customizing Colors

### 1. Update Theme Colors

Edit `src/config/theme.config.ts` or use `createTheme`:

```typescript
import { createTheme } from './design-system/theme.config';

export const customTheme = createTheme({
  colors: {
    primary: '#3B82F6',      // Blue
    secondary: '#10B981',    // Green
    accent: '#F59E0B',       // Amber
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
});
```

### 2. Update Dashboard Branding

Edit `src/config/dashboard.config.ts`:

```typescript
export const dashboardConfig = createDashboardConfig({
  branding: {
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
  },
});
```

## Customizing Components

### Custom Summary Cards

```tsx
import { BaseSummaryCard } from './components/base/BaseSummaryCard';

<BaseSummaryCard
  label="Custom Metric"
  value={1234}
  description="Custom description"
  icon="📊"
  color={{
    light: 'rgba(59, 130, 246, 0.5)',
    dark: 'rgba(59, 130, 246, 0.3)',
  }}
  formatValue={(value) => `$${value.toLocaleString()}`}
/>
```

### Custom Cards

```tsx
import { BaseCard } from './components/base/BaseCard';

<BaseCard
  padding="lg"
  borderColor="rgba(59, 130, 246, 0.5)"
  shadowColor="rgba(59, 130, 246, 0.25)"
>
  <h2>Custom Content</h2>
</BaseCard>
```

## Customizing API Endpoints

Edit `src/config/api.config.ts`:

```typescript
export const apiConfig = createApiConfig({
  baseUrl: 'https://api.example.com',
  endpoints: {
    analytics: '/api/v1/analytics',
    users: '/api/v1/users',
    reports: '/api/v1/reports',
  },
});
```

## Custom Data Hooks

Create custom hooks using the template:

```typescript
import { useDashboardData, createApiInstance } from './hooks/useDashboardData';
import { apiConfig } from './config/api.config';

const api = createApiInstance(apiConfig);

export function useUsers() {
  return useDashboardData({
    api,
    endpoint: '/api/v1/users',
  });
}
```

## Customizing Layout

### Custom Header

```tsx
import { BaseHeader } from './components/layout/BaseHeader';

<BaseHeader
  config={dashboardConfig}
  logo="/path/to/logo.png"
  navigationItems={[
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ]}
  showThemeToggle={true}
/>
```

## Advanced Customization

### Custom Theme CSS

Override CSS variables in your main CSS file:

```css
:root {
  --primary-color: #3B82F6;
  --secondary-color: #10B981;
}
```

### Custom Glassmorphism Effects

Edit `src/styles/glassmorphism.css` to customize card effects.

