import { useEffect } from 'react';
import CompactHeader from '../components/phase4/CompactHeader';
import RevenueCard from '../components/phase4/RevenueCard';
import RevenueTable from '../components/phase5/RevenueTable';
import RevenueOverTimeChart from '../components/phase5/RevenueOverTimeChart';
import RevenueBreakdownChart from '../components/phase5/RevenueBreakdownChart';
import { BackgroundBeams } from '../components/ui/background-beams';
import { useTheme } from '../context/ThemeContext';

export default function PowerBIDashboard() {
  const { theme } = useTheme();

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
        {/* Revenue Card */}
        <div className="max-w-md mx-auto mb-8">
          <RevenueCard />
        </div>

        {/* Revenue Analytics Section */}
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
      </main>
    </div>
  );
}
