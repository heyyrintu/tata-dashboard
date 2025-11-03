import { useEffect } from 'react';
import CompactHeader from '../components/phase4/CompactHeader';
import KPICardsRow from '../components/phase4/KPICardsRow';
import RangeDonutChart from '../components/phase4/RangeDonutChart';
import FulfillmentDonutChart from '../components/phase4/FulfillmentDonutChart';
import LoadBarChart from '../components/phase4/LoadBarChart';
import CompactRangeTable from '../components/phase4/CompactRangeTable';
import CompactFulfillmentTable from '../components/phase4/CompactFulfillmentTable';
import TopLocationsTable from '../components/phase4/TopLocationsTable';
import KPILoadTrendChart from '../components/phase4/KPILoadTrendChart';
import KPIFulfillmentTrendChart from '../components/phase4/KPIFulfillmentTrendChart';
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
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="mb-8">
          <KPICardsRow />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <RangeDonutChart />
          <FulfillmentDonutChart />
          <LoadBarChart />
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <CompactRangeTable />
          <CompactFulfillmentTable />
          <TopLocationsTable />
        </div>

        {/* Trend Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <KPILoadTrendChart />
          <KPIFulfillmentTrendChart />
        </div>
      </div>
    </div>
  );
}
