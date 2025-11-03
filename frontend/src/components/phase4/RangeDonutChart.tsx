import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useRangeData } from '../../hooks/useRangeData';
import { useTheme } from '../../context/ThemeContext';
import { RANGE_COLORS } from '../../utils/constants';
import { LoadingSpinner } from '../LoadingSpinner';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function RangeDonutChart() {
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

  // Map range data to RANGE_COLORS
  const colors = data.rangeData.map(item => RANGE_COLORS[item.range] || '#E01E1F');

  const chartData = {
    labels: data.rangeData.map(item => item.range),
    datasets: [
      {
        data: data.rangeData.map(item => item.indentCount),
        backgroundColor: colors,
        borderWidth: 0,
        cutout: '65%'
      },
    ],
  };

  const totalIndents = data.rangeData.reduce((sum, item) => sum + item.indentCount, 0);

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
        }`}>Indent Distribution by Range</h3>
        
        <div className="flex-1 relative flex items-center justify-center">
          <div className="w-full h-full max-w-[280px] max-h-[280px]">
            <Doughnut
              data={chartData}
              options={{
                maintainAspectRatio: true,
                aspectRatio: 1,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                    labels: {
                      boxWidth: 12,
                      font: {
                        size: 11,
                        weight: '500' as const
                      },
                      padding: 10,
                      usePointStyle: true,
                      color: theme === 'light' ? '#000000' : '#374151'
                    }
                  },
                  tooltip: {
                    backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: theme === 'light' ? '#000000' : '#374151',
                    bodyColor: theme === 'light' ? '#000000' : '#374151',
                    borderColor: '#E5E7EB',
                    borderWidth: 1,
                    callbacks: {
                      label: function(context: any) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const percentage = ((value / totalIndents) * 100).toFixed(1);
                        return `${label}: ${value} indents (${percentage}%)`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
          
          {/* Perfectly centered text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                theme === 'light' ? 'text-black' : 'text-gray-800'
              }`}>{totalIndents}</div>
              <div className={`text-sm ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-600'
              }`}>Total Indents</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
