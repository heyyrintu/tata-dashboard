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
import { useCostData } from '../../hooks/useCostData';
import { LoadingSpinner } from '../LoadingSpinner';
import TimeGranularityToggle from '../TimeGranularityToggle';
import { formatIndianNumber } from '../../utils/costCalculations';
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

export default function CostOverTimeChart() {
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const { data, loading, error } = useCostData(granularity);
  const { theme } = useTheme();

  const gradientWrapper = (content: React.ReactNode) => (
    <div className={`rounded-2xl h-[368px] ${
      theme === 'light' 
        ? 'p-[2px] shadow-lg' 
        : 'shadow-xl border border-blue-900/30'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(to right, rgba(59, 130, 246, 0.35), rgba(139, 92, 246, 0.35))',
      boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.2), 0 4px 6px -2px rgba(139, 92, 246, 0.2)'
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
          <div className="text-sm text-red-400 mb-2">Error loading cost data</div>
          <div className="text-xs text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  if (!data || !data.costOverTime || data.costOverTime.length === 0) {
    return gradientWrapper(
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-gray-400">No cost data available</div>
      </div>
    );
  }

  const chartData = {
    labels: data.costOverTime.map(item => item.date),
    datasets: [
      {
        label: 'Cost',
        data: data.costOverTime.map(item => item.cost),
        borderColor: '#3B82F6', // Blue theme color
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
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
          // Only show value if it's greater than 0
          if (value > 0) {
            ctx.save();
            ctx.fillStyle = theme === 'light' ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.8)';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            const formattedValue = formatIndianNumber(value);
            ctx.fillText(`₹${formattedValue}`, point.x, point.y - 8);
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
            size: 10,
            weight: theme === 'light' ? ('600' as const) : ('normal' as const),
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
          weight: theme === 'light' ? ('600' as const) : ('normal' as const),
        },
        bodyFont: {
          weight: theme === 'light' ? ('600' as const) : ('normal' as const),
        },
        callbacks: {
          label: function(context: any) {
            return `Cost: ₹${formatIndianNumber(context.parsed.y || 0)}`;
          }
        }
      },
    },
    scales: {
      x: {
        ticks: {
          font: { 
            size: 10,
            weight: theme === 'light' ? ('600' as const) : ('normal' as const),
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
            size: 10,
            weight: theme === 'light' ? ('600' as const) : ('normal' as const),
          },
          color: theme === 'light' ? '#1e3a8a' : '#1e3a8a',
          callback: function(value: any) {
            return formatIndianNumber(Number(value));
          }
        },
        grid: {
          color: theme === 'light' ? 'rgba(30, 58, 138, 0.2)' : 'rgba(30, 58, 138, 0.2)',
        },
        beginAtZero: true,
      },
    },
  };

  return gradientWrapper(
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold text-left ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>Cost Over Time</h3>
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

