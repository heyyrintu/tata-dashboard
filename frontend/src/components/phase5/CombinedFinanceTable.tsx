import React from 'react';
import { useRangeData } from '../../hooks/useRangeData';
import { useTheme } from '../../context/ThemeContext';
import { LoadingSpinner } from '../LoadingSpinner';
import { formatCurrency } from '../../utils/revenueCalculations';
import { formatCost } from '../../utils/costCalculations';
import { formatProfitLoss, formatProfitLossPercentage } from '../../utils/profitLossCalculations';
import { formatBucketBarrelCount } from '../../utils/rangeCalculations';
import { PROFIT_LOSS_COLORS, BUCKET_RATES, BARREL_RATES } from '../../utils/constants';

export default function CombinedFinanceTable() {
  const { data, loading, error } = useRangeData();
  const { theme } = useTheme();

  // Calculate combined finance data from Range-Wise Summary
  const calculateCombinedData = (rangeData: Array<{ 
    range: string; 
    bucketCount: number; 
    barrelCount: number;
    totalCostAE?: number; // From Column AE - main total cost
    profitLoss?: number;
    totalKm?: number;
  }> | undefined) => {
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
      const revenue = bucketRevenue + barrelRevenue;
      // Use totalCostAE (from Column AE) with fallback to totalCost
      const cost = (item.totalCostAE ?? item.totalCost) || 0;
      const profitLoss = item.profitLoss || 0;
      const profitLossPercentage = cost !== 0 ? (profitLoss / cost) * 100 : null;
      
      return {
        range: item.range,
        bucketRate,
        barrelRate,
        bucketCount: item.bucketCount,
        barrelCount: item.barrelCount,
        totalKm: Number(item.totalKm) || 0,
        revenue,
        cost,
        profitLoss,
        profitLossPercentage
      };
    });
  };

  const gradientWrapper = (content: React.ReactNode) => (
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
        {content}
      </div>
    </div>
  );

  if (loading) {
    return gradientWrapper(
      <>
        <h2 className={`text-lg font-semibold mb-4 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>Range-Wise Financial Summary</h2>
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
        }`}>Range-Wise Financial Summary</h2>
        <div className="text-center py-12">
          <div className="text-red-400 mb-2">Error loading finance data</div>
          <div className={`text-sm ${
            theme === 'light' ? 'text-black' : 'text-black'
          }`}>{error}</div>
        </div>
      </>
    );
  }

  const combinedData = calculateCombinedData(data?.rangeData);
  
  if (!data || !data.rangeData || combinedData.length === 0) {
    return gradientWrapper(
      <>
        <h2 className={`text-lg font-semibold mb-4 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>Range-Wise Financial Summary</h2>
        <div className={`text-center py-12 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>
          No finance data available for the selected date range
        </div>
      </>
    );
  }

  // Calculate totals
  const totalRevenue = combinedData.reduce((sum, item) => sum + item.revenue, 0);
  const totalCost = combinedData.reduce((sum, item) => sum + item.cost, 0);
  const totalProfitLoss = combinedData.reduce((sum, item) => sum + item.profitLoss, 0);
  const totalProfitLossPercentage = totalCost !== 0 ? (totalProfitLoss / totalCost) * 100 : null;
  const totalBuckets = combinedData.reduce((sum, item) => sum + item.bucketCount, 0);
  const totalBarrels = combinedData.reduce((sum, item) => sum + item.barrelCount, 0);

  return gradientWrapper(
    <>
      <div className="mb-6">
        <h2 className={`text-2xl font-bold mb-2 ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          Range-Wise Financial Summary
        </h2>
        <div className="h-1 w-20 bg-gradient-to-r from-red-600 to-yellow-500 rounded-full"></div>
      </div>

      <div className="overflow-x-auto overflow-y-visible rounded-xl">
        <table className="w-full">
          <thead>
            <tr className={`bg-gradient-to-r from-red-50 to-yellow-50 ${
              theme === 'light' ? 'border-b-2 border-red-200' : 'border-b-2 border-yellow-300'
            }`}>
              <th className={`text-left py-4 px-6 text-sm font-bold uppercase tracking-wider ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-800'
              }`}>Range (Rates)</th>
              <th className={`text-left py-4 px-6 text-sm font-bold uppercase tracking-wider ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-800'
              }`}>Bucket+Barrel Count</th>
              <th className={`text-left py-4 px-6 text-sm font-bold uppercase tracking-wider ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-800'
              }`}>Revenue</th>
              <th className={`text-left py-4 px-6 text-sm font-bold uppercase tracking-wider ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-800'
              }`}>Total Cost</th>
              <th className={`text-left py-4 px-6 text-sm font-bold uppercase tracking-wider ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-800'
              }`}>P & L</th>
              <th className={`text-left py-4 px-6 text-sm font-bold uppercase tracking-wider ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-800'
              }`}>P & L %</th>
            </tr>
          </thead>
          <tbody>
            {combinedData.map((item, index) => {
              // const rangeColor = RANGE_COLORS[item.range] || '#E01E1F';
              // const costColor = COST_COLORS[item.range] || '#3B82F6';
              const isProfit = item.profitLoss >= 0;
              const profitLossColor = isProfit 
                ? (PROFIT_LOSS_COLORS[item.range] || '#10B981')
                : '#EF4444'; // Red for loss
              
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
                    <div className="space-y-1">
                      <div className="font-semibold text-base">{item.range}</div>
                      <div className={`text-xs flex items-center gap-2 ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-600'
                      }`}>
                        <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
                        Bucket: ₹{item.bucketRate}
                      </div>
                      <div className={`text-xs flex items-center gap-2 ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-600'
                      }`}>
                        <span className="inline-block w-2 h-2 rounded-full bg-yellow-500"></span>
                        Barrel: ₹{item.barrelRate}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-semibold text-base text-gray-600">
                    {formatBucketBarrelCount(item.bucketCount, item.barrelCount)}
                  </td>
                  <td className="py-4 px-6 font-semibold text-base text-gray-600">
                    {formatCurrency(item.revenue)}
                  </td>
                  <td className="py-4 px-6 font-semibold text-base text-gray-600">
                    {formatCost(item.cost)}
                  </td>
                  <td className={`py-4 px-6 font-semibold text-base ${
                    isProfit ? 'text-green-600' : 'text-red-600'
                  }`} style={{ color: profitLossColor }}>
                    {formatProfitLoss(item.profitLoss)}
                  </td>
                  <td className={`py-4 px-6 font-semibold text-base ${
                    isProfit ? 'text-green-600' : 'text-red-600'
                  }`} style={{ color: profitLossColor }}>
                    {formatProfitLossPercentage(item.profitLossPercentage)}
                  </td>
                </tr>
              );
            })}
            {/* Total Row */}
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
                {formatBucketBarrelCount(totalBuckets, totalBarrels)} <span className="text-sm font-normal">Units</span>
              </td>
              <td className="py-5 px-6 font-bold text-lg text-gray-600">
                {formatCurrency(totalRevenue)}
              </td>
              <td className="py-5 px-6 font-bold text-lg text-gray-600">
                {formatCost(totalCost)}
              </td>
              <td className={`py-5 px-6 font-bold text-lg ${
                totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
              }`} style={{ color: totalProfitLoss >= 0 ? '#10B981' : '#EF4444' }}>
                {formatProfitLoss(totalProfitLoss)}
              </td>
              <td className={`py-5 px-6 font-bold text-lg ${
                totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
              }`} style={{ color: totalProfitLoss >= 0 ? '#10B981' : '#EF4444' }}>
                {formatProfitLossPercentage(totalProfitLossPercentage)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

