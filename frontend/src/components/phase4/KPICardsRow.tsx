import { useDashboard } from '../../context/DashboardContext';
import { useRangeData } from '../../hooks/useRangeData';
import { useFulfillmentData } from '../../hooks/useFulfillmentData';
import { calculateTotalLoad, calculateAvgFulfillment, formatCompactNumber } from '../../utils/phase4Calculations';

export default function KPICardsRow() {
  const { metrics } = useDashboard();
  const { data: rangeData } = useRangeData();
  const { data: fulfillmentData } = useFulfillmentData();

  const totalLoad = rangeData?.rangeData ? calculateTotalLoad(rangeData.rangeData) : 0;
  const avgFulfillment = fulfillmentData?.fulfillmentData ? calculateAvgFulfillment(fulfillmentData.fulfillmentData) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Indents */}
      <div className="enhanced-glass-card p-6 flex flex-col items-center justify-center h-32">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center mb-3">
          <div className="text-2xl">📋</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800 mb-1">{formatCompactNumber(metrics.totalIndents)}</div>
          <div className="text-sm text-gray-600">Total Indents</div>
        </div>
      </div>

      {/* Unique Indents */}
      <div className="enhanced-glass-card p-6 flex flex-col items-center justify-center h-32">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center mb-3">
          <div className="text-2xl">🔢</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800 mb-1">{formatCompactNumber(metrics.totalIndentsUnique)}</div>
          <div className="text-sm text-gray-600">Unique Indents</div>
        </div>
      </div>

      {/* Total Load */}
      <div className="enhanced-glass-card p-6 flex flex-col items-center justify-center h-32">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-600 to-yellow-500 flex items-center justify-center mb-3">
          <div className="text-2xl">⚖️</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800 mb-1">{formatCompactNumber(totalLoad)}</div>
          <div className="text-sm text-gray-600">Total Load (Kgs)</div>
        </div>
      </div>

      {/* Avg Fulfillment */}
      <div className="enhanced-glass-card p-6 flex flex-col items-center justify-center h-32">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-600 to-red-500 flex items-center justify-center mb-3">
          <div className="text-2xl">📊</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800 mb-1">{avgFulfillment.toFixed(1)}%</div>
          <div className="text-sm text-gray-600">Avg Fulfillment</div>
        </div>
      </div>
    </div>
  );
}
