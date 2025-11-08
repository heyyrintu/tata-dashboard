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

