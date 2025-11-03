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
import { LoadingSpinner } from './LoadingSpinner';
import { calculateChartData } from '../utils/rangeCalculations';
import { useTheme } from '../context/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function RangeWiseLoadGraph() {
  const { data, loading } = useRangeData();
  const { theme } = useTheme();

  const gradientBorderWrapper = (content: React.ReactNode) => (
    <div className={`rounded-2xl ${
      theme === 'light' 
        ? 'p-[2px] shadow-lg' 
        : 'shadow-xl border border-blue-900/30'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(to right, rgba(224, 30, 31, 0.35), rgba(254, 165, 25, 0.35))',
      boxShadow: '0 10px 15px -3px rgba(224, 30, 31, 0.2), 0 4px 6px -2px rgba(254, 165, 25, 0.2)'
    } : {}}>
      <div className={`rounded-2xl p-6 h-full ${
        theme === 'light' ? 'bg-[#F1F1F1] border-0' : 'glass-card'
      }`} style={theme === 'light' ? { border: 'none' } : {}}>
        {content}
      </div>
    </div>
  );

  if (loading) {
    return gradientBorderWrapper(
      <>
        <h2 className={`text-lg font-semibold mb-4 ${
          theme === 'light' ? 'text-black' : 'text-white'
        }`}>Range-Wise Bucket Count Graph</h2>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  if (!data || data.rangeData.length === 0) {
    return gradientBorderWrapper(
      <>
        <h2 className={`text-lg font-semibold mb-4 ${
          theme === 'light' ? 'text-black' : 'text-white'
        }`}>Range-Wise Bucket Count Graph</h2>
        <div className="text-center py-12 text-slate-400">
          No data available for the selected date range
        </div>
      </>
    );
  }

  const chartData = calculateChartData(data.rangeData);

  return gradientBorderWrapper(
    <>
      <h2 className={`text-lg font-semibold mb-4 ${
        theme === 'light' ? 'text-black' : 'text-white'
      }`}>Range-Wise Bucket Count Graph</h2>
      <div className="h-64">
        <Bar
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                enabled: true,
                backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.95)',
                titleColor: theme === 'light' ? '#1e3a8a' : '#e2e8f0',
                bodyColor: theme === 'light' ? '#1e3a8a' : '#e2e8f0',
                borderColor: theme === 'light' ? 'rgba(30, 58, 138, 0.3)' : 'rgba(30, 58, 138, 0.5)',
                borderWidth: 1,
                titleFont: {
                  weight: theme === 'light' ? '600' : 'normal',
                },
                bodyFont: {
                  weight: theme === 'light' ? '600' : 'normal',
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
                ticks: {
                  color: theme === 'light' ? '#1e3a8a' : '#e2e8f0',
                  font: {
                    weight: theme === 'light' ? '600' : 'normal',
                  },
                },
                grid: {
                  color: theme === 'light' ? 'rgba(30, 58, 138, 0.2)' : 'rgba(30, 58, 138, 0.3)',
                },
              },
              x: {
                ticks: {
                  color: theme === 'light' ? '#1e3a8a' : '#e2e8f0',
                  font: {
                    weight: theme === 'light' ? '600' : 'normal',
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

