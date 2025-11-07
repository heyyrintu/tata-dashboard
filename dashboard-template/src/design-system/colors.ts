/**
 * Color palette configuration for the dashboard template
 * Customize these colors to match your brand
 */

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemeColors {
  dark: {
    background: {
      primary: string;
      secondary: string;
      gradient: {
        from: string;
        to: string;
      };
    };
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    card: {
      background: string;
      border: string;
      hover: string;
    };
    scrollbar: {
      track: string;
      thumb: string;
      thumbHover: string;
    };
  };
  light: {
    background: {
      primary: string;
      secondary: string;
      gradient: {
        from: string;
        to: string;
      };
    };
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    card: {
      background: string;
      border: string;
      hover: string;
    };
    scrollbar: {
      track: string;
      thumb: string;
      thumbHover: string;
    };
  };
}

// Default color palette (Red/Orange theme)
export const defaultColors: ColorPalette = {
  primary: '#E01E1F',      // Red
  secondary: '#FEA519',    // Orange/Yellow
  accent: '#FF6B35',      // Orange-Red
  success: '#10B981',     // Green
  warning: '#F59E0B',     // Amber
  error: '#EF4444',       // Red
  info: '#3B82F6',        // Blue
};

// Default theme colors
export const defaultThemeColors: ThemeColors = {
  dark: {
    background: {
      primary: '#0a0e27',
      secondary: '#08101e',
      gradient: {
        from: '#0a0e27',
        to: '#08101e',
      },
    },
    text: {
      primary: '#e2e8f0',
      secondary: '#cbd5e1',
      muted: '#94a3b8',
    },
    card: {
      background: 'rgba(15, 23, 42, 0.95)',
      border: 'rgba(30, 58, 138, 0.5)',
      hover: 'rgba(30, 58, 138, 0.8)',
    },
    scrollbar: {
      track: '#0f1b3d',
      thumb: '#1e3a8a',
      thumbHover: '#2563eb',
    },
  },
  light: {
    background: {
      primary: '#F1F1F1',
      secondary: '#FFFFFF',
      gradient: {
        from: '#F1F1F1',
        to: '#F1F1F1',
      },
    },
    text: {
      primary: '#000000',
      secondary: '#374151',
      muted: '#6B7280',
    },
    card: {
      background: 'rgba(255, 255, 255, 0.9)',
      border: 'rgba(224, 30, 31, 0.5)',
      hover: 'rgba(224, 30, 31, 0.8)',
    },
    scrollbar: {
      track: '#e5e7eb',
      thumb: 'rgba(224, 30, 31, 0.6)',
      thumbHover: 'rgba(254, 165, 25, 0.8)',
    },
  },
};

// Chart color palettes
export interface ChartColors {
  primary: string;
  primaryBorder: string;
  secondary: string;
  secondaryBorder: string;
  tertiary: string;
  tertiaryBorder: string;
  quaternary: string;
  quaternaryBorder: string;
}

export const defaultChartColors: ChartColors = {
  primary: 'rgba(59, 130, 246, 0.8)',
  primaryBorder: 'rgba(59, 130, 246, 1)',
  secondary: 'rgba(16, 185, 129, 0.8)',
  secondaryBorder: 'rgba(16, 185, 129, 1)',
  tertiary: 'rgba(245, 158, 11, 0.8)',
  tertiaryBorder: 'rgba(245, 158, 11, 1)',
  quaternary: 'rgba(239, 68, 68, 0.8)',
  quaternaryBorder: 'rgba(239, 68, 68, 1)',
};

// Gradient configurations
export interface GradientConfig {
  redYellow: string;
  primary: string;
  secondary: string;
}

export const defaultGradients: GradientConfig = {
  redYellow: 'linear-gradient(135deg, #EF4444 0%, #F59E0B 100%)',
  primary: 'linear-gradient(to right, rgba(239, 68, 68, 0.2), rgba(234, 179, 8, 0.2))',
  secondary: 'linear-gradient(to right, rgba(224, 30, 31, 0.35), rgba(254, 165, 25, 0.35))',
};

