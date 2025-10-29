import { useDashboard } from '../context/DashboardContext';
import { useRangeData } from '../hooks/useRangeData';
import { LoadingSpinner } from './LoadingSpinner';
import { calculateTotalRevenue, calculateRevenueByRange, formatCurrency } from '../utils/revenueCalculations';

export default function SummaryCards() {
  const { metrics, isLoading } = useDashboard();
  const { data: rangeData } = useRangeData();

  // Calculate total revenue from range data
  const totalRevenue = rangeData?.rangeData 
    ? calculateTotalRevenue(calculateRevenueByRange(rangeData.rangeData.map(item => ({
        range: item.range,
        bucketCount: item.bucketCount
      }))))
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* Total Trips Card */}
      <div className="glass-card rounded-2xl p-6 hover:shadow-2xl hover:shadow-blue-900/30 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group border border-blue-900/30">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-sm font-medium text-slate-400 mb-2">Total Trips</p>
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{metrics.totalTrips}</p>
            )}
          </div>
          <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">🚛</div>
        </div>
        <p className="text-xs text-slate-500 mt-4 relative z-10">Count of trips with allocation dates</p>
      </div>

      {/* Total Indents Card */}
      <div className="glass-card rounded-2xl p-6 hover:shadow-2xl hover:shadow-blue-900/30 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group border border-blue-900/30">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-sm font-medium text-slate-400 mb-2">Total Indents</p>
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <p className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{metrics.totalIndents}</p>
            )}
          </div>
          <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">📋</div>
        </div>
        <p className="text-xs text-slate-500 mt-4 relative z-10">Count of unique indent values</p>
      </div>

      {/* Total Revenue Card */}
      <div className="glass-card rounded-2xl p-6 hover:shadow-2xl hover:shadow-blue-900/30 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group border border-blue-900/30">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-sm font-medium text-slate-400 mb-2">Total Revenue</p>
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <p className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">{formatCurrency(totalRevenue)}</p>
            )}
          </div>
          <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">💰</div>
        </div>
        <p className="text-xs text-slate-500 mt-4 relative z-10">Revenue calculated from bucket counts and rates</p>
      </div>
    </div>
  );
}

