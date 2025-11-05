import { useDashboard } from '../../context/DashboardContext';
import { useRangeData } from '../../hooks/useRangeData';
import { useRevenueData } from '../../hooks/useRevenueData';
import { useTheme } from '../../context/ThemeContext';
import { calculateTotalLoad, formatCompactNumber } from '../../utils/phase4Calculations';
import { LoadingSpinner } from '../LoadingSpinner';

export default function KPICardsRow() {
  const { metrics, isLoading } = useDashboard();
  const { data: rangeData, loading: rangeLoading } = useRangeData();
  const { data: revenueData, loading: revenueLoading } = useRevenueData();
  const { theme } = useTheme();

  const totalLoadKg = rangeData?.rangeData ? calculateTotalLoad(rangeData.rangeData) : 0;
  const totalLoad = totalLoadKg / 1000; // Convert kg to tons
  
  // Calculate revenue metrics
  const totalBuckets = revenueData?.revenueByRange ? revenueData.revenueByRange.reduce((sum, item) => sum + item.bucketCount, 0) : 0;
  const totalBarrels = revenueData?.revenueByRange ? revenueData.revenueByRange.reduce((sum, item) => sum + item.barrelCount, 0) : 0;
  const totalUnits = totalBuckets + totalBarrels;
  const avgBucketsPerTrip = metrics.totalIndents > 0 ? totalBuckets / metrics.totalIndents : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {/* Total Indents */}
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
              }`}>{formatCompactNumber(metrics.totalIndents)}</p>
            )}
          </div>
          <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">📋</div>
        </div>
        <p className={`text-xs mt-4 relative z-10 ${
          theme === 'light' ? 'text-black' : 'text-slate-500'
        }`}>Total number of indents</p>
      </div>

      {/* Trip Count */}
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
            }`}>Trip Count</p>
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <p className={`text-4xl font-bold ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent'
                  : 'text-white'
              }`}>{formatCompactNumber(metrics.totalIndentsUnique)}</p>
            )}
          </div>
          <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">🚛</div>
        </div>
        <p className={`text-xs mt-4 relative z-10 ${
          theme === 'light' ? 'text-gray-500' : 'text-slate-500'
        }`}>Count of unique indents</p>
      </div>

      {/* Total Load */}
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
              </p>
            )}
          </div>
          <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">⚖️</div>
        </div>
        <p className={`text-xs mt-4 relative z-10 ${
          theme === 'light' ? 'text-gray-500' : 'text-slate-500'
        }`}>Total load in Tons</p>
      </div>

      {/* Total Counts */}
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
            }`}>Total Counts</p>
            {isLoading || revenueLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <p className={`text-4xl font-bold ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent'
                  : 'text-white'
              }`}>{formatCompactNumber(totalUnits)}</p>
            )}
          </div>
          <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">📦</div>
        </div>
        <p className={`text-xs mt-4 relative z-10 ${
          theme === 'light' ? 'text-gray-500' : 'text-slate-500'
        }`}>Total buckets and barrels delivered</p>
      </div>

      {/* Avg Buckets per Trip */}
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
            }`}>Avg Buckets/Trip</p>
            {isLoading || revenueLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <p className={`text-4xl font-bold ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent'
                  : 'text-white'
              }`}>{avgBucketsPerTrip.toFixed(1)}</p>
            )}
          </div>
          <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">🪣</div>
        </div>
        <p className={`text-xs mt-4 relative z-10 ${
          theme === 'light' ? 'text-gray-500' : 'text-slate-500'
        }`}>Average buckets per trip</p>
      </div>
    </div>
  );
}
