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

  // Create gradient colors function
  const createGradient = (ctx: CanvasRenderingContext2D, chartArea: any, colorStops: string[]) => {
    if (!chartArea) {
      return colorStops[0];
    }
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    colorStops.forEach((color, index) => {
      gradient.addColorStop(index / (colorStops.length - 1), color);
    });
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
          if (!chartArea) {
            return 'rgba(16, 185, 129, 0.5)';
          }
          return createGradient(ctx, chartArea, [
            'rgba(16, 185, 129, 0.5)', // Light green - 50% opacity
            'rgba(5, 150, 105, 0.5)', // Medium green - 50% opacity
            'rgba(4, 120, 87, 0.5)'  // Dark green - 50% opacity
          ]);
        },
        borderColor: 'rgba(4, 120, 87, 0.7)', // Dark green - 70% opacity
        borderWidth: 2,
      },
      {
        label: 'Cost',
        data: sortedDates.map(date => costMap.get(date) || 0),
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) {
            return 'rgba(239, 68, 68, 0.5)';
          }
          return createGradient(ctx, chartArea, [
            'rgba(248, 113, 113, 0.5)', // Light red - 50% opacity
            'rgba(239, 68, 68, 0.5)', // Medium red - 50% opacity
            'rgba(220, 38, 38, 0.5)'  // Dark red - 50% opacity
          ]);
        },
        borderColor: 'rgba(220, 38, 38, 0.7)', // Dark red - 70% opacity
        borderWidth: 2,
      },
    ],
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
            ctx.fillStyle = datasetIndex === 0 
              ? 'rgba(5, 150, 105, 0.9)' // Green for Revenue
              : 'rgba(220, 38, 38, 0.9)'; // Red for Cost
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            const lakhs = value / 100000;
            const formattedValue = `${lakhs.toFixed(1)} L`;
            
            // Position label at the top of the bar
            const yPosition = bar.y < 0 ? bar.y - 8 : bar.y - 8;
            ctx.textBaseline = 'bottom';
            ctx.fillText(`₹${formattedValue}`, bar.x, yPosition);
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
        align: 'end' as const,
        labels: {
          boxWidth: 8,
          font: { 
            size: 14,
            weight: (theme === 'light' ? 600 : 'normal') as number | 'normal',
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
          weight: (theme === 'light' ? 600 : 'normal') as number | 'normal',
        },
        bodyFont: {
          size: 14,
          weight: (theme === 'light' ? 600 : 'normal') as number | 'normal',
        },
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            const lakhs = value / 100000;
            return `${label}: ₹${lakhs.toFixed(1)} L`;
          }
        }
      },
    },
    scales: {
      x: {
        ticks: {
          font: { 
            size: 14,
            weight: (theme === 'light' ? 600 : 'normal') as number | 'normal',
          },
          color: theme === 'light' ? '#1e3a8a' : '#1e3a8a',
          maxRotation: 0
        },
        grid: {
          display: false
        },
        stacked: false,
      },
      y: {
        ticks: {
          font: { 
            size: 14,
            weight: (theme === 'light' ? 600 : 'normal') as number | 'normal',
          },
          color: theme === 'light' ? '#1e3a8a' : '#1e3a8a',
          callback: function(value: any) {
            const numValue = Number(value);
            const lakhs = numValue / 100000;
            return `${lakhs.toFixed(1)} L`;
          }
        },
        grid: {
          color: theme === 'light' ? 'rgba(30, 58, 138, 0.2)' : 'rgba(30, 58, 138, 0.2)',
        },
        beginAtZero: true,
        stacked: false,
      },
    },
  };

  return gradientWrapper(
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-xl font-semibold text-left ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>Revenue & Cost Over Time</h3>
        <TimeGranularityToggle granularity={granularity} onGranularityChange={setGranularity} />
      </div>
      <div className="flex-1">
        <Bar
          data={chartData}
          options={chartOptions}
          plugins={[valuePlugin]}
        />
      </div>
    </>
  );
}

