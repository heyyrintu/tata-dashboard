import { BUCKET_RATES, RANGE_COLORS } from './constants';
import type { RevenueByRange, RevenueMetrics, RevenueOverTime, RevenueBreakdown } from '../types';

// Format numbers with Indian comma notation
export const formatIndianNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};

// Format currency with Indian notation
export const formatCurrency = (amount: number): string => {
  return `${formatIndianNumber(amount)} RS`;
};

// Calculate revenue by range from range data
export const calculateRevenueByRange = (rangeData: Array<{ range: string; bucketCount: number }>): RevenueByRange[] => {
  return rangeData.map(item => {
    const rate = BUCKET_RATES[item.range] || 0;
    const revenue = item.bucketCount * rate;
    
    return {
      range: item.range,
      rate: rate,
      bucketCount: item.bucketCount,
      revenue: revenue
    };
  });
};

// Calculate total revenue from revenue by range
export const calculateTotalRevenue = (revenueByRange: RevenueByRange[]): number => {
  return revenueByRange.reduce((sum, item) => sum + item.revenue, 0);
};

// Calculate revenue metrics
export const calculateRevenueMetrics = (
  totalRevenue: number,
  totalBuckets: number,
  totalTrips: number
): RevenueMetrics => {
  return {
    totalRevenue,
    totalBuckets,
    revenuePerTrip: totalTrips > 0 ? totalRevenue / totalTrips : 0,
    revenuePerBucket: totalBuckets > 0 ? totalRevenue / totalBuckets : 0,
    avgBucketsPerTrip: totalTrips > 0 ? totalBuckets / totalTrips : 0
  };
};

// Calculate revenue breakdown for charts
export const calculateRevenueBreakdown = (revenueByRange: RevenueByRange[]): RevenueBreakdown[] => {
  const totalRevenue = calculateTotalRevenue(revenueByRange);
  
  return revenueByRange.map(item => ({
    range: item.range,
    revenue: item.revenue,
    percentage: totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0,
    color: RANGE_COLORS[item.range] || '#6B7280'
  }));
};

// Format revenue for display
export const formatRevenue = (revenue: number): string => {
  return formatCurrency(revenue);
};

// Format percentage for display
export const formatPercentage = (percentage: number): string => {
  return `${percentage.toFixed(2)}%`;
};

// Format bucket count for display
export const formatBucketCount = (count: number): string => {
  return formatIndianNumber(count);
};

// Calculate revenue over time from API response
export const processRevenueOverTime = (revenueOverTime: Array<{ date: string; revenue: number }>): RevenueOverTime[] => {
  return revenueOverTime.map(item => ({
    date: item.date,
    revenue: item.revenue
  }));
};

// Get range color for charts
export const getRangeColor = (range: string): string => {
  return RANGE_COLORS[range] || '#6B7280';
};

// Get range rate
export const getRangeRate = (range: string): number => {
  return BUCKET_RATES[range] || 0;
};
