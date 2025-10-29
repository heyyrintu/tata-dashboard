import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useRangeData } from '../../hooks/useRangeData';
import { LoadingSpinner } from '../LoadingSpinner';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function RangeDonutChart() {
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
        data: data.rangeData.map(item => item.tripCount),
        backgroundColor: [
          '#EF4444', // Red
          '#F59E0B', // Amber
          '#FBBF24', // Yellow
          '#FDE68A'  // Light Yellow
        ],
        borderWidth: 0,
        cutout: '65%'
      },
    ],
  };

  const totalTrips = data.rangeData.reduce((sum, item) => sum + item.tripCount, 0);

  return (
    <div className="enhanced-glass-card p-6 h-96 flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-left">Trip Distribution by Range</h3>
      
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
                    color: '#374151'
                  }
                },
                tooltip: {
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  titleColor: '#374151',
                  bodyColor: '#374151',
                  borderColor: '#E5E7EB',
                  borderWidth: 1,
                  callbacks: {
                    label: function(context: any) {
                      const label = context.label || '';
                      const value = context.parsed || 0;
                      const percentage = ((value / totalTrips) * 100).toFixed(1);
                      return `${label}: ${value} trips (${percentage}%)`;
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
            <div className="text-3xl font-bold text-gray-800">{totalTrips}</div>
            <div className="text-sm text-gray-600">Total Trips</div>
          </div>
        </div>
      </div>
    </div>
  );
}
