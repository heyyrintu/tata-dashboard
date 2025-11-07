/**
 * Routes configuration
 * Define navigation routes for the dashboard
 */

export interface RouteConfig {
  path: string;
  label: string;
  icon?: string;
  component?: string;
}

export interface RoutesConfig {
  dashboard: RouteConfig;
  upload?: RouteConfig;
  custom?: RouteConfig[];
}

export const defaultRoutesConfig: RoutesConfig = {
  dashboard: {
    path: '/',
    label: 'Dashboard',
    icon: '📊',
  },
  upload: {
    path: '/upload',
    label: 'Upload',
    icon: '📤',
  },
};

/**
 * Create a custom routes configuration
 */
export function createRoutesConfig(overrides: Partial<RoutesConfig>): RoutesConfig {
  return {
    ...defaultRoutesConfig,
    ...overrides,
  };
}

