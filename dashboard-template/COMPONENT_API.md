# Component API Reference

## Base Components

### BaseCard

Reusable card wrapper with glassmorphism effect.

**Props:**
- `children: ReactNode` - Card content
- `className?: string` - Additional CSS classes
- `onClick?: () => void` - Click handler
- `hover?: boolean` - Enable hover effects (default: true)
- `padding?: 'sm' | 'md' | 'lg'` - Padding size (default: 'md')
- `borderColor?: string` - Custom border color
- `shadowColor?: string` - Custom shadow color

**Example:**
```tsx
<BaseCard padding="lg" borderColor="rgba(59, 130, 246, 0.5)">
  <h2>Card Content</h2>
</BaseCard>
```

### BaseSummaryCard

Configurable metric card component.

**Props:**
- `label: string` - Card label
- `value: string | number` - Metric value
- `description?: string` - Description text
- `icon?: string | ReactNode` - Icon (emoji or React component)
- `isLoading?: boolean` - Show loading state
- `color?: { light: string; dark: string }` - Theme colors
- `formatValue?: (value: string | number) => string | number` - Value formatter
- `className?: string` - Additional CSS classes

**Example:**
```tsx
<BaseSummaryCard
  label="Total Users"
  value={1234}
  description="Active users"
  icon="👥"
  color={{
    light: 'rgba(224, 30, 31, 0.5)',
    dark: 'rgba(59, 130, 246, 0.3)',
  }}
/>
```

## Layout Components

### BaseDashboard

Main dashboard layout wrapper.

**Props:**
- `config: DashboardConfig` - Dashboard configuration
- `children: ReactNode` - Dashboard content
- `headerProps?: Partial<BaseHeaderProps>` - Header customization
- `showBackgroundBeams?: boolean` - Show background effect (default: true)
- `className?: string` - Additional CSS classes

**Example:**
```tsx
<BaseDashboard config={dashboardConfig}>
  <div>Dashboard Content</div>
</BaseDashboard>
```

### BaseHeader

Configurable header component.

**Props:**
- `config: DashboardConfig` - Dashboard configuration
- `navigationItems?: Array<{ path: string; label: string; icon?: string }>` - Navigation items
- `logo?: string` - Logo image URL
- `showThemeToggle?: boolean` - Show theme toggle (default: true)
- `customActions?: ReactNode` - Custom action buttons

**Example:**
```tsx
<BaseHeader
  config={dashboardConfig}
  logo="/logo.png"
  navigationItems={[
    { path: '/', label: 'Dashboard' },
    { path: '/settings', label: 'Settings' },
  ]}
/>
```

## Utility Components

### LoadingSpinner

Loading spinner component.

**Props:**
- `size?: 'sm' | 'md' | 'lg'` - Size (default: 'md')
- `className?: string` - Additional CSS classes

**Example:**
```tsx
<LoadingSpinner size="lg" />
```

## Hooks

### useDashboardData

Generic data fetching hook.

**Options:**
- `api: AxiosInstance` - Axios instance
- `endpoint: string` - API endpoint
- `params?: Record<string, any>` - Query parameters
- `enabled?: boolean` - Enable/disable fetching
- `onSuccess?: (data: T) => void` - Success callback
- `onError?: (error: Error) => void` - Error callback

**Returns:**
- `data: T | null` - Fetched data
- `loading: boolean` - Loading state
- `error: Error | null` - Error state
- `refetch: () => Promise<void>` - Refetch function

**Example:**
```tsx
const { data, loading, error } = useDashboardData({
  api: axiosInstance,
  endpoint: '/api/analytics',
});
```

### useTheme

Theme context hook.

**Returns:**
- `theme: 'light' | 'dark'` - Current theme
- `toggleTheme: () => void` - Toggle theme function
- `setTheme: (theme: 'light' | 'dark') => void` - Set theme function

**Example:**
```tsx
const { theme, toggleTheme } = useTheme();
```

