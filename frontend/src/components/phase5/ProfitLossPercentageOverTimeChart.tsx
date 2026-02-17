import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useProfitLossData } from '../../hooks/useProfitLossData';
import { useRevenueData } from '../../hooks/useRevenueData';
import { Skeleton } from '../ui/skeleton';
import TimeGranularityToggle from '../TimeGranularityToggle';
import { formatProfitLossPercentage } from '../../utils/profitLossCalculations';
import { useTheme } from '../../context/ThemeContext';
import { format, parseISO } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ProfitLossPercentageOverTimeChart() {
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const { data: profitLossData, loading: profitLossLoading, error: profitLossError } = useProfitLossData(granularity);
  const { data: revenueData, loading: revenueLoading, error: revenueError } = useRevenueData(granularity);
  const { theme } = useTheme();

  const loading = profitLossLoading || revenueLoading;
  const error = profitLossError || revenueError;

  const gradientWrapper = (content: React.ReactNode) => (
    <div className={`rounded-xl overflow-hidden ${
      theme === 'light' 
        ? 'p-[3px] shadow-2xl' 
        : 'shadow-2xl border border-green-900/20'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(22, 163, 74, 0.15), rgba(239, 68, 68, 0.15))',
      boxShadow: '0 25px 50px -12px rgba(34, 197, 94, 0.25), 0 0 0 1px rgba(34, 197, 94, 0.05)'
    } : {}}>
      <div className={`rounded-xl p-8 h-[420px] flex flex-col backdrop-blur-sm transition-all duration-300 ${
        theme === 'light' ? 'bg-gradient-to-br from-white via-green-50/30 to-white border-0' : 'bg-white/95'
      }`} style={theme === 'light' ? { border: 'none' } : {}}>
        {content}
      </div>
    </div>
  );

  if (loading) {
    return gradientWrapper(
      <div className="flex items-end gap-3 h-64 pt-4 px-4">
        {[40, 70, 55, 85, 35, 65, 50, 75].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
        ))}
      </div>
    );
  }

  if (error) {
    return gradientWrapper(
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-sm text-red-400 mb-2">Error loading profit & loss percentage data</div>
          <div className="text-xs text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  // Check if we have the required data
  if (!profitLossData || !profitLossData.profitLossOverTime || profitLossData.profitLossOverTime.length === 0) {
    return gradientWrapper(
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-gray-400">No profit & loss data available</div>
      </div>
    );
  }

  if (!revenueData || !revenueData.revenueOverTime || revenueData.revenueOverTime.length === 0) {
    return gradientWrapper(
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-gray-400">No revenue data available</div>
      </div>
    );
  }

  // Create a map of revenue by date for quick lookup
  // Normalize dates to ensure matching (handle different date formats)
  const revenueMap = new Map<string, number>();
  if (revenueData?.revenueOverTime) {
    revenueData.revenueOverTime.forEach(item => {
      if (item && item.date) {
        // Normalize date format - remove time portion if present
        const normalizedDate = item.date.split('T')[0];
        revenueMap.set(normalizedDate, item.revenue || 0);
        // Also store with full date string in case backend returns different format
        revenueMap.set(item.date, item.revenue || 0);
      }
    });
  }

  // Calculate profit/loss percentage for each time period
  // Formula: (Profit/Loss / Cost Price) × 100
  // Cost = Revenue - Profit/Loss
  const profitLossPercentageOverTime = (profitLossData?.profitLossOverTime || []).map(item => {
    if (!item || !item.date) {
      return {
        date: '',
        profitLossPercentage: null as number | null
      };
    }
    
    // Normalize date format for matching
    const normalizedDate = item.date.split('T')[0];
    // Try both normalized and original date formats
    const revenue = revenueMap.get(normalizedDate) || revenueMap.get(item.date) || 0;
    const profitLoss = item.profitLoss || 0;
    const cost = revenue - profitLoss; // Cost = Revenue - Profit/Loss
    
    // Calculate percentage: (Profit/Loss / Cost) × 100
    // Handle edge case: if cost is 0 or negative, return null
    if (cost <= 0) {
      return {
        date: item.date,
        profitLossPercentage: null as number | null
      };
    }
    
    return {
      date: item.date,
      profitLossPercentage: (profitLoss / cost) * 100
    };
  }).filter(item => item.date && item.profitLossPercentage !== null); // Filter out items with empty dates or null percentages

  // Check if we have any valid data after calculation
  if (profitLossPercentageOverTime.length === 0) {
    return gradientWrapper(
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-2">No valid profit & loss percentage data available for {granularity} view</div>
        </div>
      </div>
    );
  }

  // Prepare data with point colors based on positive/negative values
  const allData = profitLossPercentageOverTime.map(item => item.profitLossPercentage);
  const pointColors = allData.map(value => {
    if (value === null || isNaN(value)) return '#9CA3AF'; // Gray for null
    // Green for values >= 0, Red for values < 0
    return value >= 0 ? '#22C55E' : '#EF4444';
  });

  // Format dates for chart labels based on granularity
  const formatDateLabel = (dateStr: string): string => {
    try {
      // Try parsing as ISO date
      const date = parseISO(dateStr);
      if (!isNaN(date.getTime())) {
        if (granularity === 'daily') {
          return format(date, 'MMM dd'); // "Nov 17"
        } else if (granularity === 'weekly') {
          return format(date, 'MMM dd'); // "Nov 17"
        } else {
          return format(date, 'MMM yyyy'); // "November 2024"
        }
      }
    } catch (e) {
      // If parsing fails, return original string
    }
    return dateStr;
  };

  // Create segments for the line - split into profit (green) and loss (red) segments
  // Chart.js v3+ supports segment colors
  const chartData = {
    labels: profitLossPercentageOverTime.map(item => formatDateLabel(item.date)),
    datasets: [
      {
        label: 'Profit & Loss %',
        data: allData,
        borderWidth: 3,
        fill: 'origin', // Fill to zero baseline
        tension: 0.4,
        pointBackgroundColor: pointColors,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointHoverBorderWidth: 3,
        segment: {
          borderColor: (ctx: any) => {
            // Get both start and end point values
            const startValue = ctx.p0?.parsed?.y;
            const endValue = ctx.p1?.parsed?.y;
            
            // If either value is invalid, return gray
            if (startValue === null || startValue === undefined || isNaN(startValue) ||
                endValue === null || endValue === undefined || isNaN(endValue)) {
              return '#9CA3AF';
            }
            
            // If both points are above or equal to zero, use green
            // If both points are below zero, use red
            // If segment crosses zero, use the end point value
            if (startValue >= 0 && endValue >= 0) {
              return '#22C55E'; // Green for entirely above zero
            } else if (startValue < 0 && endValue < 0) {
              return '#EF4444'; // Red for entirely below zero
            } else {
              // Segment crosses zero - use end point color
              return endValue >= 0 ? '#22C55E' : '#EF4444';
            }
          },
          backgroundColor: (ctx: any) => {
            // Get both start and end point values
            const startValue = ctx.p0?.parsed?.y;
            const endValue = ctx.p1?.parsed?.y;
            
            // If either value is invalid, return gray
            if (startValue === null || startValue === undefined || isNaN(startValue) ||
                endValue === null || endValue === undefined || isNaN(endValue)) {
              return 'rgba(156, 163, 175, 0.2)';
            }
            
            // If both points are above or equal to zero, use green fill
            // If both points are below zero, use red fill
            // If segment crosses zero, use the end point value
            if (startValue >= 0 && endValue >= 0) {
              return 'rgba(34, 197, 94, 0.3)'; // Green fill for entirely above zero
            } else if (startValue < 0 && endValue < 0) {
              return 'rgba(239, 68, 68, 0.3)'; // Red fill for entirely below zero
            } else {
              // Segment crosses zero - use end point color
              return endValue >= 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
            }
          }
        }
      },
    ],
  };

  // Plugin to draw zero baseline
  const zeroLinePlugin = {
    id: 'zeroLine',
    afterDatasetsDraw: (chart: any) => {
      const ctx = chart.ctx;
      const chartArea = chart.chartArea;
      const yScale = chart.scales.y;
      
      if (!chartArea || !yScale) return;
      
      // Find the y position of zero
      const zeroY = yScale.getPixelForValue(0);
      
      // Only draw if zero is within the chart area
      if (zeroY >= chartArea.top && zeroY <= chartArea.bottom) {
        ctx.save();
        ctx.strokeStyle = '#9CA3AF'; // Gray color for baseline
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]); // Solid line for baseline
        ctx.beginPath();
        ctx.moveTo(chartArea.left, zeroY);
        ctx.lineTo(chartArea.right, zeroY);
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  // Plugin to display values above points
  const valuePlugin = {
    id: 'valueLabels',
    afterDatasetsDraw: (chart: any) => {
      const ctx = chart.ctx;
      chart.data.datasets.forEach((dataset: any, i: number) => {
        const meta = chart.getDatasetMeta(i);
        meta.data.forEach((point: any, index: number) => {
          const value = dataset.data[index];
          // Show value if it's not null and not zero
          if (value !== null && !isNaN(value) && Math.abs(value) > 0) {
            ctx.save();
            
            // Text with shadow for better visibility
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            ctx.fillStyle = '#6B7280';
            ctx.font = 'bold 13px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            const formattedValue = formatProfitLossPercentage(value);
            ctx.fillText(formattedValue, point.x, point.y - 8);
            
            ctx.restore();
          }
        });
      });
    }
  };

  // Determine overall trend for header color
  const totalPL = profitLossPercentageOverTime.reduce((sum, item) => sum + (item.profitLossPercentage || 0), 0);
  const isOverallProfit = totalPL >= 0;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1200,
      easing: 'easeOutQuart' as any,
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#111827',
        bodyColor: '#374151',
        borderColor: isOverallProfit ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)',
        borderWidth: 2,
        cornerRadius: 8,
        padding: 16,
        titleFont: {
          size: 15,
          weight: 'bold' as const,
          family: 'Inter, system-ui, sans-serif',
        },
        bodyFont: {
          size: 14,
          weight: 600,
          family: 'Inter, system-ui, sans-serif',
        },
        callbacks: {
          title: (context: any) => {
            return `📅 ${context[0].label}`;
          },
          label: function(context: any) {
            const value = context.parsed.y;
            if (value === null || isNaN(value)) {
              return 'P & L %: N/A';
            }
            const formatted = formatProfitLossPercentage(value);
            const isProfit = value > 0;
            const icon = isProfit ? '📈' : '📉';
            return `${icon} P & L %: ${formatted} ${isProfit ? '(Profit)' : value < 0 ? '(Loss)' : '(Neutral)'}`;
          }
        },
        displayColors: false,
        boxPadding: 8,
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 12,
            weight: 600,
            family: 'Inter, system-ui, sans-serif',
          },
          color: '#6B7280',
          maxRotation: 0,
          minRotation: 0,
          padding: 12,
        },
        grid: {
          display: false,
        },
        border: {
          display: true,
          color: '#E5E7EB',
          width: 1.5,
          dash: [5, 5],
        }
      },
      y: {
        beginAtZero: false, // Allow negative values
        ticks: {
          font: {
            size: 11,
            weight: 600,
            family: 'Inter, system-ui, sans-serif',
          },
          color: '#6B7280',
          callback: function(value: any) {
            const numValue = Number(value);
            if (isNaN(numValue)) {
              return 'N/A';
            }
            return formatProfitLossPercentage(numValue);
          },
          padding: 10,
        },
        grid: {
          color: (context: any) => {
            // Draw gray line at zero, colored lines elsewhere
            if (context.tick && context.tick.value === 0) {
              return '#9CA3AF'; // Gray for zero line
            }
            return isOverallProfit ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)';
          },
          lineWidth: (context: any) => {
            // Thicker line at zero
            if (context.tick && context.tick.value === 0) {
              return 1.5;
            }
            return 1.5;
          },
          drawTicks: false,
        },
        border: {
          display: true,
          color: '#E5E7EB',
          width: 1.5,
        }
      },
    },
  };

  return gradientWrapper(
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-2 h-10 bg-gradient-to-b rounded-full shadow-lg ${
                isOverallProfit 
                  ? 'from-green-500 via-green-600 to-green-700' 
                  : 'from-red-500 via-red-600 to-red-700'
              }`}></div>
              <div className={`absolute inset-0 w-2 h-10 bg-gradient-to-b rounded-full opacity-50 blur-sm ${
                isOverallProfit 
                  ? 'from-green-400 to-green-600' 
                  : 'from-red-400 to-red-600'
              }`}></div>
            </div>
            <div>
              <h3 className={`text-2xl font-bold tracking-tight ${
                theme === 'light' ? 'text-gray-900' : 'text-gray-900'
              }`}>
                Monthly P & L ( In percentage )
              </h3>
            </div>
          </div>
          <TimeGranularityToggle granularity={granularity} onGranularityChange={setGranularity} />
        </div>
        <div className={`h-1.5 w-20 bg-gradient-to-r rounded-full ml-5 shadow-sm ${
          isOverallProfit 
            ? 'from-green-500 via-green-600 to-green-700' 
            : 'from-red-500 via-red-600 to-red-700'
        }`}></div>
      </div>
      <div className="flex-1 min-h-0">
        <Line
          data={chartData}
          options={chartOptions}
          plugins={[zeroLinePlugin, valuePlugin]}
        />
      </div>
    </>
  );
}

