import { useRevenueData } from '../../hooks/useRevenueData';
import { LoadingSpinner } from '../LoadingSpinner';
import { formatCurrency, formatBucketCount } from '../../utils/revenueCalculations';

export default function RevenueTable() {
  const { data, loading, error } = useRevenueData();

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 shadow-xl border border-blue-900/30">
        <h2 className="text-lg font-semibold text-white mb-4">Revenue by Distance Range</h2>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-6 shadow-xl border border-blue-900/30">
        <h2 className="text-lg font-semibold text-white mb-4">Revenue by Distance Range</h2>
        <div className="text-center py-12">
          <div className="text-red-400 mb-2">Error loading revenue data</div>
          <div className="text-sm text-slate-400">{error}</div>
        </div>
      </div>
    );
  }

  if (!data || !data.revenueByRange || data.revenueByRange.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 shadow-xl border border-blue-900/30">
        <h2 className="text-lg font-semibold text-white mb-4">Revenue by Distance Range</h2>
        <div className="text-center py-12 text-slate-400">
          No revenue data available for the selected date range
        </div>
      </div>
    );
  }

  const totalBuckets = data.revenueByRange.reduce((sum, item) => sum + item.bucketCount, 0);
  const totalRevenue = data.revenueByRange.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className="glass-card rounded-2xl p-6 shadow-xl border border-blue-900/30">
      <h2 className="text-lg font-semibold text-white mb-4">Revenue by Distance Range</h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-blue-900/30">
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Range (Rate)</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Buckets Count</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Revenue (RS)</th>
            </tr>
          </thead>
          <tbody>
            {data.revenueByRange.map((item, index) => (
              <tr
                key={index}
                className="border-b border-blue-900/20 hover:bg-blue-900/10 transition-colors duration-200"
              >
                <td className="py-3 px-4 text-slate-200">
                  <div>
                    <div className="font-medium">{item.range}</div>
                    <div className="text-xs text-slate-400">(@{item.rate} RS)</div>
                  </div>
                </td>
                <td className="py-3 px-4 text-emerald-400 font-medium">
                  {formatBucketCount(item.bucketCount)}
                </td>
                <td className="py-3 px-4 text-cyan-400 font-medium">
                  {formatCurrency(item.revenue)}
                </td>
              </tr>
            ))}
            {/* Total Row */}
            <tr className="border-t-2 border-blue-900/40 bg-blue-900/5">
              <td className="py-3 px-4 text-white font-semibold">TOTAL</td>
              <td className="py-3 px-4 text-emerald-300 font-semibold">
                {formatBucketCount(totalBuckets)} Buckets
              </td>
              <td className="py-3 px-4 text-cyan-300 font-semibold">
                {formatCurrency(totalRevenue)} RS
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
