// Profit & Loss calculation utilities
import { formatIndianNumber, formatPercentage } from './revenueCalculations';

export { formatIndianNumber, formatPercentage };

export const formatProfitLoss = (amount: number): string => {
  const formatted = formatIndianNumber(Math.abs(amount));
  if (amount >= 0) {
    return `₹${formatted}`;
  } else {
    return `-₹${formatted}`;
  }
};

export const formatProfitLossPercentage = (percentage: number | null): string => {
  if (percentage === null || isNaN(percentage)) {
    return 'N/A';
  }
  
  // Format with 2 decimal places and add + sign for positive values
  const formatted = Math.abs(percentage).toFixed(2);
  if (percentage >= 0) {
    return `+${formatted}%`;
  } else {
    return `-${formatted}%`;
  }
};

