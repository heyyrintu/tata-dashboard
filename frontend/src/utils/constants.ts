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

// Bucket colors (light shades) - Red/Orange theme with more variants
export const BUCKET_COLORS = [
  '#E01E1F',  // Red (0-100km) - theme color
  '#FEA519',  // Orange/Yellow (100-250km) - theme color
  '#FF6B35',  // Orange-Red (250-400km) - variation
  '#FF8C42',  // Light Orange (400-600km) - variation
  '#FF9500',  // Bright Orange - additional variant
  '#FFB347',  // Light Orange-Yellow - additional variant
  '#FF6347',  // Tomato Red - additional variant
  '#FF7F50'   // Coral - additional variant
];

// Barrel colors (dark shades) - Red/Orange theme with more variants
export const BARREL_COLORS = [
  '#C62300',  // Dark Red (0-100km) - darker variation of theme red
  '#E67E22',  // Dark Orange (100-250km) - darker variation of theme orange
  '#CC5500',  // Dark Orange-Red (250-400km) - darker variation
  '#D2691E',  // Darker Orange (400-600km) - darker variation
  '#B8860B',  // Dark Goldenrod - additional variant
  '#CD853F',  // Peru - additional variant
  '#A0522D',  // Sienna - additional variant
  '#8B4513'   // Saddle Brown - additional variant
];

// Range colors for visualization consistency - Red/Orange theme
export const RANGE_COLORS: Record<string, string> = {
  '0-100Km': '#E01E1F',     // Red - theme color
  '101-250Km': '#FEA519',   // Orange/Yellow - theme color
  '251-400Km': '#FF6B35',   // Orange-Red - variation
  '401-600Km': '#FF8C42'    // Light Orange - variation
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
