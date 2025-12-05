import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
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
import PageDateFilter from '../components/PageDateFilter';
import { useDashboard } from '../context/DashboardContext';
import { useTheme } from '../context/ThemeContext';
import { getAnalytics } from '../services/api';
import { BackgroundBeams } from '../components/ui/background-beams';

function MainDashboard() {
  const { uploadedFileName, dateRange, setMetrics, setIsLoading, setError, setUploadedFileName } = useDashboard();
  const { theme } = useTheme();
  const navigate = useNavigate();

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
            <PageDateFilter />
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
