import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import DateRangeSelector from '../components/DateRangeSelector';
import SummaryCards from '../components/SummaryCards';
import RangeWiseTable from '../components/RangeWiseTable';
import RangeWiseLoadGraph from '../components/RangeWiseLoadGraph';
import IndiaMap from '../components/IndiaMap';
import FulfillmentTable from '../components/FulfillmentTable';
import FulfillmentGraph from '../components/FulfillmentGraph';
import LoadTrendChart from '../components/LoadTrendChart';
import FulfillmentTrendChart from '../components/FulfillmentTrendChart';
import MonthOnMonthIndentsChart from '../components/MonthOnMonthIndentsChart';
import MonthOnMonthTripsChart from '../components/MonthOnMonthTripsChart';
import { useDashboard } from '../context/DashboardContext';
import { useTheme } from '../context/ThemeContext';
import { getAnalytics } from '../services/api';
import { BackgroundBeams } from '../components/ui/background-beams';
import { format } from 'date-fns';

function MainDashboard() {
  const { uploadedFileName, dateRange, setMetrics, setIsLoading, setError, setUploadedFileName, setDateRange } = useDashboard();
  const { theme } = useTheme();
  const navigate = useNavigate();
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
      const [year, month] = monthValue.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1); // Start from day 1
      startDate.setHours(0, 0, 0, 0);
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
      const monthLabel = format(date, 'MMMM'); // Only month name
      options.push({ value: monthKey, label: monthLabel });
    }
    
    return options;
  };

  const monthOptions = generateMonthOptions();

  const fetchInitialData = useCallback(async () => {
    console.log('[MainDashboard] fetchInitialData called with dateRange:', {
      from: dateRange.from?.toISOString().split('T')[0] || 'null',
      to: dateRange.to?.toISOString().split('T')[0] || 'null'
    });
    setIsLoading(true);
    try {
      const data = await getAnalytics(dateRange.from || undefined, dateRange.to || undefined);
      console.log('[MainDashboard] Analytics data received:', {
        totalIndents: data.totalIndents,
        totalIndentsUnique: data.totalIndentsUnique,
        dateRange: data.dateRange
      });
      setMetrics({
        totalIndents: data.totalIndents,
        totalIndentsUnique: data.totalIndentsUnique,
      });
      // If we have data, set uploadedFileName so dashboard shows content
      if (data.totalIndents > 0 && !uploadedFileName) {
        console.log('[MainDashboard] Setting uploadedFileName to email-processed');
        setUploadedFileName('email-processed');
      }
    } catch (error) {
      console.error('[MainDashboard] Error fetching analytics:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.from, dateRange.to, setMetrics, setIsLoading, setError, uploadedFileName, setUploadedFileName]);

  // Check for data on mount (even without uploadedFileName)
  useEffect(() => {
    // Always try to fetch data on mount to check if data exists
    console.log('[MainDashboard] Mounting - fetching initial data');
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Fetch analytics when date range changes (if we have data)
  useEffect(() => {
    if (uploadedFileName) {
      console.log('[MainDashboard] Date range changed - fetching data');
      fetchInitialData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.from, dateRange.to, uploadedFileName]); // fetchInitialData is stable due to useCallback

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
        <Header />
      </div>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {!uploadedFileName ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className={`text-center p-8 rounded-lg ${
              theme === 'light' 
                ? 'bg-white shadow-lg' 
                : 'bg-slate-800/50 border border-slate-700'
            }`}>
              <h2 className={`text-2xl font-bold mb-4 ${
                theme === 'light' ? 'text-gray-800' : 'text-white'
              }`}>
                No Data Available
              </h2>
              <p className={`mb-6 ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-300'
              }`}>
                Please upload an Excel file to view the dashboard.
              </p>
              <button
                onClick={() => navigate('/upload')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  theme === 'light'
                    ? 'bg-[#E01E1F] text-white hover:bg-[#C01A1B]'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Go to Upload Page
              </button>
            </div>
          </div>
        ) : (
          <>
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
            <SummaryCards />
            
            {/* Phase 2: Range Analytics */}
            <div className="space-y-6 mt-6">
              {/* Range-Wise Summary and Fulfillment Trends */}
              <div className="grid grid-cols-1 lg:grid-cols-20 gap-6">
                <div className="lg:col-span-13">
                  <RangeWiseTable />
                </div>
                <div className="lg:col-span-7">
                  <FulfillmentTable />
                </div>
              </div>
            </div>

            {/* Phase 3: Fulfillment Analytics */}
            <div className="space-y-6 mt-6">
              {/* Range-Wise Bucket Count Graph Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RangeWiseLoadGraph />
                <FulfillmentGraph />
              </div>
              
              {/* Load and Fulfillment Trends - Two Separate Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LoadTrendChart />
                <FulfillmentTrendChart />
              </div>
            </div>

            {/* Phase 4: Month-on-Month Analytics */}
            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MonthOnMonthIndentsChart />
                <MonthOnMonthTripsChart />
              </div>
            </div>

            {/* Delivery Locations Map - Bottom Section */}
            <div className="space-y-6 mt-6">
              <div>
                <IndiaMap />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default MainDashboard;
