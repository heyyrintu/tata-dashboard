import React from 'react';
import { useRangeData } from '../../hooks/useRangeData';
import { useTheme } from '../../context/ThemeContext';
import { LoadingSpinner } from '../LoadingSpinner';
import { RANGE_COLORS } from '../../utils/constants';

export default function RangeWiseTotalKmTable() {
  const { data, loading, error } = useRangeData();
  const { theme } = useTheme();

  const gradientWrapper = (content: React.ReactNode) => (
    <div className={`rounded-3xl ${
      theme === 'light' 
        ? 'p-[3px] shadow-2xl' 
        : 'shadow-2xl border border-blue-900/30'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))',
      boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.15), 0 10px 10px -5px rgba(147, 51, 234, 0.1)'
    } : {}}>
      <div className={`rounded-3xl p-8 flex flex-col backdrop-blur-sm ${
        theme === 'light' ? 'bg-white/95 border-0' : 'bg-white/95'
      }`} style={theme === 'light' ? { border: 'none' } : {}}>
        {content}
      </div>
    </div>
  );

  if (loading) {
    return gradientWrapper(
      <>
        <h2 className={`text-lg font-semibold mb-4 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>Range-Wise Total Km</h2>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  if (error) {
    return gradientWrapper(
      <>
        <h2 className={`text-lg font-semibold mb-4 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>Range-Wise Total Km</h2>
        <div className="text-center py-12">
          <div className="text-red-400 mb-2">Error loading data</div>
          <div className={`text-sm ${
            theme === 'light' ? 'text-black' : 'text-black'
          }`}>{error}</div>
        </div>
      </>
    );
  }

  // Filter out "Other" and "Duplicate Indents" rows
  const standardRanges = data?.rangeData?.filter(item => 
    item.range !== 'Other' && item.range !== 'Duplicate Indents'
  ) || [];

  if (!data || !data.rangeData || standardRanges.length === 0) {
    return gradientWrapper(
      <>
        <h2 className={`text-lg font-semibold mb-4 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>Range-Wise Total Km</h2>
        <div className={`text-center py-12 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>
          No data available for the selected date range
        </div>
      </>
    );
  }

  // Calculate totals
  const totalKm = standardRanges.reduce((sum, item) => {
    return sum + (Number(item.totalKm) || 0);
  }, 0);

  return gradientWrapper(
    <>
      <div className="mb-6">
        <h2 className={`text-2xl font-bold mb-2 ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          Range-Wise Total Km (Total Km ( TpT))
        </h2>
        <div className="h-1 w-20 bg-gradient-to-r from-blue-600 to-purple-500 rounded-full"></div>
      </div>

      <div className="overflow-x-auto overflow-y-visible rounded-xl">
        <table className="w-full">
          <thead>
            <tr className={`bg-gradient-to-r from-blue-50 to-purple-50 ${
              theme === 'light' ? 'border-b-2 border-blue-200' : 'border-b-2 border-purple-300'
            }`}>
              <th className={`text-left py-4 px-6 text-sm font-bold uppercase tracking-wider ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-800'
              }`}>Range</th>
              <th className={`text-left py-4 px-6 text-sm font-bold uppercase tracking-wider ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-800'
              }`}>Total Km ( TpT)</th>
            </tr>
          </thead>
          <tbody>
            {standardRanges.map((item, index) => {
              const rangeColor = RANGE_COLORS[item.range] || '#3B82F6';
              
              return (
                <tr
                  key={index}
                  className={`border-b transition-all duration-300 ${
                    index % 2 === 0 
                      ? (theme === 'light' ? 'bg-white' : 'bg-white')
                      : (theme === 'light' ? 'bg-gray-50/50' : 'bg-gray-50/30')
                  } ${
                    theme === 'light'
                      ? 'border-gray-100 hover:bg-blue-50/30 hover:shadow-sm'
                      : 'border-gray-200 hover:bg-purple-50/20 hover:shadow-sm'
                  }`}
                >
                  <td className={`py-4 px-6 font-semibold text-base ${
                    theme === 'light' ? 'text-gray-900' : 'text-gray-900'
                  }`} style={{ color: rangeColor }}>
                    {item.range}
                  </td>
                  <td className="py-4 px-6 font-semibold text-base text-gray-600">
                    {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(item.totalKm) || 0)} km
                  </td>
                </tr>
              );
            })}
            {/* Total Row */}
            <tr className={`border-t-4 border-blue-500 bg-gradient-to-r from-blue-100 to-purple-100 ${
              theme === 'light' ? 'shadow-lg' : 'shadow-lg'
            }`}>
              <td className={`py-5 px-6 font-bold text-lg uppercase tracking-wide ${
                theme === 'light' ? 'text-gray-900' : 'text-gray-900'
              }`}>
                <span className="inline-flex items-center gap-2">
                  <span className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-500 rounded"></span>
                  TOTAL
                </span>
              </td>
              <td className="py-5 px-6 font-bold text-lg text-gray-600">
                {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(totalKm)} km
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

