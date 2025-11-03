import { useState } from 'react';
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
import { useLoadOverTime } from '../../hooks/useLoadOverTime';
import { useTheme } from '../../context/ThemeContext';
import { LoadingSpinner } from '../LoadingSpinner';
import TimeGranularityToggle from '../TimeGranularityToggle';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function KPILoadTrendChart() {
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const { data, loading } = useLoadOverTime(granularity);
  const { theme } = useTheme();

  if (loading) {
    return (
      <div className={`rounded-2xl relative ${
        theme === 'light'
          ? 'p-[2px] shadow-lg'
          : 'glass-card'
      }`} style={theme === 'light' ? {
        background: 'linear-gradient(to right, rgba(224, 30, 31, 0.35), rgba(254, 165, 25, 0.35))',
        boxShadow: '0 10px 15px -3px rgba(224, 30, 31, 0.2), 0 4px 6px -2px rgba(254, 165, 25, 0.2)'
      } : {}}>
        <div className={`rounded-2xl p-6 h-80 flex items-center justify-center ${
          theme === 'light'
            ? 'bg-[#F1F1F1] border-0'
            : ''
        }`} style={theme === 'light' ? { border: 'none' } : {}}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className={`rounded-2xl relative ${
        theme === 'light'
          ? 'p-[2px] shadow-lg'
          : 'glass-card'
      }`} style={theme === 'light' ? {
        background: 'linear-gradient(to right, rgba(224, 30, 31, 0.35), rgba(254, 165, 25, 0.35))',
        boxShadow: '0 10px 15px -3px rgba(224, 30, 31, 0.2), 0 4px 6px -2px rgba(254, 165, 25, 0.2)'
      } : {}}>
        <div className={`rounded-2xl p-6 h-80 flex items-center justify-center ${
          theme === 'light'
            ? 'bg-[#F1F1F1] border-0'
            : ''
        }`} style={theme === 'light' ? { border: 'none' } : {}}>
          <div className={`text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-500'
          }`}>No data available</div>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.data.map(item => item.date),
    datasets: [
      {
        label: 'Total Load (Kgs)',
        data: data.data.map(item => item.totalLoad),
        backgroundColor: 'rgba(224, 30, 31, 0.6)', // Red theme color
        borderColor: 'rgba(224, 30, 31, 0.6)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className={`rounded-2xl relative ${
      theme === 'light'
        ? 'p-[2px] shadow-lg'
        : 'glass-card'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(to right, rgba(224, 30, 31, 0.35), rgba(254, 165, 25, 0.35))',
      boxShadow: '0 10px 15px -3px rgba(224, 30, 31, 0.2), 0 4px 6px -2px rgba(254, 165, 25, 0.2)'
    } : {}}>
      <div className={`rounded-2xl p-6 h-80 flex flex-col ${
        theme === 'light'
          ? 'bg-[#F1F1F1] border-0'
          : ''
      }`} style={theme === 'light' ? { border: 'none' } : {}}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-semibold text-left ${
            theme === 'light' ? 'text-black' : 'text-gray-800'
          }`}>Time vs Total Load (Kgs)</h3>
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
                    font: { size: 10, color: theme === 'light' ? '#000000' : '#374151' },
                    padding: 5
                  }
                },
                tooltip: {
                  backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  titleColor: theme === 'light' ? '#000000' : '#374151',
                  bodyColor: theme === 'light' ? '#000000' : '#374151',
                  borderColor: '#E5E7EB',
                  borderWidth: 1,
                  cornerRadius: 8,
                },
              },
              scales: {
                x: {
                  ticks: {
                    font: { size: 10, color: theme === 'light' ? '#000000' : '#374151' },
                    maxRotation: 0
                  },
                  grid: {
                    display: false
                  }
                },
                y: {
                  ticks: {
                    font: { size: 10, color: theme === 'light' ? '#000000' : '#374151' },
                    callback: function (value) {
                      return `${(value as number) / 1000}K`;
                    }
                  },
                  grid: {
                    color: 'rgba(229, 231, 235, 0.5)',
                    drawBorder: false,
                  },
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}