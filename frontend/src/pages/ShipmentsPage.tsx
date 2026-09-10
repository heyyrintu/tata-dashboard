import { useEffect, useMemo, useState } from 'react';
import { useNplData } from '../context/NplDataContext';
import FilterBar from '../components/npl/FilterBar';
import {
  Card,
  Pill,
  LoadingPane,
  ErrorPane,
  useSurface,
  statusTone,
  fmtInt,
  fmtLitres,
  fmtDate,
} from '../components/npl/ui';
import { fetchShipments, type Shipment, type ShipmentPage } from '../services/nplApi';
import {
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconArrowUp,
  IconArrowDown,
  IconLoader2,
  IconFlag,
} from '@tabler/icons-react';

const COLUMNS: { key: string; label: string; sortable: boolean; align?: 'right' }[] = [
  { key: 'lrDate', label: 'LR Date', sortable: true },
  { key: 'lrNo', label: 'LR No', sortable: true },
  { key: 'branch', label: 'Branch', sortable: true },
  { key: 'partyName', label: 'Party', sortable: true },
  { key: 'destination', label: 'Destination', sortable: true },
  { key: 'materialSku', label: 'SKU', sortable: false },
  { key: 'buckets', label: 'Buckets', sortable: true, align: 'right' },
  { key: 'totalQuantityLtr', label: 'Volume', sortable: true, align: 'right' },
  { key: 'loadType', label: 'Load', sortable: false },
  { key: 'expectedDeliveryDate', label: 'Expected', sortable: false },
  { key: 'actualDeliveryDate', label: 'Actual', sortable: false },
  { key: 'delayDays', label: 'Delay', sortable: true, align: 'right' },
  { key: 'deliveryStatus', label: 'Status', sortable: true },
  { key: 'podStatus', label: 'POD', sortable: true },
  { key: 'vendorName', label: 'Vendor', sortable: true },
  { key: 'vehicleNumber', label: 'Vehicle', sortable: true },
];

export default function ShipmentsPage() {
  const s = useSurface();
  const { filters } = useNplData();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [sortBy, setSortBy] = useState('lrDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [result, setResult] = useState<ShipmentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Any change to the filters or the query resets to the first page.
  useEffect(() => {
    setPage(1);
  }, [filters, debounced, pageSize, sortBy, sortDir]);

  const query = useMemo(
    () => ({ ...filters, page, pageSize, search: debounced || null, sortBy, sortDir }),
    [filters, page, pageSize, debounced, sortBy, sortDir]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchShipments(query)
      .then((r) => {
        if (!cancelled) {
          setResult(r);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Request failed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const toggleSort = (key: string) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  if (loading && !result) return <LoadingPane label="Loading shipments…" />;
  if (error && !result) return <ErrorPane message={error} />;

  const rows: Shipment[] = result?.rows ?? [];

  return (
    <div className={`min-h-screen ${s.page}`}>
      <div className="mx-auto max-w-[1600px] px-6 py-6">
        <header className="mb-5">
          <h1 className={`text-xl font-semibold ${s.heading}`}>Shipments</h1>
          <p className={`mt-0.5 text-sm ${s.muted}`}>Every LR behind the charts, searchable and sortable</p>
        </header>

        <div className="mb-5">
          <FilterBar />
        </div>

        <Card bodyClassName="px-0 py-0">
          <div className={`flex flex-wrap items-center gap-3 border-b px-4 py-3 ${s.divider}`}>
            <div className="relative flex-1 min-w-[16rem]">
              <IconSearch className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${s.muted}`} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search party, destination, LR, invoice, vehicle or vendor…"
                className={`h-9 w-full rounded-lg border pl-9 pr-3 text-sm outline-none focus:border-brand-600 ${s.input}`}
              />
            </div>

            <label className={`flex items-center gap-2 text-xs ${s.muted}`}>
              Rows
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className={`h-9 rounded-lg border px-2 text-sm outline-none focus:border-brand-600 ${s.input}`}
              >
                {[25, 50, 100, 200].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>

            <span className={`text-xs ${s.muted}`}>
              {loading ? (
                <IconLoader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {fmtInt(result?.total ?? 0)} result{(result?.total ?? 0) === 1 ? '' : 's'}
                </>
              )}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className={`${s.headRow} text-left`}>
                  {COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      onClick={c.sortable ? () => toggleSort(c.key) : undefined}
                      className={`whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
                        c.align === 'right' ? 'text-right' : 'text-left'
                      } ${c.sortable ? 'cursor-pointer select-none hover:text-brand-600' : ''}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {c.label}
                        {sortBy === c.key &&
                          (sortDir === 'asc' ? (
                            <IconArrowUp className="h-3 w-3" />
                          ) : (
                            <IconArrowDown className="h-3 w-3" />
                          ))}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className={`px-3 py-10 text-center text-sm ${s.muted}`}>
                      No shipments match this selection.
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className={`border-t ${s.divider} ${s.rowHover}`}>
                    <td className="whitespace-nowrap px-3 py-2">{fmtDate(r.lrDate)}</td>
                    <td className={`whitespace-nowrap px-3 py-2 font-mono text-xs ${s.subtle}`}>
                      <span className="inline-flex items-center gap-1">
                        {r.lrNo ?? '—'}
                        {r.dataFlags && (
                          <IconFlag
                            className="h-3 w-3 text-amber-500"
                            title={`Data issues: ${r.dataFlags.split(',').join(', ')}`}
                          />
                        )}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">{r.branch ?? '—'}</td>
                    <td className="max-w-[16rem] truncate px-3 py-2" title={r.partyName ?? ''}>
                      {r.partyName ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">{r.destination ?? '—'}</td>
                    <td className="whitespace-nowrap px-3 py-2">{r.materialSku ?? '—'}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{fmtInt(r.buckets)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {fmtLitres(r.totalQuantityLtr)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">{r.loadType ?? '—'}</td>
                    <td className="whitespace-nowrap px-3 py-2">{fmtDate(r.expectedDeliveryDate)}</td>
                    <td className="whitespace-nowrap px-3 py-2">{fmtDate(r.actualDeliveryDate)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {r.delayDays === null || r.delayDays === undefined ? (
                        <span className={s.muted}>—</span>
                      ) : (
                        <span className={r.delayDays > 0 ? 'text-red-500' : 'text-emerald-500'}>
                          {r.delayDays > 0 ? `+${r.delayDays}` : r.delayDays} d
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {r.deliveryStatus ? (
                        <Pill tone={statusTone(r.deliveryStatus)}>{r.deliveryStatus}</Pill>
                      ) : (
                        <span className={s.muted}>—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {r.podStatus ? (
                        <Pill tone={statusTone(r.podStatus)}>{r.podStatus}</Pill>
                      ) : (
                        <span className={s.muted}>—</span>
                      )}
                    </td>
                    <td className="max-w-[12rem] truncate px-3 py-2" title={r.vendorName ?? ''}>
                      {r.vendorName ?? '—'}
                    </td>
                    <td className={`whitespace-nowrap px-3 py-2 font-mono text-xs ${s.subtle}`}>
                      {r.vehicleNumber ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result && result.pageCount > 1 && (
            <div className={`flex items-center justify-between border-t px-4 py-3 ${s.divider}`}>
              <span className={`text-xs ${s.muted}`}>
                Page {result.page} of {result.pageCount}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={`flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    s.light ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <IconChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  disabled={page >= result.pageCount}
                  onClick={() => setPage((p) => Math.min(result.pageCount, p + 1))}
                  className={`flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    s.light ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  Next
                  <IconChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
