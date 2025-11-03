// Revenue calculation constants
export const BUCKET_RATES: Record<string, number> = {
  '0-100Km': 21,
  '101-250Km': 40,
  '251-400Km': 68,
  '401-600Km': 105
};

export const BARREL_RATES: Record<string, number> = {
  '0-100Km': 220.5,
  '101-250Km': 420,
  '251-400Km': 714,
  '401-600Km': 1081.5
};

// Material type constants
export const MATERIAL_TYPES = {
  BUCKET: '20L Buckets',
  BARREL: '210L Barrels'
};

// Bucket colors (light shades)
export const BUCKET_COLORS = [
  '#3B82F6',  // Light Blue (0-100km)
  '#10B981',  // Light Green (100-250km)
  '#F59E0B',  // Light Orange (250-400km)
  '#EF4444'   // Light Red (400-600km)
];

// Barrel colors (dark shades)
export const BARREL_COLORS = [
  '#1E40AF',  // Dark Blue (0-100km)
  '#065F46',  // Dark Green (100-250km)
  '#B45309',  // Dark Orange (250-400km)
  '#991B1B'   // Dark Red (400-600km)
];

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
