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
import { useTheme } from '../../context/ThemeContext';
import { RANGE_COLORS } from '../../utils/constants';
import { LoadingSpinner } from '../LoadingSpinner';
import { formatCompactNumber } from '../../utils/phase4Calculations';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

export default function LoadBarChart() {
  const { data, loading } = useRangeData();
  const { theme } = useTheme();

  if (loading) {
    return (
      <div className={`rounded-2xl relative ${
        theme === 'light'
          ? 'p-[2px] shadow-lg'
          : 'enhanced-glass-card'
      }`} style={theme === 'light' ? {
        background: 'linear-gradient(to right, rgba(224, 30, 31, 0.35), rgba(254, 165, 25, 0.35))',
        boxShadow: '0 10px 15px -3px rgba(224, 30, 31, 0.2), 0 4px 6px -2px rgba(254, 165, 25, 0.2)'
      } : {}}>
        <div className={`rounded-2xl p-6 h-96 flex items-center justify-center ${
          theme === 'light'
            ? 'bg-[#F1F1F1] border-0'
            : ''
        }`} style={theme === 'light' ? { border: 'none' } : {}}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!data || data.rangeData.length === 0) {
    return (
      <div className={`rounded-2xl relative ${
        theme === 'light'
          ? 'p-[2px] shadow-lg'
          : 'enhanced-glass-card'
      }`} style={theme === 'light' ? {
        background: 'linear-gradient(to right, rgba(224, 30, 31, 0.35), rgba(254, 165, 25, 0.35))',
        boxShadow: '0 10px 15px -3px rgba(224, 30, 31, 0.2), 0 4px 6px -2px rgba(254, 165, 25, 0.2)'
      } : {}}>
        <div className={`rounded-2xl p-6 h-96 flex items-center justify-center ${
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

  // Map range data to RANGE_COLORS with opacity
  const backgroundColor = data.rangeData.map(item => {
    const color = RANGE_COLORS[item.range] || '#E01E1F';
    // Convert hex to rgba with 0.8 opacity
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 0.8)`;
  });
  const borderColor = data.rangeData.map(item => RANGE_COLORS[item.range] || '#E01E1F');

  const chartData = {
    labels: data.rangeData.map(item => item.range),
    datasets: [
      {
        label: 'Load (Kgs)',
        data: data.rangeData.map(item => item.totalLoad),
        backgroundColor,
        borderColor,
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className={`rounded-2xl relative ${
      theme === 'light'
        ? 'p-[2px] shadow-lg'
        : 'enhanced-glass-card'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(to right, rgba(224, 30, 31, 0.35), rgba(254, 165, 25, 0.35))',
      boxShadow: '0 10px 15px -3px rgba(224, 30, 31, 0.2), 0 4px 6px -2px rgba(254, 165, 25, 0.2)'
    } : {}}>
      <div className={`rounded-2xl p-6 h-96 flex flex-col ${
        theme === 'light'
          ? 'bg-[#F1F1F1] border-0'
          : ''
      }`} style={theme === 'light' ? { border: 'none' } : {}}>
        <h3 className={`text-lg font-semibold mb-4 text-left ${
          theme === 'light' ? 'text-black' : 'text-gray-800'
        }`}>Load Distribution by Range</h3>
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
                  backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  titleColor: theme === 'light' ? '#000000' : '#374151',
                  bodyColor: theme === 'light' ? '#000000' : '#374151',
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
                    font: { size: 11, color: theme === 'light' ? '#000000' : '#374151' },
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
                    font: { size: 11, color: theme === 'light' ? '#000000' : '#374151' }
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
    </div>
  );
}
