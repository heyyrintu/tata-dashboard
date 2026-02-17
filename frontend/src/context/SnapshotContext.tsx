import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { getDashboardSnapshot, type DashboardSnapshotResponse } from '../services/api';

interface SnapshotContextType {
  snapshot: DashboardSnapshotResponse | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const SnapshotContext = createContext<SnapshotContextType | undefined>(undefined);

export const useSnapshot = () => {
  const context = useContext(SnapshotContext);
  if (!context) {
    throw new Error('useSnapshot must be used within SnapshotProvider');
  }
  return context;
};

export const SnapshotProvider = ({ children }: { children: ReactNode }) => {
  const [snapshot, setSnapshot] = useState<DashboardSnapshotResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getDashboardSnapshot();
      setSnapshot(data);
    } catch (err) {
      console.error('[SnapshotContext] Failed to load dashboard snapshot:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SnapshotContext.Provider value={{ snapshot, isLoading, error, refresh }}>
      {children}
    </SnapshotContext.Provider>
  );
};
