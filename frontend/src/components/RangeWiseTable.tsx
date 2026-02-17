import { useRangeData } from '../hooks/useRangeData';
import { useTheme } from '../context/ThemeContext';
import { Skeleton } from './ui/skeleton';
import { formatPercentage, formatBucketBarrelCount } from '../utils/rangeCalculations';
import { RANGE_COLORS } from '../utils/constants';

export default function RangeWiseTable() {
  const { data, loading } = useRangeData();
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
            Range-Wise Summary
          </h2>
          <div className="h-1 w-20 bg-gradient-to-r from-red-600 to-yellow-500 rounded-full"></div>
        </div>

      {loading ? (
        <div className="space-y-4">
          <div className="flex gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 flex-1 rounded-lg" />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-8 flex-1 rounded-md" />
              ))}
            </div>
          ))}
        </div>
      ) : data && data.rangeData ? (
        <div className="overflow-x-auto overflow-y-visible rounded-xl">
          <table className="w-full">
            <thead>
              <tr className={`bg-gradient-to-r from-red-50 to-yellow-50 ${
                theme === 'light' ? 'border-b-2 border-red-200' : 'border-b-2 border-yellow-300'
              }`}>
                <th className={`text-left py-4 px-6 text-sm font-bold uppercase tracking-wider ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-800'
                }`}>Radius</th>
                <th className={`text-left py-4 px-6 text-sm font-bold uppercase tracking-wider ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-800'
                }`}>Indent Count</th>
                <th className={`text-left py-4 px-6 text-sm font-bold uppercase tracking-wider ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-800'
                }`}>Percentage</th>
                <th className={`text-left py-4 px-6 text-sm font-bold uppercase tracking-wider ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-800'
                }`}>Load</th>
                <th className={`text-left py-4 px-6 text-sm font-bold uppercase tracking-wider ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-800'
                }`}>Bucket+Barrel Count</th>
              </tr>
            </thead>
            <tbody>
              {data.rangeData
                .filter(item => item.range !== 'Duplicate Indents') // Filter out duplicate indents row for now
                .map((item, index) => {
                  const rangeColor = RANGE_COLORS[item.range] || '#E01E1F';
                  return (
                  <tr
                    key={`${item.range}-${index}`}
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
                      <div className="font-semibold text-base">{item.range}</div>
                    </td>
                    <td className={`py-4 px-6 font-semibold text-base text-gray-600 ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-600'
                    }`}>{item.uniqueIndentCount ?? item.indentCount}</td>
                    <td className="py-4 px-6 font-semibold text-base" style={{ color: rangeColor }}>{formatPercentage(item.percentage)}</td>
                    <td className={`py-4 px-6 font-semibold text-base text-gray-600 ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-600'
                    }`}>
                      {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(item.totalLoad / 1000)} <span className="text-[18px]">Ton</span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-base text-gray-600" style={{ color: rangeColor }}>{formatBucketBarrelCount(item.bucketCount, item.barrelCount)}</td>
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
                    className={`border-b transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white border-gray-100 hover:bg-red-50/30 hover:shadow-sm'
                        : 'bg-white border-gray-200 hover:bg-yellow-50/20 hover:shadow-sm'
                    }`}
                  >
                    <td className={`py-4 px-6 ${
                      theme === 'light' ? 'text-gray-900' : 'text-gray-900'
                    }`}>
                      <div className="font-semibold text-base">Multiple Points</div>
                    </td>
                    <td className={`py-4 px-6 font-semibold text-base text-gray-600 ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-600'
                    }`}>{duplicateRow.uniqueIndentCount ?? duplicateRow.indentCount}</td>
                    <td className="py-4 px-6 font-semibold text-base" style={{ color: rangeColor }}>{formatPercentage(duplicateRow.percentage)}</td>
                    <td className={`py-4 px-6 font-semibold text-base text-gray-600 ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-600'
                    }`}>
                      {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(duplicateRow.totalLoad / 1000)} <span className="text-[18px]">Ton</span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-base text-gray-600" style={{ color: rangeColor }}>{formatBucketBarrelCount(duplicateRow.bucketCount, duplicateRow.barrelCount)}</td>
                  </tr>
                );
              })()}
              {/* Total Row */}
              {(() => {
                // Filter out "Other" and "Duplicate Indents" rows for all total calculations
                const standardRanges = data.rangeData.filter(item => item.range !== 'Other' && item.range !== 'Duplicate Indents');

                // Total indent count: sum of standard ranges only (exclude "Other" and "Duplicate Indents")
                const totalIndents = standardRanges.reduce((sum, item) => sum + (item.uniqueIndentCount ?? item.indentCount), 0);
                
                // Total percentage: exclude "Other" and "Duplicate Indents" rows from percentage calculation
                const summedPercentage = standardRanges.reduce((sum, item) => sum + item.percentage, 0);
                const totalPercentage = (summedPercentage >= 99.99 && summedPercentage <= 100.01) ? 100.00 : parseFloat(summedPercentage.toFixed(2));
                
                // Total load: sum of standard ranges only (exclude "Other" and "Duplicate Indents")
                const totalLoad = standardRanges.reduce((sum, item) => sum + item.totalLoad, 0);
                
                // Total buckets and barrels: sum of standard ranges only (exclude "Other" and "Duplicate Indents")
                const totalBuckets = standardRanges.reduce((sum, item) => sum + item.bucketCount, 0);
                const totalBarrels = standardRanges.reduce((sum, item) => sum + item.barrelCount, 0);

                return (
                  <tr className={`border-t-4 border-red-500 bg-gradient-to-r from-red-100 to-yellow-100 ${
                    theme === 'light' ? 'shadow-lg' : 'shadow-lg'
                  }`}>
                    <td className={`py-5 px-6 font-bold text-lg uppercase tracking-wide ${
                      theme === 'light' ? 'text-gray-900' : 'text-gray-900'
                    }`}>
                      <span className="inline-flex items-center gap-2">
                        <span className="w-1 h-6 bg-gradient-to-b from-red-600 to-yellow-500 rounded"></span>
                        TOTAL
                      </span>
                    </td>
                    <td className="py-5 px-6 font-bold text-lg text-gray-600">
                      {totalIndents}
                    </td>
                    <td className="py-5 px-6 font-bold text-lg text-gray-600">
                      {formatPercentage(totalPercentage)}
                    </td>
                    <td className="py-5 px-6 font-bold text-lg text-gray-600">
                      {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(totalLoad / 1000)} <span className="text-[18px]">Ton</span>
                    </td>
                    <td className="py-5 px-6 font-bold text-lg text-gray-600">
                      {formatBucketBarrelCount(totalBuckets, totalBarrels)}
                    </td>
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

