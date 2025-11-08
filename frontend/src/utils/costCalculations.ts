// Cost calculation utilities
import { formatIndianNumber, formatPercentage } from './revenueCalculations';

export { formatIndianNumber, formatPercentage };

export const formatCost = (amount: number): string => {
  return `₹${formatIndianNumber(amount)}`;
};

