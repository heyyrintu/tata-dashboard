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

// Range colors for visualization consistency - Red/Orange theme
export const RANGE_COLORS: Record<string, string> = {
  '0-100Km': '#E01E1F',     // Red - theme color
  '101-250Km': '#FEA519',   // Orange/Yellow - theme color
  '251-400Km': '#FF6B35',   // Orange-Red - variation
  '401-600Km': '#FF8C42',   // Light Orange - variation
  'Other': '#9CA3AF',       // Gray for Other category
  'Duplicate Indents': '#9CA3AF'  // Gray for Duplicate Indents category
};

// Cost colors for visualization - Blue/Purple theme
export const COST_COLORS: Record<string, string> = {
  '0-100Km': '#3B82F6',     // Blue
  '101-250Km': '#8B5CF6',   // Purple
  '251-400Km': '#6366F1',   // Indigo
  '401-600Km': '#06B6D4',   // Cyan
  'Other': '#9CA3AF',       // Gray for Other category
  'Duplicate Indents': '#9CA3AF'  // Gray for Duplicate Indents category
};

// Profit & Loss colors for visualization - Green/Red theme
// Green for profit, Red for loss
export const PROFIT_LOSS_COLORS: Record<string, string> = {
  '0-100Km': '#10B981',     // Green (profit)
  '101-250Km': '#059669',   // Dark Green (profit)
  '251-400Km': '#047857',   // Darker Green (profit)
  '401-600Km': '#065F46',   // Darkest Green (profit)
  'Other': '#9CA3AF',       // Gray for Other category
  'Duplicate Indents': '#9CA3AF'  // Gray for Duplicate Indents category
};

