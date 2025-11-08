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
import { LoadingSpinner } from '../LoadingSpinner';
import TimeGranularityToggle from '../TimeGranularityToggle';
import { formatIndianNumber } from '../../utils/profitLossCalculations';
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

export default function ProfitLossOverTimeChart() {
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const { data, loading, error } = useProfitLossData(granularity);
  const { theme } = useTheme();

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
          <div className="text-sm text-red-400 mb-2">Error loading profit & loss data</div>
          <div className="text-xs text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  if (!data || !data.profitLossOverTime || data.profitLossOverTime.length === 0) {
    return gradientWrapper(
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-gray-400">No profit & loss data available</div>
      </div>
    );
  }

  // Determine if overall trend is profit or loss for color
  const totalPL = data.profitLossOverTime.reduce((sum, item) => sum + item.profitLoss, 0);
  const isOverallProfit = totalPL >= 0;
  const lineColor = isOverallProfit ? '#10B981' : '#EF4444'; // Green for profit, Red for loss

  const chartData = {
    labels: data.profitLossOverTime.map(item => item.date),
    datasets: [
      {
        label: 'Profit & Loss',
        data: data.profitLossOverTime.map(item => item.profitLoss),
        borderColor: lineColor,
        backgroundColor: lineColor + '1A', // 10% opacity
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: lineColor,
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
          // Show value if it's not zero
          if (Math.abs(value) > 0) {
            ctx.save();
            const isProfit = value >= 0;
            ctx.fillStyle = isProfit ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            const formattedValue = formatIndianNumber(Math.abs(value));
            const sign = value >= 0 ? '+' : '-';
            ctx.fillText(`${sign}₹${formattedValue}`, point.x, point.y - 8);
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
            weight: theme === 'light' ? 600 : ('normal' as const),
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
          weight: theme === 'light' ? 600 : ('normal' as const),
        },
        bodyFont: {
          weight: theme === 'light' ? 600 : ('normal' as const),
        },
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y || 0;
            const isProfit = value >= 0;
            const sign = value >= 0 ? '+' : '-';
            return `Profit & Loss: ${sign}₹${formatIndianNumber(Math.abs(value))} ${isProfit ? '(Profit)' : '(Loss)'}`;
          }
        }
      },
    },
    scales: {
      x: {
        ticks: {
          font: { 
            size: 10,
            weight: theme === 'light' ? 600 : ('normal' as const),
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
            weight: theme === 'light' ? 600 : ('normal' as const),
          },
          color: theme === 'light' ? '#1e3a8a' : '#1e3a8a',
          callback: function(value: any) {
            const numValue = Number(value);
            const sign = numValue >= 0 ? '+' : '-';
            return `${sign}${formatIndianNumber(Math.abs(numValue))}`;
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
        <h3 className={`text-lg font-semibold text-left ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>Profit & Loss Over Time</h3>
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

