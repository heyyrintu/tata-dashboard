import { useRangeData } from '../../hooks/useRangeData';
import { useTheme } from '../../context/ThemeContext';
import { RANGE_COLORS } from '../../utils/constants';
import { Skeleton } from '../ui/skeleton';
import { formatLoad, formatPercentage } from '../../utils/rangeCalculations';

export default function CompactRangeTable() {
  const { data, loading } = useRangeData();
  const { theme } = useTheme();

  if (loading) {
    return (
      <div className={`rounded-2xl relative ${
        theme === 'light'
          ? 'p-[2px] shadow-lg'
          : 'enhanced-glass-card'
      }`} style={theme === 'light' ? {
        background: 'linear-gradient(to right, rgba(224, 30, 31, 0.35), rgba(254, 165, 25, 0.35))',
        boxShadow: '0 10px 15px -3px rgba(224, 30, 31, 0.2), 0 4px 6px -2px rgba(254, 165, 25, 0.2)'
      } : {}}>
        <div className={`rounded-2xl p-6 h-96 flex flex-col justify-center ${
          theme === 'light'
            ? 'bg-[#F1F1F1] border-0'
            : ''
        }`} style={theme === 'light' ? { border: 'none' } : {}}>
          <div className="space-y-4 w-full">
            <div className="flex gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 flex-1 rounded-lg" />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-6 flex-1 rounded-md" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.rangeData.length === 0) {
    return (
      <div className={`rounded-2xl relative ${
        theme === 'light'
          ? 'p-[2px] shadow-lg'
          : 'enhanced-glass-card'
      }`} style={theme === 'light' ? {
        background: 'linear-gradient(to right, rgba(224, 30, 31, 0.35), rgba(254, 165, 25, 0.35))',
        boxShadow: '0 10px 15px -3px rgba(224, 30, 31, 0.2), 0 4px 6px -2px rgba(254, 165, 25, 0.2)'
      } : {}}>
        <div className={`rounded-2xl p-6 h-96 flex items-center justify-center ${
          theme === 'light'
            ? 'bg-[#F1F1F1] border-0'
            : ''
        }`} style={theme === 'light' ? { border: 'none' } : {}}>
          <div className={`text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-500'
          }`}>No data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl relative ${
      theme === 'light'
        ? 'p-[2px] shadow-lg'
        : 'enhanced-glass-card'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(to right, rgba(224, 30, 31, 0.35), rgba(254, 165, 25, 0.35))',
      boxShadow: '0 10px 15px -3px rgba(224, 30, 31, 0.2), 0 4px 6px -2px rgba(254, 165, 25, 0.2)'
    } : {}}>
      <div className={`rounded-2xl p-6 h-96 flex flex-col ${
        theme === 'light'
          ? 'bg-[#F1F1F1] border-0'
          : ''
      }`} style={theme === 'light' ? { border: 'none' } : {}}>
        <h3 className={`text-lg font-semibold mb-4 text-left ${
          theme === 'light' ? 'text-black' : 'text-gray-800'
        }`}>Range Analysis</h3>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${
                theme === 'light' ? 'border-gray-200' : 'border-gray-700'
              }`}>
                <th className={`text-left py-3 px-4 text-sm font-semibold ${
                  theme === 'light' ? 'text-black' : 'text-gray-700'
                }`}>Radius</th>
                <th className={`text-right py-3 px-4 text-sm font-semibold ${
                  theme === 'light' ? 'text-black' : 'text-gray-700'
                }`}>Indents</th>
                <th className={`text-right py-3 px-4 text-sm font-semibold ${
                  theme === 'light' ? 'text-black' : 'text-gray-700'
                }`}>%</th>
                <th className={`text-right py-3 px-4 text-sm font-semibold ${
                  theme === 'light' ? 'text-black' : 'text-gray-700'
                }`}>Load</th>
              </tr>
            </thead>
            <tbody>
              {data.rangeData.map((item, index) => {
                const rangeColor = RANGE_COLORS[item.range] || '#E01E1F';
                return (
                  <tr key={index} className={`border-b ${
                    theme === 'light' ? 'border-gray-100 hover:bg-gray-50' : 'border-gray-700 hover:bg-gray-800/30'
                  } transition-colors`}>
                    <td className={`py-3 px-4 text-sm ${
                      theme === 'light' ? 'text-black' : 'text-gray-300'
                    }`}>{item.range}</td>
                    <td className={`py-3 px-4 text-sm font-medium text-right ${
                      theme === 'light' ? 'text-black' : 'text-gray-300'
                    }`}>{item.indentCount}</td>
                    <td className="py-3 px-4 text-sm font-medium text-right" style={{ color: rangeColor }}>
                      {formatPercentage(item.percentage)}
                    </td>
                    <td className={`py-3 px-4 text-sm text-right ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`}>{formatLoad(item.totalLoad)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
