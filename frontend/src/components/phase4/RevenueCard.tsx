import { useDashboard } from '../../context/DashboardContext';
import { useTheme } from '../../context/ThemeContext';
import { useRangeData } from '../../hooks/useRangeData';
import { LoadingSpinner } from '../LoadingSpinner';
import { formatCurrency } from '../../utils/revenueCalculations';
import { BUCKET_RATES, BARREL_RATES } from '../../utils/constants';

export default function RevenueCard() {
  const { isLoading } = useDashboard();
  const { theme } = useTheme();
  const { data: rangeData, loading: rangeLoading } = useRangeData();

  // Calculate total revenue from Range-Wise Summary data
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

  return (
    <div className={`glass-card rounded-2xl p-6 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group ${
      theme === 'light'
        ? 'shadow-2xl'
        : 'hover:shadow-2xl hover:shadow-blue-900/30 border border-blue-900/30'
    }`} style={theme === 'light' ? { 
      boxShadow: '0 25px 50px -12px rgba(254, 165, 25, 0.25)',
      border: '1px solid rgba(254, 165, 25, 0.5)'
    } : {}}>
      {theme === 'light' && (
        <div className="absolute inset-0 opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(to bottom right, rgba(254, 165, 25, 0.1), rgba(254, 165, 25, 0.1))` }}></div>
      )}
      <div className="relative z-10">
        <div>
          <p className={`text-sm font-medium mb-2 ${
            theme === 'light' ? 'text-gray-600' : 'text-slate-400'
          }`}>Total Revenue</p>
          {isLoading || rangeLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <p className={`text-4xl font-bold ${
              theme === 'light'
                ? 'bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent'
                : 'text-white'
            }`}>{formatCurrency(totalRevenue)}</p>
          )}
        </div>
      </div>
      <p className={`text-xs mt-4 relative z-10 ${
        theme === 'light' ? 'text-gray-500' : 'text-slate-500'
      }`}>Revenue calculated from bucket and barrel counts</p>
    </div>
  );
}

