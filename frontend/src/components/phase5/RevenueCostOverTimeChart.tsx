import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useRevenueData } from '../../hooks/useRevenueData';
import { useCostData } from '../../hooks/useCostData';
import { LoadingSpinner } from '../LoadingSpinner';
import TimeGranularityToggle from '../TimeGranularityToggle';
// import { formatIndianNumber } from '../../utils/revenueCalculations';
import { useTheme } from '../../context/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function RevenueCostOverTimeChart() {
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const { data: revenueData, loading: revenueLoading, error: revenueError } = useRevenueData(granularity);
  const { data: costData, loading: costLoading, error: costError } = useCostData(granularity);
  const { theme } = useTheme();

  const loading = revenueLoading || costLoading;
  const error = revenueError || costError;

  const gradientWrapper = (content: React.ReactNode) => (
    <div className={`rounded-xl overflow-hidden ${
      theme === 'light' 
        ? 'p-[3px] shadow-2xl' 
        : 'shadow-2xl border border-green-900/20'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15), rgba(239, 68, 68, 0.15))',
      boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.25), 0 0 0 1px rgba(16, 185, 129, 0.05)'
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
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return gradientWrapper(
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-sm text-red-400 mb-2">Error loading revenue and cost data</div>
          <div className="text-xs text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  if (!revenueData || !revenueData.revenueOverTime || revenueData.revenueOverTime.length === 0 ||
      !costData || !costData.costOverTime || costData.costOverTime.length === 0) {
    return gradientWrapper(
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-gray-400">No revenue and cost data available</div>
      </div>
    );
  }

  // Create maps for quick lookup
  const revenueMap = new Map<string, number>();
  revenueData.revenueOverTime.forEach(item => {
    if (item && item.date) {
      revenueMap.set(item.date, item.revenue || 0);
    }
  });

  const costMap = new Map<string, number>();
  costData.costOverTime.forEach(item => {
    if (item && item.date) {
      costMap.set(item.date, item.cost || 0);
    }
  });

  // Get all unique dates from both datasets
  const allDates = new Set<string>();
  revenueData.revenueOverTime.forEach(item => {
    if (item && item.date) allDates.add(item.date);
  });
  costData.costOverTime.forEach(item => {
    if (item && item.date) allDates.add(item.date);
  });

  // Sort dates month-wise (chronologically)
  const sortedDates = Array.from(allDates).sort((a, b) => {
    // Parse month labels like "Jan'25", "Feb'25", etc.
    const parseMonthLabel = (label: string): Date => {
      try {
        // Check if it's in MMM'yy format (e.g., "Jan'25")
        if (label.includes("'")) {
          const [monthStr, yearStr] = label.split("'");
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthIndex = monthNames.indexOf(monthStr);
          const year = 2000 + parseInt(yearStr, 10); // Convert '25' to 2025
          if (monthIndex !== -1) {
            return new Date(year, monthIndex, 1);
          }
        }
        // Try parsing as regular date string
        const parsed = new Date(label);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      } catch (e) {
        // If parsing fails, return a far future date to push to end
        return new Date(9999, 0, 1);
      }
      return new Date(9999, 0, 1);
    };

    const dateA = parseMonthLabel(a);
    const dateB = parseMonthLabel(b);
    return dateA.getTime() - dateB.getTime();
  });

  // Create beautiful gradient for Revenue bars
  const createRevenueGradient = (ctx: CanvasRenderingContext2D, chartArea: any) => {
    if (!chartArea) return 'rgba(16, 185, 129, 0.8)';
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, 'rgba(5, 150, 105, 0.8)'); // Darker green at bottom
    gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.85)'); // Mid green
    gradient.addColorStop(1, 'rgba(34, 197, 94, 0.9)'); // Lighter green at top
    return gradient;
  };

  // Create beautiful gradient for Cost bars
  const createCostGradient = (ctx: CanvasRenderingContext2D, chartArea: any) => {
    if (!chartArea) return 'rgba(239, 68, 68, 0.8)';
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, 'rgba(220, 38, 38, 0.8)'); // Darker red at bottom
    gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.85)'); // Mid red
    gradient.addColorStop(1, 'rgba(248, 113, 113, 0.9)'); // Lighter red at top
    return gradient;
  };

  const chartData = {
    labels: sortedDates,
    datasets: [
      {
        label: 'Revenue',
        data: sortedDates.map(date => revenueMap.get(date) || 0),
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(16, 185, 129, 0.8)';
          return createRevenueGradient(ctx, chartArea);
        },
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 0,
        borderRadius: {
          topLeft: 6,
          topRight: 6,
          bottomLeft: 0,
          bottomRight: 0,
        },
        borderSkipped: false,
        maxBarThickness: 60,
      },
      {
        label: 'Cost',
        data: sortedDates.map(date => costMap.get(date) || 0),
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(239, 68, 68, 0.8)';
          return createCostGradient(ctx, chartArea);
        },
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 0,
        borderRadius: {
          topLeft: 6,
          topRight: 6,
          bottomLeft: 0,
          bottomRight: 0,
        },
        borderSkipped: false,
        maxBarThickness: 60,
      },
    ],
  };

  const formatLakh = (value: number): string => {
    if (value >= 100000) {
      const lakhs = value / 100000;
      return lakhs.toFixed(2).replace(/\.00$/, '').replace(/\.(\d)0$/, '.$1') + ' L';
    }
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
  };

  // Plugin to display values above bars
  const valuePlugin = {
    id: 'valueLabels',
    afterDatasetsDraw: (chart: any) => {
      const ctx = chart.ctx;
      chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        meta.data.forEach((bar: any, index: number) => {
          const value = dataset.data[index];
          // Only show value if it's greater than 0
          if (value > 0) {
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
            ctx.fillText(formatLakh(value), bar.x, bar.y - 8);
            
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
    animation: {
      duration: 1200,
      easing: 'easeOutQuart' as any,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#111827',
        bodyColor: '#374151',
        borderColor: 'rgba(16, 185, 129, 0.4)',
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
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            const icon = label === 'Revenue' ? '💰' : '💸';
            return `${icon} ${label}: ₹${formatLakh(value)}`;
          }
        },
        displayColors: true,
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
        beginAtZero: true,
        ticks: {
          font: {
            size: 11,
            weight: 600,
            family: 'Inter, system-ui, sans-serif',
          },
          color: '#6B7280',
          callback: (value: any) => {
            return formatLakh(value);
          },
          padding: 10,
        },
        grid: {
          color: 'rgba(16, 185, 129, 0.08)',
          lineWidth: 1.5,
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
              <div className="w-2 h-10 bg-gradient-to-b from-green-500 via-green-600 to-green-700 rounded-full shadow-lg"></div>
              <div className="absolute inset-0 w-2 h-10 bg-gradient-to-b from-green-400 to-green-600 rounded-full opacity-50 blur-sm"></div>
            </div>
            <div>
              <h3 className={`text-2xl font-bold tracking-tight ${
                theme === 'light' ? 'text-gray-900' : 'text-gray-900'
              }`}>
                Revenue & Cost Over Time
              </h3>
            </div>
          </div>
          <TimeGranularityToggle granularity={granularity} onGranularityChange={setGranularity} />
        </div>
        <div className="h-1.5 w-20 bg-gradient-to-r from-green-500 via-green-600 to-green-700 rounded-full ml-5 shadow-sm"></div>
      </div>
      <div className="flex-1 min-h-0">
        <Bar
          data={chartData}
          options={chartOptions}
          plugins={[valuePlugin]}
        />
      </div>
    </>
  );
}

