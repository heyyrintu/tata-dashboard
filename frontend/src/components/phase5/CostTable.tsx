import React from 'react';
import { useRangeData } from '../../hooks/useRangeData';
import { useTheme } from '../../context/ThemeContext';
import { Skeleton } from '../ui/skeleton';
import { formatCost } from '../../utils/costCalculations';
import { COST_COLORS } from '../../utils/constants';

export default function CostTable() {
  const { data, loading, error } = useRangeData();
  const { theme } = useTheme();

  // Calculate cost from Range-Wise Summary data
  const calculateCost = (rangeData: Array<{ range: string; totalCost?: number }> | undefined) => {
    if (!rangeData) return [];
    
    // Filter out "Other" and "Duplicate Indents" rows
    const standardRanges = rangeData.filter(item => 
      item.range !== 'Other' && item.range !== 'Duplicate Indents'
    );
    
    return standardRanges.map(item => ({
      range: item.range,
      cost: item.totalCost || 0
    }));
  };

  const gradientWrapper = (content: React.ReactNode) => (
    <div className={`rounded-2xl ${
      theme === 'light' 
        ? 'p-[2px] shadow-lg' 
        : 'shadow-xl border border-blue-900/30'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(to right, rgba(59, 130, 246, 0.35), rgba(139, 92, 246, 0.35))',
      boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.2), 0 4px 6px -2px rgba(139, 92, 246, 0.2)',
      height: '520px'
    } : { height: '520px' }}>
      <div className={`rounded-2xl p-6 h-full flex flex-col ${
        theme === 'light' ? 'bg-white border-0' : 'bg-white'
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
        }`}>Cost by Distance Range</h2>
        <div className="space-y-4 flex-1">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 flex-1 rounded-lg" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-8 flex-1 rounded-md" />
              <Skeleton className="h-8 flex-1 rounded-md" />
            </div>
          ))}
        </div>
      </>
    );
  }

  if (error) {
    return gradientWrapper(
      <>
        <h2 className={`text-lg font-semibold mb-4 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>Cost by Distance Range</h2>
        <div className="text-center py-12">
          <div className="text-red-400 mb-2">Error loading cost data</div>
          <div className={`text-sm ${
            theme === 'light' ? 'text-black' : 'text-black'
          }`}>{error}</div>
        </div>
      </>
    );
  }

  const costByRange = calculateCost(data?.rangeData);
  
  if (!data || !data.rangeData || costByRange.length === 0) {
    return gradientWrapper(
      <>
        <h2 className={`text-lg font-semibold mb-4 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>Cost by Distance Range</h2>
        <div className={`text-center py-12 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>
          No cost data available for the selected date range
        </div>
      </>
    );
  }

  const totalCost = costByRange.reduce((sum, item) => sum + item.cost, 0);

  return gradientWrapper(
    <>
      <h2 className={`text-lg font-semibold mb-4 ${
        theme === 'light' ? 'text-gray-800' : 'text-white'
      }`}>Cost by Distance Range</h2>

      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="w-full">
          <thead>
            <tr className={theme === 'light' ? 'border-b border-gray-200' : 'border-b border-gray-300'}>
              <th className={`text-left py-3 px-4 text-sm font-medium ${
                theme === 'light' ? 'text-black' : 'text-black'
              }`}>Range</th>
              <th className={`text-left py-3 px-4 text-sm font-medium ${
                theme === 'light' ? 'text-black' : 'text-black'
              }`}>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {costByRange.map((item, index) => {
              const rangeColor = COST_COLORS[item.range] || '#3B82F6';
              return (
                <tr
                  key={index}
                  className={`border-b transition-colors duration-200 ${
                    theme === 'light'
                      ? 'border-gray-100 hover:bg-gray-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <td className={`py-3 px-4 font-medium ${
                    theme === 'light' ? 'text-black' : 'text-black'
                  }`}>
                    {item.range}
                  </td>
                  <td className="py-3 px-4 font-medium" style={{ color: rangeColor }}>
                    {formatCost(item.cost)}
                  </td>
                </tr>
              );
            })}
            {/* Total Row */}
            <tr className={theme === 'light' 
              ? 'border-t-2 border-gray-300 bg-gray-100' 
              : 'border-t-2 border-gray-300 bg-gray-100'
            }>
              <td className={`py-3 px-4 font-semibold ${
                theme === 'light' ? 'text-black' : 'text-black'
              }`}>TOTAL</td>
              <td className="py-3 px-4 font-semibold" style={{ color: theme === 'light' ? '#3B82F6' : '#8B5CF6' }}>
                {formatCost(totalCost)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

