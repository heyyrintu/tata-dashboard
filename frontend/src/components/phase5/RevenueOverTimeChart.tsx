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
import { useRevenueData } from '../../hooks/useRevenueData';
import { Skeleton } from '../ui/skeleton';
import TimeGranularityToggle from '../TimeGranularityToggle';
import { formatIndianNumber } from '../../utils/revenueCalculations';
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

export default function RevenueOverTimeChart() {
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const { data, loading, error } = useRevenueData(granularity);
  const { theme } = useTheme();

  const gradientWrapper = (content: React.ReactNode) => (
    <div className={`rounded-2xl h-[368px] ${
      theme === 'light' 
        ? 'p-[2px] shadow-lg' 
        : 'shadow-xl border border-blue-900/30'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(to right, rgba(224, 30, 31, 0.35), rgba(254, 165, 25, 0.35))',
      boxShadow: '0 10px 15px -3px rgba(224, 30, 31, 0.2), 0 4px 6px -2px rgba(254, 165, 25, 0.2)'
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
          <div className="text-sm text-red-400 mb-2">Error loading revenue data</div>
          <div className="text-xs text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  if (!data || !data.revenueOverTime || data.revenueOverTime.length === 0) {
    return gradientWrapper(
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-gray-400">No revenue data available</div>
      </div>
    );
  }

  const chartData = {
    labels: data.revenueOverTime.map(item => item.date),
    datasets: [
      {
        label: 'Revenue',
        data: data.revenueOverTime.map(item => item.revenue),
        borderColor: '#FEA519', // Orange theme color
        backgroundColor: 'rgba(254, 165, 25, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#FEA519',
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
            ctx.fillStyle = theme === 'light' ? 'rgba(30, 58, 138, 0.8)' : 'rgba(30, 58, 138, 0.8)';
            ctx.font = 'bold 14px sans-serif';
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
            return `Revenue: ₹${formatIndianNumber(context.parsed.y || 0)}`;
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
        }
      },
      y: {
        ticks: {
          font: { 
            size: 14,
            weight: (theme === 'light' ? 600 : 'normal') as number | 'normal',
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
        <h3 className={`text-xl font-semibold text-left ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>Revenue Over Time</h3>
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
