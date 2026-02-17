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
import { Skeleton } from '../ui/skeleton';
import { formatIndianNumber, formatPercentage } from '../../utils/costCalculations';
import { COST_COLORS } from '../../utils/constants';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

export default function CostBreakdownChart() {
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL RETURNS
  const { data, loading, error } = useRangeData();
  const { theme } = useTheme();
  const metadataRef = useRef<Array<{
    range: string;
    cost: number;
    percentage: number;
  }>>([]);
  
  // Store costByRange and theme in refs for plugin access - MUST BE BEFORE CONDITIONAL RETURNS
  const costByRangeRef = useRef<Array<{
    range: string;
    cost: number;
  }>>([]);
  const themeRef = useRef(theme);

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

  // Calculate cost data - MUST BE BEFORE CONDITIONAL RETURNS
  const costByRange = useMemo(() => {
    if (!data?.rangeData) return [];
    return calculateCost(data.rangeData);
  }, [data?.rangeData]);
  
  const totalCost = useMemo(() => {
    if (!costByRange || costByRange.length === 0) return 0;
    return costByRange.reduce((sum, item) => sum + item.cost, 0);
  }, [costByRange]);
  
  // Update refs
  costByRangeRef.current = costByRange;
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
    
    const calculatedCost = calculateCost(data.rangeData);
    
    if (!calculatedCost || calculatedCost.length === 0) {
      return {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderColor: [],
        }],
      };
    }

    const totalCostValue = calculatedCost.reduce((sum, item) => sum + item.cost, 0);
    
    // Create labels and data arrays for donut chart
    const labels: string[] = [];
    const costData: number[] = [];
    const backgroundColors: string[] = [];
    const borderColors: string[] = [];
    const metadataArray: Array<{
      range: string;
      cost: number;
      percentage: number;
    }> = [];
    
    calculatedCost.forEach((item) => {
      // Show cost segment per range
      if (item.cost > 0) {
        const rangeColor = COST_COLORS[item.range] || '#9CA3AF'; // Default to gray if range not found
        labels.push(item.range);
        costData.push(item.cost);
        backgroundColors.push(rangeColor + '80');
        borderColors.push(rangeColor);
        metadataArray.push({
          range: item.range,
          cost: item.cost,
          percentage: totalCostValue > 0 ? (item.cost / totalCostValue) * 100 : 0,
        });
      }
    });

    // Store metadata in ref
    metadataRef.current = metadataArray;

    return {
      labels: labels,
      datasets: [{
        data: costData,
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
          console.error('[CostBreakdownChart] Error in percentagePlugin:', error);
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
            return [
              `Range: ${item.range}`,
              `Total Cost: ₹${formatIndianNumber(item.cost)}`,
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

  // NOW WE CAN HAVE CONDITIONAL RETURNS - ALL HOOKS ARE CALLED ABOVE
  if (loading) {
    return gradientWrapper(
      <div className="flex items-center justify-center h-64">
        <Skeleton className="w-48 h-48 rounded-full" />
      </div>
    );
  }

  if (error) {
    return gradientWrapper(
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-sm text-red-400 mb-2">Error loading cost data</div>
          <div className="text-xs text-gray-400">{error}</div>
        </div>
      </div>
    );
  }
  
  if (!data || !data.rangeData || costByRange.length === 0) {
    return gradientWrapper(
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-gray-400">No cost data available</div>
      </div>
    );
  }

  try {
    return gradientWrapper(
      <>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-semibold text-left ${
            theme === 'light' ? 'text-black' : 'text-black'
          }`}>Range wise Cost %</h3>
        </div>
        <div className="flex-1 relative flex items-center justify-center">
          <div className="w-full h-full max-w-[379px] max-h-[379px]">
            <Doughnut
              data={chartData}
              options={chartOptions}
              plugins={[percentagePlugin]}
            />
          </div>
          
          {/* Centered text showing total cost */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                theme === 'light' ? 'text-black' : 'text-black'
              }`}>₹{formatIndianNumber(totalCost)}</div>
              <div className={`text-xs ${
                theme === 'light' ? 'text-black' : 'text-black'
              }`}>Total Cost</div>
            </div>
          </div>
        </div>
      </>
    );
  } catch (err) {
    console.error('[CostBreakdownChart] Render error:', err);
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

