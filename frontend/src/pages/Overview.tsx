import { useNplData } from '../context/NplDataContext';
import FilterBar from '../components/npl/FilterBar';
import { Scorecard, ShipmentFlow } from '../components/npl/mis';
import { LineChart, BarChart, DoughnutChart, colorFor, PALETTE } from '../components/npl/charts';
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
  statusTone,
  fmtInt,
  fmtLitres,
  fmtPct,
  fmtDays,
  fmtMonth,
  type Column,
} from '../components/npl/ui';
import type { BranchVolume } from '../services/nplApi';
import {
  IconTruckDelivery,
  IconDroplet,
  IconClockCheck,
  IconFileCheck,
  IconAlertTriangle,
  IconBuildingWarehouse,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';

export default function Overview() {
  const s = useSurface();
  const { data, isLoading, isRefreshing, error, refresh } = useNplData();

  if (isLoading) return <LoadingPane />;
  if (error) return <ErrorPane message={error} onRetry={refresh} />;
  if (!data) return <EmptyPane />;

  const { kpis, volume, deliveryStatus, onTime, pod, dataQuality, flow, scorecard, businessUnit, dropSize } = data;

  if (data.meta.totalRows === 0) {
    return (
      <EmptyPane
        action={
          <Link
            to="/upload"
            className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Go to upload
          </Link>
        }
      />
    );
  }

  // Daily volume is noisy at this data size; the monthly view is the honest
  // default once there is more than one month to compare.
  const useMonthly = volume.byMonth.length > 1;
  const trendLabels = useMonthly ? volume.byMonth.map((m) => fmtMonth(m.month)) : volume.byDay.map((d) => d.date);
  const trendLitres = useMonthly ? volume.byMonth.map((m) => m.litres) : volume.byDay.map((d) => d.litres);
  const trendShipments = useMonthly
    ? volume.byMonth.map((m) => m.shipments)
    : volume.byDay.map((d) => d.shipments);

  const branchColumns: Column<BranchVolume>[] = [
    { key: 'branch', header: 'Branch', render: (r) => <span className={s.heading}>{r.branch}</span> },
    { key: 'shipments', header: 'Shipments', align: 'right', render: (r) => fmtInt(r.shipments) },
    { key: 'litres', header: 'Volume', align: 'right', render: (r) => fmtLitres(r.litres) },
    { key: 'buckets', header: 'Buckets', align: 'right', render: (r) => fmtInt(r.buckets) },
    {
      key: 'onTime',
      header: 'On time',
      align: 'right',
      render: (r) => <Pill tone={toneForPct(r.onTimePct)}>{fmtPct(r.onTimePct)}</Pill>,
    },
    {
      key: 'pod',
      header: 'POD',
      align: 'right',
      render: (r) => <Pill tone={toneForPct(r.podPct)}>{fmtPct(r.podPct)}</Pill>,
    },
    { key: 'transit', header: 'Avg transit', align: 'right', render: (r) => fmtDays(r.avgTransitDays) },
  ];

  return (
    <div className={`min-h-screen ${s.page}`}>
      <div className={`mx-auto max-w-[1600px] px-6 py-6 ${isRefreshing ? 'opacity-70 transition-opacity' : ''}`}>
        <header className="mb-5">
          <h1 className={`text-xl font-semibold ${s.heading}`}>NPL DEF · Delivery Operations</h1>
          <p className={`mt-0.5 text-sm ${s.muted}`}>
            Dispatch, delivery and POD performance across {kpis.branchCount} branches
          </p>
        </header>

        <div className="mb-5">
          <FilterBar />
        </div>

        {dataQuality.length > 0 && (
          <Link
            to="/data-quality"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 transition-colors hover:bg-amber-500/15"
          >
            <IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                {dataQuality.reduce((a, d) => a + d.count, 0)} rows have data-quality issues in the source sheet
              </p>
              <p className={`mt-0.5 truncate text-xs ${s.muted}`}>
                {dataQuality.map((d) => `${d.count} × ${d.label.toLowerCase()}`).join(' · ')}
              </p>
            </div>
          </Link>
        )}

        {/* KPI row */}
        <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <StatCard
            label="Shipments"
            value={fmtInt(kpis.shipments)}
            hint={`${fmtInt(kpis.destinationCount)} destinations`}
            icon={<IconTruckDelivery className="h-4 w-4" />}
          />
          <StatCard
            label="Volume"
            value={fmtLitres(kpis.litres)}
            hint={`${fmtInt(kpis.buckets)} buckets`}
            icon={<IconDroplet className="h-4 w-4" />}
          />
          <StatCard
            label="On time"
            value={fmtPct(kpis.onTimePct)}
            tone={toneForPct(kpis.onTimePct)}
            hint={`${fmtInt(kpis.onTimeMeasurable)} measurable · ${fmtInt(kpis.onTimeLate)} late`}
            icon={<IconClockCheck className="h-4 w-4" />}
          />
          <StatCard
            label="POD received"
            value={fmtPct(kpis.podReceivedPct)}
            tone={toneForPct(kpis.podReceivedPct)}
            hint={`${fmtInt(kpis.podOutstandingCount)} outstanding`}
            icon={<IconFileCheck className="h-4 w-4" />}
          />
          <StatCard
            label="Delivered"
            value={fmtPct(kpis.deliveredPct)}
            tone={toneForPct(kpis.deliveredPct)}
            hint={`${fmtInt(kpis.inTransitCount)} in transit · ${fmtInt(kpis.pendingCount)} pending`}
            icon={<IconBuildingWarehouse className="h-4 w-4" />}
          />
          <StatCard
            label="Returned / refused"
            value={fmtInt(kpis.returnedCount)}
            tone={kpis.returnedCount > 0 ? 'bad' : 'good'}
            hint={`${fmtPct(kpis.returnedPct)} of shipments`}
            icon={<IconAlertTriangle className="h-4 w-4" />}
          />
        </div>

        {/* executive layer: how the month scored and where orders stalled */}
        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ShipmentFlow flow={flow} />
          <Scorecard rows={scorecard} />
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card
            title="Business unit mix"
            subtitle="Share of shipments against share of volume — derived from the material description"
          >
            <BarChart
              labels={businessUnit.map((b) => b.bu)}
              datasets={[
                { label: '% of shipments', data: businessUnit.map((b) => b.pctShipments), color: PALETTE[0] },
                { label: '% of volume', data: businessUnit.map((b) => b.pctLitres), color: PALETTE[3] },
              ]}
              showLegend
              height={260}
              suffix="%"
            />
            <p className={`mt-3 text-xs ${s.subtle}`}>
              A unit that leads on shipment count but trails on volume is moving small packs; the
              reverse means bulk. The two need different vehicle plans.
            </p>
          </Card>

          <Card
            title="Drop-size economics"
            subtitle="Many small drops against a few large loads"
          >
            <BarChart
              labels={dropSize.map((d) => d.bucket)}
              datasets={[
                { label: '% of shipments', data: dropSize.map((d) => d.pctShipments), color: PALETTE[0] },
                { label: '% of volume', data: dropSize.map((d) => d.pctLitres), color: PALETTE[3] },
              ]}
              showLegend
              height={260}
              suffix="%"
            />
            <p className={`mt-3 text-xs ${s.subtle}`}>
              The small-drop tail consumes trips without carrying volume — the case for fixed milk-run
              days or a minimum-order rule. Bulk lanes justify scheduled full loads.
            </p>
          </Card>
        </div>

        {/* trend + status */}
        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card
            className="xl:col-span-2"
            title={useMonthly ? 'Volume by month' : 'Volume by day'}
            subtitle="Litres dispatched against shipment count"
          >
            <LineChart
              labels={trendLabels}
              datasets={[
                { label: 'Litres', data: trendLitres, color: '#3b82f6', fill: true },
                { label: 'Shipments', data: trendShipments, color: '#10b981', yAxisID: 'y' },
              ]}
              height={300}
            />
          </Card>

          <Card title="Delivery status" subtitle="Where every shipment currently stands">
            <DoughnutChart
              labels={deliveryStatus.map((d) => d.status)}
              data={deliveryStatus.map((d) => d.count)}
              centerValue={fmtInt(kpis.shipments)}
              centerLabel="shipments"
              height={300}
            />
          </Card>
        </div>

        {/* branch table + sku */}
        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card
            className="xl:col-span-2"
            title="Branch performance"
            subtitle="Volume, punctuality and paperwork by origin"
            bodyClassName="px-0 py-0"
          >
            <DataTable columns={branchColumns} rows={volume.byBranch} keyOf={(r) => r.branch} />
          </Card>

          <Card title="Product mix" subtitle="Volume by pack size">
            <DoughnutChart
              labels={volume.bySku.map((s2) => s2.sku)}
              data={volume.bySku.map((s2) => s2.litres)}
              suffix=" L"
              height={300}
            />
          </Card>
        </div>

        {/* secondary row */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card title="On-time by branch" subtitle="Share of measurable shipments delivered by the expected date">
            <BarChart
              labels={onTime.byBranch.map((b) => b.branch)}
              datasets={[
                {
                  label: 'On time %',
                  data: onTime.byBranch.map((b) => b.pct),
                  color: onTime.byBranch.map((b) =>
                    b.pct >= 90 ? '#10b981' : b.pct >= 75 ? '#f59e0b' : '#ef4444'
                  ),
                },
              ]}
              horizontal
              suffix="%"
              max={100}
              height={260}
            />
          </Card>

          <Card title="POD status" subtitle="Proof-of-delivery collection">
            <DoughnutChart
              labels={pod.byStatus.map((p) => p.status)}
              data={pod.byStatus.map((p) => p.count)}
              centerValue={fmtPct(kpis.podReceivedPct)}
              centerLabel="received"
              height={260}
            />
          </Card>

          <Card title="Top destinations" subtitle="By volume delivered" bodyClassName="px-0 py-0">
            <DataTable
              maxHeight="260px"
              columns={[
                {
                  key: 'destination',
                  header: 'Destination',
                  render: (r: { destination: string }) => <span className={s.heading}>{r.destination}</span>,
                },
                {
                  key: 'shipments',
                  header: 'Shipments',
                  align: 'right',
                  render: (r: { shipments: number }) => fmtInt(r.shipments),
                },
                {
                  key: 'litres',
                  header: 'Volume',
                  align: 'right',
                  render: (r: { litres: number }) => fmtLitres(r.litres),
                },
              ]}
              rows={volume.topDestinations}
              keyOf={(r) => r.destination}
            />
          </Card>
        </div>

        {/* load type strip */}
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card title="Load type" subtitle="Full vs part truck load">
            <div className="flex flex-col gap-3">
              {volume.byLoadType.map((l, i) => (
                <div key={l.loadType}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className={s.subtle}>{l.loadType}</span>
                    <span className={`tabular-nums ${s.muted}`}>
                      {fmtInt(l.shipments)} · {fmtPct(l.pct)}
                    </span>
                  </div>
                  <div className={`h-2 overflow-hidden rounded-full ${s.light ? 'bg-gray-200' : 'bg-white/10'}`}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${l.pct}%`, background: colorFor(l.loadType, i) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card
            className="xl:col-span-2"
            title="Top customers"
            subtitle="By volume delivered"
            bodyClassName="px-0 py-0"
          >
            <DataTable
              maxHeight="240px"
              columns={[
                {
                  key: 'party',
                  header: 'Party',
                  render: (r: { party: string }) => <span className={s.heading}>{r.party}</span>,
                },
                {
                  key: 'shipments',
                  header: 'Shipments',
                  align: 'right',
                  render: (r: { shipments: number }) => fmtInt(r.shipments),
                },
                {
                  key: 'litres',
                  header: 'Volume',
                  align: 'right',
                  render: (r: { litres: number }) => fmtLitres(r.litres),
                },
                {
                  key: 'onTime',
                  header: 'On time',
                  align: 'right',
                  render: (r: { onTimePct: number }) => (
                    <Pill tone={toneForPct(r.onTimePct)}>{fmtPct(r.onTimePct)}</Pill>
                  ),
                },
              ]}
              rows={volume.topParties}
              keyOf={(r) => r.party}
            />
          </Card>
        </div>

        {/* status legend strip for quick scanning */}
        <div className="mt-5 flex flex-wrap gap-2">
          {deliveryStatus.map((d) => (
            <Pill key={d.status} tone={statusTone(d.status)}>
              {d.status}: {fmtInt(d.count)} ({fmtPct(d.pct)})
            </Pill>
          ))}
        </div>
      </div>
    </div>
  );
}
