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
import { useFulfillmentData } from '../hooks/useFulfillmentData';
import { LoadingSpinner } from './LoadingSpinner';
import { formatIndentCount, calculateFulfillmentChartData } from '../utils/fulfillmentCalculations';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function FulfillmentGraph() {
  const { data, loading } = useFulfillmentData();

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 shadow-xl border border-blue-900/30">
        <h2 className="text-lg font-semibold text-white mb-4">Fulfillment Utilization Graph</h2>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!data || !data.fulfillmentData || data.fulfillmentData.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 shadow-xl border border-blue-900/30">
        <h2 className="text-lg font-semibold text-white mb-4">Fulfillment Utilization Graph</h2>
        <div className="text-center py-12 text-slate-400">
          No data available for the selected date range
        </div>
      </div>
    );
  }

  const chartData = calculateFulfillmentChartData(data.fulfillmentData);

  return (
    <div className="glass-card rounded-2xl p-6 shadow-xl border border-blue-900/30">
      <h2 className="text-lg font-semibold text-white mb-4">Fulfillment Utilization Graph</h2>
      <div className="h-64">
        <Bar
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                enabled: true,
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#e2e8f0',
                bodyColor: '#e2e8f0',
                borderColor: 'rgba(30, 58, 138, 0.5)',
                borderWidth: 1,
                callbacks: {
                  label: function (context) {
                    return `Indents: ${formatIndentCount(context.parsed.y || 0)}`;
                  },
                },
              },
            },
            scales: {
              y: {
                ticks: {
                  color: '#e2e8f0',
                  callback: function (value) {
                    return formatIndentCount(value as number);
                  },
                },
                grid: {
                  color: 'rgba(30, 58, 138, 0.3)',
                },
              },
              x: {
                ticks: {
                  color: '#e2e8f0',
                },
                grid: {
                  display: false,
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}

