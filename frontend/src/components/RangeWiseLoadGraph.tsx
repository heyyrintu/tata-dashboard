import React from 'react';
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
import { useRangeData } from '../hooks/useRangeData';
import { Skeleton } from './ui/skeleton';
import { calculateChartData } from '../utils/rangeCalculations';
import { useTheme } from '../context/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function RangeWiseLoadGraph() {
  const { data, loading } = useRangeData();
  const { theme } = useTheme();

  const gradientBorderWrapper = (content: React.ReactNode) => (
    <div className={`rounded-xl overflow-hidden ${
      theme === 'light' 
        ? 'p-[3px] shadow-2xl' 
        : 'shadow-2xl border border-red-900/20'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.15), rgba(220, 38, 38, 0.15), rgba(185, 28, 28, 0.15))',
      boxShadow: '0 25px 50px -12px rgba(220, 38, 38, 0.25), 0 0 0 1px rgba(220, 38, 38, 0.05)'
    } : {}}>
      <div className={`rounded-xl p-8 flex flex-col backdrop-blur-sm transition-all duration-300 ${
        theme === 'light' ? 'bg-gradient-to-br from-white via-red-50/30 to-white border-0' : 'bg-white/95'
      }`} style={theme === 'light' ? { border: 'none' } : {}}>
        {content}
      </div>
    </div>
  );

  if (loading) {
    return gradientBorderWrapper(
      <>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <div className="w-2 h-10 bg-gradient-to-b from-red-500 via-red-600 to-red-700 rounded-full shadow-lg"></div>
              <div className="absolute inset-0 w-2 h-10 bg-gradient-to-b from-red-400 to-red-600 rounded-full opacity-50 blur-sm"></div>
            </div>
            <div>
              <h3 className={`text-2xl font-bold tracking-tight ${
                theme === 'light' ? 'text-gray-900' : 'text-gray-900'
              }`}>
                Range-Wise Bucket Count Graph
              </h3>
            </div>
          </div>
          <div className="h-1.5 w-20 bg-gradient-to-r from-red-500 via-red-600 to-red-700 rounded-full ml-5 shadow-sm"></div>
        </div>
        <div className="flex items-end gap-3 h-64 pt-4 px-4">
          {[40, 70, 55, 85, 35, 65, 50, 75].map((h, i) => (
            <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
          ))}
        </div>
      </>
    );
  }

  if (!data || data.rangeData.length === 0) {
    return gradientBorderWrapper(
      <>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <div className="w-2 h-10 bg-gradient-to-b from-red-500 via-red-600 to-red-700 rounded-full shadow-lg"></div>
              <div className="absolute inset-0 w-2 h-10 bg-gradient-to-b from-red-400 to-red-600 rounded-full opacity-50 blur-sm"></div>
            </div>
            <div>
              <h3 className={`text-2xl font-bold tracking-tight ${
                theme === 'light' ? 'text-gray-900' : 'text-gray-900'
              }`}>
                Range-Wise Bucket Count Graph
              </h3>
            </div>
          </div>
          <div className="h-1.5 w-20 bg-gradient-to-r from-red-500 via-red-600 to-red-700 rounded-full ml-5 shadow-sm"></div>
        </div>
        <div className="flex justify-center items-center flex-1 min-h-0 text-black">
          No data available for the selected date range
        </div>
      </>
    );
  }

  const chartData = calculateChartData(data.rangeData);

  // Calculate max value from chart data and add 2000
  const maxDataValue = Math.max(...(chartData.datasets[0]?.data || [0]), 0);
  const yAxisMax = maxDataValue + 2000;

  // Plugin to display values above bars
  const valuePlugin = {
    id: 'valueLabels',
    afterDatasetsDraw: (chart: any) => {
      const ctx = chart.ctx;
      chart.data.datasets.forEach((dataset: any, i: number) => {
        const meta = chart.getDatasetMeta(i);
        meta.data.forEach((bar: any, index: number) => {
          const value = dataset.data[index];
          ctx.save();
          ctx.fillStyle = 'rgba(31, 41, 55, 0.7)';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(value, bar.x, bar.y - 5);
          ctx.restore();
        });
      });
    }
  };

  return gradientBorderWrapper(
    <>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <div className="w-2 h-10 bg-gradient-to-b from-red-500 via-red-600 to-red-700 rounded-full shadow-lg"></div>
            <div className="absolute inset-0 w-2 h-10 bg-gradient-to-b from-red-400 to-red-600 rounded-full opacity-50 blur-sm"></div>
          </div>
          <div>
            <h3 className={`text-2xl font-bold tracking-tight ${
              theme === 'light' ? 'text-gray-900' : 'text-gray-900'
            }`}>
              Range-Wise Bucket Count Graph
            </h3>
          </div>
        </div>
        <div className="h-1.5 w-20 bg-gradient-to-r from-red-500 via-red-600 to-red-700 rounded-full ml-5 shadow-sm"></div>
      </div>
      <div className="flex-1 min-h-0" style={{ minHeight: '360px' }}>
        <Bar
          data={chartData}
          plugins={[valuePlugin]}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                enabled: true,
                backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                titleColor: theme === 'light' ? '#1e3a8a' : '#1e3a8a',
                bodyColor: theme === 'light' ? '#1e3a8a' : '#1e3a8a',
                borderColor: theme === 'light' ? 'rgba(220, 38, 38, 0.4)' : 'rgba(220, 38, 38, 0.4)',
                borderWidth: 1,
                titleFont: {
                  weight: theme === 'light' ? ('bold' as const) : 'normal',
                },
                bodyFont: {
                  weight: theme === 'light' ? ('bold' as const) : 'normal',
                },
                callbacks: {
                  label: function (context) {
                    return `Bucket Count: ${context.parsed.y || 0}`;
                  },
                },
              },
            },
            scales: {
              y: {
                max: yAxisMax,
                ticks: {
                  color: theme === 'light' ? '#1e3a8a' : '#1e3a8a',
                  font: {
                    weight: theme === 'light' ? ('bold' as const) : ('bold' as const),
                  },
                },
                grid: {
                  color: theme === 'light' ? 'rgba(220, 38, 38, 0.08)' : 'rgba(220, 38, 38, 0.08)',
                },
              },
              x: {
                ticks: {
                  color: theme === 'light' ? '#1e3a8a' : '#1e3a8a',
                  font: {
                    weight: theme === 'light' ? ('bold' as const) : ('bold' as const),
                  },
                },
                grid: {
                  display: false,
                },
              },
            },
          }}
        />
      </div>
    </>
  );
}

