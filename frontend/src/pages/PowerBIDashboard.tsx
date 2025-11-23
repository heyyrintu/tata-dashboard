import { useEffect, useState } from 'react';
import CompactHeader from '../components/phase4/CompactHeader';
import DateRangeSelector from '../components/DateRangeSelector';
import RevenueCard from '../components/phase4/RevenueCard';
import CostCard from '../components/phase4/CostCard';
import ProfitLossCard from '../components/phase4/ProfitLossCard';
import ProfitLossPercentageCard from '../components/phase4/ProfitLossPercentageCard';
import VehicleCostCard from '../components/phase4/VehicleCostCard';
import RemainingCostCard from '../components/phase4/RemainingCostCard';
import CombinedFinanceTable from '../components/phase5/CombinedFinanceTable';
import VehicleCostTable from '../components/phase5/VehicleCostTable';
import MonthlyActualKmChart from '../components/phase5/MonthlyActualKmChart';
import MonthlyExtraVehicleCostChart from '../components/phase5/MonthlyExtraVehicleCostChart';
import RevenueCostOverTimeChart from '../components/phase5/RevenueCostOverTimeChart';
import ProfitLossOverTimeChart from '../components/phase5/ProfitLossOverTimeChart';
import ProfitLossPercentageOverTimeChart from '../components/phase5/ProfitLossPercentageOverTimeChart';
import { BackgroundBeams } from '../components/ui/background-beams';
import { useTheme } from '../context/ThemeContext';
import { useDashboard } from '../context/DashboardContext';
import { format } from 'date-fns';

export default function PowerBIDashboard() {
  const { theme } = useTheme();
  const { dateRange, setDateRange } = useDashboard();
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Initialize selectedMonth from dateRange
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      const fromMonth = format(dateRange.from, 'yyyy-MM');
      const toMonth = format(dateRange.to, 'yyyy-MM');
      if (fromMonth === toMonth) {
        setSelectedMonth(fromMonth);
      } else {
        setSelectedMonth('');
      }
    } else {
      setSelectedMonth('');
    }
  }, [dateRange.from, dateRange.to]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const monthValue = e.target.value;
    setSelectedMonth(monthValue);
    
    if (monthValue) {
      // Specific month selected - set date range to that month
      const [year, month] = monthValue.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1); // Start from day 1
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of month
      endDate.setHours(23, 59, 59, 999);
      setDateRange(startDate, endDate);
    } else {
      // "All Months" selected - clear date range to show all data
      setDateRange(null, null);
    }
  };

  // Generate month options (last 12 months + current month)
  const generateMonthOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 12; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMMM yyyy'); // Month name with year
      options.push({ value: monthKey, label: monthLabel });
    }
    
    return options;
  };

  const monthOptions = generateMonthOptions();

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      document.documentElement.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
      document.documentElement.classList.remove('light-theme');
    }
  }, [theme]);

  return (
    <div className={`min-h-screen relative ${
      theme === 'light'
        ? 'bg-[#F1F1F1]'
        : 'bg-gradient-to-b from-[#0a0e27] to-[#08101e]'
    }`}>
      {/* Background Beams Effect - Only for dark theme */}
      {theme === 'dark' && (
        <div className="absolute inset-0 overflow-hidden">
          <BackgroundBeams className="pointer-events-none" />
        </div>
      )}
      
      {/* Header */}
      <div className="relative z-50">
        <CompactHeader />
      </div>

      {/* Main Content with proper spacing */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Selector and Month Selector - Combined as one */}
        <div className="mb-6 flex justify-center">
          <div className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 ${
            theme === 'light'
              ? 'bg-gradient-to-r from-red-50 to-yellow-50 border-2 border-red-200/50'
              : 'bg-gradient-to-r from-red-900/30 to-yellow-900/30 border-2 border-red-500/30'
          }`}>
            <div className="flex items-center gap-1.5">
              {/* Date Range Selector Content */}
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${
                theme === 'light' ? 'text-red-600' : 'text-yellow-400'
              }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <DateRangeSelector compact={true} />
              {/* Month Selector */}
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${
                theme === 'light' ? 'text-red-600' : 'text-yellow-400'
              }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  className={`px-3 py-1.5 pr-6 rounded-md text-xs font-semibold transition-all duration-300 appearance-none cursor-pointer ${
                    theme === 'light'
                      ? 'bg-white/90 text-gray-900 border-2 border-red-300/50 focus:ring-2 focus:ring-red-500 focus:border-red-500 hover:border-red-400'
                      : 'bg-gray-900/90 border-2 border-yellow-500/30 text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 hover:border-yellow-400'
                  }`}
                >
                  <option value="">All Months</option>
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-sm font-bold ${
                  theme === 'light' ? 'text-red-600' : 'text-yellow-400'
                }`}>
                  ↓
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Revenue, Cost, Profit & Loss, Profit & Loss % Cards - Four in a row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 max-w-7xl mx-auto">
          <RevenueCard />
          <CostCard />
          <ProfitLossCard />
          <ProfitLossPercentageCard />
        </div>

        {/* Vehicle Cost and Remaining Cost Cards - Two in a row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-8 max-w-7xl mx-auto">
          <VehicleCostCard />
          <RemainingCostCard />
        </div>

        {/* Range-Wise Financial Summary - Right after cards */}
        <div className="mb-8">
          <CombinedFinanceTable />
        </div>

        {/* Vehicle Cost Table */}
        <div className="mb-8">
          <VehicleCostTable />
        </div>

        {/* Monthly Vehicle Cost Charts */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlyActualKmChart />
          <MonthlyExtraVehicleCostChart />
        </div>

        {/* Profit & Loss % Over Time */}
        <div className="mb-8 space-y-6">
          <ProfitLossPercentageOverTimeChart />
          <ProfitLossOverTimeChart />
        </div>

        {/* Over Time Charts */}
        <div className="space-y-6">
          <RevenueCostOverTimeChart />
        </div>
      </main>
    </div>
  );
}
