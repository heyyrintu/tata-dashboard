import React, { useMemo, useRef } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useRevenueData } from '../../hooks/useRevenueData';
import { useTheme } from '../../context/ThemeContext';
import { LoadingSpinner } from '../LoadingSpinner';
import { formatIndianNumber, formatPercentage } from '../../utils/revenueCalculations';
import { BUCKET_COLORS, BARREL_COLORS } from '../../utils/constants';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

export default function RevenueBreakdownChart() {
  const { data, loading, error } = useRevenueData();
  const { theme } = useTheme();
  const metadataRef = useRef<Array<{
    range: string;
    itemType: string;
    count: number;
    revenue: number;
    rate: number;
    percentage: number;
  }>>([]);

  // Move useMemo to top level - before any conditional returns
  const chartData = useMemo(() => {
    if (!data || !data.revenueByRange || data.revenueByRange.length === 0) {
      return {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderColor: [],
        }],
      };
    }

    const totalRevenue = data.revenueByRange.reduce((sum, item) => sum + item.revenue, 0);
    
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
    
    data.revenueByRange.forEach((item, index) => {
      // Bucket segment
      if (item.bucketRevenue > 0) {
        labels.push(`${item.range} - Bucket`);
        revenueData.push(item.bucketRevenue);
        backgroundColors.push(BUCKET_COLORS[index] + '80');
        borderColors.push(BUCKET_COLORS[index]);
        metadataArray.push({
          range: item.range,
          itemType: 'Bucket',
          count: item.bucketCount,
          revenue: item.bucketRevenue,
          rate: item.bucketRate,
          percentage: (item.bucketRevenue / totalRevenue) * 100,
        });
      }
      
      // Barrel segment
      if (item.barrelRevenue > 0) {
        labels.push(`${item.range} - Barrel`);
        revenueData.push(item.barrelRevenue);
        backgroundColors.push(BARREL_COLORS[index] + '80');
        borderColors.push(BARREL_COLORS[index]);
        metadataArray.push({
          range: item.range,
          itemType: 'Barrel',
          count: item.barrelCount,
          revenue: item.barrelRevenue,
          rate: item.barrelRate,
          percentage: (item.barrelRevenue / totalRevenue) * 100,
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
  }, [data?.revenueByRange]);

  const gradientWrapper = (content: React.ReactNode) => (
    <div className={`rounded-2xl ${
      theme === 'light' 
        ? 'p-[2px] shadow-lg' 
        : 'shadow-xl border border-blue-900/30'
    }`} style={theme === 'light' ? {
      height: '450px',
      background: 'linear-gradient(to right, rgba(224, 30, 31, 0.35), rgba(254, 165, 25, 0.35))',
      boxShadow: '0 10px 15px -3px rgba(224, 30, 31, 0.2), 0 4px 6px -2px rgba(254, 165, 25, 0.2)'
    } : { height: '450px' }}>
      <div className={`rounded-2xl p-6 pb-[82px] h-full flex flex-col ${
        theme === 'light' ? 'bg-[#F1F1F1] border-0' : 'glass-card'
      }`} style={theme === 'light' ? { border: 'none' } : {}}>
        {content}
      </div>
    </div>
  );

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

  if (!data || !data.revenueByRange || data.revenueByRange.length === 0) {
    return gradientWrapper(
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-gray-400">No revenue data available</div>
      </div>
    );
  }

  const totalRevenue = data.revenueByRange.reduce((sum, item) => sum + item.revenue, 0);

  // Custom plugin to display percentages on donut segments
  const percentagePlugin = {
    id: 'percentageLabels',
    afterDraw: (chart: any) => {
      const ctx = chart.ctx;
      const data = chart.data;
      const meta = chart.getDatasetMeta(0);
      
      if (!data.labels || data.labels.length === 0) return;
      
      const total = data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
      
      meta.data.forEach((segment: any, index: number) => {
        const value = data.datasets[0].data[index];
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
          ctx.fillStyle = theme === 'light' ? '#111827' : '#FFFFFF';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Display range and percentage on separate lines
          ctx.fillText(range, x, y - 8);
          ctx.fillText(`${percentage}%`, x, y + 8);
          ctx.restore();
        }
      });
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1,
    cutout: '65%',
    plugins: {
      legend: {
        display: false,
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          font: { size: 10 },
          padding: 8,
          color: '#E5E7EB',
          usePointStyle: true,
          pointStyle: 'rect' as const,
          generateLabels: function(chart: any) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              const dataset = data.datasets[0];
              const total = dataset.data.reduce((a: number, b: number) => a + b, 0);
              return data.labels.map((label: string, i: number) => {
                const value = dataset.data[i];
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                // Extract item type (Bucket or Barrel) from label, removing the range
                const itemType = label.includes(' - ') ? label.split(' - ')[1] : label;
                return {
                  text: `${itemType} (${percentage}%)`,
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
        backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.8)',
        titleColor: theme === 'light' ? '#111827' : '#FFFFFF',
        bodyColor: theme === 'light' ? '#111827' : '#FFFFFF',
        borderColor: theme === 'light' ? '#E5E7EB' : '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            const index = context.dataIndex;
            const item = metadataRef.current[index];
            if (!item) return '';
            return [
              `Range: ${item.range}`,
              `Type: ${item.itemType}`,
              `Rate: ₹${item.rate}/${item.itemType === 'Bucket' ? 'bucket' : 'barrel'}`,
              `Count: ${formatIndianNumber(item.count)} ${item.itemType === 'Bucket' ? 'buckets' : 'barrels'}`,
              `Revenue: ₹${formatIndianNumber(item.revenue)}`,
              `Percentage: ${formatPercentage(item.percentage)}`
            ];
          }
        }
      },
    },
  };

  return gradientWrapper(
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold text-left ${
          theme === 'light' ? 'text-black' : 'text-white'
        }`}>Range wise Revenue %</h3>
      </div>
      <div className="flex-1 relative flex items-center justify-center">
        <div className="w-full h-full max-w-[361px] max-h-[361px]">
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
              theme === 'light' ? 'text-black' : 'text-white'
            }`}>₹{formatIndianNumber(totalRevenue)}</div>
            <div className={`text-xs ${
              theme === 'light' ? 'text-black' : 'text-slate-400'
            }`}>Total Revenue</div>
          </div>
        </div>
      </div>
    </>
  );
}
