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
import { useMonthOnMonthData } from '../hooks/useMonthOnMonthData';
import { LoadingSpinner } from './LoadingSpinner';
import { useTheme } from '../context/ThemeContext';
import { formatIndentCount } from '../utils/fulfillmentCalculations';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function MonthOnMonthIndentsChart() {
  const { data, loading, error, refetch } = useMonthOnMonthData();
  const { theme } = useTheme();
  
  // Force refresh on mount to get latest data
  React.useEffect(() => {
    refetch();
  }, [refetch]);

  const gradientWrapper = (content: React.ReactNode) => (
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
          <div className={`text-sm mb-2 ${
            theme === 'light' ? 'text-red-600' : 'text-red-400'
          }`}>Error loading data</div>
          <div className="text-xs text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    console.log('[MonthOnMonthIndentsChart] No data:', { data, hasData: !!data, dataLength: data?.data?.length });
    return gradientWrapper(
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-gray-400">No data available</div>
      </div>
    );
  }

  const chartData = {
    labels: data.data.map(item => item.month),
    datasets: [
      {
        label: 'Indent Count',
        data: data.data.map(item => item.indentCount),
        backgroundColor: 'rgba(224, 30, 31, 0.75)', // Red theme color with 75% opacity
        borderColor: 'rgba(224, 30, 31, 0.75)',
        borderWidth: 1,
      },
    ],
  };

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
          ctx.fillText(formatIndentCount(value), bar.x, bar.y - 5);
          ctx.restore();
        });
      });
    }
  };

  return gradientWrapper(
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
              Month on Month Indent Count
            </h3>
          </div>
        </div>
        <div className="h-1.5 w-20 bg-gradient-to-r from-red-500 via-red-600 to-red-700 rounded-full ml-5 shadow-sm"></div>
      </div>
      <div className="flex-1">
        <Bar
          data={chartData}
          plugins={[valuePlugin]}
          options={{
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
                  boxWidth: 12,
                  font: { 
                    size: 11,
                    weight: theme === 'light' ? 600 : 'normal',
                  },
                  padding: 10,
                  color: theme === 'light' ? '#1e3a8a' : '#1e3a8a'
                }
              },
              tooltip: {
                backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                titleColor: theme === 'light' ? '#1e3a8a' : '#1e3a8a',
                bodyColor: theme === 'light' ? '#1e3a8a' : '#1e3a8a',
                borderColor: theme === 'light' ? 'rgba(220, 38, 38, 0.4)' : 'rgba(220, 38, 38, 0.4)',
                borderWidth: 1,
                cornerRadius: 8,
                titleFont: {
                  weight: theme === 'light' ? 600 : 'normal',
                },
                bodyFont: {
                  weight: theme === 'light' ? 600 : 'normal',
                },
              },
            },
            scales: {
              x: {
                ticks: {
                  font: { 
                    size: 10,
                    weight: theme === 'light' ? 600 : 'normal',
                  },
                  color: theme === 'light' ? '#1e3a8a' : '#1e3a8a',
                  maxRotation: 0,
                  minRotation: 0
                },
                grid: {
                  display: false
                }
              },
              y: {
                ticks: {
                  font: { 
                    size: 10,
                    weight: theme === 'light' ? 600 : 'normal',
                  },
                  color: theme === 'light' ? '#1e3a8a' : '#1e3a8a',
                },
                grid: {
                  color: theme === 'light' ? 'rgba(220, 38, 38, 0.08)' : 'rgba(220, 38, 38, 0.08)',
                },
                beginAtZero: true,
              },
            },
          }}
        />
      </div>
    </>
  );
}

