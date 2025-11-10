import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { useDashboard } from '../context/DashboardContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/moving-border';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import './DateRangeSelector.css';

export default function DateRangeSelector() {
  const { dateRange, setDateRange } = useDashboard();
  const { theme } = useTheme();
  // Initialize with current month if no date range is set
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date | null>(
    dateRange.from && dateRange.to ? dateRange.from : new Date()
  );
  
  // Local state for pending changes - initialize with current date range or null
  const [pendingFrom, setPendingFrom] = useState<Date | null>(dateRange.from);
  const [pendingTo, setPendingTo] = useState<Date | null>(dateRange.to);
  const [pendingMonth, setPendingMonth] = useState<Date | null>(
    dateRange.from && dateRange.to ? dateRange.from : new Date()
  );

  // Update local state when dateRange changes externally
  useEffect(() => {
    setPendingFrom(dateRange.from);
    setPendingTo(dateRange.to);
  }, [dateRange.from, dateRange.to]);

  const handleMonthChange = (date: Date | null) => {
    if (date) {
      setPendingMonth(date);
      const startDate = new Date(date.getFullYear(), date.getMonth(), 2); // Start from day 2
      startDate.setHours(0, 0, 0, 0); // Ensure start of day
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0); // Last day of month
      endDate.setHours(23, 59, 59, 999); // Set to end of day to include entire last day
      setPendingFrom(startDate);
      setPendingTo(endDate);
    }
  };

  const handleApplyFilter = () => {
    console.log('[DateRangeSelector] ===== APPLYING FILTER =====');
    console.log('[DateRangeSelector] Pending dates:', {
      from: pendingFrom ? format(pendingFrom, 'yyyy-MM-dd') : 'null',
      to: pendingTo ? format(pendingTo, 'yyyy-MM-dd') : 'null'
    });
    
    // Normalize dates to ensure correct boundaries
    let normalizedFrom = pendingFrom;
    let normalizedTo = pendingTo;
    
    if (normalizedFrom) {
      normalizedFrom = new Date(normalizedFrom);
      normalizedFrom.setHours(0, 0, 0, 0); // Start of day
    }
    
    if (normalizedTo) {
      normalizedTo = new Date(normalizedTo);
      normalizedTo.setHours(23, 59, 59, 999); // End of day
    }
    
    console.log('[DateRangeSelector] Normalized dates:', {
      from: normalizedFrom ? format(normalizedFrom, 'yyyy-MM-dd HH:mm:ss') : 'null',
      to: normalizedTo ? format(normalizedTo, 'yyyy-MM-dd HH:mm:ss') : 'null',
      fromISO: normalizedFrom?.toISOString(),
      toISO: normalizedTo?.toISOString()
    });
    
    console.log('[DateRangeSelector] Setting date range in context...');
    setDateRange(normalizedFrom, normalizedTo);
    
    if (pendingMonth) {
      setSelectedMonthDate(pendingMonth);
    }
    
    console.log('[DateRangeSelector] ===== FILTER APPLIED =====');
  };

  const handleExportExcel = async () => {
    try {
      console.log('[EXPORT] Starting export...');
      
      // Use current date range (from context) or pending dates
      const fromDate = dateRange.from || pendingFrom;
      const toDate = dateRange.to || pendingTo;
      
      console.log('[EXPORT] Date range:', {
        from: fromDate ? format(fromDate, 'yyyy-MM-dd') : 'null',
        to: toDate ? format(toDate, 'yyyy-MM-dd') : 'null'
      });
      
      // Build query parameters
      const params = new URLSearchParams();
      if (fromDate) {
        params.append('fromDate', format(fromDate, 'yyyy-MM-dd'));
      }
      if (toDate) {
        params.append('toDate', format(toDate, 'yyyy-MM-dd'));
      }
      
      // Create download URL - use same base URL pattern as other API calls
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const apiUrl = `${baseUrl}/analytics/export-all`;
      const url = params.toString() ? `${apiUrl}?${params.toString()}` : apiUrl;
      
      console.log('[EXPORT] Calling URL:', url);
      
      // Use fetch to download the file (handles CORS properly)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      console.log('[EXPORT] Response status:', response.status, response.statusText);
      console.log('[EXPORT] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        console.error('[EXPORT] HTTP Error:', errorMessage);
        throw new Error(errorMessage);
      }

      // Get the blob from the response
      console.log('[EXPORT] Converting response to blob...');
      const blob = await response.blob();
      console.log('[EXPORT] Blob size:', blob.size, 'bytes');
      console.log('[EXPORT] Blob type:', blob.type);
      
      // Check if blob is actually an Excel file
      if (blob.size === 0) {
        throw new Error('Received empty file from server');
      }
      
      if (!blob.type.includes('spreadsheet') && !blob.type.includes('excel') && blob.type !== 'application/octet-stream') {
        // Might be an error JSON response
        const text = await blob.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.error || errorData.message || 'Invalid file type received');
        } catch (e) {
          throw new Error(`Invalid file type: ${blob.type}. Response: ${text.substring(0, 100)}`);
        }
      }
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'All_Indents.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      console.log('[EXPORT] Filename:', filename);
      
      // Create a temporary URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
      
      console.log('[EXPORT] Export completed successfully!');
    } catch (error) {
      console.error('[EXPORT] Error details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to export Excel file: ${errorMessage}\n\nCheck the browser console for more details.`);
    }
  };

  return (
    <div 
      className={`rounded-2xl mb-6 transition-all duration-300 ${
        theme === 'light'
          ? 'p-[2px] shadow-lg'
          : 'glass-card hover:shadow-2xl hover:shadow-blue-900/20 border border-blue-900/30 shadow-xl'
      }`}
      style={theme === 'light' ? {
        background: 'linear-gradient(to right, rgba(224, 30, 31, 0.35), rgba(254, 165, 25, 0.35))',
        boxShadow: '0 10px 15px -3px rgba(224, 30, 31, 0.2), 0 4px 6px -2px rgba(254, 165, 25, 0.2)'
      } : {}}
    >
      <div className={`rounded-2xl p-6 w-full ${
        theme === 'light' ? 'bg-[#FDFDFD] border-0' : ''
      }`} style={theme === 'light' ? { border: 'none' } : {}}>
        <div className="flex flex-row gap-4 items-center w-full">
          <div className="flex items-center gap-2 flex-1">
            <label className={`text-sm font-medium whitespace-nowrap ${
              theme === 'light' ? 'text-black' : 'text-slate-300'
            }`}>
              From Date
            </label>
            <div className={theme === 'light' ? 'date-input-red-border flex-1' : 'flex-1'}>
              <DatePicker
                selected={pendingFrom}
                onChange={(date: Date | null) => setPendingFrom(date)}
                selectsStart
                startDate={pendingFrom || undefined}
                endDate={pendingTo || undefined}
                maxDate={pendingTo || new Date()}
                className={`w-full px-3 py-2 rounded-lg relative z-50 transition-all duration-300 ${
                  theme === 'light'
                    ? 'bg-white text-black focus:ring-2 hover:shadow-md'
                    : 'bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-white focus:border-gray-600 hover:border-gray-600 hover:shadow-lg hover:shadow-white/10'
                }`}
                dateFormat="yyyy-MM-dd"
                portalId="date-picker-portal"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <label className={`text-sm font-medium whitespace-nowrap ${
              theme === 'light' ? 'text-black' : 'text-slate-300'
            }`}>
              To Date
            </label>
            <div className={theme === 'light' ? 'date-input-red-border flex-1' : 'flex-1'}>
              <DatePicker
                selected={pendingTo}
                onChange={(date: Date | null) => setPendingTo(date)}
                selectsEnd
                startDate={pendingFrom || undefined}
                endDate={pendingTo || undefined}
                minDate={pendingFrom || undefined}
                maxDate={new Date()}
                className={`w-full px-3 py-2 rounded-lg relative z-50 transition-all duration-300 ${
                  theme === 'light'
                    ? 'bg-white text-black focus:ring-2 hover:shadow-md'
                    : 'bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-white focus:border-gray-600 hover:border-gray-600 hover:shadow-lg hover:shadow-white/10'
                }`}
                dateFormat="yyyy-MM-dd"
                portalId="date-picker-portal"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <label className={`text-sm font-medium whitespace-nowrap ${
              theme === 'light' ? 'text-black' : 'text-slate-300'
            }`}>
              Month
            </label>
            <div className={theme === 'light' ? 'date-input-red-border flex-1' : 'flex-1'}>
              <DatePicker
                selected={pendingMonth}
                onChange={handleMonthChange}
                dateFormat="MMMM yyyy"
                showMonthYearPicker
                className={`w-full px-4 py-3 rounded-lg transition-all duration-300 ${
                  theme === 'light'
                    ? 'bg-white text-black focus:ring-2 hover:shadow-md'
                    : 'bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-white focus:border-gray-600 hover:border-gray-600 hover:shadow-lg hover:shadow-white/10'
                }`}
                maxDate={new Date()}
                portalId="date-picker-portal"
              />
            </div>
          </div>

          <Button
            onClick={handleApplyFilter}
            borderRadius="0.5rem"
            containerClassName="h-auto w-auto"
            className={cn(
              'px-6 py-2 text-base font-bold whitespace-nowrap',
              theme === 'light' 
                ? '!bg-white !text-[#FEA519] !border-neutral-200' 
                : 'bg-slate-900 text-white border-slate-800'
            )}
            borderClassName={
              theme === 'light'
                ? 'bg-[radial-gradient(#E01E1F_40%,transparent_60%)]'
                : 'bg-[radial-gradient(#0ea5e9_40%,transparent_60%)]'
            }
          >
            Filter
          </Button>

          <Button
            onClick={handleExportExcel}
            borderRadius="0.5rem"
            containerClassName="h-auto w-auto"
            className={cn(
              'px-6 py-2 text-base font-bold whitespace-nowrap',
              theme === 'light' 
                ? '!bg-white !text-green-600 !border-neutral-200' 
                : 'bg-green-900 text-white border-green-800'
            )}
            borderClassName={
              theme === 'light'
                ? 'bg-[radial-gradient(#22c55e_40%,transparent_60%)]'
                : 'bg-[radial-gradient(#0ea5e9_40%,transparent_60%)]'
            }
          >
            📥 Export Excel
          </Button>
        </div>
      </div>
    </div>
  );
}

