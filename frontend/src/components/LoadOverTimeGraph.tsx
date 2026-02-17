import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { useLoadOverTime } from '../hooks/useLoadOverTime';
import { Skeleton } from './ui/skeleton';
import TimeGranularityToggle from './TimeGranularityToggle';
import { useTheme } from '../context/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function LoadOverTimeGraph() {
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const { data, loading } = useLoadOverTime(granularity);
  const { theme } = useTheme();

  if (loading) {
    return (
      <div className={`glass-card rounded-2xl p-6 ${
        theme === 'light' 
          ? 'border-2 border-blue-500/35 shadow-lg shadow-blue-500/20' 
          : 'shadow-xl border border-blue-900/30'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Load Over Time</h2>
          <TimeGranularityToggle granularity={granularity} onGranularityChange={setGranularity} />
        </div>
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
      <div className={`glass-card rounded-2xl p-6 ${
        theme === 'light' 
          ? 'border-2 border-blue-500/35 shadow-lg shadow-blue-500/20' 
          : 'shadow-xl border border-blue-900/30'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Load Over Time</h2>
          <TimeGranularityToggle granularity={granularity} onGranularityChange={setGranularity} />
        </div>
        <div className="text-center py-12 text-slate-400">
          No data available for the selected date range
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.data.map(item => item.date),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Total Load (Kgs)',
        data: data.data.map(item => item.totalLoad),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        yAxisID: 'y-left',
      },
      {
        type: 'line' as const,
        label: 'Avg Fulfillment %',
        data: data.data.map(item => item.avgFulfillment),
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y-right',
      },
    ],
  };

  return (
    <div className="glass-card rounded-2xl p-6 shadow-xl border border-blue-900/30">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Load Over Time</h2>
        <TimeGranularityToggle granularity={granularity} onGranularityChange={setGranularity} />
      </div>
      <div className="h-80">
        <Chart
          type="bar"
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
                labels: {
                  color: '#e2e8f0',
                },
              },
              tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#e2e8f0',
                bodyColor: '#e2e8f0',
                borderColor: 'rgba(30, 58, 138, 0.5)',
                borderWidth: 1,
                callbacks: {
                  label: function (context) {
                    if (context.datasetIndex === 0) {
                      return `Total Load: ${(context.parsed.y || 0).toLocaleString('en-IN')} Kgs`;
                    } else {
                      return `Avg Fulfillment: ${(context.parsed.y || 0).toFixed(2)}%`;
                    }
                  },
                },
              },
            },
            scales: {
              'y-left': {
                type: 'linear' as const,
                position: 'left' as const,
                title: {
                  display: true,
                  text: 'Total Load (Kgs)',
                  color: '#e2e8f0',
                },
                ticks: {
                  color: '#e2e8f0',
                  callback: function (value) {
                    return value.toLocaleString('en-IN');
                  },
                },
                grid: {
                  color: 'rgba(30, 58, 138, 0.3)',
                },
              },
              'y-right': {
                type: 'linear' as const,
                position: 'right' as const,
                title: {
                  display: true,
                  text: 'Avg Fulfillment %',
                  color: '#e2e8f0',
                },
                ticks: {
                  color: '#e2e8f0',
                },
                grid: {
                  drawOnChartArea: false,
                },
              },
              x: {
                ticks: {
                  color: '#e2e8f0',
                },
                grid: {
                  color: 'rgba(30, 58, 138, 0.3)',
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}

