import { useState, useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { useTheme } from '../../context/ThemeContext';
import { format } from 'date-fns';

export default function MonthSelector() {
  const { dateRange, setDateRange } = useDashboard();
  const { theme } = useTheme();
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Initialize selectedMonth from dateRange
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      const fromMonth = format(dateRange.from, 'yyyy-MM');
      const toMonth = format(dateRange.to, 'yyyy-MM');
      if (fromMonth === toMonth) {
        setSelectedMonth(fromMonth);
      }
    }
  }, [dateRange.from, dateRange.to]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const monthValue = e.target.value;
    setSelectedMonth(monthValue);
    
    if (monthValue) {
      const [year, month] = monthValue.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 2); // Start from day 2
      startDate.setHours(0, 0, 0, 0); // Ensure start of day
      const endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of month
      endDate.setHours(23, 59, 59, 999);
      setDateRange(startDate, endDate);
    }
  };

  // Generate month options (last 12 months + current month)
  const generateMonthOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 12; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMMM yyyy');
      options.push({ value: monthKey, label: monthLabel });
    }
    
    return options;
  };

  const monthOptions = generateMonthOptions();

  return (
    <div className={`mb-6 flex justify-center ${
      theme === 'light' ? '' : ''
    }`}>
      <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-lg ${
        theme === 'light'
          ? 'bg-white shadow-md border border-gray-200'
          : 'bg-gray-800 border border-gray-700'
      }`}>
        <label className={`text-sm font-medium whitespace-nowrap ${
          theme === 'light' ? 'text-black' : 'text-slate-300'
        }`}>
          Select Month:
        </label>
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={handleMonthChange}
            className={`px-4 py-2 pr-8 rounded-lg text-sm font-medium transition-all duration-300 appearance-none cursor-pointer ${
              theme === 'light'
                ? 'bg-white text-black border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                : 'bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            }`}
          >
            <option value="">All Months</option>
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            ↓
          </div>
        </div>
      </div>
    </div>
  );
}

