import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface DashboardContextType {
  uploadedFileName: string | null;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  metrics: {
    totalIndents: number;
    totalIndentsUnique: number;
  };
  isLoading: boolean;
  error: string | null;
  setUploadedFileName: (fileName: string | null) => void;
  setDateRange: (from: Date | null, to: Date | null) => void;
  setMetrics: (metrics: { totalIndents: number; totalIndentsUnique: number }) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
};

interface DashboardProviderProps {
  children: ReactNode;
}

// Initialize date range to current month so data hooks fire correctly on first render
function getCurrentMonthRange() {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
  };
}

export const DashboardProvider = ({ children }: DashboardProviderProps) => {
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [dateRange, setDateRangeState] = useState<{ from: Date | null; to: Date | null }>(
    getCurrentMonthRange
  );
  const [metrics, setMetrics] = useState({ totalIndents: 0, totalIndentsUnique: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setDateRange = (from: Date | null, to: Date | null) => {
    setDateRangeState({ from, to });
  };

  const value: DashboardContextType = {
    uploadedFileName,
    dateRange,
    metrics,
    isLoading,
    error,
    setUploadedFileName,
    setDateRange,
    setMetrics,
    setIsLoading,
    setError,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

