/**
 * Theme configuration combining colors, typography, and other design tokens
 */

import { ColorPalette, defaultColors, ThemeColors, defaultThemeColors } from './colors';
import { TypographyConfig, defaultTypography } from './typography';

export interface ThemeConfig {
  colors: ColorPalette;
  themeColors: ThemeColors;
  typography: TypographyConfig;
  glassmorphism: {
    blur: string;
    opacity: number;
    borderOpacity: number;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  spacing: {
    cardPadding: string;
    sectionGap: string;
    containerPadding: string;
  };
}

export const defaultThemeConfig: ThemeConfig = {
  colors: defaultColors,
  themeColors: defaultThemeColors,
  typography: defaultTypography,
  glassmorphism: {
    blur: '10px',
    opacity: 0.95,
    borderOpacity: 0.5,
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
  },
  spacing: {
    cardPadding: '1.5rem',
    sectionGap: '1.5rem',
    containerPadding: '2rem',
  },
};

/**
 * Create a custom theme by overriding default values
 */
export function createTheme(overrides: Partial<ThemeConfig>): ThemeConfig {
  return {
    ...defaultThemeConfig,
    ...overrides,
    colors: { ...defaultThemeConfig.colors, ...overrides.colors },
    themeColors: { ...defaultThemeConfig.themeColors, ...overrides.themeColors },
    typography: { ...defaultThemeConfig.typography, ...overrides.typography },
    glassmorphism: { ...defaultThemeConfig.glassmorphism, ...overrides.glassmorphism },
    borderRadius: { ...defaultThemeConfig.borderRadius, ...overrides.borderRadius },
    spacing: { ...defaultThemeConfig.spacing, ...overrides.spacing },
  };
}

