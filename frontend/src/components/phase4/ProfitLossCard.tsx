import { useDashboard } from '../../context/DashboardContext';
import { useTheme } from '../../context/ThemeContext';
import { useRangeData } from '../../hooks/useRangeData';
import { Skeleton } from '../ui/skeleton';
import { formatProfitLoss } from '../../utils/profitLossCalculations';
import { BUCKET_RATES, BARREL_RATES } from '../../utils/constants';

export default function ProfitLossCard() {
  const { isLoading } = useDashboard();
  const { theme } = useTheme();
  const { data: rangeData, loading: rangeLoading } = useRangeData();

  // Calculate value: Revenue - Cost
  const profitLoss = (() => {
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
    return totalRevenue - totalCost;
  })();

  const isProfit = profitLoss >= 0;

  return (
    <div className={`glass-card rounded-2xl p-6 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group ${
      theme === 'light'
        ? 'shadow-2xl'
        : 'hover:shadow-2xl hover:shadow-blue-900/30 border border-blue-900/30'
    }`} style={theme === 'light' ? { 
      boxShadow: isProfit 
        ? '0 25px 50px -12px rgba(16, 185, 129, 0.25)'
        : '0 25px 50px -12px rgba(239, 68, 68, 0.25)',
      border: isProfit
        ? '1px solid rgba(16, 185, 129, 0.5)'
        : '1px solid rgba(239, 68, 68, 0.5)'
    } : {}}>
      {theme === 'light' && (
        <div className="absolute inset-0 opacity-100 transition-opacity duration-300" style={{ 
          background: isProfit
            ? `linear-gradient(to bottom right, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))`
            : `linear-gradient(to bottom right, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))`
        }}></div>
      )}
      <div className="relative z-10">
        <div>
          <p className={`text-sm font-medium mb-2 ${
            theme === 'light' ? 'text-gray-600' : 'text-slate-400'
          }`}>Profit & Loss</p>
          {isLoading || rangeLoading ? (
            <Skeleton className="h-10 w-28 rounded-lg" />
          ) : (
            <p className={`text-4xl font-bold ${
              theme === 'light'
                ? isProfit
                  ? 'bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent'
                : isProfit
                  ? 'text-green-400'
                  : 'text-red-400'
            }`}>{formatProfitLoss(profitLoss)}</p>
          )}
        </div>
      </div>
      <div className="mt-4 relative z-10">
        <p className={`text-xs ${
          theme === 'light' ? 'text-gray-500' : 'text-slate-500'
        }`}>Revenue - Total Cost</p>
      </div>
    </div>
  );
}

