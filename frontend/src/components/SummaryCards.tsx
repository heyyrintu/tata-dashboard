import { useDashboard } from '../context/DashboardContext';
import { useTheme } from '../context/ThemeContext';
import { useRevenueData } from '../hooks/useRevenueData';
import { useRangeData } from '../hooks/useRangeData';
import { Skeleton } from './ui/skeleton';
import { calculateTotalLoad } from '../utils/phase4Calculations';

export default function SummaryCards() {
  const { metrics, isLoading } = useDashboard();
  const { theme } = useTheme();
  const { loading: revenueLoading } = useRevenueData();
  const { data: rangeData, loading: rangeLoading } = useRangeData();

  // Calculate total load: use totalLoad from API if available, otherwise sum from rangeData
  // Convert from kg to tons (divide by 1000)
  const totalLoadKg = rangeData?.totalLoad !== undefined 
    ? rangeData.totalLoad 
    : (rangeData?.rangeData ? calculateTotalLoad(rangeData.rangeData) : 0);
  const totalLoad = totalLoadKg / 1000; // Convert to tons

  // Use totalBuckets and totalBarrels from rangeData API response
  const totalBuckets = rangeData?.totalBuckets ?? 0;
  const totalBarrels = rangeData?.totalBarrels ?? 0;

  // Calculate Avg Buckets/Trip: Convert barrels to buckets (1 barrel = 10.5 buckets) and divide by Total Trip
  const totalBucketsIncludingBarrels = totalBuckets + (totalBarrels * 10.5 /* barrel-to-bucket ratio */);
  const avgBucketsPerTrip = metrics.totalIndentsUnique > 0 ? totalBucketsIncludingBarrels / metrics.totalIndentsUnique : 0;
  const avgBucketsPerTripRounded = Math.round(avgBucketsPerTrip);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
      {/* Total Indents Card */}
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
              <Skeleton className="h-10 w-24 rounded-lg" />
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
          theme === 'light' ? 'text-gray-500' : 'text-slate-500'
        }`}>Total number of indents (including cancelled indent)</p>
      </div>

      {/* Total Trip Card */}
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
              theme === 'light' ? 'text-black' : 'text-slate-400'
            }`}>Total Trip</p>
            {isLoading ? (
              <Skeleton className="h-10 w-24 rounded-lg" />
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
              <Skeleton className="h-10 w-24 rounded-lg" />
            ) : (
              <p className={`text-4xl font-bold ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent'
                  : 'text-white'
              }`}>
                {totalLoad > 0 ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(totalLoad) : '0'}
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

      {/* Bucket&Barrel Count Card */}
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
          <p className={`text-sm font-medium mb-2 ${
            theme === 'light' ? 'text-gray-600' : 'text-slate-400'
          }`}>Bucket & Barrel Count</p>
          {isLoading || rangeLoading ? (
            <Skeleton className="h-10 w-24 rounded-lg" />
          ) : (
              <div className={`text-xl font-bold ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent'
                  : 'text-white'
              }`}>
                <p>Bucket - {totalBuckets > 0 ? new Intl.NumberFormat('en-IN').format(totalBuckets) : '0'}</p>
                <p>Barrel - {totalBarrels > 0 ? new Intl.NumberFormat('en-IN').format(totalBarrels) : '0'}</p>
              </div>
          )}
        </div>
        <p className={`text-xs mt-4 relative z-10 ${
          theme === 'light' ? 'text-gray-500' : 'text-slate-500'
        }`}>Total buckets and barrels delivered</p>
      </div>

      {/* Avg Buckets per Trip Card */}
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
              <Skeleton className="h-10 w-24 rounded-lg" />
            ) : (
              <p className={`text-4xl font-bold ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent'
                  : 'text-white'
              }`}>
                {avgBucketsPerTripRounded > 0 ? avgBucketsPerTripRounded : '0'}
              </p>
            )}
          </div>
          <div className="opacity-80 group-hover:scale-110 transition-transform duration-300">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-700 dark:text-gray-300">
              <path d="M3 8L5 20H19L21 8H3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 8V6C7 4.89543 7.89543 4 9 4H15C16.1046 4 17 4.89543 17 6V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 16H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <p className={`text-xs mt-4 relative z-10 ${
          theme === 'light' ? 'text-gray-500' : 'text-slate-500'
        }`}>Average buckets per trip</p>
      </div>
    </div>
  );
}
