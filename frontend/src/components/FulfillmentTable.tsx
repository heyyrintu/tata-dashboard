import { useFulfillmentData } from '../hooks/useFulfillmentData';
import { useTheme } from '../context/ThemeContext';
import { useDashboard } from '../context/DashboardContext';
import { LoadingSpinner } from './LoadingSpinner';
import { formatIndentCount } from '../utils/fulfillmentCalculations';
import { exportMissingIndents } from '../services/api';
import { useState } from 'react';

export default function FulfillmentTable() {
  const { data, loading, error } = useFulfillmentData();
  const { theme } = useTheme();
  const { dateRange } = useDashboard();
  const [downloading, setDownloading] = useState(false);

  const handleDownloadMissingIndents = async () => {
    try {
      setDownloading(true);
      const fromDate = dateRange.from ? new Date(dateRange.from) : undefined;
      const toDate = dateRange.to ? new Date(dateRange.to) : undefined;
      
      const blob = await exportMissingIndents(fromDate, toDate);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const dateRangeStr = fromDate && toDate 
        ? `${fromDate.toISOString().split('T')[0]}_to_${toDate.toISOString().split('T')[0]}`
        : 'all_dates';
      link.download = `Missing_Indents_${dateRangeStr}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading missing indents:', err);
      alert('Failed to download missing indents. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
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
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-lg font-semibold ${
            theme === 'light' ? 'text-black' : 'text-black'
          }`}>Fulfillment Trends</h2>
          <button
            onClick={handleDownloadMissingIndents}
            disabled={loading || downloading || !data || !data.fulfillmentData || data.fulfillmentData.length === 0}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              theme === 'light'
                ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed'
            }`}
          >
            {downloading ? 'Downloading...' : 'Download Missing Indents'}
          </button>
        </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className={`flex justify-center items-center h-64 ${
          theme === 'light' ? 'text-red-600' : 'text-red-400'
        }`}>
          Error: {error}
        </div>
      ) : data && data.fulfillmentData && data.fulfillmentData.length > 0 ? (
        <div className="overflow-x-auto h-64 overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className={theme === 'light' ? 'border-b border-gray-200' : 'border-b border-gray-300'}>
                <th className={`text-left py-3 px-4 text-sm font-medium ${
                  theme === 'light' ? 'text-black' : 'text-black'
                }`}>Bucket Range</th>
                <th className={`text-center py-3 px-4 text-sm font-medium ${
                  theme === 'light' ? 'text-gray-700' : 'text-black'
                }`}>Trip Count</th>
              </tr>
            </thead>
            <tbody>
              {data.fulfillmentData.map((item, index) => {
                // Use bucketRange from API (bucket count only, no percentage)
                const bucketRange = item.bucketRange || item.range;
                
                // Define colors for each bucket range
                const fulfillmentColors = [
                  '#E01E1F',   // Red - 0-150
                  '#FEA519',   // Orange/Yellow - 151-200
                  '#FF6B35',   // Orange-Red - 201-250
                  '#FF8C42',   // Light Orange - 251-300
                  '#9CA3AF'   // Gray - Other (300+)
                ];
                // Use gray for "Other" category, otherwise use the color array
                const rangeColor = item.range === 'Other' || bucketRange === '300+'
                  ? '#9CA3AF' 
                  : fulfillmentColors[index % fulfillmentColors.length];
                
                return (
                  <tr
                    key={index}
                    className={`border-b transition-colors duration-200 ${
                      theme === 'light'
                        ? 'border-gray-100 hover:bg-gray-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-3 px-4 font-medium" style={{ color: rangeColor }}>{bucketRange}</td>
                    <td className={`py-3 px-4 font-medium text-center ${
                      theme === 'light' ? 'text-black' : 'text-black'
                    }`}>{formatIndentCount(item.tripCount)}</td>
                  </tr>
                );
              })}
              {/* Total Row */}
              <tr className={`border-t-2 ${
                theme === 'light' ? 'border-gray-300 bg-gray-50' : 'border-gray-400 bg-gray-100'
              }`}>
                <td className={`py-3 px-4 font-bold ${
                  theme === 'light' ? 'text-black' : 'text-black'
                }`}>Total</td>
                <td className={`py-3 px-4 font-bold text-center ${
                  theme === 'light' ? 'text-black' : 'text-black'
                }`}>{formatIndentCount(data.totalTrips || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className={`flex justify-center items-center h-64 ${
          theme === 'light' ? 'text-black' : 'text-black'
        }`}>
          No data available for the selected date range
        </div>
      )}
      </div>
    </div>
  );
}

