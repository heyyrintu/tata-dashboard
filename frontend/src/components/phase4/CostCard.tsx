import { useDashboard } from '../../context/DashboardContext';
import { useTheme } from '../../context/ThemeContext';
import { useRangeData } from '../../hooks/useRangeData';
import { LoadingSpinner } from '../LoadingSpinner';
import { formatCost } from '../../utils/costCalculations';

export default function CostCard() {
  const { isLoading } = useDashboard();
  const { theme } = useTheme();
  const { data: rangeData, loading: rangeLoading } = useRangeData();

  // Use totalCost directly from API response (calculated from all indents in date range)
  const totalCost = rangeData?.totalCost || 0;

  return (
    <div className={`glass-card rounded-2xl p-6 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group ${
      theme === 'light'
        ? 'shadow-2xl'
        : 'hover:shadow-2xl hover:shadow-blue-900/30 border border-blue-900/30'
    }`} style={theme === 'light' ? { 
      boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.25)',
      border: '1px solid rgba(59, 130, 246, 0.5)'
    } : {}}>
      {theme === 'light' && (
        <div className="absolute inset-0 opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(to bottom right, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))` }}></div>
      )}
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className={`text-sm font-medium mb-2 ${
            theme === 'light' ? 'text-gray-600' : 'text-slate-400'
          }`}>Total Cost</p>
          {isLoading || rangeLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <p className={`text-4xl font-bold ${
              theme === 'light'
                ? 'bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent'
                : 'text-white'
            }`}>{formatCost(totalCost)}</p>
          )}
        </div>
        <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">💸</div>
      </div>
      <p className={`text-xs mt-4 relative z-10 ${
        theme === 'light' ? 'text-gray-500' : 'text-slate-500'
      }`}>Cost calculated from Total Cost column</p>
    </div>
  );
}

