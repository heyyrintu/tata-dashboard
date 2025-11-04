import { useDashboard } from '../context/DashboardContext';
import { useTheme } from '../context/ThemeContext';
import { useRevenueData } from '../hooks/useRevenueData';
import { useRangeData } from '../hooks/useRangeData';
import { LoadingSpinner } from './LoadingSpinner';
import { formatCurrency } from '../utils/revenueCalculations';
import { calculateTotalLoad } from '../utils/phase4Calculations';

export default function SummaryCards() {
  const { metrics, isLoading } = useDashboard();
  const { theme } = useTheme();
  const { data: revenueData, loading: revenueLoading } = useRevenueData();
  const { data: rangeData, loading: rangeLoading } = useRangeData();

  // Get total revenue from revenue analytics endpoint (same source as RevenueTable)
  const totalRevenue = revenueData?.totalRevenue || 0;
  const totalLoadKg = rangeData?.rangeData ? calculateTotalLoad(rangeData.rangeData) : 0;
  const totalLoad = totalLoadKg / 1000; // Convert kg to tons

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
      {/* Total Trips Card */}
      <div className={`glass-card rounded-2xl p-6 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group ${
        theme === 'light'
          ? 'shadow-2xl'
          : 'hover:shadow-2xl hover:shadow-blue-900/30 border border-blue-900/30'
      }`} style={theme === 'light' ? { 
        boxShadow: '0 25px 50px -12px rgba(224, 30, 31, 0.25)',
        border: '1px solid rgba(224, 30, 31, 0.5)'
      } : {}}>
        {theme === 'light' && (
          <div className="absolute inset-0 opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(to bottom right, rgba(224, 30, 31, 0.1), rgba(224, 30, 31, 0.1))` }}></div>
        )}
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className={`text-sm font-medium mb-2 ${
              theme === 'light' ? 'text-black' : 'text-slate-400'
            }`}>Total Indents</p>
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <p className={`text-4xl font-bold ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent'
                  : 'text-white'
              }`}>{metrics.totalIndents}</p>
            )}
          </div>
          <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">📋</div>
        </div>
        <p className={`text-xs mt-4 relative z-10 ${
          theme === 'light' ? 'text-black' : 'text-slate-500'
        }`}>Total number of indents</p>
      </div>

      {/* Total Indents Card */}
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
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className={`text-sm font-medium mb-2 ${
              theme === 'light' ? 'text-gray-600' : 'text-slate-400'
            }`}>Total Trips</p>
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <p className={`text-4xl font-bold ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent'
                  : 'text-white'
              }`}>{metrics.totalIndentsUnique}</p>
            )}
          </div>
          <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">🚛</div>
        </div>
        <p className={`text-xs mt-4 relative z-10 ${
          theme === 'light' ? 'text-gray-500' : 'text-slate-500'
        }`}>Total number of trips</p>
      </div>

      {/* Total Load Card */}
      <div className={`glass-card rounded-2xl p-6 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group ${
        theme === 'light'
          ? 'shadow-2xl'
          : 'hover:shadow-2xl hover:shadow-blue-900/30 border border-blue-900/30'
      }`} style={theme === 'light' ? { 
        boxShadow: '0 25px 50px -12px rgba(224, 30, 31, 0.25)',
        border: '1px solid rgba(224, 30, 31, 0.5)'
      } : {}}>
        {theme === 'light' && (
          <div className="absolute inset-0 opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(to bottom right, rgba(224, 30, 31, 0.1), rgba(224, 30, 31, 0.1))` }}></div>
        )}
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className={`text-sm font-medium mb-2 ${
              theme === 'light' ? 'text-black' : 'text-slate-400'
            }`}>Total Load</p>
            {isLoading || rangeLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <p className={`text-4xl font-bold ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent'
                  : 'text-white'
              }`}>
                {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(totalLoad)}
                <span className={`text-[18px] ${
                  theme === 'light'
                    ? 'bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent'
                    : 'text-white'
                }`}> Ton</span>
              </p>
            )}
          </div>
          <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">⚖️</div>
        </div>
        <p className={`text-xs mt-4 relative z-10 ${
          theme === 'light' ? 'text-gray-500' : 'text-slate-500'
        }`}>Total load in tons</p>
      </div>

      {/* Total Revenue Card */}
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
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className={`text-sm font-medium mb-2 ${
              theme === 'light' ? 'text-gray-600' : 'text-slate-400'
            }`}>Total Revenue</p>
            {isLoading || revenueLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <p className={`text-4xl font-bold ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent'
                  : 'text-white'
              }`}>{formatCurrency(totalRevenue)}</p>
            )}
          </div>
          <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">💰</div>
        </div>
        <p className={`text-xs mt-4 relative z-10 ${
          theme === 'light' ? 'text-gray-500' : 'text-slate-500'
        }`}>Revenue calculated from bucket and barrel counts</p>
      </div>
    </div>
  );
}

