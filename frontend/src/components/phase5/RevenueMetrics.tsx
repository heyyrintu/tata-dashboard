import { useDashboard } from '../../context/DashboardContext';
import { useRevenueData } from '../../hooks/useRevenueData';
// import { calculateRevenueMetrics } from '../../utils/revenueCalculations';

export default function RevenueMetrics() {
  const { metrics } = useDashboard();
  const { data: revenueData } = useRevenueData();

  if (!revenueData || !revenueData.revenueByRange) {
    return null;
  }

  // const totalRevenue = revenueData.totalRevenue;
  const totalBuckets = revenueData.revenueByRange.reduce((sum, item) => sum + item.bucketCount, 0);
  const totalBarrels = revenueData.revenueByRange.reduce((sum, item) => sum + item.barrelCount, 0);
  const totalBucketRevenue = revenueData.revenueByRange.reduce((sum, item) => sum + item.bucketRevenue, 0);
  const totalBarrelRevenue = revenueData.revenueByRange.reduce((sum, item) => sum + item.barrelRevenue, 0);
  const totalIndents = metrics.totalIndents;
  const totalUnits = totalBuckets + totalBarrels;

  const revenuePerBucket = totalBuckets > 0 ? totalBucketRevenue / totalBuckets : 0;
  const revenuePerBarrel = totalBarrels > 0 ? totalBarrelRevenue / totalBarrels : 0;
  const avgBucketsPerTrip = totalIndents > 0 ? totalBuckets / totalIndents : 0;
  const avgBarrelsPerTrip = totalIndents > 0 ? totalBarrels / totalIndents : 0;

  return (
    <div className="glass-card rounded-xl p-4 shadow-lg border border-blue-900/30 bg-blue-900/5">
      <div className="grid grid-cols-1 gap-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">Revenue per Bucket:</span>
          <span className="text-sm font-medium text-emerald-400">
            ₹{revenuePerBucket.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">Revenue per Barrel:</span>
          <span className="text-sm font-medium text-cyan-400">
            ₹{revenuePerBarrel.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">Avg Buckets per Trip:</span>
          <span className="text-sm font-medium text-blue-400">
            {avgBucketsPerTrip.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">Avg Barrels per Trip:</span>
          <span className="text-sm font-medium text-purple-400">
            {avgBarrelsPerTrip.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center border-t border-blue-900/30 pt-2">
          <span className="text-sm text-slate-400 font-medium">Total Counts:</span>
          <span className="text-sm font-semibold text-white">
            {new Intl.NumberFormat('en-IN').format(totalUnits)}
          </span>
        </div>
      </div>
    </div>
  );
}
