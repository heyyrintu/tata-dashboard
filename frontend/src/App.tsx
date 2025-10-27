import { useEffect } from 'react';
import Header from './components/Header';
import DateRangeSelector from './components/DateRangeSelector';
import SummaryCards from './components/SummaryCards';
import RangeWiseTable from './components/RangeWiseTable';
import RangeWiseLoadGraph from './components/RangeWiseLoadGraph';
import IndiaMap from './components/IndiaMap';
import { useDashboard } from './context/DashboardContext';
import { getAnalytics } from './services/api';
import { FileUploadNew } from './components/FileUploadNew';
import { BackgroundRippleEffect } from './components/BackgroundRippleEffect';

function App() {
  const { uploadedFileName, dateRange, setMetrics, setIsLoading, setError } = useDashboard();

  // Fetch analytics when component mounts or when date range changes
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const data = await getAnalytics(dateRange.from || undefined, dateRange.to || undefined);
        setMetrics({
          totalTrips: data.totalTrips,
          totalIndents: data.totalIndents,
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch analytics');
      } finally {
        setIsLoading(false);
      }
    };

    if (uploadedFileName) {
      fetchInitialData();
    }
  }, [uploadedFileName, dateRange.from, dateRange.to, setMetrics, setIsLoading, setError]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e27] to-[#08101e] relative">
      <BackgroundRippleEffect />
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {!uploadedFileName && (
          <div className="mb-8">
            <FileUploadNew onClose={() => {}} />
          </div>
        )}

        {uploadedFileName && (
          <>
            <div className="mb-6">
              <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 shadow-lg">
                <p className="text-sm text-green-300">
                  <span className="font-medium">File loaded:</span> {uploadedFileName}
                </p>
              </div>
            </div>
            
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
          </>
        )}
      </main>
    </div>
  );
}

export default App;
