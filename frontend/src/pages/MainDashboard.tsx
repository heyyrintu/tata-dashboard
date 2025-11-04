import { useEffect, useCallback } from 'react';
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
import RevenueTable from '../components/phase5/RevenueTable';
import RevenueOverTimeChart from '../components/phase5/RevenueOverTimeChart';
import RevenueBreakdownChart from '../components/phase5/RevenueBreakdownChart';
import { useDashboard } from '../context/DashboardContext';
import { useTheme } from '../context/ThemeContext';
import { getAnalytics } from '../services/api';
import { FileUploadNew } from '../components/FileUploadNew';
import { BackgroundBeams } from '../components/ui/background-beams';

function MainDashboard() {
  const { uploadedFileName, dateRange, setMetrics, setIsLoading, setError } = useDashboard();
  const { theme } = useTheme();

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAnalytics(dateRange.from || undefined, dateRange.to || undefined);
      setMetrics({
        totalIndents: data.totalIndents,
        totalIndentsUnique: data.totalIndentsUnique,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.from, dateRange.to, setMetrics, setIsLoading, setError]);

  // Fetch analytics when component mounts or when date range changes
  useEffect(() => {
    if (uploadedFileName) {
      fetchInitialData();
    }
  }, [uploadedFileName, fetchInitialData]);

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
        {!uploadedFileName && (
          <div className="mb-8">
            <FileUploadNew onClose={() => {}} />
          </div>
        )}

        {uploadedFileName && (
          <>
            <DateRangeSelector />
            <SummaryCards />
            
            {/* Phase 2: Range Analytics and Map */}
            <div className="space-y-6 mt-6">
              {/* Second Row: Range-Wise Trips and Range-Wise Load Graph */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RangeWiseTable />
                <RangeWiseLoadGraph />
              </div>
              
              {/* Third Row: Delivery Locations Map */}
              <div>
                <IndiaMap />
              </div>
            </div>

            {/* Phase 3: Fulfillment Analytics */}
            <div className="space-y-6 mt-6">
              {/* Fulfillment Utilization Row */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2">
                  <FulfillmentTable />
                </div>
                <div className="lg:col-span-3">
                  <FulfillmentGraph />
                </div>
              </div>
              
              {/* Load and Fulfillment Trends - Two Separate Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LoadTrendChart />
                <FulfillmentTrendChart />
              </div>
            </div>

            {/* Phase 5: Revenue Analytics */}
            <div className="space-y-6 mt-6">
              {/* First Row: Revenue Table and Range wise Revenue % - matching heights */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Column: Revenue Table (40% width) */}
                <div className="lg:col-span-2">
                  <RevenueTable />
                </div>
                
                {/* Right Column: Range wise Revenue % - matching height */}
                <div className="lg:col-span-3">
                  <RevenueBreakdownChart />
                </div>
              </div>
              
              {/* Second Row: Revenue Over Time */}
              <div>
                <RevenueOverTimeChart />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default MainDashboard;
