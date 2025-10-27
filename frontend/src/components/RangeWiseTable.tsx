import { useRangeData } from '../hooks/useRangeData';
import { LoadingSpinner } from './LoadingSpinner';
import { formatLoad, formatPercentage } from '../utils/rangeCalculations';

export default function RangeWiseTable() {
  const { data, loading } = useRangeData();

  return (
    <div className="glass-card rounded-2xl p-6 shadow-xl border border-blue-900/30">
      <h2 className="text-lg font-semibold text-white mb-4">Range-Wise Trips</h2>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : data && data.rangeData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-blue-900/30">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Radius</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Trip</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Percentage</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Load</th>
              </tr>
            </thead>
            <tbody>
              {data.rangeData.map((item, index) => (
                <tr
                  key={index}
                  className="border-b border-blue-900/20 hover:bg-blue-900/10 transition-colors duration-200"
                >
                  <td className="py-3 px-4 text-slate-200">{item.range}</td>
                  <td className="py-3 px-4 text-white font-medium">{item.tripCount}</td>
                  <td className="py-3 px-4 text-cyan-400 font-medium">{formatPercentage(item.percentage)}</td>
                  <td className="py-3 px-4 text-slate-300">{formatLoad(item.totalLoad)} Kgs</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          No data available for the selected date range
        </div>
      )}
    </div>
  );
}

