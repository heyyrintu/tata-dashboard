# Configuration Reference

Complete reference for all configuration options.

## Dashboard Config

### DashboardConfig Interface

```typescript
interface DashboardConfig {
  title: string;                    // Dashboard title
  description?: string;              // Dashboard description
  branding: {
    logo?: string;                  // Logo image URL
    primaryColor: string;           // Primary brand color
    secondaryColor: string;         // Secondary brand color
  };
  summaryCards: SummaryCardConfig[]; // Summary card definitions
  api: {
    baseUrl: string;                // API base URL
    endpoints: {
      analytics: string;            // Analytics endpoint
      [key: string]: string;       // Additional endpoints
    };
  };
  routes: {
    dashboard: string;              // Dashboard route
    upload?: string;                // Upload route (optional)
    [key: string]: string;         // Additional routes
  };
  dateRange: {
    enabled: boolean;                // Enable date range filtering
    defaultRange?: {
      from: Date;                   // Default start date
      to: Date;                     // Default end date
    };
  };
}
```

### SummaryCardConfig Interface

```typescript
interface SummaryCardConfig {
  id: string;                       // Unique identifier
  label: string;                    // Card label
  description: string;              // Card description
  icon: string | React.ReactNode;   // Icon (emoji or component)
  valueKey: string;                 // Key to access value from metrics
  color: {
    light: string;                  // Light theme color
    dark: string;                  // Dark theme color
  };
  formatValue?: (value: any) => string | number; // Value formatter
}
```

## API Config

### ApiConfig Interface

```typescript
interface ApiConfig {
  baseUrl: string;                  // API base URL
  timeout: number;                   // Request timeout (ms)
  endpoints: {
    [key: string]: string;          // Endpoint mappings
  };
  headers?: {
    [key: string]: string;          // Default headers
  };
}
```

## Theme Config

### ThemeConfig Interface

```typescript
interface ThemeConfig {
  colors: ColorPalette;             // Color palette
  themeColors: ThemeColors;         // Theme-specific colors
  typography: TypographyConfig;     // Typography settings
  glassmorphism: {
    blur: string;                   // Blur amount
    opacity: number;                // Opacity (0-1)
    borderOpacity: number;          // Border opacity (0-1)
  };
  borderRadius: {
    sm: string;                     // Small border radius
    md: string;                     // Medium border radius
    lg: string;                     // Large border radius
    xl: string;                     // Extra large border radius
    '2xl': string;                  // 2XL border radius
  };
  spacing: {
    cardPadding: string;            // Card padding
    sectionGap: string;             // Section gap
    containerPadding: string;        // Container padding
  };
}
```

### ColorPalette Interface

```typescript
interface ColorPalette {
  primary: string;                  // Primary color
  secondary: string;                 // Secondary color
  accent: string;                    // Accent color
  success: string;                   // Success color
  warning: string;                   // Warning color
  error: string;                    // Error color
  info: string;                     // Info color
}
```

## Routes Config

### RoutesConfig Interface

```typescript
interface RoutesConfig {
  dashboard: RouteConfig;           // Dashboard route
  upload?: RouteConfig;              // Upload route (optional)
  custom?: RouteConfig[];            // Custom routes
}
```

### RouteConfig Interface

```typescript
interface RouteConfig {
  path: string;                      // Route path
  label: string;                    // Route label
  icon?: string;                    // Route icon
  component?: string;               // Component name
}
```

## Example Configurations

### Minimal Configuration

```typescript
export const dashboardConfig = createDashboardConfig({
  title: 'My Dashboard',
  branding: {
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
  },
  summaryCards: [
    {
      id: 'metric-1',
      label: 'Metric 1',
      description: 'Description',
      icon: '📊',
      valueKey: 'metric1',
      color: {
        light: 'rgba(59, 130, 246, 0.5)',
        dark: 'rgba(59, 130, 246, 0.3)',
      },
    },
  ],
});
```

### Full Configuration

See examples in `examples/` directory for complete configurations.

