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
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');
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
        theme === 'light' ? 'bg-[#F1F1F1] border-0' : 'glass-card'
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
        backgroundColor: 'rgba(224, 30, 31, 0.6)', // Red theme color with 60% opacity
        borderColor: 'rgba(224, 30, 31, 0.6)',
        borderWidth: 1,
      },
    ],
  };

  return gradientWrapper(
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold text-left ${
          theme === 'light' ? 'text-black' : 'text-white'
        }`}>Time vs Bucket Count</h3>
        <TimeGranularityToggle granularity={granularity} onGranularityChange={setGranularity} />
      </div>
      <div className="flex-1">
        <Bar
          data={chartData}
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
                  boxWidth: 8,
                  font: { 
                    size: 10,
                    weight: theme === 'light' ? '600' : 'normal',
                  },
                  padding: 5,
                  color: theme === 'light' ? '#1e3a8a' : '#E5E7EB'
                }
              },
              tooltip: {
                backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.8)',
                titleColor: theme === 'light' ? '#1e3a8a' : '#FFFFFF',
                bodyColor: theme === 'light' ? '#1e3a8a' : '#FFFFFF',
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
                  color: theme === 'light' ? '#1e3a8a' : '#9CA3AF',
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
                  color: theme === 'light' ? '#1e3a8a' : '#9CA3AF',
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