import { useRangeData } from '../../hooks/useRangeData';
import { LoadingSpinner } from '../LoadingSpinner';
import { sortLocationsByTrips } from '../../utils/phase4Calculations';

export default function TopLocationsTable() {
  const { data, loading } = useRangeData();

  if (loading) {
    return (
      <div className="enhanced-glass-card p-6 h-96 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data || !data.locations || data.locations.length === 0) {
    return (
      <div className="enhanced-glass-card p-6 h-96 flex items-center justify-center">
        <div className="text-sm text-gray-500">No data available</div>
      </div>
    );
  }

  const topLocations = sortLocationsByTrips(data.locations, 10);
  const maxCount = topLocations[0]?.tripCount || 1;

  return (
    <div className="enhanced-glass-card p-6 h-96 flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-left">Top 10 Locations</h3>
      
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3">
          {topLocations.map((location, index) => (
            <div key={index} className="flex items-center gap-3 text-sm">
              <div className="w-24 text-gray-800 truncate font-medium" title={location.name}>
                {location.name}
              </div>
              <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-yellow-500 transition-all duration-300"
                  style={{ width: `${(location.tripCount / maxCount) * 100}%` }}
                />
              </div>
              <div className="w-12 text-gray-800 font-medium text-right">
                {location.tripCount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
