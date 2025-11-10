import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useFulfillmentData } from '../../hooks/useFulfillmentData';
import { useTheme } from '../../context/ThemeContext';
import { LoadingSpinner } from '../LoadingSpinner';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function FulfillmentDonutChart() {
  const { data, loading } = useFulfillmentData();
  const { theme } = useTheme();

  if (loading) {
    return (
      <div className={`rounded-2xl relative ${
        theme === 'light'
          ? 'p-[2px] shadow-lg'
          : 'enhanced-glass-card'
      }`} style={theme === 'light' ? {
        background: 'linear-gradient(to right, rgba(224, 30, 31, 0.35), rgba(254, 165, 25, 0.35))',
        boxShadow: '0 10px 15px -3px rgba(224, 30, 31, 0.2), 0 4px 6px -2px rgba(254, 165, 25, 0.2)'
      } : {}}>
        <div className={`rounded-2xl p-6 h-96 flex items-center justify-center ${
          theme === 'light'
            ? 'bg-[#F1F1F1] border-0'
            : ''
        }`} style={theme === 'light' ? { border: 'none' } : {}}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!data || !data.fulfillmentData || data.fulfillmentData.length === 0) {
    return (
      <div className={`rounded-2xl relative ${
        theme === 'light'
          ? 'p-[2px] shadow-lg'
          : 'enhanced-glass-card'
      }`} style={theme === 'light' ? {
        background: 'linear-gradient(to right, rgba(224, 30, 31, 0.35), rgba(254, 165, 25, 0.35))',
        boxShadow: '0 10px 15px -3px rgba(224, 30, 31, 0.2), 0 4px 6px -2px rgba(254, 165, 25, 0.2)'
      } : {}}>
        <div className={`rounded-2xl p-6 h-96 flex items-center justify-center ${
          theme === 'light'
            ? 'bg-[#F1F1F1] border-0'
            : ''
        }`} style={theme === 'light' ? { border: 'none' } : {}}>
          <div className={`text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-500'
          }`}>No data available</div>
        </div>
      </div>
    );
  }

  // Map fulfillment data to colors (fulfillment uses percentage ranges, not distance ranges)
  const fulfillmentColors = [
    '#E01E1F',   // Red - 0-50%
    '#FEA519',   // Orange/Yellow - 51-70%
    '#FF6B35',   // Orange-Red - 71-90%
    '#FF8C42'    // Light Orange - 91-100%
  ];
  
  const colors = data.fulfillmentData.map((_item, index) => {
    // Use index-based color assignment for fulfillment ranges
    return fulfillmentColors[index % fulfillmentColors.length];
  });

  const chartData = {
    labels: data.fulfillmentData.map(item => item.range),
    datasets: [
      {
        data: data.fulfillmentData.map(item => item.indentCount),
        backgroundColor: colors,
        borderWidth: 0,
        cutout: '65%'
      },
    ],
  };

  const totalIndents = data.fulfillmentData.reduce((sum, item) => sum + item.indentCount, 0);

  // Plugin to display percentages on donut segments
  const percentagePlugin = {
    id: 'percentageLabels',
    afterDraw: (chart: any) => {
      const ctx = chart.ctx;
      const data = chart.data;
      const meta = chart.getDatasetMeta(0);
      
      if (!data.labels || data.labels.length === 0) return;
      
      const total = data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
      
      meta.data.forEach((segment: any, index: number) => {
        const value = data.datasets[0].data[index];
        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
        
        // Only show label if segment is large enough (at least 5%)
        if (parseFloat(percentage) >= 5) {
          const arc = segment;
          const angle = (arc.startAngle + arc.endAngle) / 2;
          const radius = (arc.innerRadius + arc.outerRadius) / 2;
          const centerX = arc.x;
          const centerY = arc.y;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          const range = data.labels[index];
          
          ctx.save();
          ctx.fillStyle = 'rgba(31, 41, 55, 0.7)';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Display range and percentage
          ctx.fillText(range, x, y - 6);
          ctx.fillText(`${percentage}%`, x, y + 6);
          ctx.restore();
        }
      });
    }
  };

  return (
    <div className={`rounded-2xl relative ${
      theme === 'light'
        ? 'p-[2px] shadow-lg'
        : 'enhanced-glass-card'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(to right, rgba(224, 30, 31, 0.35), rgba(254, 165, 25, 0.35))',
      boxShadow: '0 10px 15px -3px rgba(224, 30, 31, 0.2), 0 4px 6px -2px rgba(254, 165, 25, 0.2)'
    } : {}}>
      <div className={`rounded-2xl p-6 h-96 flex flex-col ${
        theme === 'light'
          ? 'bg-[#F1F1F1] border-0'
          : ''
      }`} style={theme === 'light' ? { border: 'none' } : {}}>
        <h3 className={`text-lg font-semibold mb-4 text-left ${
          theme === 'light' ? 'text-black' : 'text-gray-800'
        }`}>Fulfillment Trends</h3>
        
        <div className="flex-1 relative flex items-center justify-center">
          <div className="w-full h-full max-w-[280px] max-h-[280px] relative z-10">
            <Doughnut
              data={chartData}
              plugins={[percentagePlugin]}
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
                        weight: 500 as const
                      },
                      padding: 10,
                      usePointStyle: true,
                      color: theme === 'light' ? '#000000' : '#374151'
                    }
                  },
                  tooltip: {
                    backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: theme === 'light' ? '#000000' : '#374151',
                    bodyColor: theme === 'light' ? '#000000' : '#374151',
                    borderColor: '#E5E7EB',
                    borderWidth: 1,
                    callbacks: {
                      label: function(context: any) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const percentage = ((value / totalIndents) * 100).toFixed(1);
                        return `${label}: ${value} indents (${percentage}%)`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
          
          {/* Perfectly centered text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                theme === 'light' ? 'text-black' : 'text-gray-800'
              }`}>{totalIndents}</div>
              <div className={`text-sm ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-600'
              }`}>Total Indents</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
