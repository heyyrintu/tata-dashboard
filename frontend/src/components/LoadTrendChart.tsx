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
import { LoadingSpinner } from './LoadingSpinner';
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
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold text-left ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>Bucket Count Trends</h3>
        <TimeGranularityToggle granularity={granularity} onGranularityChange={setGranularity} />
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
                borderColor: theme === 'light' ? 'rgba(30, 58, 138, 0.3)' : '#374151',
                borderWidth: 1,
                cornerRadius: 8,
                titleFont: {
                  weight: theme === 'light' ? '600' : 'normal',
                },
                bodyFont: {
                  weight: theme === 'light' ? '600' : 'normal',
                },
              },
            },
            scales: {
              x: {
                ticks: {
                  font: { 
                    size: 10,
                    weight: theme === 'light' ? '600' : 'normal',
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
                    weight: theme === 'light' ? '600' : 'normal',
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