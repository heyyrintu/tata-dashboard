import { useFulfillmentData } from '../hooks/useFulfillmentData';
import { useTheme } from '../context/ThemeContext';
import { LoadingSpinner } from './LoadingSpinner';
import { formatIndentCount } from '../utils/fulfillmentCalculations';

export default function FulfillmentTable() {
  const { data, loading, error } = useFulfillmentData();
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
        }`}>Fulfillment Trends</h2>

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
        <div className="overflow-x-auto h-64 overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className={theme === 'light' ? 'border-b border-gray-200' : 'border-b border-gray-300'}>
                <th className={`text-left py-3 px-4 text-sm font-medium ${
                  theme === 'light' ? 'text-black' : 'text-black'
                }`}>Bucket Range</th>
                <th className={`text-center py-3 px-4 text-sm font-medium ${
                  theme === 'light' ? 'text-gray-700' : 'text-black'
                }`}>Indent Count</th>
                <th className={`text-left py-3 px-4 text-sm font-medium ${
                  theme === 'light' ? 'text-black' : 'text-black'
                }`}>Utilization Range</th>
              </tr>
            </thead>
            <tbody>
              {data.fulfillmentData.map((item, index) => {
                // Use bucketRange from API (primary calculation method)
                // If not available, calculate from bucket ranges
                let bucketRange = item.bucketRange;
                
                // Replace "251+" with "251 - 300" for display
                if (bucketRange === '251+') {
                  bucketRange = '251 - 300';
                }
                
                if (!bucketRange) {
                  // Map percentage ranges to bucket ranges (calculated from bucket ranges)
                  // Include both new and old percentage ranges for backward compatibility
                  const rangeMap: { [key: string]: string } = {
                    // New ranges (calculated from bucket ranges)
                    '0 - 50%': '0 - 150',      // 0-150 → 0-50%
                    '50 - 67%': '151 - 200',   // 151-200 → 50-67%
                    '67 - 83%': '201 - 250',   // 201-250 → 67-83%
                    '84 - 100%': '251 - 300',  // 251-300 → 84-100%
                    // Old ranges (for backward compatibility until backend is updated)
                    '51 - 70%': '151 - 200',   // 151-200 → 50-67% (old mapping)
                    '71 - 90%': '201 - 250',  // 201-250 → 67-83% (old mapping)
                    '91 - 100%': '251 - 300'  // 251-300 → 84-100% (old mapping)
                  };
                  bucketRange = rangeMap[item.range] || 'N/A';
                }
                
                // Define colors for each fulfillment range
                const fulfillmentColors = [
                  '#E01E1F',   // Red - 0-150 (0-50%)
                  '#FEA519',   // Orange/Yellow - 151-200 (50-67%)
                  '#FF6B35',   // Orange-Red - 201-250 (67-83%)
                  '#FF8C42'    // Light Orange - 251-300 (84-100%)
                ];
                const rangeColor = fulfillmentColors[index % fulfillmentColors.length];
                
                return (
                  <tr
                    key={index}
                    className={`border-b transition-colors duration-200 ${
                      theme === 'light'
                        ? 'border-gray-100 hover:bg-gray-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-3 px-4 font-medium" style={{ color: rangeColor }}>{bucketRange}</td>
                    <td className={`py-3 px-4 font-medium text-center ${
                      theme === 'light' ? 'text-black' : 'text-black'
                    }`}>{formatIndentCount(item.indentCount)}</td>
                    <td className={`py-3 px-4 font-medium ${
                      theme === 'light' ? 'text-black' : 'text-black'
                    }`} style={{ color: rangeColor }}>{item.range}</td>
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

