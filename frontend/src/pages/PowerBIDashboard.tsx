import { useEffect } from 'react';
import CompactHeader from '../components/phase4/CompactHeader';
import RevenueCard from '../components/phase4/RevenueCard';
import CostCard from '../components/phase4/CostCard';
import ProfitLossCard from '../components/phase4/ProfitLossCard';
import RevenueTable from '../components/phase5/RevenueTable';
import CostTable from '../components/phase5/CostTable';
import ProfitLossTable from '../components/phase5/ProfitLossTable';
import RevenueOverTimeChart from '../components/phase5/RevenueOverTimeChart';
import CostOverTimeChart from '../components/phase5/CostOverTimeChart';
import ProfitLossOverTimeChart from '../components/phase5/ProfitLossOverTimeChart';
import RevenueBreakdownChart from '../components/phase5/RevenueBreakdownChart';
import CostBreakdownChart from '../components/phase5/CostBreakdownChart';
import ProfitLossBreakdownChart from '../components/phase5/ProfitLossBreakdownChart';
import MonthSelector from '../components/phase5/MonthSelector';
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
        {/* Month Selector */}
        <MonthSelector />
        
        {/* Revenue, Cost, and Profit & Loss Cards - Three in a row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-6xl mx-auto">
          <RevenueCard />
          <CostCard />
          <ProfitLossCard />
        </div>

        {/* Revenue, Cost, and Profit & Loss Analytics Section */}
        <div className="space-y-6 mt-6">
          {/* Revenue Section */}
          <div className="space-y-6">
            {/* Revenue by Distance Range + Range wise Revenue % */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueTable />
              <RevenueBreakdownChart />
            </div>
            
            {/* Revenue Over Time (only) */}
            <div>
              <RevenueOverTimeChart />
            </div>
          </div>
          
          {/* Cost Section */}
          <div className="space-y-6">
            {/* Cost by Distance Range + Range wise Cost % */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CostTable />
              <CostBreakdownChart />
            </div>
            
            {/* Cost Over Time (only) */}
            <div>
              <CostOverTimeChart />
            </div>
          </div>
          
          {/* Profit & Loss Section */}
          <div className="space-y-6">
            {/* Profit & Loss by Distance Range + Range wise Profit & Loss % */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProfitLossTable />
              <ProfitLossBreakdownChart />
            </div>
            
            {/* Profit & Loss Over Time (only) */}
            <div>
              <ProfitLossOverTimeChart />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
