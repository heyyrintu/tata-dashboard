import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { useDashboard } from '../context/DashboardContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/moving-border';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import './DateRangeSelector.css';

interface DateRangeSelectorProps {
  compact?: boolean;
}

export default function DateRangeSelector({ compact = false }: DateRangeSelectorProps) {
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
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1); // Start from day 1
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
    
    // Validate that both dates are selected
    if (!pendingFrom || !pendingTo) {
      console.warn('[DateRangeSelector] Both dates must be selected');
      return;
    }
    
    // Normalize dates to ensure correct boundaries using local timezone
    let normalizedFrom = pendingFrom;
    let normalizedTo = pendingTo;
    
    // Create date using local date components to avoid timezone issues
    const fromYear = normalizedFrom.getFullYear();
    const fromMonth = normalizedFrom.getMonth();
    const fromDay = normalizedFrom.getDate();
    normalizedFrom = new Date(fromYear, fromMonth, fromDay, 0, 0, 0, 0); // Start of day in local time
    
    const toYear = normalizedTo.getFullYear();
    const toMonth = normalizedTo.getMonth();
    const toDay = normalizedTo.getDate();
    normalizedTo = new Date(toYear, toMonth, toDay, 23, 59, 59, 999); // End of day in local time
    
    // Handle same-day selection: if from and to are the same calendar day,
    // ensure to is after from (even though they're the same day, to should be end of day)
    if (fromYear === toYear && fromMonth === toMonth && fromDay === toDay) {
      // Same day selection - from is start of day, to is end of day
      // This is already handled correctly above
      console.log('[DateRangeSelector] Same day selected - filtering for single day');
    }
    
    console.log('[DateRangeSelector] Normalized dates:', {
      from: normalizedFrom ? format(normalizedFrom, 'yyyy-MM-dd HH:mm:ss') : 'null',
      to: normalizedTo ? format(normalizedTo, 'yyyy-MM-dd HH:mm:ss') : 'null',
      fromISO: normalizedFrom?.toISOString(),
      toISO: normalizedTo?.toISOString(),
      isSameDay: fromYear === toYear && fromMonth === toMonth && fromDay === toDay
    });
    
    console.log('[DateRangeSelector] Setting date range in context...');
    setDateRange(normalizedFrom, normalizedTo);
    
    if (pendingMonth) {
      setSelectedMonthDate(pendingMonth);
    }
    
    console.log('[DateRangeSelector] ===== FILTER APPLIED =====');
  };


  // Compact version - returns just the inner content (no wrapper)
  if (compact) {
    return (
      <>
        <div className="relative">
          <DatePicker
            selected={pendingFrom}
            onChange={(date: Date | null) => {
              setPendingFrom(date);
              if (date && !pendingTo) {
                setPendingTo(date);
              }
            }}
            selectsStart
            startDate={pendingFrom || undefined}
            endDate={pendingTo || undefined}
            maxDate={pendingTo || new Date()}
            className={`px-3 py-1.5 pr-6 rounded-md text-xs font-semibold transition-all duration-300 ${
              theme === 'light'
                ? 'bg-white/90 text-gray-900 border-2 border-red-300/50 focus:ring-2 focus:ring-red-500 focus:border-red-500 hover:border-red-400'
                : 'bg-gray-900/90 border-2 border-yellow-500/30 text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 hover:border-yellow-400'
            }`}
            dateFormat="MMM dd"
            placeholderText="From"
            portalId="date-picker-portal"
          />
        </div>
        <span className={`text-xs font-semibold ${
          theme === 'light' ? 'text-red-600' : 'text-yellow-400'
        }`}>-</span>
        <div className="relative">
          <DatePicker
            selected={pendingTo}
            onChange={(date: Date | null) => setPendingTo(date)}
            selectsEnd
            startDate={pendingFrom || undefined}
            endDate={pendingTo || undefined}
            minDate={pendingFrom || undefined}
            maxDate={new Date()}
            className={`px-3 py-1.5 pr-6 rounded-md text-xs font-semibold transition-all duration-300 ${
              theme === 'light'
                ? 'bg-white/90 text-gray-900 border-2 border-red-300/50 focus:ring-2 focus:ring-red-500 focus:border-red-500 hover:border-red-400'
                : 'bg-gray-900/90 border-2 border-yellow-500/30 text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 hover:border-yellow-400'
            }`}
            dateFormat="MMM dd"
            placeholderText="To"
            portalId="date-picker-portal"
          />
        </div>
        <Button
          onClick={handleApplyFilter}
          borderRadius="0.5rem"
          containerClassName="h-auto w-auto transition-all duration-300 hover:scale-105 active:scale-95"
          className={cn(
            'px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all duration-300',
            isFilterActive
              ? theme === 'light'
                ? '!bg-orange-100 !text-[#E01E1F] !border-orange-300 hover:!bg-orange-200'
                : 'bg-blue-900 text-white border-blue-700 hover:bg-blue-800'
              : theme === 'light'
                ? '!bg-white !text-[#FEA519] !border-neutral-200 hover:!bg-orange-50 hover:!text-[#E01E1F]'
                : 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800'
          )}
          borderClassName={cn(
            'transition-all duration-300',
            isFilterActive
              ? theme === 'light'
                ? 'bg-[radial-gradient(#E01E1F_60%,transparent_40%)]'
                : 'bg-[radial-gradient(#0ea5e9_60%,transparent_40%)]'
              : theme === 'light'
                ? 'bg-[radial-gradient(#E01E1F_40%,transparent_60%)]'
                : 'bg-[radial-gradient(#0ea5e9_40%,transparent_60%)]'
          )}
        >
          Apply
        </Button>
      </>
    );
  }

  // Full version (original design)
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

