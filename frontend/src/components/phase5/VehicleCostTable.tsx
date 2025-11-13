import React from 'react';
import { useVehicleCostData } from '../../hooks/useVehicleCostData';
import { useTheme } from '../../context/ThemeContext';
import { LoadingSpinner } from '../LoadingSpinner';

export default function VehicleCostTable() {
  const { data, loading, error } = useVehicleCostData();
  const { theme } = useTheme();

  const gradientWrapper = (content: React.ReactNode) => (
    <div className={`rounded-3xl ${
      theme === 'light' 
        ? 'p-[3px] shadow-2xl' 
        : 'shadow-2xl border border-orange-900/30'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.2), rgba(234, 88, 12, 0.2))',
      boxShadow: '0 20px 25px -5px rgba(251, 146, 60, 0.15), 0 10px 10px -5px rgba(234, 88, 12, 0.1)'
    } : {}}>
      <div className={`rounded-3xl p-8 flex flex-col backdrop-blur-sm ${
        theme === 'light' ? 'bg-white/95 border-0' : 'bg-white/95'
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
        }`}>Vehicle Cost Analysis</h2>
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
        }`}>Vehicle Cost Analysis</h2>
        <div className="text-center py-12">
          <div className="text-red-400 mb-2">Error loading data</div>
          <div className={`text-sm ${
            theme === 'light' ? 'text-black' : 'text-black'
          }`}>{error}</div>
        </div>
      </>
    );
  }

  if (!data || !data.data) {
    return gradientWrapper(
      <>
        <h2 className={`text-lg font-semibold mb-4 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>Vehicle Cost Analysis</h2>
        <div className={`text-center py-12 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>
          No data available for the selected date range
        </div>
      </>
    );
  }

  if (data.data.length === 0) {
    return gradientWrapper(
      <>
        <h2 className={`text-lg font-semibold mb-4 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>Vehicle Cost Analysis</h2>
        <div className={`text-center py-12 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>
          No data available for the selected date range
        </div>
      </>
    );
  }

  // Filter out "Other" row if it exists
  const fixedVehicles = data.data.filter(item => item && item.vehicleNumber !== 'Other');

  // Calculate totals (including Fixed KM)
  const totalFixedKm = fixedVehicles.reduce((sum, item) => sum + (item.fixedKm || 0), 0);
  const totalActualKm = fixedVehicles.reduce((sum, item) => sum + (item.actualKm || 0), 0);
  const totalRemainingKm = fixedVehicles.reduce((sum, item) => sum + (item.remainingKm || 0), 0);
  const totalCostForRemainingKm = fixedVehicles.reduce((sum, item) => sum + (item.costForRemainingKm || 0), 0);

  return gradientWrapper(
    <>
      <div className="mb-6">
        <h2 className={`text-2xl font-bold mb-2 ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          Vehicle Cost Analysis
        </h2>
        <div className="h-1 w-20 bg-gradient-to-r from-orange-600 to-orange-500 rounded-full"></div>
      </div>

      <div className="overflow-x-auto overflow-y-visible rounded-xl">
        <table className="w-full">
          <thead>
            <tr className={`bg-gradient-to-r from-orange-50 to-orange-50 ${
              theme === 'light' ? 'border-b-2 border-orange-200' : 'border-b-2 border-orange-300'
            }`}>
              <th className={`text-left py-4 px-6 text-sm font-bold uppercase tracking-wider ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-800'
              }`}>Fixed Vehicle No</th>
              <th className={`text-right py-4 px-6 text-sm font-bold uppercase tracking-wider ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-800'
              }`}>Fixed KM</th>
              <th className={`text-right py-4 px-6 text-sm font-bold uppercase tracking-wider ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-800'
              }`}>Actual KM</th>
              <th className={`text-right py-4 px-6 text-sm font-bold uppercase tracking-wider ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-800'
              }`}>
                Remaining KM<br />
                <span className="text-xs font-normal normal-case text-gray-500">(Fixed KM - Actual KM)</span>
              </th>
              <th className={`text-right py-4 px-6 text-sm font-bold uppercase tracking-wider ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-800'
              }`}>
                Cost for Remaining KM<br />
                <span className="text-xs font-normal normal-case text-gray-500">(Remaining KM × 31)</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Fixed vehicles */}
            {fixedVehicles.map((item, index) => {
              if (!item || !item.vehicleNumber) return null;
              return (
                <tr
                  key={item.vehicleNumber}
                  className={`border-b transition-all duration-300 ${
                    index % 2 === 0 
                      ? (theme === 'light' ? 'bg-white' : 'bg-white')
                      : (theme === 'light' ? 'bg-gray-50/50' : 'bg-gray-50/30')
                  } ${
                    theme === 'light'
                      ? 'border-gray-100 hover:bg-orange-50/30 hover:shadow-sm'
                      : 'border-gray-200 hover:bg-orange-50/20 hover:shadow-sm'
                  }`}
                >
                  <td className={`py-4 px-6 font-semibold text-base ${
                    theme === 'light' ? 'text-gray-900' : 'text-gray-900'
                  }`}>
                    {item.vehicleNumber}
                  </td>
                  <td className="py-4 px-6 text-right font-semibold text-base text-gray-600">
                    {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(item.fixedKm)}
                  </td>
                  <td className="py-4 px-6 text-right font-semibold text-base text-gray-600">
                    {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(item.actualKm)} km
                  </td>
                  <td className={`py-4 px-6 text-right font-semibold text-base ${
                    item.remainingKm >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(item.remainingKm)} km
                  </td>
                  <td className="py-4 px-6 text-right font-semibold text-base text-gray-600">
                    ₹{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(item.costForRemainingKm)}
                  </td>
                </tr>
              );
            })}
            {/* Total Row */}
            <tr className={`border-t-4 border-orange-500 bg-gradient-to-r from-orange-100 to-orange-100 ${
              theme === 'light' ? 'shadow-lg' : 'shadow-lg'
            }`}>
              <td className={`py-5 px-6 font-bold text-lg uppercase tracking-wide ${
                theme === 'light' ? 'text-gray-900' : 'text-gray-900'
              }`}>
                <span className="inline-flex items-center gap-2">
                  <span className="w-1 h-6 bg-gradient-to-b from-orange-600 to-orange-500 rounded"></span>
                  TOTAL
                </span>
              </td>
              <td className="py-5 px-6 text-right font-bold text-lg text-gray-600">
                {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(totalFixedKm)}
              </td>
              <td className="py-5 px-6 text-right font-bold text-lg text-gray-600">
                {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(totalActualKm)} km
              </td>
              <td className={`py-5 px-6 text-right font-bold text-lg ${
                totalRemainingKm >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(totalRemainingKm)} km
              </td>
              <td className="py-5 px-6 text-right font-bold text-lg text-gray-600">
                ₹{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(totalCostForRemainingKm)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

