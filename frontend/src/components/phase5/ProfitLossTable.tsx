import React from 'react';
import { useRangeData } from '../../hooks/useRangeData';
import { useTheme } from '../../context/ThemeContext';
import { Skeleton } from '../ui/skeleton';
import { formatProfitLoss } from '../../utils/profitLossCalculations';
import { PROFIT_LOSS_COLORS } from '../../utils/constants';
import { BUCKET_RATES, BARREL_RATES } from '../../utils/constants';

export default function ProfitLossTable() {
  const { data, loading, error } = useRangeData();
  const { theme } = useTheme();

  // Calculate profit/loss from Range-Wise Summary data
  const calculateProfitLoss = (rangeData: Array<{ range: string; profitLoss?: number; bucketCount: number; barrelCount: number; totalCost?: number }> | undefined) => {
    if (!rangeData) return [];
    
    // Filter out "Other" and "Duplicate Indents" rows
    const standardRanges = rangeData.filter(item => 
      item.range !== 'Other' && item.range !== 'Duplicate Indents'
    );
    
    return standardRanges.map(item => {
      // Excel value
      const excelValue = item.profitLoss || 0;
      
      // Calculated value: Revenue - Cost
      const bucketRate = BUCKET_RATES[item.range] || 0;
      const barrelRate = BARREL_RATES[item.range] || 0;
      const revenue = (item.bucketCount * bucketRate) + (item.barrelCount * barrelRate);
      const cost = item.totalCost || 0;
      const calculatedValue = revenue - cost;
      
      return {
        range: item.range,
        profitLoss: excelValue,
        calculatedProfitLoss: calculatedValue
      };
    });
  };

  const gradientWrapper = (content: React.ReactNode) => (
    <div className={`rounded-2xl ${
      theme === 'light' 
        ? 'p-[2px] shadow-lg' 
        : 'shadow-xl border border-blue-900/30'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(to right, rgba(16, 185, 129, 0.35), rgba(239, 68, 68, 0.35))',
      boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2), 0 4px 6px -2px rgba(239, 68, 68, 0.2)',
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
    );
  }

  if (error) {
    return gradientWrapper(
      <div className="text-center py-8">
        <p className={`text-red-500 ${theme === 'light' ? 'text-black' : 'text-black'}`}>
          Error: {error}
        </p>
      </div>
    );
  }

  const profitLossByRange = calculateProfitLoss(data?.rangeData);
  const totalProfitLoss = profitLossByRange.reduce((sum, item) => sum + item.profitLoss, 0);

  if (!data || !data.rangeData || profitLossByRange.length === 0) {
    return gradientWrapper(
      <div className="text-center py-8">
        <p className={`${theme === 'light' ? 'text-black' : 'text-black'}`}>
          No data available for the selected date range
        </p>
      </div>
    );
  }

  return gradientWrapper(
    <>
      <h2 className={`text-lg font-semibold mb-4 ${
        theme === 'light' ? 'text-gray-800' : 'text-white'
      }`}>Profit & Loss by Distance Range</h2>
      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="w-full">
          <thead>
            <tr className={theme === 'light' ? 'border-b border-gray-200' : 'border-b border-gray-300'}>
              <th className={`text-left py-3 px-4 text-sm font-medium ${
                theme === 'light' ? 'text-black' : 'text-black'
              }`}>Range</th>
              <th className={`text-left py-3 px-4 text-sm font-medium ${
                theme === 'light' ? 'text-black' : 'text-black'
              }`}>Profit & Loss</th>
            </tr>
          </thead>
          <tbody>
            {profitLossByRange.map((item, index) => {
              const isProfit = item.profitLoss >= 0;
              const rangeColor = isProfit 
                ? (PROFIT_LOSS_COLORS[item.range] || '#10B981')
                : '#EF4444'; // Red for loss
              
              return (
                <tr key={index} className={`border-b transition-colors duration-200 ${
                  theme === 'light' ? 'border-gray-100 hover:bg-gray-50' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <td className={`py-3 px-4 font-medium ${
                    theme === 'light' ? 'text-black' : 'text-black'
                  }`}>{item.range}</td>
                  <td 
                    className="py-3 px-4 font-medium" 
                    style={{ color: rangeColor }}
                    title={Math.abs(item.profitLoss - item.calculatedProfitLoss) > 0.01 
                      ? `Excel: ${formatProfitLoss(item.profitLoss)}, Calculated: ${formatProfitLoss(item.calculatedProfitLoss)}`
                      : undefined
                    }
                  >
                    {formatProfitLoss(item.profitLoss)}
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
              <td 
                className="py-3 px-4 font-semibold" 
                style={{ color: totalProfitLoss >= 0 ? '#10B981' : '#EF4444' }}
              >
                {formatProfitLoss(totalProfitLoss)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

