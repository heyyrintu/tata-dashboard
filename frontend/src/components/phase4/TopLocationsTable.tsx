import { useRangeData } from '../../hooks/useRangeData';
import { useTheme } from '../../context/ThemeContext';
import { LoadingSpinner } from '../LoadingSpinner';
import { sortLocationsByIndents } from '../../utils/phase4Calculations';

export default function TopLocationsTable() {
  const { data, loading } = useRangeData();
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

  if (!data || !data.locations || data.locations.length === 0) {
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

  const topLocations = sortLocationsByIndents(data.locations, 10);
  const maxCount = topLocations[0]?.indentCount || 1;

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
        }`}>Top 10 Locations</h3>
        
        <div className="flex-1 overflow-y-auto pr-4">
          <div className="space-y-3">
            {topLocations.map((location, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <div className={`w-24 truncate font-medium ${
                  theme === 'light' ? 'text-black' : 'text-gray-300'
                }`} title={location.name}>
                  {location.name}
                </div>
                <div className={`flex-1 h-4 rounded-full overflow-hidden ${
                  theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'
                }`}>
                  <div 
                    className="h-full transition-all duration-300"
                    style={{ 
                      width: `${(location.indentCount / maxCount) * 100}%`,
                      background: 'linear-gradient(to right, #E01E1F, #FEA519)'
                    }}
                  />
                </div>
                <div className={`w-12 font-medium text-right ${
                  theme === 'light' ? 'text-black' : 'text-gray-300'
                }`}>
                  {location.indentCount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
