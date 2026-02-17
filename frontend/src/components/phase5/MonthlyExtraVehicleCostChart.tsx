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
import { Skeleton } from '../ui/skeleton';
import { getMonthlyVehicleCostAnalytics, type MonthlyVehicleCostResponse } from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function MonthlyExtraVehicleCostChart() {
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
    <div className={`rounded-xl overflow-hidden ${
      theme === 'light' 
        ? 'p-[3px] shadow-2xl' 
        : 'shadow-2xl border border-red-900/20'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.15), rgba(220, 38, 38, 0.15), rgba(185, 28, 28, 0.15))',
      boxShadow: '0 25px 50px -12px rgba(220, 38, 38, 0.25), 0 0 0 1px rgba(220, 38, 38, 0.05)'
    } : {}}>
      <div className={`rounded-xl p-8 h-[420px] flex flex-col backdrop-blur-sm transition-all duration-300 ${
        theme === 'light' ? 'bg-gradient-to-br from-white via-red-50/30 to-white border-0' : 'bg-white/95'
      }`} style={theme === 'light' ? { border: 'none' } : {}}>
        {content}
      </div>
    </div>
  );

  if (loading) {
    return gradientWrapper(
      <div className="flex items-end gap-3 h-64 pt-4 px-4">
        {[40, 70, 55, 85, 35, 65, 50, 75].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
        ))}
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

  // Create beautiful gradient for bars
  const createGradient = (ctx: CanvasRenderingContext2D, chartArea: any) => {
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, 'rgba(234, 88, 12, 1)');
    gradient.addColorStop(0.3, 'rgba(220, 38, 38, 0.95)');
    gradient.addColorStop(0.7, 'rgba(185, 28, 28, 0.9)');
    gradient.addColorStop(1, 'rgba(153, 27, 27, 0.85)');
    return gradient;
  };

  const chartData = {
    labels: data.data.map(item => item.month),
    datasets: [
      {
        label: 'Cost for Remaining KM',
        data: data.data.map(item => item.costForRemainingKm),
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(234, 88, 12, 0.8)';
          return createGradient(ctx, chartArea);
        },
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 0,
        borderRadius: {
          topLeft: 6,
          topRight: 6,
          bottomLeft: 0,
          bottomRight: 0,
        },
        borderSkipped: false,
        maxBarThickness: 60,
      },
    ],
  };

  const formatLakh = (value: number): string => {
    if (value >= 100000) {
      const lakhs = value / 100000;
      return lakhs.toFixed(2).replace(/\.00$/, '').replace(/\.(\d)0$/, '.$1') + ' L';
    }
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
  };

  const formatLakhWithRupee = (value: number): string => {
    if (value >= 100000) {
      const lakhs = value / 100000;
      return '₹' + lakhs.toFixed(2).replace(/\.00$/, '').replace(/\.(\d)0$/, '.$1') + ' L';
    }
    return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
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
          
          // Text with shadow for better visibility
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          ctx.fillStyle = '#6B7280';
          ctx.font = 'bold 13px Inter, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(formatLakh(value), bar.x, bar.y - 8);
          
          ctx.restore();
        });
      });
    }
  };

  return gradientWrapper(
    <>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <div className="w-2 h-10 bg-gradient-to-b from-red-500 via-red-600 to-red-700 rounded-full shadow-lg"></div>
            <div className="absolute inset-0 w-2 h-10 bg-gradient-to-b from-red-400 to-red-600 rounded-full opacity-50 blur-sm"></div>
          </div>
          <div>
            <h3 className={`text-2xl font-bold tracking-tight ${
              theme === 'light' ? 'text-gray-900' : 'text-gray-900'
            }`}>
              Monthly Market Vehicle Cost
            </h3>
          </div>
        </div>
        <div className="h-1.5 w-20 bg-gradient-to-r from-red-500 via-red-600 to-red-700 rounded-full ml-5 shadow-sm"></div>
      </div>
      <div className="flex-1 min-h-0">
        <Bar
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 1200,
              easing: 'easeOutQuart' as any,
            },
            interaction: {
              mode: 'index' as const,
              intersect: false,
            },
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                enabled: true,
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                titleColor: '#111827',
                bodyColor: '#374151',
                borderColor: 'rgba(220, 38, 38, 0.4)',
                borderWidth: 2,
                cornerRadius: 8,
                padding: 16,
                titleFont: {
                  size: 15,
                  weight: 'bold',
                  family: 'Inter, system-ui, sans-serif',
                },
                bodyFont: {
                  size: 14,
                  weight: 600,
                  family: 'Inter, system-ui, sans-serif',
                },
                callbacks: {
                  title: (context: any) => {
                    return `📅 ${context[0].label}`;
                  },
                  label: (context: any) => {
                    return `💰 Cost: ${formatLakhWithRupee(context.parsed.y)}`;
                  }
                },
                displayColors: false,
                boxPadding: 8,
              }
            },
            scales: {
              x: {
                ticks: {
                  font: {
                    size: 12,
                    weight: 600,
                    family: 'Inter, system-ui, sans-serif',
                  },
                  color: '#6B7280',
                  maxRotation: 0,
                  minRotation: 0,
                  padding: 12,
                },
                grid: {
                  display: false,
                },
                border: {
                  display: true,
                  color: '#E5E7EB',
                  width: 1.5,
                  dash: [5, 5],
                }
              },
              y: {
                beginAtZero: true,
                min: 0,
                ticks: {
                  font: {
                    size: 11,
                    weight: 600,
                    family: 'Inter, system-ui, sans-serif',
                  },
                  color: '#6B7280',
                  callback: (value: any) => {
                    if (value < 0) return '';
                    return formatLakhWithRupee(value);
                  },
                  padding: 10,
                },
                grid: {
                  color: 'rgba(220, 38, 38, 0.08)',
                  lineWidth: 1.5,
                  drawTicks: false,
                },
                border: {
                  display: true,
                  color: '#E5E7EB',
                  width: 1.5,
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
