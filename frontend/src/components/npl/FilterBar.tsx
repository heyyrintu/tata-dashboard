import { useNplData } from '../../context/NplDataContext';
import { useSurface, fmtInt } from './ui';
import { exportUrl, type DashboardFilters } from '../../services/nplApi';
import { lastFullMonth, monthOf } from '../../lib/period';
import {
  IconRefresh,
  IconDownload,
  IconFilterOff,
  IconLoader2,
} from '@tabler/icons-react';

/** Quick ranges relative to the newest LR date in the data, not today's date. */
function quickRanges(latest: string | null): { label: string; from: string | null; to: string | null }[] {
  if (!latest) return [{ label: 'All time', from: null, to: null }];
  const end = new Date(`${latest}T00:00:00Z`);
  const back = (days: number) => {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - days + 1);
    return d.toISOString().slice(0, 10);
  };
  const monthStart = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);

  // Last month is the dashboard default, so it leads the list.
  const prev = lastFullMonth();
  const current = monthOf(end);

  return [
    { label: prev.label, from: prev.from, to: prev.to },
    { label: `${current.label} (so far)`, from: monthStart, to: latest },
    { label: 'Last 7 days', from: back(7), to: latest },
    { label: 'Last 30 days', from: back(30), to: latest },
    { label: 'All time', from: null, to: null },
  ];
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: string[];
  onChange: (v: string | null) => void;
}) {
  const s = useSurface();
  if (options.length === 0) return null;
  return (
    <label className="flex flex-col gap-1">
      <span className={`text-[10px] font-semibold uppercase tracking-wide ${s.muted}`}>{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className={`h-9 min-w-[9rem] rounded-lg border px-2 text-sm outline-none focus:border-blue-500 ${s.input}`}
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function FilterBar() {
  const s = useSurface();
  const {
    filters,
    setFilter,
    setDateRange,
    resetFilters,
    activeFilterCount,
    options,
    data,
    isRefreshing,
    refresh,
  } = useNplData();

  const latest = options?.dateRange.to ?? null;
  const ranges = quickRanges(latest);

  const isActiveRange = (r: { from: string | null; to: string | null }) =>
    (filters.from ?? null) === r.from && (filters.to ?? null) === r.to;

  return (
    <div className={`rounded-2xl ${s.card} px-4 py-3`}>
      <div className="flex flex-wrap items-end gap-3">
        {/* quick ranges */}
        <div className="flex flex-col gap-1">
          <span className={`text-[10px] font-semibold uppercase tracking-wide ${s.muted}`}>Period</span>
          <div className="flex flex-wrap gap-1">
            {ranges.map((r) => (
              <button
                key={r.label}
                onClick={() => setDateRange(r.from, r.to)}
                className={`h-9 rounded-lg px-3 text-xs font-medium transition-colors ${
                  isActiveRange(r)
                    ? 'bg-blue-600 text-white'
                    : s.light
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* explicit dates */}
        <label className="flex flex-col gap-1">
          <span className={`text-[10px] font-semibold uppercase tracking-wide ${s.muted}`}>From</span>
          <input
            type="date"
            value={filters.from ?? ''}
            min={options?.dateRange.from ?? undefined}
            max={options?.dateRange.to ?? undefined}
            onChange={(e) => setDateRange(e.target.value || null, filters.to ?? null)}
            className={`h-9 rounded-lg border px-2 text-sm outline-none focus:border-blue-500 ${s.input}`}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={`text-[10px] font-semibold uppercase tracking-wide ${s.muted}`}>To</span>
          <input
            type="date"
            value={filters.to ?? ''}
            min={options?.dateRange.from ?? undefined}
            max={options?.dateRange.to ?? undefined}
            onChange={(e) => setDateRange(filters.from ?? null, e.target.value || null)}
            className={`h-9 rounded-lg border px-2 text-sm outline-none focus:border-blue-500 ${s.input}`}
          />
        </label>

        <Select
          label="Branch"
          value={filters.branch ?? null}
          options={options?.branches ?? []}
          onChange={(v) => setFilter('branch', v)}
        />
        <Select
          label="Vendor"
          value={filters.vendor ?? null}
          options={options?.vendors ?? []}
          onChange={(v) => setFilter('vendor', v)}
        />
        <Select
          label="SKU"
          value={filters.sku ?? null}
          options={options?.skus ?? []}
          onChange={(v) => setFilter('sku', v)}
        />
        <Select
          label="Load"
          value={filters.loadType ?? null}
          options={options?.loadTypes ?? []}
          onChange={(v) => setFilter('loadType', v)}
        />
        <Select
          label="Status"
          value={filters.deliveryStatus ?? null}
          options={options?.deliveryStatuses ?? []}
          onChange={(v) => setFilter('deliveryStatus', v)}
        />

        <div className="ml-auto flex items-end gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              title="Clear all filters"
              className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors ${
                s.light ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <IconFilterOff className="h-4 w-4" />
              Clear ({activeFilterCount})
            </button>
          )}
          <button
            onClick={refresh}
            title="Refetch from the server"
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              s.light ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            {isRefreshing ? (
              <IconLoader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconRefresh className="h-4 w-4" />
            )}
          </button>
          <a
            href={exportUrl(filters as DashboardFilters)}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-medium text-white transition-colors hover:bg-blue-700"
          >
            <IconDownload className="h-4 w-4" />
            Export
          </a>
        </div>
      </div>

      {data && (
        <p className={`mt-3 border-t pt-2 text-xs ${s.divider} ${s.muted}`}>
          Showing <span className="font-semibold">{fmtInt(data.meta.filteredRows)}</span> of{' '}
          {fmtInt(data.meta.totalRows)} shipments
          {data.meta.dateRange && (
            <>
              {' '}
              · {data.meta.dateRange.from} to {data.meta.dateRange.to}
            </>
          )}
        </p>
      )}
    </div>
  );
}
