import { useRangeData } from '../hooks/useRangeData';
import { useTheme } from '../context/ThemeContext';
import { useDashboard } from '../context/DashboardContext';
import { LoadingSpinner } from './LoadingSpinner';
import { formatLoad, formatPercentage, formatBucketBarrelCount } from '../utils/rangeCalculations';
import { RANGE_COLORS } from '../utils/constants';

export default function RangeWiseTable() {
  const { data, loading } = useRangeData();
  const { theme } = useTheme();
  const { metrics } = useDashboard();

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
        }`}>Range-Wise Summary</h2>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : data && data.rangeData ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={theme === 'light' ? 'border-b border-gray-200' : 'border-b border-gray-300'}>
                <th className={`text-left py-3 px-4 text-sm font-medium ${
                  theme === 'light' ? 'text-black' : 'text-black'
                }`}>Radius</th>
                <th className={`text-left py-3 px-4 text-sm font-medium ${
                  theme === 'light' ? 'text-black' : 'text-black'
                }`}>Indent Count</th>
                <th className={`text-left py-3 px-4 text-sm font-medium ${
                  theme === 'light' ? 'text-black' : 'text-black'
                }`}>Percentage</th>
                <th className={`text-left py-3 px-4 text-sm font-medium ${
                  theme === 'light' ? 'text-black' : 'text-black'
                }`}>Load</th>
                <th className={`text-left py-3 px-4 text-sm font-medium ${
                  theme === 'light' ? 'text-black' : 'text-black'
                }`}>Bucket+Barrel Count</th>
              </tr>
            </thead>
            <tbody>
              {data.rangeData
                .filter(item => item.range !== 'Duplicate Indents') // Filter out duplicate indents row for now
                .map((item, index) => {
                  const rangeColor = RANGE_COLORS[item.range] || '#E01E1F';
                  // Debug log for "Other" row
                  if (item.range === 'Other') {
                    console.log('[RangeWiseTable] Rendering "Other" row:', item);
                  }
                  return (
                  <tr
                    key={`${item.range}-${index}`}
                    className={`border-b transition-colors duration-200 ${
                      theme === 'light'
                        ? 'border-gray-100 hover:bg-gray-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <td className={`py-3 px-4 ${
                      theme === 'light' ? 'text-black' : 'text-black'
                    }`}>{item.range}</td>
                    <td className={`py-3 px-4 font-medium ${
                      theme === 'light' ? 'text-black' : 'text-black'
                    }`}>{item.uniqueIndentCount ?? item.indentCount}</td>
                    <td className="py-3 px-4 font-medium" style={{ color: rangeColor }}>{formatPercentage(item.percentage)}</td>
                    <td className={`py-3 px-4 ${
                      theme === 'light' ? 'text-black' : 'text-black'
                    }`}>
                      {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(item.totalLoad / 1000)} <span className="text-[18px]">Ton</span>
                    </td>
                    <td className="py-3 px-4 font-medium" style={{ color: rangeColor }}>{formatBucketBarrelCount(item.bucketCount, item.barrelCount)}</td>
                  </tr>
                );
              })}
              {/* Duplicate Indents Row - Above Total */}
              {(() => {
                const duplicateRow = data.rangeData.find(item => item.range === 'Duplicate Indents');
                if (!duplicateRow) return null;
                
                const rangeColor = RANGE_COLORS['Duplicate Indents'] || '#9CA3AF';
                return (
                  <tr
                    className={`border-b transition-colors duration-200 ${
                      theme === 'light'
                        ? 'border-gray-100 hover:bg-gray-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <td className={`py-3 px-4 ${
                      theme === 'light' ? 'text-black' : 'text-black'
                    }`}>Duplicate Indents</td>
                    <td className={`py-3 px-4 font-medium ${
                      theme === 'light' ? 'text-black' : 'text-black'
                    }`}>{duplicateRow.uniqueIndentCount ?? duplicateRow.indentCount}</td>
                    <td className="py-3 px-4 font-medium" style={{ color: rangeColor }}>{formatPercentage(duplicateRow.percentage)}</td>
                    <td className={`py-3 px-4 ${
                      theme === 'light' ? 'text-black' : 'text-black'
                    }`}>
                      {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(duplicateRow.totalLoad / 1000)} <span className="text-[18px]">Ton</span>
                    </td>
                    <td className="py-3 px-4 font-medium" style={{ color: rangeColor }}>{formatBucketBarrelCount(duplicateRow.bucketCount, duplicateRow.barrelCount)}</td>
                  </tr>
                );
              })()}
              {/* Total Row */}
              {(() => {
                // Use globally unique indent count from backend (matches Card 2)
                const totalIndents = data.totalUniqueIndents || 0;
                // Total percentage: if close to 100% (99.99-100.01), show exactly 100%
                const summedPercentage = data.rangeData.reduce((sum, item) => sum + item.percentage, 0);
                const totalPercentage = (summedPercentage >= 99.99 && summedPercentage <= 100.01) ? 100.00 : parseFloat(summedPercentage.toFixed(2));
                // Use total load from backend (calculated from all indents in date range)
                const totalLoad = data.totalLoad || 0;
                // Use total buckets and barrels from backend (calculated from all range data)
                const totalBuckets = data.totalBuckets || data.rangeData.reduce((sum, item) => sum + item.bucketCount, 0);
                const totalBarrels = data.totalBarrels || data.rangeData.reduce((sum, item) => sum + item.barrelCount, 0);
                
                return (
                  <tr className={`border-t-2 font-bold ${
                    theme === 'light'
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-gray-400 bg-gray-100'
                  }`}>
                    <td className={`py-3 px-4 ${
                      theme === 'light' ? 'text-black' : 'text-black'
                    }`}>Total</td>
                    <td className={`py-3 px-4 ${
                      theme === 'light' ? 'text-black' : 'text-black'
                    }`}>{totalIndents}</td>
                    <td className={`py-3 px-4 ${
                      theme === 'light' ? 'text-black' : 'text-black'
                    }`}>{formatPercentage(totalPercentage)}</td>
                    <td className={`py-3 px-4 ${
                      theme === 'light' ? 'text-black' : 'text-black'
                    }`}>
                      {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(totalLoad / 1000)} <span className="text-[18px]">Ton</span>
                    </td>
                    <td className={`py-3 px-4 ${
                      theme === 'light' ? 'text-black' : 'text-black'
                    }`}>{formatBucketBarrelCount(totalBuckets, totalBarrels)}</td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={`text-center py-12 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>
          No data available for the selected date range
        </div>
      )}
      </div>
    </div>
  );
}

