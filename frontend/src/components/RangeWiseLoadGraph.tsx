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
      <div className={`rounded-2xl p-6 h-full flex flex-col ${
        theme === 'light' ? 'bg-white border-0' : 'bg-white'
      }`} style={theme === 'light' ? { border: 'none' } : {}}>
        {content}
      </div>
    </div>
  );

  if (loading) {
    return gradientBorderWrapper(
      <>
        <h2 className={`text-lg font-semibold mb-4 flex-shrink-0 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>Range-Wise Bucket Count Graph</h2>
        <div className="flex justify-center items-center flex-1 min-h-0">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  if (!data || data.rangeData.length === 0) {
    return gradientBorderWrapper(
      <>
        <h2 className={`text-lg font-semibold mb-4 flex-shrink-0 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>Range-Wise Bucket Count Graph</h2>
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
      <h2 className={`text-lg font-semibold mb-4 flex-shrink-0 ${
        theme === 'light' ? 'text-black' : 'text-black'
      }`}>Range-Wise Bucket Count Graph</h2>
      <div className="flex-1 min-h-0">
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
                borderColor: theme === 'light' ? 'rgba(30, 58, 138, 0.3)' : 'rgba(30, 58, 138, 0.5)',
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
                  color: theme === 'light' ? 'rgba(30, 58, 138, 0.2)' : 'rgba(30, 58, 138, 0.2)',
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

