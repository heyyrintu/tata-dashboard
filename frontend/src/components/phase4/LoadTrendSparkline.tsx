import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useLoadOverTime } from '../../hooks/useLoadOverTime';
import { Skeleton } from '../ui/skeleton';
import TimeGranularityToggle from '../TimeGranularityToggle';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function LoadTrendSparkline() {
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const { data, loading } = useLoadOverTime(granularity);

  if (loading) {
    return (
      <div className="enhanced-glass-card p-6 h-80 flex items-center justify-center">
        <div className="flex items-end gap-3 h-64 pt-4 px-4">
          {[40, 70, 55, 85, 35, 65, 50, 75].map((h, i) => (
            <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="enhanced-glass-card p-6 h-80 flex items-center justify-center">
        <div className="text-sm text-gray-500">No data available</div>
      </div>
    );
  }

  const chartData = {
    labels: data.data.map(item => item.date),
    datasets: [
      {
        label: 'Total Load (Kgs)',
        data: data.data.map(item => item.totalLoad),
        borderColor: 'rgba(239, 68, 68, 1)', // Red
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        yAxisID: 'y-left',
        tension: 0.4,
      },
      {
        label: 'Avg Fulfillment %',
        data: data.data.map(item => item.avgFulfillment),
        borderColor: 'rgba(251, 191, 36, 1)', // Yellow
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        yAxisID: 'y-right',
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="enhanced-glass-card p-6 h-80 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 text-left">Load & Fulfillment Trend</h3>
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
                  color: '#374151',
                  padding: 5
                }
              },
              tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#374151',
                bodyColor: '#374151',
                borderColor: '#E5E7EB',
                borderWidth: 1,
                titleFont: { size: 11 },
                bodyFont: { size: 10 }
              }
            },
            scales: {
              'y-left': {
                type: 'linear' as const,
                position: 'left' as const,
                ticks: {
                  font: { size: 10 },
                  color: '#374151'
                },
                grid: {
                  display: false
                }
              },
              'y-right': {
                type: 'linear' as const,
                position: 'right' as const,
                ticks: {
                  font: { size: 10 },
                  color: '#374151'
                },
                grid: {
                  drawOnChartArea: false
                }
              },
              x: {
                ticks: {
                  font: { size: 10 },
                  color: '#374151',
                  maxRotation: 0
                },
                grid: {
                  display: false
                }
              }
            },
            elements: {
              point: {
                radius: 0
              },
              line: {
                borderWidth: 1.5
              }
            }
          }}
        />
      </div>
    </div>
  );
}
