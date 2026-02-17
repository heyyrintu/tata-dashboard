import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { useDashboard } from '../context/DashboardContext';
import { useTheme } from '../context/ThemeContext';
import { useAvailableMonths } from '../hooks/useAvailableMonths';
import { format } from 'date-fns';
import { IconCalendar, IconFilter, IconX, IconChevronDown } from '@tabler/icons-react';
import { getLatestIndentDate } from '../services/api';
import { formatOrdinalDate } from '../utils/dateFormatting';
import './DateRangeSelector.css';

export default function PageDateFilter() {
  const { dateRange, setDateRange } = useDashboard();
  const { theme } = useTheme();
  const { monthOptions, loading } = useAvailableMonths();

  // Compute current month bounds once at initialization
  const [initMonth] = useState(() => {
    const now = new Date();
    return {
      key: format(now, 'yyyy-MM'),
      start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  });

  const [pendingFrom, setPendingFrom] = useState<Date | null>(dateRange.from ?? initMonth.start);
  const [pendingTo, setPendingTo] = useState<Date | null>(dateRange.to ?? initMonth.end);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    dateRange.from && dateRange.to ? format(dateRange.from, 'yyyy-MM') : initMonth.key
  );
  const [latestIndentDate, setLatestIndentDate] = useState<string | null>(null);

  // Fetch latest indent date
  useEffect(() => {
    const fetchLatestDate = async () => {
      try {
        const date = await getLatestIndentDate();
        setLatestIndentDate(date);
      } catch (error) {
        console.error('[PageDateFilter] Error fetching latest indent date:', error);
      }
    };
    fetchLatestDate();
  }, []);

  // Auto-apply current month on first load if no filter is set in context
  useEffect(() => {
    if (!dateRange.from && !dateRange.to) {
      setDateRange(initMonth.start, initMonth.end);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync local state with context
  useEffect(() => {
    setPendingFrom(dateRange.from);
    setPendingTo(dateRange.to);

    if (dateRange.from && dateRange.to) {
      const fromMonth = format(dateRange.from, 'yyyy-MM');
      const toMonth = format(dateRange.to, 'yyyy-MM');
      setSelectedMonth(fromMonth === toMonth ? fromMonth : '');
    } else {
      setSelectedMonth('');
    }
  }, [dateRange.from, dateRange.to]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const monthValue = e.target.value;
    setSelectedMonth(monthValue);

    if (!monthValue) {
      // "All Months" selected — clear the date filter
      setPendingFrom(null);
      setPendingTo(null);
      setDateRange(null, null);
      return;
    }

    const [year, month] = monthValue.split('-');
    const startDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(parseInt(year, 10), parseInt(month, 10), 0);
    endDate.setHours(23, 59, 59, 999);
    setPendingFrom(startDate);
    setPendingTo(endDate);
    // Auto-apply when month is selected
    setDateRange(startDate, endDate);
  };

  const applyDateRange = (from: Date, to: Date) => {
    const normalizedFrom = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 0, 0, 0, 0);
    const normalizedTo = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999);
    setDateRange(normalizedFrom, normalizedTo);
  };

  const handleClearFilter = () => {
    setPendingFrom(null);
    setPendingTo(null);
    setSelectedMonth('');
    setDateRange(null, null);
  };

  const isFilterActive = dateRange.from !== null && dateRange.to !== null;

  return (
    <div 
      className={`mb-4 rounded-xl overflow-hidden ${
        theme === 'light'
          ? 'bg-white/80 backdrop-blur-sm shadow-sm border border-slate-200/50'
          : 'bg-slate-900/40 backdrop-blur-sm border border-slate-700/50'
      }`}
    >
      <div className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Data Status Box - Top Left */}
          {latestIndentDate && (
            <div 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                theme === 'light'
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-emerald-500/10 border border-emerald-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className={`text-xs font-medium ${
                theme === 'light' ? 'text-emerald-700' : 'text-emerald-400'
              }`}>
                Data up to {formatOrdinalDate(latestIndentDate)}
              </span>
            </div>
          )}

          {/* Divider */}
          <div className={`w-px h-6 ${theme === 'light' ? 'bg-slate-200' : 'bg-slate-700'}`} />

          {/* Filter Icon & Label */}
          <div className="flex items-center gap-2">
            <div 
              className={`p-1.5 rounded-lg ${
                theme === 'light'
                  ? 'bg-gradient-to-br from-[#E01E1F]/10 to-[#FEA519]/10'
                  : 'bg-gradient-to-br from-[#E01E1F]/20 to-[#FEA519]/20'
              }`}
            >
              <IconFilter 
                size={14} 
                style={{ color: theme === 'light' ? '#E01E1F' : '#FEA519' }}
              />
            </div>
            <span className={`text-xs font-semibold hidden sm:inline ${
              theme === 'light' ? 'text-slate-600' : 'text-slate-300'
            }`}>
              Filter
            </span>
          </div>

          {/* Divider */}
          <div className={`w-px h-6 ${theme === 'light' ? 'bg-slate-200' : 'bg-slate-700'}`} />

          {/* Quick Month Select */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              disabled={loading}
              className={`appearance-none rounded-lg pl-3 pr-8 py-1.5 text-xs font-medium transition-all focus:outline-none focus:ring-2 cursor-pointer ${
                theme === 'light'
                  ? 'bg-slate-50 border border-slate-200 text-slate-700 hover:border-[#E01E1F]/30 focus:ring-[#E01E1F]/20 focus:border-[#E01E1F]'
                  : 'bg-slate-800/80 border border-slate-600 text-slate-200 hover:border-[#FEA519]/30 focus:ring-[#FEA519]/20 focus:border-[#FEA519]'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <option value="">All Months</option>
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <IconChevronDown
              size={12}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                theme === 'light' ? 'text-slate-400' : 'text-slate-500'
              }`}
            />
          </div>

          {/* From Date */}
          <div className="relative date-filter-input">
            <IconCalendar
              size={12}
              className={`absolute left-2.5 top-1/2 -translate-y-1/2 z-10 ${
                theme === 'light' ? 'text-slate-400' : 'text-slate-500'
              }`}
            />
            <DatePicker
              selected={pendingFrom}
              onChange={(date: Date | null) => {
                setPendingFrom(date);
                setSelectedMonth('');
                const to = pendingTo || date;
                if (date && to) {
                  if (!pendingTo) setPendingTo(to);
                  applyDateRange(date, to);
                }
              }}
              selectsStart
              startDate={pendingFrom || undefined}
              endDate={pendingTo || undefined}
              maxDate={pendingTo || new Date()}
              className={`w-[100px] rounded-lg pl-7 pr-2 py-1.5 text-xs font-medium transition-all focus:outline-none focus:ring-2 ${
                theme === 'light'
                  ? 'bg-slate-50 border border-slate-200 text-slate-700 hover:border-[#E01E1F]/30 focus:ring-[#E01E1F]/20 focus:border-[#E01E1F]'
                  : 'bg-slate-800/80 border border-slate-600 text-slate-200 hover:border-[#FEA519]/30 focus:ring-[#FEA519]/20 focus:border-[#FEA519]'
              }`}
              dateFormat="MMM dd"
              placeholderText="From"
              portalId="date-picker-portal"
            />
          </div>

          <span className={`text-xs ${theme === 'light' ? 'text-slate-400' : 'text-slate-600'}`}>→</span>

          {/* To Date */}
          <div className="relative date-filter-input">
            <IconCalendar
              size={12}
              className={`absolute left-2.5 top-1/2 -translate-y-1/2 z-10 ${
                theme === 'light' ? 'text-slate-400' : 'text-slate-500'
              }`}
            />
            <DatePicker
              selected={pendingTo}
              onChange={(date: Date | null) => {
                setPendingTo(date);
                setSelectedMonth('');
                if (pendingFrom && date) {
                  applyDateRange(pendingFrom, date);
                }
              }}
              selectsEnd
              startDate={pendingFrom || undefined}
              endDate={pendingTo || undefined}
              minDate={pendingFrom || undefined}
              maxDate={new Date()}
              className={`w-[100px] rounded-lg pl-7 pr-2 py-1.5 text-xs font-medium transition-all focus:outline-none focus:ring-2 ${
                theme === 'light'
                  ? 'bg-slate-50 border border-slate-200 text-slate-700 hover:border-[#E01E1F]/30 focus:ring-[#E01E1F]/20 focus:border-[#E01E1F]'
                  : 'bg-slate-800/80 border border-slate-600 text-slate-200 hover:border-[#FEA519]/30 focus:ring-[#FEA519]/20 focus:border-[#FEA519]'
              }`}
              dateFormat="MMM dd"
              placeholderText="To"
              portalId="date-picker-portal"
            />
          </div>

          {/* Clear Button */}
          {isFilterActive && (
            <button
              onClick={handleClearFilter}
              className={`p-1.5 rounded-lg transition-all ${
                theme === 'light'
                  ? 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                  : 'text-slate-500 hover:text-red-400 hover:bg-red-500/10'
              }`}
              title="Clear filter"
            >
              <IconX size={14} />
            </button>
          )}

          {/* Active Filter Badge */}
          {isFilterActive && (
            <div className={`ml-auto hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              theme === 'light'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {dateRange.from && format(dateRange.from, 'MMM dd')} - {dateRange.to && format(dateRange.to, 'MMM dd')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
