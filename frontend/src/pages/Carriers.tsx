import { useState } from 'react';
import { useNplData } from '../context/NplDataContext';
import FilterBar from '../components/npl/FilterBar';
import { BarChart, DoughnutChart, PALETTE } from '../components/npl/charts';
import {
  Card,
  StatCard,
  DataTable,
  Pill,
  LoadingPane,
  ErrorPane,
  EmptyPane,
  useSurface,
  toneForPct,
  fmtInt,
  fmtLitres,
  fmtPct,
  fmtDays,
  type Column,
} from '../components/npl/ui';
import type { VendorRow, VehicleRow, LaneRow } from '../services/nplApi';
import { IconBuildingStore, IconTruck, IconRoute, IconArrowBackUp } from '@tabler/icons-react';

type Tab = 'vendors' | 'vehicles' | 'lanes';

export default function Carriers() {
  const s = useSurface();
  const { data, isLoading, isRefreshing, error, refresh, setFilter } = useNplData();
  const [tab, setTab] = useState<Tab>('vendors');

  if (isLoading) return <LoadingPane />;
  if (error) return <ErrorPane message={error} onRetry={refresh} />;
  if (!data || data.meta.totalRows === 0) return <EmptyPane />;

  const { kpis, vendors, vehicles, lanes, trips } = data;

  // Only rank vendors that carried enough to be worth judging.
  const RANKABLE_MIN = 5;
  const rankable = vendors.filter((v) => v.measurable >= RANKABLE_MIN);
  const best = [...rankable].sort((a, b) => b.onTimePct - a.onTimePct)[0];
  const worst = [...rankable].sort((a, b) => a.onTimePct - b.onTimePct)[0];
  const totalReturns = vendors.reduce((a, v) => a + v.returns, 0);

  const vendorCols: Column<VendorRow>[] = [
    {
      key: 'vendor',
      header: 'Vendor',
      render: (r) => (
        <button
          onClick={() => setFilter('vendor', r.vendor)}
          className="text-left font-medium text-brand-600 hover:underline"
          title="Filter the whole dashboard by this vendor"
        >
          {r.vendor}
        </button>
      ),
    },
    { key: 'shipments', header: 'Shipments', align: 'right', render: (r) => fmtInt(r.shipments) },
    { key: 'litres', header: 'Volume', align: 'right', render: (r) => fmtLitres(r.litres) },
    { key: 'vehicles', header: 'Vehicles', align: 'right', render: (r) => fmtInt(r.vehicles) },
    {
      key: 'onTime',
      header: 'On time',
      align: 'right',
      render: (r) =>
        r.measurable >= RANKABLE_MIN ? (
          <Pill tone={toneForPct(r.onTimePct)}>{fmtPct(r.onTimePct)}</Pill>
        ) : (
          <span className={s.muted} title={`Only ${r.measurable} measurable shipments`}>
            {fmtPct(r.onTimePct)}*
          </span>
        ),
    },
    {
      key: 'avgDelay',
      header: 'Avg delay',
      align: 'right',
      render: (r) => (
        <span className={r.avgDelayDays > 0 ? 'text-red-500' : 'text-emerald-500'}>
          {r.avgDelayDays > 0 ? '+' : ''}
          {r.avgDelayDays} d
        </span>
      ),
    },
    { key: 'transit', header: 'Avg transit', align: 'right', render: (r) => fmtDays(r.avgTransitDays) },
    {
      key: 'pod',
      header: 'POD',
      align: 'right',
      render: (r) => <Pill tone={toneForPct(r.podPct)}>{fmtPct(r.podPct)}</Pill>,
    },
    {
      key: 'returns',
      header: 'Returns',
      align: 'right',
      render: (r) => <span className={r.returns > 0 ? 'text-red-500' : s.muted}>{fmtInt(r.returns)}</span>,
    },
    {
      key: 'branches',
      header: 'Branches',
      render: (r) => <span className={s.muted}>{r.branches.join(', ') || '—'}</span>,
    },
  ];

  const vehicleCols: Column<VehicleRow>[] = [
    { key: 'vehicle', header: 'Vehicle', render: (r) => <span className={`font-mono ${s.heading}`}>{r.vehicleNumber}</span> },
    { key: 'trips', header: 'Trips', align: 'right', render: (r) => fmtInt(r.trips) },
    { key: 'litres', header: 'Volume', align: 'right', render: (r) => fmtLitres(r.litres) },
    {
      key: 'onTime',
      header: 'On time',
      align: 'right',
      render: (r) => <Pill tone={toneForPct(r.onTimePct)}>{fmtPct(r.onTimePct)}</Pill>,
    },
    { key: 'transit', header: 'Avg transit', align: 'right', render: (r) => fmtDays(r.avgTransitDays) },
    { key: 'vendor', header: 'Vendor', render: (r) => <span className={s.subtle}>{r.vendor ?? '—'}</span> },
    {
      key: 'branches',
      header: 'Branches',
      render: (r) => <span className={s.muted}>{r.branches.join(', ') || '—'}</span>,
    },
  ];

  const laneCols: Column<LaneRow>[] = [
    { key: 'lane', header: 'Lane', render: (r) => <span className={s.heading}>{r.lane}</span> },
    { key: 'shipments', header: 'Shipments', align: 'right', render: (r) => fmtInt(r.shipments) },
    { key: 'litres', header: 'Volume', align: 'right', render: (r) => fmtLitres(r.litres) },
    {
      key: 'onTime',
      header: 'On time',
      align: 'right',
      render: (r) =>
        r.measurable > 0 ? (
          <Pill tone={toneForPct(r.onTimePct)}>{fmtPct(r.onTimePct)}</Pill>
        ) : (
          <span className={s.muted}>—</span>
        ),
    },
    { key: 'transit', header: 'Avg transit', align: 'right', render: (r) => fmtDays(r.avgTransitDays) },
  ];

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'vendors', label: 'Vendors', count: vendors.length },
    { id: 'vehicles', label: 'Vehicles', count: vehicles.length },
    { id: 'lanes', label: 'Lanes', count: lanes.length },
  ];

  const topVendors = vendors.slice(0, 10);

  return (
    <div className={`min-h-screen ${s.page}`}>
      <div className={`mx-auto max-w-[1600px] px-6 py-6 ${isRefreshing ? 'opacity-70 transition-opacity' : ''}`}>
        <header className="mb-5">
          <h1 className={`text-xl font-semibold ${s.heading}`}>Carriers &amp; Lanes</h1>
          <p className={`mt-0.5 text-sm ${s.muted}`}>
            Carrier scorecards, vehicle utilisation and route performance. Carriers are shown under
            stable reference codes rather than trading names.
          </p>
        </header>

        <div className="mb-5">
          <FilterBar />
        </div>

        <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard
            label="Vendors"
            value={fmtInt(kpis.vendorCount)}
            hint={`${fmtInt(kpis.vehicleCount)} distinct vehicles`}
            icon={<IconBuildingStore className="h-4 w-4" />}
          />
          <StatCard
            label="Best on-time"
            value={best ? fmtPct(best.onTimePct) : '—'}
            tone="good"
            hint={best ? best.vendor : `No vendor has ${RANKABLE_MIN}+ measurable shipments`}
            icon={<IconTruck className="h-4 w-4" />}
          />
          <StatCard
            label="Worst on-time"
            value={worst ? fmtPct(worst.onTimePct) : '—'}
            tone={worst ? toneForPct(worst.onTimePct) : 'default'}
            hint={worst ? worst.vendor : `No vendor has ${RANKABLE_MIN}+ measurable shipments`}
            icon={<IconRoute className="h-4 w-4" />}
          />
          <StatCard
            label="Returns / refusals"
            value={fmtInt(totalReturns)}
            tone={totalReturns > 0 ? 'bad' : 'good'}
            hint="Across all vendors"
            icon={<IconArrowBackUp className="h-4 w-4" />}
          />
        </div>

        {/* how well loaded the trucks actually left */}
        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card
            title="Trip utilisation"
            subtitle={`${fmtInt(trips.total)} dispatch trips — one vehicle leaving on one day`}
          >
            <DoughnutChart
              labels={trips.mix.map((m) => m.bucket)}
              data={trips.mix.map((m) => m.trips)}
              colors={['#10b981', '#ef4444', PALETTE[0]]}
              height={260}
              centerLabel="Avg fill"
              centerValue={fmtPct(trips.avgFillPct)}
            />
          </Card>

          <Card title="Vehicle fill" subtitle={`Against a practical payload of ${fmtInt(trips.capacityLtr)} L`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={`text-2xl font-semibold tabular-nums ${s.heading}`}>
                  {trips.avgLitresPerTrip === null ? '—' : `${fmtInt(trips.avgLitresPerTrip)} L`}
                </p>
                <p className={`mt-0.5 text-[11px] font-semibold uppercase tracking-wide ${s.muted}`}>
                  Avg litres per trip
                </p>
              </div>
              <div>
                <p className={`text-2xl font-semibold tabular-nums ${s.heading}`}>
                  {fmtInt(trips.avgShipmentsPerTrip)}
                </p>
                <p className={`mt-0.5 text-[11px] font-semibold uppercase tracking-wide ${s.muted}`}>
                  Avg drops per trip
                </p>
              </div>
            </div>
            <div className="mt-4">
              <BarChart
                labels={trips.mix.map((m) => m.bucket)}
                datasets={[
                  {
                    label: 'Trips',
                    data: trips.mix.map((m) => m.trips),
                    color: ['#10b981', '#ef4444', PALETTE[0]],
                  },
                ]}
                horizontal
                height={170}
              />
            </div>
            <p className={`mt-3 text-xs ${s.subtle}`}>
              Under-filled trips mean a vehicle left with spare capacity while other orders were still
              waiting for consolidation — the cost of reactive rather than scheduled route planning.
              {trips.unassignedShipments > 0 && (
                <>
                  {' '}
                  {fmtInt(trips.unassignedShipments)} dispatched shipment
                  {trips.unassignedShipments === 1 ? ' has' : 's have'} no vehicle recorded and are
                  excluded from these figures.
                </>
              )}
            </p>
          </Card>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card title="Vendor volume" subtitle="Top 10 by shipment count">
            <BarChart
              labels={topVendors.map((v) => v.vendor)}
              datasets={[{ label: 'Shipments', data: topVendors.map((v) => v.shipments), color: '#3b82f6' }]}
              horizontal
              height={320}
            />
          </Card>
          <Card title="Vendor punctuality" subtitle={`On-time %, vendors with ${RANKABLE_MIN}+ measurable shipments`}>
            <BarChart
              labels={rankable.slice(0, 10).map((v) => v.vendor)}
              datasets={[
                {
                  label: 'On time %',
                  data: rankable.slice(0, 10).map((v) => v.onTimePct),
                  color: rankable
                    .slice(0, 10)
                    .map((v) => (v.onTimePct >= 90 ? '#10b981' : v.onTimePct >= 75 ? '#f59e0b' : '#ef4444')),
                },
              ]}
              horizontal
              suffix="%"
              max={100}
              height={320}
            />
          </Card>
        </div>

        <Card bodyClassName="px-0 py-0">
          <div className={`flex items-center gap-1 border-b px-4 pt-3 ${s.divider}`}>
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? 'border-b-2 border-brand-600 text-brand-600'
                    : `${s.muted} hover:${s.heading}`
                }`}
              >
                {t.label}{' '}
                <span className={`ml-1 text-xs ${s.muted}`}>{t.count}</span>
              </button>
            ))}
          </div>

          {tab === 'vendors' && (
            <>
              <DataTable columns={vendorCols} rows={vendors} keyOf={(r) => r.vendor} />
              {vendors.some((v) => v.measurable < RANKABLE_MIN) && (
                <p className={`px-4 py-3 text-xs ${s.muted}`}>
                  * On-time % shown without a rating badge where fewer than {RANKABLE_MIN} shipments could be
                  measured — too small a sample to rank fairly.
                </p>
              )}
            </>
          )}
          {tab === 'vehicles' && (
            <DataTable columns={vehicleCols} rows={vehicles} keyOf={(r) => r.vehicleNumber} />
          )}
          {tab === 'lanes' && <DataTable columns={laneCols} rows={lanes} keyOf={(r) => r.lane} />}
        </Card>
      </div>
    </div>
  );
}
