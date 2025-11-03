import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { useDashboard } from '../context/DashboardContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/moving-border';
import { cn } from '../lib/utils';
import './DateRangeSelector.css';

export default function DateRangeSelector() {
  const { dateRange, setDateRange } = useDashboard();
  const { theme } = useTheme();
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date | null>(new Date());
  
  // Local state for pending changes
  const [pendingFrom, setPendingFrom] = useState<Date | null>(dateRange.from);
  const [pendingTo, setPendingTo] = useState<Date | null>(dateRange.to);
  const [pendingMonth, setPendingMonth] = useState<Date | null>(new Date());

  // Update local state when dateRange changes externally
  useEffect(() => {
    setPendingFrom(dateRange.from);
    setPendingTo(dateRange.to);
  }, [dateRange.from, dateRange.to]);

  const handleMonthChange = (date: Date | null) => {
    if (date) {
      setPendingMonth(date);
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0); // Last day of month
      setPendingFrom(startDate);
      setPendingTo(endDate);
    }
  };

  const handleApplyFilter = () => {
    setDateRange(pendingFrom, pendingTo);
    if (pendingMonth) {
      setSelectedMonthDate(pendingMonth);
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
        </div>
      </div>
    </div>
  );
}

