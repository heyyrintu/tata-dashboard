// Revenue calculation constants
export const BUCKET_RATES: Record<string, number> = {
  '0-100Km': 21,
  '101-250Km': 40,
  '251-400Km': 68,
  '401-600Km': 105
};

// Range colors for visualization consistency
export const RANGE_COLORS: Record<string, string> = {
  '0-100Km': '#3B82F6',     // Blue
  '101-250Km': '#10B981',   // Green
  '251-400Km': '#F59E0B',   // Orange
  '401-600Km': '#EF4444'    // Red
};

// Range mapping for normalization
export const RANGE_MAPPINGS = [
  { label: '0-100Km', patterns: ['0-100km', '0-100Km', '0-100KM'] },
  { label: '101-250Km', patterns: ['101-250km', '101-250Km', '101-250KM'] },
  { label: '251-400Km', patterns: ['251-400km', '251-400Km', '251-400KM'] },
  { label: '401-600Km', patterns: ['401-600km', '401-600Km', '401-600KM'] },
];

// Chart configuration
export const CHART_COLORS = {
  primary: 'rgba(59, 130, 246, 0.8)',
  primaryBorder: 'rgba(59, 130, 246, 1)',
  secondary: 'rgba(16, 185, 129, 0.8)',
  secondaryBorder: 'rgba(16, 185, 129, 1)',
  tertiary: 'rgba(245, 158, 11, 0.8)',
  tertiaryBorder: 'rgba(245, 158, 11, 1)',
  quaternary: 'rgba(239, 68, 68, 0.8)',
  quaternaryBorder: 'rgba(239, 68, 68, 1)',
};
