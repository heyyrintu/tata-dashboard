import { useEffect } from 'react';
import CompactHeader from '../components/phase4/CompactHeader';
import RevenueCard from '../components/phase4/RevenueCard';
import CostCard from '../components/phase4/CostCard';
import ProfitLossCard from '../components/phase4/ProfitLossCard';
import ProfitLossPercentageCard from '../components/phase4/ProfitLossPercentageCard';
import CombinedFinanceTable from '../components/phase5/CombinedFinanceTable';
import VehicleCostTable from '../components/phase5/VehicleCostTable';
import MonthlyActualKmChart from '../components/phase5/MonthlyActualKmChart';
import MonthlyExtraVehicleCostChart from '../components/phase5/MonthlyExtraVehicleCostChart';
import RevenueCostOverTimeChart from '../components/phase5/RevenueCostOverTimeChart';
import ProfitLossOverTimeChart from '../components/phase5/ProfitLossOverTimeChart';
import ProfitLossPercentageOverTimeChart from '../components/phase5/ProfitLossPercentageOverTimeChart';
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
        {/* Revenue, Cost, Profit & Loss, Profit & Loss % Cards - Four in a row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 max-w-7xl mx-auto">
          <RevenueCard />
          <CostCard />
          <ProfitLossCard />
          <ProfitLossPercentageCard />
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
