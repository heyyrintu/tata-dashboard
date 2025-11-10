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
import { useFulfillmentData } from '../hooks/useFulfillmentData';
import { LoadingSpinner } from './LoadingSpinner';
import { formatIndentCount, calculateFulfillmentChartData } from '../utils/fulfillmentCalculations';
import { useTheme } from '../context/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function FulfillmentGraph() {
  const { data, loading, error } = useFulfillmentData();
  const { theme } = useTheme();

  const gradientWrapper = (content: React.ReactNode) => (
    <div className={`rounded-2xl ${
      theme === 'light' 
        ? 'p-[2px] shadow-lg' 
        : 'shadow-xl border border-blue-900/30'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(to right, rgba(224, 30, 31, 0.35), rgba(254, 165, 25, 0.35))',
      boxShadow: '0 10px 15px -3px rgba(224, 30, 31, 0.2), 0 4px 6px -2px rgba(254, 165, 25, 0.2)'
    } : {}}>
      <div className={`rounded-2xl p-6 h-full ${
        theme === 'light' ? 'bg-white border-0' : 'bg-white'
      }`} style={theme === 'light' ? { border: 'none' } : {}}>
        {content}
      </div>
    </div>
  );

  if (loading) {
    return gradientWrapper(
      <>
        <h2 className={`text-lg font-semibold mb-4 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>Fulfillment Trends graph</h2>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  if (error) {
    return gradientWrapper(
      <>
        <h2 className={`text-lg font-semibold mb-4 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>Fulfillment Trends graph</h2>
        <div className={`flex justify-center items-center h-64 ${
          theme === 'light' ? 'text-red-600' : 'text-red-400'
        }`}>
          Error: {error}
        </div>
      </>
    );
  }

  if (!data || !data.fulfillmentData || data.fulfillmentData.length === 0) {
    return gradientWrapper(
      <>
        <h2 className={`text-lg font-semibold mb-4 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>Fulfillment Trends graph</h2>
        <div className="text-center py-12 text-black">
          No data available for the selected date range
        </div>
      </>
    );
  }

  const chartData = calculateFulfillmentChartData(
    data.fulfillmentData.map(item => ({
      range: item.range,
      tripCount: item.tripCount || item.indentCount || 0
    }))
  );

  // Calculate max y-axis value: find the highest trip count and add 10 extra points
  const maxTripCount = Math.max(...data.fulfillmentData.map(item => item.tripCount || item.indentCount || 0), 0);
  const yAxisMax = maxTripCount + 10;

  // Plugin to display values above bars
  const valuePlugin = {
    id: 'valueLabels',
    afterDatasetsDraw: (chart: any) => {
      const ctx = chart.ctx;
      chart.data.datasets.forEach((dataset: any, i: number) => {
        const meta = chart.getDatasetMeta(i);
        meta.data.forEach((bar: any, index: number) => {
          const value = dataset.data[index];
          ctx.save();
          ctx.fillStyle = 'rgba(31, 41, 55, 0.7)';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(value, bar.x, bar.y - 5);
          ctx.restore();
        });
      });
    }
  };

  return gradientWrapper(
    <>
      <h2 className={`text-lg font-semibold mb-4 ${
        theme === 'light' ? 'text-black' : 'text-black'
      }`}>Fulfillment Trends graph</h2>
      <div className="h-64">
        <Bar
          data={chartData}
          plugins={[valuePlugin]}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                enabled: true,
                backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                titleColor: theme === 'light' ? '#1e3a8a' : '#1e3a8a',
                bodyColor: theme === 'light' ? '#1e3a8a' : '#1e3a8a',
                borderColor: theme === 'light' ? 'rgba(30, 58, 138, 0.3)' : 'rgba(30, 58, 138, 0.5)',
                borderWidth: 1,
                titleFont: {
                  weight: theme === 'light' ? 600 : 'normal',
                },
                bodyFont: {
                  weight: theme === 'light' ? 600 : 'normal',
                },
                callbacks: {
                  label: function (context) {
                    return `Trips: ${formatIndentCount(context.parsed.y || 0)}`;
                  },
                },
              },
            },
            scales: {
              y: {
                ticks: {
                  color: theme === 'light' ? '#1e3a8a' : '#1e3a8a',
                  font: {
                    weight: theme === 'light' ? 600 : 600,
                  },
                  callback: function (value) {
                    return formatIndentCount(value as number);
                  },
                },
                grid: {
                  color: theme === 'light' ? 'rgba(30, 58, 138, 0.2)' : 'rgba(30, 58, 138, 0.2)',
                },
                beginAtZero: true,
                max: yAxisMax,
              },
              x: {
                ticks: {
                  color: theme === 'light' ? '#1e3a8a' : '#1e3a8a',
                  font: {
                    weight: theme === 'light' ? 600 : 600,
                  },
                },
                grid: {
                  display: false,
                },
              },
            },
          }}
        />
      </div>
    </>
  );
}

