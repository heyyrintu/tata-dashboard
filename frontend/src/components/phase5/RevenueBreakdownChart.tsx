import React, { useMemo, useRef } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useRangeData } from '../../hooks/useRangeData';
import { useTheme } from '../../context/ThemeContext';
import { LoadingSpinner } from '../LoadingSpinner';
import { formatIndianNumber, formatPercentage } from '../../utils/revenueCalculations';
import { RANGE_COLORS, BUCKET_RATES, BARREL_RATES } from '../../utils/constants';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

export default function RevenueBreakdownChart() {
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL RETURNS
  const { data, loading, error } = useRangeData();
  const { theme } = useTheme();
  const metadataRef = useRef<Array<{
    range: string;
    itemType: string;
    count: number;
    revenue: number;
    rate: number;
    percentage: number;
  }>>([]);
  
  // Store revenueByRange and theme in refs for plugin access - MUST BE BEFORE CONDITIONAL RETURNS
  const revenueByRangeRef = useRef<Array<{
    range: string;
    bucketRate: number;
    barrelRate: number;
    bucketCount: number;
    barrelCount: number;
    bucketRevenue: number;
    barrelRevenue: number;
    revenue: number;
  }>>([]);
  const themeRef = useRef(theme);

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

  // Calculate revenue data - MUST BE BEFORE CONDITIONAL RETURNS
  const revenueByRange = useMemo(() => {
    if (!data?.rangeData) return [];
    return calculateRevenue(data.rangeData);
  }, [data?.rangeData]);
  
  const totalRevenue = useMemo(() => {
    if (!revenueByRange || revenueByRange.length === 0) return 0;
    return revenueByRange.reduce((sum, item) => sum + item.revenue, 0);
  }, [revenueByRange]);
  
  // Update refs
  revenueByRangeRef.current = revenueByRange;
  themeRef.current = theme;

  // Move useMemo to top level - before any conditional returns
  const chartData = useMemo(() => {
    if (!data?.rangeData) {
      return {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderColor: [],
        }],
      };
    }
    
    const calculatedRevenue = calculateRevenue(data.rangeData);
    
    if (!calculatedRevenue || calculatedRevenue.length === 0) {
      return {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderColor: [],
        }],
      };
    }

    const totalRev = calculatedRevenue.reduce((sum, item) => sum + item.revenue, 0);
    
    // Create labels and data arrays for donut chart
    const labels: string[] = [];
    const revenueData: number[] = [];
    const backgroundColors: string[] = [];
    const borderColors: string[] = [];
    const metadataArray: Array<{
      range: string;
      itemType: string;
      count: number;
      revenue: number;
      rate: number;
      percentage: number;
    }> = [];
    
    calculatedRevenue.forEach((item) => {
      // Combine bucket and barrel revenue into a single segment per range
      if (item.revenue > 0) {
        const rangeColor = RANGE_COLORS[item.range] || '#9CA3AF'; // Default to gray if range not found
        labels.push(item.range);
        revenueData.push(item.revenue);
        backgroundColors.push(rangeColor + '80');
        borderColors.push(rangeColor);
        metadataArray.push({
          range: item.range,
          itemType: 'Total',
          count: item.bucketCount + item.barrelCount,
          revenue: item.revenue,
          rate: 0, // Not applicable for combined
          percentage: totalRev > 0 ? (item.revenue / totalRev) * 100 : 0,
        });
      }
    });

    // Store metadata in ref
    metadataRef.current = metadataArray;

    return {
      labels: labels,
      datasets: [{
        data: revenueData,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
      }],
    };
  }, [data?.rangeData]);

  // Custom plugin to display percentages on donut segments - MUST BE BEFORE CONDITIONAL RETURNS
  const percentagePlugin = useMemo(() => {
    const currentTheme = theme;
    return {
      id: 'percentageLabels',
      afterDraw: (chart: any) => {
        try {
          const ctx = chart.ctx;
          const chartData = chart.data;
          const meta = chart.getDatasetMeta(0);
          
          if (!chartData.labels || chartData.labels.length === 0 || !meta || !meta.data) return;
          
          const total = chartData.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
          
          meta.data.forEach((segment: any, index: number) => {
            const value = chartData.datasets[0].data[index];
            if (value === 0 || value === undefined) return;
            
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            
            // Only show label if segment is large enough (at least 5%)
            if (parseFloat(percentage) >= 5) {
              const arc = segment;
              const angle = (arc.startAngle + arc.endAngle) / 2;
              const radius = (arc.innerRadius + arc.outerRadius) / 2;
              const centerX = arc.x;
              const centerY = arc.y;
              const x = centerX + Math.cos(angle) * radius;
              const y = centerY + Math.sin(angle) * radius;
              
              // Get range from metadata
              const item = metadataRef.current[index];
              const range = item ? item.range : '';
              
              ctx.save();
              ctx.fillStyle = currentTheme === 'light' ? '#1F2937' : '#F9FAFB';
              ctx.font = 'bold 12px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              // Display range and percentage on separate lines
              if (range) {
                ctx.fillText(range, x, y - 8);
              }
              ctx.fillText(`${percentage}%`, x, y + 8);
              ctx.restore();
            }
          });
        } catch (error) {
          console.error('[RevenueBreakdownChart] Error in percentagePlugin:', error);
        }
      }
    };
  }, [theme]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1,
    cutout: '65%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          padding: 10,
          font: {
            size: 11,
            weight: 'normal' as const,
          },
          color: theme === 'light' ? '#1F2937' : '#F9FAFB',
          usePointStyle: false,
          generateLabels: function(chart: any) {
            const data = chart.data;
            if (data.labels && data.labels.length && data.datasets.length) {
              const dataset = data.datasets[0];
              const total = dataset.data.reduce((a: number, b: number) => a + b, 0);
              return data.labels.map((label: string, i: number) => {
                const value = dataset.data[i];
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.borderColor[i],
                  lineWidth: dataset.borderWidth,
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: theme === 'light' ? '#111827' : '#111827',
        bodyColor: theme === 'light' ? '#111827' : '#111827',
        borderColor: theme === 'light' ? '#E5E7EB' : '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            const index = context.dataIndex;
            const item = metadataRef.current[index];
            if (!item) return '';
            const rangeItem = revenueByRangeRef.current.find(r => r.range === item.range);
            return [
              `Range: ${item.range}`,
              `Bucket Revenue: ₹${formatIndianNumber(rangeItem?.bucketRevenue || 0)}`,
              `Barrel Revenue: ₹${formatIndianNumber(rangeItem?.barrelRevenue || 0)}`,
              `Total Revenue: ₹${formatIndianNumber(item.revenue)}`,
              `Percentage: ${formatPercentage(item.percentage)}`
            ];
          }
        }
      },
    },
  };

  const gradientWrapper = (content: React.ReactNode) => (
    <div className={`rounded-2xl ${
      theme === 'light' 
        ? 'p-[2px] shadow-lg' 
        : 'shadow-xl border border-blue-900/30'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(to right, rgba(224, 30, 31, 0.35), rgba(254, 165, 25, 0.35))',
      boxShadow: '0 10px 15px -3px rgba(224, 30, 31, 0.2), 0 4px 6px -2px rgba(254, 165, 25, 0.2)',
      height: '520px'
    } : { height: '520px' }}>
      <div className={`rounded-2xl p-6 h-full flex flex-col ${
        theme === 'light' ? 'bg-white border-0' : 'bg-white'
      }`} style={theme === 'light' ? { border: 'none' } : {}}>
        {content}
      </div>
    </div>
  );

  // NOW WE CAN HAVE CONDITIONAL RETURNS - ALL HOOKS ARE CALLED ABOVE
  if (loading) {
    return gradientWrapper(
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return gradientWrapper(
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-sm text-red-400 mb-2">Error loading revenue data</div>
          <div className="text-xs text-gray-400">{error}</div>
        </div>
      </div>
    );
  }
  
  if (!data || !data.rangeData || revenueByRange.length === 0) {
    return gradientWrapper(
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-gray-400">No revenue data available</div>
      </div>
    );
  }

  try {
    return gradientWrapper(
      <>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-semibold text-left ${
            theme === 'light' ? 'text-black' : 'text-black'
          }`}>Range wise Revenue %</h3>
        </div>
        <div className="flex-1 relative flex items-center justify-center">
          <div className="w-full h-full max-w-[379px] max-h-[379px]">
            <Doughnut
              data={chartData}
              options={chartOptions}
              plugins={[percentagePlugin]}
            />
          </div>
          
          {/* Centered text showing total revenue */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                theme === 'light' ? 'text-black' : 'text-black'
              }`}>₹{formatIndianNumber(totalRevenue)}</div>
              <div className={`text-xs ${
                theme === 'light' ? 'text-black' : 'text-black'
              }`}>Total Revenue</div>
            </div>
          </div>
        </div>
      </>
    );
  } catch (err) {
    console.error('[RevenueBreakdownChart] Render error:', err);
    return gradientWrapper(
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-sm text-red-500 mb-2">Error rendering chart</div>
          <div className="text-xs text-gray-400">{err instanceof Error ? err.message : 'Unknown error'}</div>
        </div>
      </div>
    );
  }
}
