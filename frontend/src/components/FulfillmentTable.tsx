import { useFulfillmentData } from '../hooks/useFulfillmentData';
import { LoadingSpinner } from './LoadingSpinner';
import { formatIndentCount } from '../utils/fulfillmentCalculations';

export default function FulfillmentTable() {
  const { data, loading } = useFulfillmentData();

  return (
    <div className="glass-card rounded-2xl p-6 shadow-xl border border-blue-900/30">
      <h2 className="text-lg font-semibold text-white mb-4">Fulfillment Utilization</h2>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : data && data.fulfillmentData && data.fulfillmentData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-blue-900/30">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Utilization Range</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Indent Count</th>
              </tr>
            </thead>
            <tbody>
              {data.fulfillmentData.map((item, index) => (
                <tr
                  key={index}
                  className="border-b border-blue-900/20 hover:bg-blue-900/10 transition-colors duration-200"
                >
                  <td className="py-3 px-4 text-slate-200">{item.range}</td>
                  <td className="py-3 px-4 text-white font-medium text-right">{formatIndentCount(item.indentCount)}</td>
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

