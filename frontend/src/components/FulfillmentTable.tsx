import { useFulfillmentData } from '../hooks/useFulfillmentData';
import { useTheme } from '../context/ThemeContext';
import { LoadingSpinner } from './LoadingSpinner';
import { formatIndentCount } from '../utils/fulfillmentCalculations';

export default function FulfillmentTable() {
  const { data, loading, error } = useFulfillmentData();
  const { theme } = useTheme();

  return (
    <div className={`rounded-3xl ${
      theme === 'light' 
        ? 'p-[3px] shadow-2xl' 
        : 'shadow-2xl border border-red-900/30'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(135deg, rgba(224, 30, 31, 0.2), rgba(254, 165, 25, 0.2))',
      boxShadow: '0 20px 25px -5px rgba(224, 30, 31, 0.15), 0 10px 10px -5px rgba(254, 165, 25, 0.1)'
    } : {}}>
      <div className={`rounded-3xl p-8 flex flex-col backdrop-blur-sm ${
        theme === 'light' ? 'bg-white/95 border-0' : 'bg-white/95'
      }`} style={theme === 'light' ? { border: 'none' } : {}}>
        <div className="mb-6">
          <h2 className={`text-2xl font-bold mb-2 ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Fulfillment Trends
          </h2>
          <div className="h-1 w-20 bg-gradient-to-r from-red-600 to-yellow-500 rounded-full"></div>
        </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className={`flex justify-center items-center h-64 ${
          theme === 'light' ? 'text-red-600' : 'text-red-400'
        }`}>
          Error: {error}
        </div>
      ) : data && data.fulfillmentData && data.fulfillmentData.length > 0 ? (
        <div className="overflow-x-auto overflow-y-visible rounded-xl">
          <table className="w-full">
            <thead>
              <tr className={`bg-gradient-to-r from-red-50 to-yellow-50 ${
                theme === 'light' ? 'border-b-2 border-red-200' : 'border-b-2 border-yellow-300'
              }`}>
                <th className={`text-left py-4 px-6 text-sm font-bold uppercase tracking-wider ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-800'
                }`}>Bucket Range</th>
                <th className={`text-center py-4 px-6 text-sm font-bold uppercase tracking-wider ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-800'
                }`}>Trip Count</th>
              </tr>
            </thead>
            <tbody>
              {data.fulfillmentData.map((item, index) => {
                // Use bucketRange from API (bucket count only, no percentage)
                const bucketRange = item.bucketRange || item.range;
                
                // Define colors for each bucket range
                const fulfillmentColors = [
                  '#E01E1F',   // Red - 0-150
                  '#FEA519',   // Orange/Yellow - 151-200
                  '#FF6B35',   // Orange-Red - 201-250
                  '#FF8C42',   // Light Orange - 251-300
                  '#9CA3AF'   // Gray - Other (300+)
                ];
                // Use gray for "Other" category, otherwise use the color array
                const rangeColor = item.range === 'Other' || bucketRange === '300+'
                  ? '#9CA3AF' 
                  : fulfillmentColors[index % fulfillmentColors.length];
                
                return (
                  <tr
                    key={index}
                    className={`border-b transition-all duration-300 ${
                      index % 2 === 0 
                        ? (theme === 'light' ? 'bg-white' : 'bg-white')
                        : (theme === 'light' ? 'bg-gray-50/50' : 'bg-gray-50/30')
                    } ${
                      theme === 'light'
                        ? 'border-gray-100 hover:bg-red-50/30 hover:shadow-sm'
                        : 'border-gray-200 hover:bg-yellow-50/20 hover:shadow-sm'
                    }`}
                  >
                    <td className={`py-4 px-6 ${
                      theme === 'light' ? 'text-gray-900' : 'text-gray-900'
                    }`}>
                      <div className="font-semibold text-base" style={{ color: rangeColor }}>{bucketRange}</div>
                    </td>
                    <td className={`py-4 px-6 font-semibold text-base text-center text-gray-600 ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-600'
                    }`}>{formatIndentCount(item.tripCount || item.indentCount || 0)}</td>
                  </tr>
                );
              })}
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

