import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import {
  fetchDashboard,
  fetchFilterOptions,
  type DashboardFilters,
  type DashboardPayload,
  type FilterOptions,
} from '../services/nplApi';
import { defaultPeriod, lastFullMonth } from '../lib/period';

/**
 * Single source of truth for the dashboard.
 *
 * Every page reads from one filtered payload rather than fetching its own
 * slice, so the KPI cards, charts and tables can never disagree about which
 * rows they are describing.
 */

interface NplDataContextValue {
  filters: DashboardFilters;
  setFilter: (key: keyof DashboardFilters, value: string | null) => void;
  setDateRange: (from: string | null, to: string | null) => void;
  resetFilters: () => void;
  activeFilterCount: number;

  data: DashboardPayload | null;
  options: FilterOptions | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => void;
  hasData: boolean;
}

const NplDataContext = createContext<NplDataContextValue | undefined>(undefined);

const NO_FILTERS: DashboardFilters = {
  from: null,
  to: null,
  branch: null,
  vendor: null,
  sku: null,
  loadType: null,
  deliveryStatus: null,
};

/** Opening state: last complete month, nothing else narrowed. */
function initialFilters(): DashboardFilters {
  const p = lastFullMonth();
  return { ...NO_FILTERS, from: p.from, to: p.to };
}

export function NplDataProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters);
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  // Tracks whether the first payload has landed, so filter changes show a
  // subtle refreshing state instead of blanking the whole page.
  const loadedOnce = useRef(false);
  // Guards against an older in-flight response overwriting a newer one.
  const requestId = useRef(0);

  useEffect(() => {
    let cancelled = false;
    fetchFilterOptions()
      .then((o) => {
        if (cancelled) return;
        setOptions(o);

        const preferred = lastFullMonth();
        const actual = defaultPeriod(o.dateRange.to ?? null);
        if (actual.from === preferred.from) return;
        setFilters((prev) =>
          prev.from === preferred.from && prev.to === preferred.to
            ? { ...prev, from: actual.from, to: actual.to }
            : prev
        );
      })
      .catch(() => {
        /* filter bar falls back to whatever the payload contains */
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  useEffect(() => {
    const id = ++requestId.current;

    if (loadedOnce.current) setIsRefreshing(true);
    else setIsLoading(true);

    fetchDashboard(filters)
      .then((payload) => {
        if (id !== requestId.current) return;
        setData(payload);
        setError(null);
        loadedOnce.current = true;
      })
      .catch((e: unknown) => {
        if (id !== requestId.current) return;
        const message =
          e && typeof e === 'object' && 'message' in e ? String((e as Error).message) : 'Request failed';
        setError(message);
      })
      .finally(() => {
        if (id !== requestId.current) return;
        setIsLoading(false);
        setIsRefreshing(false);
      });
  }, [filters, nonce]);

  const setFilter = useCallback((key: keyof DashboardFilters, value: string | null) => {
    setFilters((prev) => ({ ...prev, [key]: value || null }));
  }, []);

  const setDateRange = useCallback((from: string | null, to: string | null) => {
    setFilters((prev) => ({ ...prev, from, to }));
  }, []);

  const resetFilters = useCallback(() => setFilters(initialFilters()), []);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  // The default period is always set, so counting it would make the bar open
  // showing "2 filters" before the user has touched anything.
  const activeFilterCount = useMemo(() => {
    const d = lastFullMonth();
    const isDefaultPeriod = filters.from === d.from && filters.to === d.to;
    return Object.entries(filters).filter(([k, v]) => {
      if (!v) return false;
      if ((k === 'from' || k === 'to') && isDefaultPeriod) return false;
      return true;
    }).length;
  }, [filters]);

  const value: NplDataContextValue = {
    filters,
    setFilter,
    setDateRange,
    resetFilters,
    activeFilterCount,
    data,
    options,
    isLoading,
    isRefreshing,
    error,
    refresh,
    hasData: !!data && data.meta.filteredRows > 0,
  };

  return <NplDataContext.Provider value={value}>{children}</NplDataContext.Provider>;
}

export function useNplData(): NplDataContextValue {
  const ctx = useContext(NplDataContext);
  if (!ctx) throw new Error('useNplData must be used within an NplDataProvider');
  return ctx;
}
