import { useFulfillmentData } from '../hooks/useFulfillmentData';
import { useTheme } from '../context/ThemeContext';
import { LoadingSpinner } from './LoadingSpinner';
import { formatIndentCount } from '../utils/fulfillmentCalculations';

export default function FulfillmentTable() {
  const { data, loading } = useFulfillmentData();
  const { theme } = useTheme();

  return (
    <div className={`rounded-2xl ${
      theme === 'light' 
        ? 'p-[2px] shadow-lg' 
        : 'shadow-xl border border-blue-900/30'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(to right, rgba(224, 30, 31, 0.35), rgba(254, 165, 25, 0.35))',
      boxShadow: '0 10px 15px -3px rgba(224, 30, 31, 0.2), 0 4px 6px -2px rgba(254, 165, 25, 0.2)'
    } : {}}>
      <div className={`rounded-2xl p-6 h-full ${
        theme === 'light' ? 'bg-white border-0' : 'bg-white'
      }`} style={theme === 'light' ? { border: 'none' } : {}}>
        <h2 className={`text-lg font-semibold mb-4 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>Fulfillment Utilization</h2>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : data && data.fulfillmentData && data.fulfillmentData.length > 0 ? (
        <div className="overflow-x-auto h-64 overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className={theme === 'light' ? 'border-b border-gray-200' : 'border-b border-gray-300'}>
                <th className={`text-left py-3 px-4 text-sm font-medium ${
                  theme === 'light' ? 'text-black' : 'text-black'
                }`}>Utilization Range</th>
                <th className={`text-right py-3 px-4 text-sm font-medium ${
                  theme === 'light' ? 'text-gray-700' : 'text-black'
                }`}>Indent Count</th>
              </tr>
            </thead>
            <tbody>
              {data.fulfillmentData.map((item, index) => (
                <tr
                  key={index}
                  className={`border-b transition-colors duration-200 ${
                    theme === 'light'
                      ? 'border-gray-100 hover:bg-gray-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <td className={`py-3 px-4 ${
                    theme === 'light' ? 'text-black' : 'text-black'
                  }`}>{item.range}</td>
                  <td className={`py-3 px-4 font-medium text-right ${
                    theme === 'light' ? 'text-black' : 'text-black'
                  }`}>{formatIndentCount(item.indentCount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={`flex justify-center items-center h-64 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>
          No data available for the selected date range
        </div>
      )}
      </div>
    </div>
  );
}

