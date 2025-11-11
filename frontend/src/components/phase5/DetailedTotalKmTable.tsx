import React from 'react';
import { useRangeData } from '../../hooks/useRangeData';
import { useTheme } from '../../context/ThemeContext';
import { LoadingSpinner } from '../LoadingSpinner';
import { RANGE_COLORS } from '../../utils/constants';

export default function DetailedTotalKmTable() {
  const { data, loading, error } = useRangeData();
  const { theme } = useTheme();

  const gradientWrapper = (content: React.ReactNode) => (
    <div className={`rounded-3xl ${
      theme === 'light' 
        ? 'p-[3px] shadow-2xl' 
        : 'shadow-2xl border border-green-900/30'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(59, 130, 246, 0.2))',
      boxShadow: '0 20px 25px -5px rgba(34, 197, 94, 0.15), 0 10px 10px -5px rgba(59, 130, 246, 0.1)'
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
        }`}>Detailed Total KM Analysis</h2>
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
        }`}>Detailed Total KM Analysis</h2>
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
        }`}>Detailed Total KM Analysis</h2>
        <div className={`text-center py-12 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>
          No data available for the selected date range
        </div>
      </>
    );
  }

  // Calculate totals using same logic as test script
  const totalKm = standardRanges.reduce((sum, item) => {
    return sum + (Number(item.totalKm) || 0);
  }, 0);

  const totalRows = standardRanges.reduce((sum, item) => {
    return sum + (item.indentCount || 0);
  }, 0);

  // Calculate rows with values (assuming if totalKm > 0, there are rows with values)
  // Note: This is an approximation since we don't have individual row data in the frontend
  const rangesWithData = standardRanges.filter(item => (Number(item.totalKm) || 0) > 0);

  return gradientWrapper(
    <>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className={`text-2xl font-bold mb-2 ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              Detailed Total KM Analysis (Column U)
            </h2>
            <div className="h-1 w-20 bg-gradient-to-r from-green-600 to-blue-500 rounded-full"></div>
            <p className={`text-sm mt-2 ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              Range-wise breakdown of Total KM values from Column U (index 20)
            </p>
          </div>
          <div className={`mt-4 sm:mt-0 px-6 py-4 rounded-xl ${
            theme === 'light' 
              ? 'bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200' 
              : 'bg-gradient-to-r from-green-100 to-blue-100 border-2 border-green-300'
          }`}>
            <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-700'
            }`}>
              Total KM (Column U)
            </div>
            <div className={`text-3xl font-bold ${
              theme === 'light' ? 'text-gray-900' : 'text-gray-900'
            }`} style={{
              background: 'linear-gradient(135deg, #22c55e, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(totalKm)} km
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-visible rounded-xl">
        <table className="w-full">
          <thead>
            <tr className={`bg-gradient-to-r from-green-50 to-blue-50 ${
              theme === 'light' ? 'border-b-2 border-green-200' : 'border-b-2 border-blue-300'
            }`}>
              <th className={`text-left py-4 px-6 text-sm font-bold uppercase tracking-wider ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-800'
              }`}>Range</th>
              <th className={`text-left py-4 px-6 text-sm font-bold uppercase tracking-wider ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-800'
              }`}>Total KM</th>
              <th className={`text-left py-4 px-6 text-sm font-bold uppercase tracking-wider ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-800'
              }`}>Row Count</th>
              <th className={`text-left py-4 px-6 text-sm font-bold uppercase tracking-wider ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-800'
              }`}>Status</th>
            </tr>
          </thead>
          <tbody>
            {standardRanges.map((item, index) => {
              const rangeColor = RANGE_COLORS[item.range] || '#3B82F6';
              const totalKmValue = Number(item.totalKm) || 0;
              const rowCount = item.indentCount || 0;
              const hasData = totalKmValue > 0;
              
              return (
                <tr
                  key={index}
                  className={`border-b transition-all duration-300 ${
                    index % 2 === 0 
                      ? (theme === 'light' ? 'bg-white' : 'bg-white')
                      : (theme === 'light' ? 'bg-gray-50/50' : 'bg-gray-50/30')
                  } ${
                    theme === 'light'
                      ? 'border-gray-100 hover:bg-green-50/30 hover:shadow-sm'
                      : 'border-gray-200 hover:bg-blue-50/20 hover:shadow-sm'
                  }`}
                >
                  <td className={`py-4 px-6 font-semibold text-base ${
                    theme === 'light' ? 'text-gray-900' : 'text-gray-900'
                  }`} style={{ color: rangeColor }}>
                    {item.range}
                  </td>
                  <td className="py-4 px-6 font-semibold text-base text-gray-600">
                    {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(totalKmValue)} km
                  </td>
                  <td className="py-4 px-6 font-medium text-base text-gray-600">
                    {new Intl.NumberFormat('en-IN').format(rowCount)}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      hasData 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {hasData ? '✓ Has Data' : 'No Data'}
                    </span>
                  </td>
                </tr>
              );
            })}
            {/* Total Row */}
            <tr className={`border-t-4 border-green-500 bg-gradient-to-r from-green-100 to-blue-100 ${
              theme === 'light' ? 'shadow-lg' : 'shadow-lg'
            }`}>
              <td className={`py-5 px-6 font-bold text-lg uppercase tracking-wide ${
                theme === 'light' ? 'text-gray-900' : 'text-gray-900'
              }`}>
                <span className="inline-flex items-center gap-2">
                  <span className="w-1 h-6 bg-gradient-to-b from-green-600 to-blue-500 rounded"></span>
                  TOTAL
                </span>
              </td>
              <td className="py-5 px-6 font-bold text-lg text-gray-600">
                {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(totalKm)} km
              </td>
              <td className="py-5 px-6 font-bold text-lg text-gray-600">
                {new Intl.NumberFormat('en-IN').format(totalRows)}
              </td>
              <td className="py-5 px-6">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  totalKm > 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {rangesWithData.length} Range{rangesWithData.length !== 1 ? 's' : ''} with Data
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary Statistics */}
      <div className={`mt-6 p-4 rounded-lg ${
        theme === 'light' ? 'bg-gray-50' : 'bg-gray-50'
      }`}>
        <h3 className={`text-sm font-semibold mb-3 ${
          theme === 'light' ? 'text-gray-700' : 'text-gray-700'
        }`}>
          Summary Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className={`text-xs ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-600'
            }`}>Total KM (All Ranges)</div>
            <div className={`text-lg font-bold ${
              theme === 'light' ? 'text-gray-900' : 'text-gray-900'
            }`}>
              {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(totalKm)} km
            </div>
          </div>
          <div>
            <div className={`text-xs ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-600'
            }`}>Total Rows</div>
            <div className={`text-lg font-bold ${
              theme === 'light' ? 'text-gray-900' : 'text-gray-900'
            }`}>
              {new Intl.NumberFormat('en-IN').format(totalRows)}
            </div>
          </div>
          <div>
            <div className={`text-xs ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-600'
            }`}>Ranges with Data</div>
            <div className={`text-lg font-bold ${
              theme === 'light' ? 'text-gray-900' : 'text-gray-900'
            }`}>
              {rangesWithData.length} / {standardRanges.length}
            </div>
          </div>
          <div>
            <div className={`text-xs ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-600'
            }`}>Avg KM per Row</div>
            <div className={`text-lg font-bold ${
              theme === 'light' ? 'text-gray-900' : 'text-gray-900'
            }`}>
              {totalRows > 0 
                ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(totalKm / totalRows)
                : '0'
              } km
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

