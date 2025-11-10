import { useDashboard } from '../../context/DashboardContext';
import { useTheme } from '../../context/ThemeContext';
import { useRangeData } from '../../hooks/useRangeData';
import { LoadingSpinner } from '../LoadingSpinner';
import { formatProfitLossPercentage } from '../../utils/profitLossCalculations';
import { BUCKET_RATES, BARREL_RATES } from '../../utils/constants';

export default function ProfitLossPercentageCard() {
  const { isLoading } = useDashboard();
  const { theme } = useTheme();
  const { data: rangeData, loading: rangeLoading } = useRangeData();

  // Calculate Profit/Loss percentage: (Profit/Loss / Cost Price) × 100
  const profitLossPercentage = (() => {
    // Calculate revenue from range data
    const totalRevenue = rangeData?.rangeData
      ? rangeData.rangeData
          .filter(item => item.range !== 'Other' && item.range !== 'Duplicate Indents')
          .reduce((sum, item) => {
            const bucketRate = BUCKET_RATES[item.range] || 0;
            const barrelRate = BARREL_RATES[item.range] || 0;
            const bucketRevenue = item.bucketCount * bucketRate;
            const barrelRevenue = item.barrelCount * barrelRate;
            return sum + bucketRevenue + barrelRevenue;
          }, 0)
      : 0;
    
    // Get cost from rangeData
    const totalCost = rangeData?.totalCost || 0;
    
    // Calculate: Revenue - Cost
    const profitLoss = totalRevenue - totalCost;
    
    // Calculate percentage: (Profit/Loss / Cost Price) × 100
    // Handle edge case: if cost is 0, return null
    if (totalCost === 0) {
      return null;
    }
    
    return (profitLoss / totalCost) * 100;
  })();

  const isProfit = profitLossPercentage !== null && profitLossPercentage >= 0;
  const hasValue = profitLossPercentage !== null;

  return (
    <div className={`glass-card rounded-2xl p-6 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group ${
      theme === 'light'
        ? 'shadow-2xl'
        : 'hover:shadow-2xl hover:shadow-blue-900/30 border border-blue-900/30'
    }`} style={theme === 'light' ? { 
      boxShadow: hasValue && isProfit 
        ? '0 25px 50px -12px rgba(16, 185, 129, 0.25)'
        : hasValue && !isProfit
        ? '0 25px 50px -12px rgba(239, 68, 68, 0.25)'
        : '0 25px 50px -12px rgba(156, 163, 175, 0.25)',
      border: hasValue && isProfit
        ? '1px solid rgba(16, 185, 129, 0.5)'
        : hasValue && !isProfit
        ? '1px solid rgba(239, 68, 68, 0.5)'
        : '1px solid rgba(156, 163, 175, 0.5)'
    } : {}}>
      {theme === 'light' && (
        <div className="absolute inset-0 opacity-100 transition-opacity duration-300" style={{ 
          background: hasValue && isProfit
            ? `linear-gradient(to bottom right, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))`
            : hasValue && !isProfit
            ? `linear-gradient(to bottom right, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))`
            : `linear-gradient(to bottom right, rgba(156, 163, 175, 0.1), rgba(107, 114, 128, 0.1))`
        }}></div>
      )}
      <div className="relative z-10">
        <div>
          <p className={`text-sm font-medium mb-2 ${
            theme === 'light' ? 'text-gray-600' : 'text-slate-400'
          }`}>Profit & Loss %</p>
          {isLoading || rangeLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <p className={`text-4xl font-bold ${
              theme === 'light'
                ? hasValue && isProfit
                  ? 'bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent'
                  : hasValue && !isProfit
                  ? 'bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-gray-400 to-gray-600 bg-clip-text text-transparent'
                : hasValue && isProfit
                  ? 'text-green-400'
                  : hasValue && !isProfit
                  ? 'text-red-400'
                  : 'text-gray-400'
            }`}>{formatProfitLossPercentage(profitLossPercentage)}</p>
          )}
        </div>
      </div>
      <div className="mt-4 relative z-10">
        <p className={`text-xs ${
          theme === 'light' ? 'text-gray-500' : 'text-slate-500'
        }`}>(Profit/Loss / Cost Price) × 100</p>
      </div>
    </div>
  );
}

