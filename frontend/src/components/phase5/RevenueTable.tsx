import React from 'react';
import { useRangeData } from '../../hooks/useRangeData';
import { useTheme } from '../../context/ThemeContext';
import { LoadingSpinner } from '../LoadingSpinner';
import { formatCurrency } from '../../utils/revenueCalculations';
import { formatBucketBarrelCount } from '../../utils/rangeCalculations';
import { RANGE_COLORS, BUCKET_RATES, BARREL_RATES } from '../../utils/constants';

export default function RevenueTable() {
  const { data, loading, error } = useRangeData();
  const { theme } = useTheme();

  // Calculate revenue from Range-Wise Summary data
  const calculateRevenue = (rangeData: Array<{ range: string; bucketCount: number; barrelCount: number }> | undefined) => {
    if (!rangeData) return [];
    
    // Filter out "Other" and "Duplicate Indents" rows
    const standardRanges = rangeData.filter(item => 
      item.range !== 'Other' && item.range !== 'Duplicate Indents'
    );
    
    return standardRanges.map(item => {
      const bucketRate = BUCKET_RATES[item.range] || 0;
      const barrelRate = BARREL_RATES[item.range] || 0;
      const bucketRevenue = item.bucketCount * bucketRate;
      const barrelRevenue = item.barrelCount * barrelRate;
      const totalRevenue = bucketRevenue + barrelRevenue;
      
      return {
        range: item.range,
        bucketRate,
        barrelRate,
        bucketCount: item.bucketCount,
        barrelCount: item.barrelCount,
        bucketRevenue,
        barrelRevenue,
        revenue: totalRevenue
      };
    });
  };

  const gradientWrapper = (content: React.ReactNode) => (
    <div className={`rounded-2xl ${
      theme === 'light' 
        ? 'p-[2px] shadow-lg' 
        : 'shadow-xl border border-blue-900/30'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(to right, rgba(224, 30, 31, 0.35), rgba(254, 165, 25, 0.35))',
      boxShadow: '0 10px 15px -3px rgba(224, 30, 31, 0.2), 0 4px 6px -2px rgba(254, 165, 25, 0.2)'
    } : {}}>
      <div className={`rounded-2xl p-6 flex flex-col ${
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
        }`}>Revenue by Distance Range</h2>
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
        }`}>Revenue by Distance Range</h2>
        <div className="text-center py-12">
          <div className="text-red-400 mb-2">Error loading revenue data</div>
          <div className={`text-sm ${
            theme === 'light' ? 'text-black' : 'text-black'
          }`}>{error}</div>
        </div>
      </>
    );
  }

  const revenueByRange = calculateRevenue(data?.rangeData);
  
  if (!data || !data.rangeData || revenueByRange.length === 0) {
    return gradientWrapper(
      <>
        <h2 className={`text-lg font-semibold mb-4 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>Revenue by Distance Range</h2>
        <div className={`text-center py-12 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>
          No revenue data available for the selected date range
        </div>
      </>
    );
  }

  const totalRevenue = revenueByRange.reduce((sum, item) => sum + item.revenue, 0);
  const totalBuckets = revenueByRange.reduce((sum, item) => sum + item.bucketCount, 0);
  const totalBarrels = revenueByRange.reduce((sum, item) => sum + item.barrelCount, 0);

  return gradientWrapper(
    <>
      <h2 className={`text-lg font-semibold mb-4 ${
        theme === 'light' ? 'text-gray-800' : 'text-white'
      }`}>Revenue by Distance Range</h2>

      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full">
          <thead>
            <tr className={theme === 'light' ? 'border-b border-gray-200' : 'border-b border-gray-300'}>
              <th className={`text-left py-3 px-4 text-sm font-medium ${
                theme === 'light' ? 'text-black' : 'text-black'
              }`}>Range (Rates)</th>
              <th className={`text-left py-3 px-4 text-sm font-medium ${
                theme === 'light' ? 'text-black' : 'text-black'
              }`}>Bucket+Barrel Count</th>
              <th className={`text-left py-3 px-4 text-sm font-medium ${
                theme === 'light' ? 'text-black' : 'text-black'
              }`}>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {revenueByRange.map((item, index) => {
              const rangeColor = RANGE_COLORS[item.range] || '#E01E1F';
              return (
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
                  }`}>
                    <div>
                      <div className="font-medium">{item.range}</div>
                      <div className={`text-xs ${
                        theme === 'light' ? 'text-black' : 'text-black'
                      }`}>Bucket: ₹{item.bucketRate}</div>
                      <div className={`text-xs ${
                        theme === 'light' ? 'text-black' : 'text-black'
                      }`}>Barrel: ₹{item.barrelRate}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium" style={{ color: rangeColor }}>
                    {formatBucketBarrelCount(item.bucketCount, item.barrelCount)}
                  </td>
                  <td className="py-3 px-4 font-medium" style={{ color: rangeColor }}>
                    {formatCurrency(item.revenue)}
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
              <td className="py-3 px-4 font-semibold" style={{ color: theme === 'light' ? '#E01E1F' : '#FEA519' }}>
                {formatBucketBarrelCount(totalBuckets, totalBarrels)} Units
              </td>
              <td className="py-3 px-4 font-semibold" style={{ color: theme === 'light' ? '#FEA519' : '#FF6B35' }}>
                {formatCurrency(totalRevenue)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
