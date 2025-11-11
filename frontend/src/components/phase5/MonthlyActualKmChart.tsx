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
import { useTheme } from '../../context/ThemeContext';
import { LoadingSpinner } from '../LoadingSpinner';
import { getMonthlyVehicleCostAnalytics, type MonthlyVehicleCostResponse } from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function MonthlyActualKmChart() {
  const { theme } = useTheme();
  const [data, setData] = React.useState<MonthlyVehicleCostResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getMonthlyVehicleCostAnalytics();
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const gradientWrapper = (content: React.ReactNode) => (
    <div className={`rounded-2xl h-80 ${
      theme === 'light' 
        ? 'p-[2px] shadow-lg' 
        : 'shadow-xl border border-orange-900/30'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(to right, rgba(251, 146, 60, 0.35), rgba(234, 88, 12, 0.35))',
      boxShadow: '0 10px 15px -3px rgba(251, 146, 60, 0.2), 0 4px 6px -2px rgba(234, 88, 12, 0.2)'
    } : {}}>
      <div className={`rounded-2xl p-6 h-full flex flex-col ${
        theme === 'light' ? 'bg-white border-0' : 'bg-white'
      }`} style={theme === 'light' ? { border: 'none' } : {}}>
        {content}
      </div>
    </div>
  );

  if (loading) {
    return gradientWrapper(
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return gradientWrapper(
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className={`text-sm mb-2 ${
            theme === 'light' ? 'text-red-600' : 'text-red-400'
          }`}>Error loading data</div>
          <div className="text-xs text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return gradientWrapper(
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-gray-400">No data available</div>
      </div>
    );
  }

  const chartData = {
    labels: data.data.map(item => item.month),
    datasets: [
      {
        label: 'Actual KM',
        data: data.data.map(item => item.actualKm),
        backgroundColor: 'rgba(251, 146, 60, 0.8)',
        borderColor: '#FB923C',
        borderWidth: 1,
      },
    ],
  };

  const formatKm = (value: number): string => {
    if (value >= 1000) {
      return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'k km';
    }
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value) + ' km';
  };

  const valuePlugin = {
    id: 'valueLabels',
    afterDatasetsDraw: (chart: any) => {
      const ctx = chart.ctx;
      chart.data.datasets.forEach((dataset: any) => {
        const meta = chart.getDatasetMeta(0);
        meta.data.forEach((bar: any, index: number) => {
          const value = dataset.data[index];
          ctx.save();
          ctx.fillStyle = 'rgba(31, 41, 55, 0.7)';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(formatKm(value), bar.x, bar.y - 5);
          ctx.restore();
        });
      });
    }
  };

  return gradientWrapper(
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold text-left ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>
          Monthly Actual KM
        </h3>
      </div>
      <div className="flex-1">
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
                callbacks: {
                  label: (context: any) => {
                    return formatKm(context.parsed.y);
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value: any) => {
                    return formatKm(value);
                  }
                }
              }
            }
          }}
          plugins={[valuePlugin]}
        />
      </div>
    </>
  );
}

