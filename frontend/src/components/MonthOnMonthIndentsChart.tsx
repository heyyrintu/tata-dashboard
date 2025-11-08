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
    <div className={`rounded-2xl h-80 ${
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
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold text-left ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>Month on Month Indent Count</h3>
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
                    weight: theme === 'light' ? 600 : ('normal' as const),
                  },
                  padding: 10,
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
                  weight: (theme === 'light' ? 600 : 'normal') as number | 'normal',
                },
                bodyFont: {
                  weight: (theme === 'light' ? 600 : 'normal') as number | 'normal',
                },
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
                    weight: theme === 'light' ? 600 : ('normal' as const),
                  },
                  color: theme === 'light' ? '#1e3a8a' : '#1e3a8a',
                },
                grid: {
                  color: theme === 'light' ? 'rgba(30, 58, 138, 0.2)' : 'rgba(75, 85, 99, 0.3)',
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

