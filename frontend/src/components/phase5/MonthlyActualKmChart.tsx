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
    <div className={`rounded-xl overflow-hidden ${
      theme === 'light' 
        ? 'p-[3px] shadow-2xl' 
        : 'shadow-2xl border border-orange-900/20'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15), rgba(249, 115, 22, 0.15), rgba(234, 88, 12, 0.15))',
      boxShadow: '0 25px 50px -12px rgba(251, 146, 60, 0.25), 0 0 0 1px rgba(251, 146, 60, 0.05)'
    } : {}}>
      <div className={`rounded-xl p-8 h-[420px] flex flex-col backdrop-blur-sm transition-all duration-300 ${
        theme === 'light' ? 'bg-gradient-to-br from-white via-orange-50/30 to-white border-0' : 'bg-white/95'
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

  // Create beautiful gradient for bars
  const createGradient = (ctx: CanvasRenderingContext2D, chartArea: any) => {
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, 'rgba(251, 146, 60, 1)');
    gradient.addColorStop(0.3, 'rgba(249, 115, 22, 0.95)');
    gradient.addColorStop(0.7, 'rgba(234, 88, 12, 0.9)');
    gradient.addColorStop(1, 'rgba(194, 65, 12, 0.85)');
    return gradient;
  };

  const chartData = {
    labels: data.data.map(item => item.month),
    datasets: [
      {
        label: 'Actual KM',
        data: data.data.map(item => item.actualKm),
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(251, 146, 60, 0.8)';
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

  const formatKm = (value: number): string => {
    if (value >= 1000) {
      return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
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
          ctx.fillText(formatKm(value), bar.x, bar.y - 8);
          
          ctx.restore();
        });
      });
    }
  };

  const referenceLinePlugin = {
    id: 'referenceLine20k',
    afterDatasetsDraw: (chart: any) => {
      const ctx = chart.ctx;
      const chartArea = chart.chartArea;
      const yScale = chart.scales.y;
      const TARGET_KM = 20000;
      
      // Calculate the y position for 20k km
      const yPos = yScale.getPixelForValue(TARGET_KM);
      
      // Only draw if the line is within the chart area
      if (yPos >= chartArea.top && yPos <= chartArea.bottom) {
        ctx.save();
        
        // Draw dark green line
        ctx.strokeStyle = '#166534'; // dark green
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 5]); // dashed line
        ctx.beginPath();
        ctx.moveTo(chartArea.left, yPos);
        ctx.lineTo(chartArea.right, yPos);
        ctx.stroke();
        
        ctx.restore();
      }
    }
  };

  return gradientWrapper(
    <>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <div className="w-2 h-10 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 rounded-full shadow-lg"></div>
            <div className="absolute inset-0 w-2 h-10 bg-gradient-to-b from-orange-300 to-orange-500 rounded-full opacity-50 blur-sm"></div>
          </div>
          <div>
            <h3 className={`text-2xl font-bold tracking-tight ${
              theme === 'light' ? 'text-gray-900' : 'text-gray-900'
            }`}>
              Monthly Actual KM
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Total kilometers driven per month</p>
          </div>
        </div>
        <div className="h-1.5 w-20 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 rounded-full ml-5 shadow-sm"></div>
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
                borderColor: 'rgba(251, 146, 60, 0.4)',
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
                    return `🚗 Actual KM: ${formatKm(context.parsed.y)} km`;
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
                ticks: {
                  font: {
                    size: 11,
                    weight: 600,
                    family: 'Inter, system-ui, sans-serif',
                  },
                  color: '#6B7280',
                  callback: (value: any) => {
                    return formatKm(value) + ' km';
                  },
                  padding: 10,
                },
                grid: {
                  color: 'rgba(251, 146, 60, 0.08)',
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
          plugins={[valuePlugin, referenceLinePlugin]}
        />
      </div>
    </>
  );
}
