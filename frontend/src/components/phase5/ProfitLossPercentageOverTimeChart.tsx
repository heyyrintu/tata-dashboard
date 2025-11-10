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
import { LoadingSpinner } from '../LoadingSpinner';
import TimeGranularityToggle from '../TimeGranularityToggle';
import { formatProfitLossPercentage } from '../../utils/profitLossCalculations';
import { useTheme } from '../../context/ThemeContext';

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
    <div className={`rounded-2xl h-[368px] ${
      theme === 'light' 
        ? 'p-[2px] shadow-lg' 
        : 'shadow-xl border border-blue-900/30'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(to right, rgba(16, 185, 129, 0.35), rgba(239, 68, 68, 0.35))',
      boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2), 0 4px 6px -2px rgba(239, 68, 68, 0.2)'
    } : {}}>
      <div className={`rounded-2xl p-6 h-full flex flex-col ${
        theme === 'light' ? 'bg-white border-0' : 'bg-white'
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
          <div className="text-sm text-red-400 mb-2">Error loading profit & loss percentage data</div>
          <div className="text-xs text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  if (!profitLossData || !profitLossData.profitLossOverTime || profitLossData.profitLossOverTime.length === 0 ||
      !revenueData || !revenueData.revenueOverTime || revenueData.revenueOverTime.length === 0) {
    return gradientWrapper(
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-gray-400">No profit & loss percentage data available</div>
      </div>
    );
  }

  // Create a map of revenue by date for quick lookup
  const revenueMap = new Map<string, number>();
  if (revenueData?.revenueOverTime) {
    revenueData.revenueOverTime.forEach(item => {
      if (item && item.date) {
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
    
    const revenue = revenueMap.get(item.date) || 0;
    const profitLoss = item.profitLoss || 0;
    const cost = revenue - profitLoss; // Cost = Revenue - Profit/Loss
    
    // Calculate percentage: (Profit/Loss / Cost) × 100
    // Handle edge case: if cost is 0, return null
    if (cost === 0) {
      return {
        date: item.date,
        profitLossPercentage: null as number | null
      };
    }
    
    return {
      date: item.date,
      profitLossPercentage: (profitLoss / cost) * 100
    };
  }).filter(item => item.date); // Filter out items with empty dates

  // Prepare data with point colors based on positive/negative values
  const allData = profitLossPercentageOverTime.map(item => item.profitLossPercentage);
  const pointColors = allData.map(value => {
    if (value === null || isNaN(value)) return '#9CA3AF'; // Gray for null
    return value > 0 ? '#10B981' : value < 0 ? '#EF4444' : '#9CA3AF'; // Green for positive, Red for negative, Gray for zero
  });

  // Create segments for the line - split into profit (green) and loss (red) segments
  // Chart.js v3+ supports segment colors
  const chartData = {
    labels: profitLossPercentageOverTime.map(item => item.date),
    datasets: [
      {
        label: 'Profit & Loss %',
        data: allData,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: pointColors,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        segment: {
          borderColor: (ctx: any) => {
            // Get the value of the current segment's end point
            const value = ctx.p1?.parsed?.y;
            if (value === null || value === undefined || isNaN(value)) return '#9CA3AF';
            // Green for values above 0, red for values below 0
            return value > 0 ? '#10B981' : value < 0 ? '#EF4444' : '#9CA3AF';
          },
          backgroundColor: (ctx: any) => {
            // Get the value of the current segment's end point for fill color
            const value = ctx.p1?.parsed?.y;
            if (value === null || value === undefined || isNaN(value)) return 'rgba(156, 163, 175, 0.2)';
            // Green fill for positive values, red fill for negative values
            return value > 0 ? 'rgba(16, 185, 129, 0.3)' : value < 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(156, 163, 175, 0.2)';
          }
        }
      },
    ],
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
            // Green for values above 0, red for values below 0
            const isProfit = value > 0;
            ctx.fillStyle = isProfit ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)';
            ctx.font = 'bold 14px sans-serif';
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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          boxWidth: 8,
          font: { 
            size: 14,
            weight: theme === 'light' ? ('bold' as const) : ('normal' as const),
          },
          padding: 5,
          color: theme === 'light' ? '#1e3a8a' : '#1e3a8a'
        }
      },
      tooltip: {
        backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: theme === 'light' ? '#1e3a8a' : '#1e3a8a',
        bodyColor: theme === 'light' ? '#1e3a8a' : '#1e3a8a',
        borderColor: theme === 'light' ? 'rgba(30, 58, 138, 0.3)' : '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        titleFont: {
          size: 14,
          weight: theme === 'light' ? ('bold' as const) : ('normal' as const),
        },
        bodyFont: {
          size: 14,
          weight: theme === 'light' ? ('bold' as const) : ('normal' as const),
        },
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            if (value === null || isNaN(value)) {
              return 'Profit & Loss %: N/A';
            }
            const formatted = formatProfitLossPercentage(value);
            // Green for values above 0, red for values below 0
            const isProfit = value > 0;
            return `Profit & Loss %: ${formatted} ${isProfit ? '(Profit)' : value < 0 ? '(Loss)' : '(Neutral)'}`;
          }
        }
      },
    },
    scales: {
      x: {
        ticks: {
          font: { 
            size: 14,
            weight: theme === 'light' ? ('bold' as const) : ('normal' as const),
          },
          color: theme === 'light' ? '#1e3a8a' : '#1e3a8a',
          maxRotation: 0
        },
        grid: {
          display: false
        }
      },
      y: {
        ticks: {
          font: { 
            size: 14,
            weight: theme === 'light' ? (600 as const) : ('normal' as const),
          },
          color: theme === 'light' ? '#1e3a8a' : '#1e3a8a',
          callback: function(value: any) {
            const numValue = Number(value);
            if (isNaN(numValue)) {
              return 'N/A';
            }
            return formatProfitLossPercentage(numValue);
          }
        },
        grid: {
          color: theme === 'light' ? 'rgba(30, 58, 138, 0.2)' : 'rgba(30, 58, 138, 0.2)',
        },
        beginAtZero: false, // Allow negative values
      },
    },
  };

  return gradientWrapper(
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-xl font-semibold text-left ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>Monthly P & L ( In percentage )</h3>
        <TimeGranularityToggle granularity={granularity} onGranularityChange={setGranularity} />
      </div>
      <div className="flex-1">
        <Line
          data={chartData}
          options={chartOptions}
          plugins={[valuePlugin]}
        />
      </div>
    </>
  );
}

