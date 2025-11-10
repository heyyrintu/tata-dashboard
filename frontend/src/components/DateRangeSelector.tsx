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
  const [, setSelectedMonthDate] = useState<Date | null>(
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

  // Check if filter is active (dates are selected)
  const isFilterActive = dateRange.from !== null && dateRange.to !== null;

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
            <div className={`relative ${theme === 'light' ? 'date-input-red-border flex-1' : 'flex-1'}`}>
              <DatePicker
                selected={pendingMonth}
                onChange={handleMonthChange}
                dateFormat="MMMM yyyy"
                showMonthYearPicker
                className={`w-full px-4 py-3 pr-8 rounded-lg transition-all duration-300 ${
                  theme === 'light'
                    ? 'bg-white text-black focus:ring-2 hover:shadow-md'
                    : 'bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-white focus:border-gray-600 hover:border-gray-600 hover:shadow-lg hover:shadow-white/10'
                }`}
                maxDate={new Date()}
                portalId="date-picker-portal"
              />
              <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-400'
              }`}>
                ↓
              </div>
            </div>
          </div>

          <Button
            onClick={handleApplyFilter}
            borderRadius="0.5rem"
            containerClassName="h-auto w-auto transition-all duration-300 hover:scale-105 active:scale-95"
            className={cn(
              'px-6 py-2 text-base font-bold whitespace-nowrap transition-all duration-300',
              isFilterActive
                ? theme === 'light'
                  ? '!bg-orange-100 !text-[#E01E1F] !border-orange-300 hover:!bg-orange-200 hover:shadow-lg hover:shadow-orange-300/50 active:!bg-orange-300'
                  : 'bg-blue-900 text-white border-blue-700 hover:bg-blue-800 hover:shadow-lg hover:shadow-blue-500/50 active:bg-blue-700'
                : theme === 'light' 
                  ? '!bg-white !text-[#FEA519] !border-neutral-200 hover:!bg-orange-50 hover:!text-[#E01E1F] hover:shadow-lg hover:shadow-orange-200/50 active:!bg-orange-100' 
                  : 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800 hover:shadow-lg hover:shadow-blue-500/30 active:bg-slate-700'
            )}
            borderClassName={cn(
              'transition-all duration-300',
              isFilterActive
                ? theme === 'light'
                  ? 'bg-[radial-gradient(#E01E1F_60%,transparent_40%)] hover:bg-[radial-gradient(#E01E1F_80%,transparent_20%)]'
                  : 'bg-[radial-gradient(#0ea5e9_60%,transparent_40%)] hover:bg-[radial-gradient(#0ea5e9_80%,transparent_20%)]'
                : theme === 'light'
                  ? 'bg-[radial-gradient(#E01E1F_40%,transparent_60%)] hover:bg-[radial-gradient(#E01E1F_60%,transparent_40%)]'
                  : 'bg-[radial-gradient(#0ea5e9_40%,transparent_60%)] hover:bg-[radial-gradient(#0ea5e9_60%,transparent_40%)]'
            )}
          >
            Filter
          </Button>
        </div>
      </div>
    </div>
  );
}

