import { useDashboard } from '../../context/DashboardContext';
import { useTheme } from '../../context/ThemeContext';
import { useRangeData } from '../../hooks/useRangeData';
import { Skeleton } from '../ui/skeleton';
import { formatCost } from '../../utils/costCalculations';

export default function VehicleCostCard() {
  const { isLoading } = useDashboard();
  const { theme } = useTheme();
  const { data: rangeData, loading: rangeLoading } = useRangeData();

  // Use totalVehicleCost directly from API response
  const totalVehicleCost = rangeData?.totalVehicleCost || 0;

  return (
    <div className={`glass-card rounded-2xl p-6 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group ${
      theme === 'light'
        ? 'shadow-2xl'
        : 'hover:shadow-2xl hover:shadow-green-900/30 border border-green-900/30'
    }`} style={theme === 'light' ? { 
      boxShadow: '0 25px 50px -12px rgba(34, 197, 94, 0.25)',
      border: '1px solid rgba(34, 197, 94, 0.5)'
    } : {}}>
      {theme === 'light' && (
        <div className="absolute inset-0 opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(to bottom right, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1))` }}></div>
      )}
      <div className="relative z-10">
        <div>
          <p className={`text-sm font-medium mb-2 ${
            theme === 'light' ? 'text-gray-600' : 'text-slate-400'
          }`}>Total Vehicle Cost</p>
          {isLoading || rangeLoading ? (
            <Skeleton className="h-10 w-28 rounded-lg" />
          ) : (
            <p className={`text-4xl font-bold ${
              theme === 'light'
                ? 'bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent'
                : 'text-white'
            }`}>{formatCost(totalVehicleCost)}</p>
          )}
        </div>
      </div>
      <p className={`text-xs mt-4 relative z-10 ${
        theme === 'light' ? 'text-gray-500' : 'text-slate-500'
      }`}>Total Cost - Remaining Cost</p>
    </div>
  );
}

