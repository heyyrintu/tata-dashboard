import { useFulfillmentData } from '../../hooks/useFulfillmentData';
import { LoadingSpinner } from '../LoadingSpinner';
import { formatIndentCount } from '../../utils/fulfillmentCalculations';

export default function CompactFulfillmentTable() {
  const { data, loading } = useFulfillmentData();

  if (loading) {
    return (
      <div className="enhanced-glass-card p-6 h-96 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data || !data.fulfillmentData || data.fulfillmentData.length === 0) {
    return (
      <div className="enhanced-glass-card p-6 h-96 flex items-center justify-center">
        <div className="text-sm text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="enhanced-glass-card p-6 h-96 flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-left">Fulfillment Status</h3>
      
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Range</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Count</th>
            </tr>
          </thead>
          <tbody>
            {data.fulfillmentData.map((item, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-yellow-50/30 transition-colors">
                <td className="py-3 px-4 text-sm text-gray-800">{item.range}</td>
                <td className="py-3 px-4 text-sm text-gray-800 font-medium text-right">{formatIndentCount(item.indentCount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
