import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useDashboard } from '../context/DashboardContext';
import { format } from 'date-fns';
import { getLatestIndentDate } from '../services/api';
import { formatOrdinalDate } from '../utils/dateFormatting';
import DateRangeSelector from './DateRangeSelector';
import { IconCalendarEvent, IconChevronDown } from '@tabler/icons-react';
import { useAvailableMonths } from '../hooks/useAvailableMonths';

export default function Header() {
  const location = useLocation();
  const { theme } = useTheme();
  const { dateRange, setDateRange } = useDashboard();
  const [latestIndentDate, setLatestIndentDate] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const { monthOptions, loading } = useAvailableMonths();

  useEffect(() => {
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

    if (monthValue) {
      const [year, month] = monthValue.split('-');
      const startDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(parseInt(year, 10), parseInt(month, 10), 0);
      endDate.setHours(23, 59, 59, 999);
      setDateRange(startDate, endDate);
    } else {
      setDateRange(null, null);
    }
  };

  useEffect(() => {
    const fetchLatestDate = async () => {
      try {
        const date = await getLatestIndentDate();
        setLatestIndentDate(date);
      } catch (error) {
        console.error('[Header] Error fetching latest indent date:', error);
      }
    };
    fetchLatestDate();
  }, []);

  const shellClasses =
    theme === 'light'
      ? 'bg-white/85 border-slate-200 text-slate-900'
      : 'bg-slate-950/80 border-white/10 text-white';

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-lg transition-all duration-300 ${shellClasses}`}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex h-14 items-center gap-3">
          <div className="flex flex-1 items-center gap-2 text-base font-semibold leading-none uppercase tracking-tight">
            <span>DRONA</span>
            <span className={theme === 'light' ? 'text-slate-400' : 'text-slate-600'}>/</span>
            <span className={theme === 'light' ? 'text-slate-600' : 'text-slate-300'}>
              {location.pathname === '/upload' ? 'TATA DEF UPDATE' : 'TATA DEF DASHBOARD'}
            </span>
          </div>

          {location.pathname === '/' && (
            <div className="hidden lg:flex flex-shrink-0 items-center gap-2 text-xs font-semibold">
              <div
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${
                  theme === 'light'
                    ? 'border-slate-200 bg-white text-slate-600'
                    : 'border-white/10 bg-white/5 text-slate-200'
                }`}
              >
                <DateRangeSelector compact />
              </div>
              <div className="relative">
                <IconCalendarEvent
                  size={14}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                    theme === 'light' ? 'text-slate-400' : 'text-slate-500'
                  }`}
                />
                <select
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  disabled={loading}
                  className={`appearance-none rounded-full border pl-8 pr-7 py-1.5 focus:outline-none ${
                    theme === 'light'
                      ? 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/20'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="">All months</option>
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <IconChevronDown
                  size={12}
                  className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${
                    theme === 'light' ? 'text-slate-400' : 'text-slate-500'
                  }`}
                />
              </div>
            </div>
          )}

          {latestIndentDate && (
            <div className="flex flex-shrink-0 items-center gap-2 text-xs font-semibold">
              <span
                className={`hidden sm:flex items-center gap-2 rounded-full border px-3 py-1 ${
                  theme === 'light'
                    ? 'border-emerald-100 bg-white text-emerald-600'
                    : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Data up to {formatOrdinalDate(latestIndentDate)}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

