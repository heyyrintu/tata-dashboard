import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useRangeData } from '../../hooks/useRangeData';
import { LoadingSpinner } from '../LoadingSpinner';
import { formatCompactNumber } from '../../utils/phase4Calculations';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

export default function LoadBarChart() {
  const { data, loading } = useRangeData();

  if (loading) {
    return (
      <div className="enhanced-glass-card p-6 h-96 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data || data.rangeData.length === 0) {
    return (
      <div className="enhanced-glass-card p-6 h-96 flex items-center justify-center">
        <div className="text-sm text-gray-500">No data available</div>
      </div>
    );
  }

  const chartData = {
    labels: data.rangeData.map(item => item.range),
    datasets: [
      {
        label: 'Load (Kgs)',
        data: data.rangeData.map(item => item.totalLoad),
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',   // Red
          'rgba(249, 115, 22, 0.8)',  // Orange
          'rgba(251, 191, 36, 0.8)',  // Yellow
          'rgba(253, 224, 71, 0.8)'   // Light Yellow
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(253, 224, 71, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="enhanced-glass-card p-6 h-96 flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-left">Load Distribution by Range</h3>
      <div className="flex-1">
        <Bar
          data={chartData}
          options={{
            indexAxis: 'y' as const,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#374151',
                bodyColor: '#374151',
                borderColor: '#E5E7EB',
                borderWidth: 1,
                callbacks: {
                  label: function (context) {
                    return `Load: ${formatCompactNumber((context.parsed.x as number) || 0)} Kgs`;
                  },
                },
              }
            },
            scales: {
              x: {
                ticks: {
                  font: { size: 11, color: '#374151' },
                  callback: function (value) {
                    return formatCompactNumber((value as number) || 0);
                  }
                },
                grid: {
                  display: false
                }
              },
              y: {
                ticks: {
                  font: { size: 11, color: '#374151' }
                },
                grid: {
                  display: false
                }
              }
            }
          }}
        />
      </div>
    </div>
  );
}
