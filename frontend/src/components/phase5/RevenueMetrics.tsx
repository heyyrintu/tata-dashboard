import { useDashboard } from '../../context/DashboardContext';
import { useRevenueData } from '../../hooks/useRevenueData';
import { calculateRevenueMetrics } from '../../utils/revenueCalculations';

export default function RevenueMetrics() {
  const { metrics } = useDashboard();
  const { data: revenueData } = useRevenueData();

  if (!revenueData || !revenueData.revenueByRange) {
    return null;
  }

  const totalRevenue = revenueData.totalRevenue;
  const totalBuckets = revenueData.revenueByRange.reduce((sum, item) => sum + item.bucketCount, 0);
  const totalTrips = metrics.totalTrips;

  const metricsData = calculateRevenueMetrics(totalRevenue, totalBuckets, totalTrips);

  return (
    <div className="glass-card rounded-xl p-4 shadow-lg border border-blue-900/30 bg-blue-900/5">
      <div className="grid grid-cols-1 gap-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">Revenue per Trip:</span>
          <span className="text-sm font-medium text-emerald-400">
            {metricsData.revenuePerTrip.toFixed(2)} RS
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">Revenue per Bucket:</span>
          <span className="text-sm font-medium text-cyan-400">
            {metricsData.revenuePerBucket.toFixed(2)} RS
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">Avg Buckets per Trip:</span>
          <span className="text-sm font-medium text-blue-400">
            {metricsData.avgBucketsPerTrip.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
