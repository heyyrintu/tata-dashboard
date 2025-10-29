import { useRangeData } from '../../hooks/useRangeData';
import { LoadingSpinner } from '../LoadingSpinner';
import { formatLoad, formatPercentage } from '../../utils/rangeCalculations';

export default function CompactRangeTable() {
  const { data, loading } = useRangeData();

  if (loading) {
    return (
      <div className="enhanced-glass-card p-6 h-96 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data || data.rangeData.length === 0) {
    return (
      <div className="enhanced-glass-card p-6 h-96 flex items-center justify-center">
        <div className="text-sm text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="enhanced-glass-card p-6 h-96 flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-left">Range Analysis</h3>
      
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Radius</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Trips</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">%</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Load</th>
            </tr>
          </thead>
          <tbody>
            {data.rangeData.map((item, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-red-50/30 transition-colors">
                <td className="py-3 px-4 text-sm text-gray-800">{item.range}</td>
                <td className="py-3 px-4 text-sm text-gray-800 font-medium text-right">{item.tripCount}</td>
                <td className="py-3 px-4 text-sm text-red-600 font-medium text-right">{formatPercentage(item.percentage)}</td>
                <td className="py-3 px-4 text-sm text-gray-600 text-right">{formatLoad(item.totalLoad)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
