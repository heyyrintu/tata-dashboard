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
import { useLoadOverTime } from '../hooks/useLoadOverTime';
import { Skeleton } from './ui/skeleton';
import TimeGranularityToggle from './TimeGranularityToggle';
import { useTheme } from '../context/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function LoadTrendChart() {
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const { data, loading } = useLoadOverTime(granularity);
  const { theme } = useTheme();

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
      <div className="flex items-end gap-3 h-64 pt-4 px-4">
        {[40, 70, 55, 85, 35, 65, 50, 75].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
        ))}
      </div>
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return gradientWrapper(
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-gray-400">No data available</div>
      </div>
    );
  }

  const chartData = {
    labels: data.data.map(item => item.date),
    datasets: [
      {
        label: 'Bucket Count',
        data: data.data.map(item => item.bucketCount),
        backgroundColor: 'rgba(224, 30, 31, 0.8)', // Red color for buckets
        borderColor: '#E01E1F',
        borderWidth: 1,
      },
      {
        label: 'Barrel Count',
        data: data.data.map(item => item.barrelCount || 0),
        backgroundColor: 'rgba(254, 165, 25, 0.8)', // Yellow/Orange color for barrels
        borderColor: '#FEA519',
        borderWidth: 1,
      },
    ],
  };

  // Plugin to display values above bars for both datasets
  const valuePlugin = {
    id: 'valueLabels',
    afterDatasetsDraw: (chart: any) => {
      const ctx = chart.ctx;
      chart.data.datasets.forEach((dataset: any, i: number) => {
        const meta = chart.getDatasetMeta(i);
        meta.data.forEach((bar: any, index: number) => {
          const value = dataset.data[index];
          // Only show value if it's greater than 0
          if (value > 0) {
            ctx.save();
            ctx.fillStyle = 'rgba(31, 41, 55, 0.7)';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(value, bar.x, bar.y - 5);
            ctx.restore();
          }
        });
      });
    }
  };

  return gradientWrapper(
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2 h-10 bg-gradient-to-b from-red-500 via-red-600 to-red-700 rounded-full shadow-lg"></div>
              <div className="absolute inset-0 w-2 h-10 bg-gradient-to-b from-red-400 to-red-600 rounded-full opacity-50 blur-sm"></div>
            </div>
            <div>
              <h3 className={`text-2xl font-bold tracking-tight ${
                theme === 'light' ? 'text-gray-900' : 'text-gray-900'
              }`}>
                Bucket Count Trends
              </h3>
            </div>
          </div>
          <TimeGranularityToggle granularity={granularity} onGranularityChange={setGranularity} />
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
                labels: {
                  boxWidth: 12,
                  font: { 
                    size: 11,
                    weight: theme === 'light' ? ('bold' as const) : ('normal' as const),
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