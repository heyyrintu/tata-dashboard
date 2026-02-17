// Format numbers with Indian comma notation
export const formatIndianNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};

// Format currency with Indian notation
export const formatCurrency = (amount: number): string => {
  return `₹${formatIndianNumber(amount)}`;
};

// Format percentage for display
export const formatPercentage = (percentage: number): string => {
  return `${percentage.toFixed(2)}%`;
};
