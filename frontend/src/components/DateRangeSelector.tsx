import { useState } from 'react';
import DatePicker from 'react-datepicker';
import { useDashboard } from '../context/DashboardContext';
import { HoverBorderGradient } from './HoverBorderGradient';
import './DateRangeSelector.css';

export default function DateRangeSelector() {
  const { dateRange, setDateRange } = useDashboard();
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date | null>(new Date());

  const handleMonthChange = (date: Date | null) => {
    if (date) {
      setSelectedMonthDate(date);
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0); // Last day of month
      setDateRange(startDate, endDate);
    }
  };

  const currentMonth = new Date();

  return (
    <div className="glass-card rounded-2xl p-6 mb-6 shadow-xl hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-300 border border-blue-900/30">
      <h2 className="text-lg font-semibold text-white mb-4">Filter by Date Range</h2>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            From Date
          </label>
          <DatePicker
            selected={dateRange.from}
            onChange={(date: Date | null) => setDateRange(date, dateRange.to)}
            selectsStart
            startDate={dateRange.from || undefined}
            endDate={dateRange.to || undefined}
            maxDate={dateRange.to || new Date()}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-gray-600 text-white relative z-50 transition-all duration-300 hover:border-gray-600 hover:shadow-lg hover:shadow-white/10"
            dateFormat="yyyy-MM-dd"
            portalId="date-picker-portal"
          />
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            To Date
          </label>
          <DatePicker
            selected={dateRange.to}
            onChange={(date: Date | null) => setDateRange(dateRange.from, date)}
            selectsEnd
            startDate={dateRange.from || undefined}
            endDate={dateRange.to || undefined}
            minDate={dateRange.from || undefined}
            maxDate={new Date()}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-gray-600 text-white relative z-50 transition-all duration-300 hover:border-gray-600 hover:shadow-lg hover:shadow-white/10"
            dateFormat="yyyy-MM-dd"
            portalId="date-picker-portal"
          />
        </div>

        <div className="flex items-end">
          <HoverBorderGradient
            onClick={() => {
              setDateRange(null, null);
              setSelectedMonthDate(currentMonth);
            }}
            containerClassName="rounded-full"
            className="w-full sm:w-auto px-4 py-2 text-white bg-black/40"
            duration={1}
          >
            Clear
          </HoverBorderGradient>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Quick Month Select
        </label>
        <div className="flex gap-2">
          <DatePicker
            selected={selectedMonthDate}
            onChange={handleMonthChange}
            dateFormat="MMMM yyyy"
            showMonthYearPicker
            className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-gray-600 text-white transition-all duration-300 hover:border-gray-600 hover:shadow-lg hover:shadow-white/10"
            maxDate={new Date()}
            portalId="date-picker-portal"
          />
          <HoverBorderGradient
            onClick={() => {
              setSelectedMonthDate(currentMonth);
              const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
              const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
              setDateRange(startDate, endDate);
            }}
            containerClassName="rounded-full"
            className="px-5 py-3 text-white bg-black/40 whitespace-nowrap"
            duration={1}
          >
            📅 This Month
          </HoverBorderGradient>
        </div>
      </div>
    </div>
  );
}

