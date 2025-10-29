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
import { useRevenueData } from '../../hooks/useRevenueData';
import { LoadingSpinner } from '../LoadingSpinner';
import { calculateRevenueBreakdown, formatIndianNumber, formatPercentage } from '../../utils/revenueCalculations';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function RevenueBreakdownChart() {
  const { data, loading, error } = useRevenueData();

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

  if (!data || !data.revenueByRange || data.revenueByRange.length === 0) {
    return (
      <div className="glass-card p-6 h-80 flex items-center justify-center">
        <div className="text-sm text-gray-400">No revenue data available</div>
      </div>
    );
  }

  const breakdown = calculateRevenueBreakdown(data.revenueByRange);

  const chartData = {
    labels: ['Revenue Breakdown'],
    datasets: breakdown.map((item) => ({
      label: `${item.range} (${formatPercentage(item.percentage)})`,
      data: [item.revenue],
      backgroundColor: item.color + '80', // Add transparency
      borderColor: item.color,
      borderWidth: 1,
      stack: 'revenue',
    })),
  };

  return (
    <div className="glass-card p-6 h-80 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white text-left">Revenue by Range</h3>
      </div>
      <div className="flex-1">
        <Bar
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y' as const,
            interaction: {
              mode: 'index' as const,
              intersect: false,
            },
            plugins: {
              legend: {
                display: true,
                position: 'top' as const,
                labels: {
                  boxWidth: 12,
                  font: { size: 10 },
                  padding: 8,
                  color: '#E5E7EB',
                  usePointStyle: true,
                  pointStyle: 'rect'
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
                    const datasetIndex = context.datasetIndex;
                    const item = breakdown[datasetIndex];
                    const rate = data.revenueByRange[datasetIndex]?.rate || 0;
                    return [
                      `Range: ${item.range}`,
                      `Rate: ${rate} RS/bucket`,
                      `Revenue: ${formatIndianNumber(item.revenue)} RS`,
                      `Percentage: ${formatPercentage(item.percentage)}`
                    ];
                  }
                }
              },
            },
            scales: {
              x: {
                stacked: true,
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
              y: {
                stacked: true,
                ticks: {
                  font: { size: 10 },
                  color: '#9CA3AF',
                },
                grid: {
                  display: false
                }
              },
            },
          }}
        />
      </div>
    </div>
  );
}
