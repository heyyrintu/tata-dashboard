import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useRevenueData } from '../../hooks/useRevenueData';
import { LoadingSpinner } from '../LoadingSpinner';
import TimeGranularityToggle from '../TimeGranularityToggle';
import { formatIndianNumber } from '../../utils/revenueCalculations';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function RevenueOverTimeChart() {
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const { data, loading, error } = useRevenueData(granularity);

  if (loading) {
    return (
      <div className="glass-card p-6 h-80 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 h-80 flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-red-400 mb-2">Error loading revenue data</div>
          <div className="text-xs text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  if (!data || !data.revenueOverTime || data.revenueOverTime.length === 0) {
    return (
      <div className="glass-card p-6 h-80 flex items-center justify-center">
        <div className="text-sm text-gray-400">No revenue data available</div>
      </div>
    );
  }

  const chartData = {
    labels: data.revenueOverTime.map(item => item.date),
    datasets: [
      {
        label: 'Revenue (RS)',
        data: data.revenueOverTime.map(item => item.revenue),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  return (
    <div className="glass-card p-6 h-80 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white text-left">Revenue Over Time</h3>
        <TimeGranularityToggle granularity={granularity} onGranularityChange={setGranularity} />
      </div>
      <div className="flex-1">
        <Line
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
                  font: { size: 10 },
                  padding: 5,
                  color: '#E5E7EB'
                }
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#FFFFFF',
                bodyColor: '#FFFFFF',
                borderColor: '#374151',
                borderWidth: 1,
                cornerRadius: 8,
                callbacks: {
                  label: function(context) {
                    return `Revenue: ${formatIndianNumber(context.parsed.y || 0)} RS`;
                  }
                }
              },
            },
            scales: {
              x: {
                ticks: {
                  font: { size: 10 },
                  color: '#9CA3AF',
                  maxRotation: 0
                },
                grid: {
                  display: false
                }
              },
              y: {
                ticks: {
                  font: { size: 10 },
                  color: '#9CA3AF',
                  callback: function(value) {
                    return formatIndianNumber(Number(value));
                  }
                },
                grid: {
                  color: 'rgba(75, 85, 99, 0.3)',
                },
                beginAtZero: true,
              },
            },
          }}
        />
      </div>
    </div>
  );
}
