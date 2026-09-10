import { useNplData } from '../context/NplDataContext';
import FilterBar from '../components/npl/FilterBar';
import { LineChart, BarChart, DoughnutChart } from '../components/npl/charts';
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
  fmtPct,
  fmtDays,
  fmtMonth,
  type Column,
} from '../components/npl/ui';
import type { BranchOnTime } from '../services/nplApi';
import { IconClockCheck, IconClockExclamation, IconFileCheck, IconTruckLoading } from '@tabler/icons-react';

const DELAY_COLORS: Record<string, string> = {
  Early: '#059669',
  'On time': '#10b981',
  '1-2 days late': '#f59e0b',
  '3-5 days late': '#f97316',
  '6+ days late': '#ef4444',
};

export default function Deliveries() {
  const s = useSurface();
  const { data, isLoading, isRefreshing, error, refresh } = useNplData();

  if (isLoading) return <LoadingPane />;
  if (error) return <ErrorPane message={error} onRetry={refresh} />;
  if (!data || data.meta.totalRows === 0) return <EmptyPane />;

  const { kpis, onTime, pod } = data;

  const notMeasurable = kpis.shipments - kpis.onTimeMeasurable;

  const branchCols: Column<BranchOnTime>[] = [
    { key: 'branch', header: 'Branch', render: (r) => <span className={s.heading}>{r.branch}</span> },
    { key: 'shipments', header: 'Shipments', align: 'right', render: (r) => fmtInt(r.shipments) },
    { key: 'measurable', header: 'Measurable', align: 'right', render: (r) => fmtInt(r.measurable) },
    { key: 'onTime', header: 'On time', align: 'right', render: (r) => fmtInt(r.onTime) },
    { key: 'late', header: 'Late', align: 'right', render: (r) => fmtInt(r.late) },
    {
      key: 'pct',
      header: 'On time %',
      align: 'right',
      render: (r) => <Pill tone={toneForPct(r.pct)}>{fmtPct(r.pct)}</Pill>,
    },
    {
      key: 'avg',
      header: 'Avg delay',
      align: 'right',
      render: (r) => (
        <span className={r.avgDelayDays > 0 ? 'text-red-500' : 'text-emerald-500'}>
          {r.avgDelayDays > 0 ? '+' : ''}
          {r.avgDelayDays} d
        </span>
      ),
    },
  ];

  return (
    <div className={`min-h-screen ${s.page}`}>
      <div className={`mx-auto max-w-[1600px] px-6 py-6 ${isRefreshing ? 'opacity-70 transition-opacity' : ''}`}>
        <header className="mb-5">
          <h1 className={`text-xl font-semibold ${s.heading}`}>Delivery Performance</h1>
          <p className={`mt-0.5 text-sm ${s.muted}`}>
            Punctuality against the expected delivery date, and proof-of-delivery collection
          </p>
        </header>

        <div className="mb-5">
          <FilterBar />
        </div>

        <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard
            label="On-time rate"
            value={fmtPct(kpis.onTimePct)}
            tone={toneForPct(kpis.onTimePct)}
            hint={`${fmtInt(kpis.onTimeMeasurable)} of ${fmtInt(kpis.shipments)} measurable`}
            icon={<IconClockCheck className="h-4 w-4" />}
          />
          <StatCard
            label="Late deliveries"
            value={fmtInt(kpis.onTimeLate)}
            tone={kpis.onTimeLate > 0 ? 'bad' : 'good'}
            hint={`Avg delay ${kpis.avgDelayDays > 0 ? '+' : ''}${kpis.avgDelayDays} days`}
            icon={<IconClockExclamation className="h-4 w-4" />}
          />
          <StatCard
            label="Avg transit"
            value={fmtDays(kpis.avgTransitDays)}
            hint="Dispatch to delivery"
            icon={<IconTruckLoading className="h-4 w-4" />}
          />
          <StatCard
            label="POD outstanding"
            value={fmtInt(kpis.podOutstandingCount)}
            tone={kpis.podOutstandingCount > 0 ? 'warn' : 'good'}
            hint={`${fmtPct(kpis.podReceivedPct)} received`}
            icon={<IconFileCheck className="h-4 w-4" />}
          />
        </div>

        {notMeasurable > 0 && (
          <p className={`mb-5 rounded-xl border px-4 py-2 text-xs ${s.divider} ${s.muted}`}>
            {fmtInt(notMeasurable)} shipment{notMeasurable === 1 ? '' : 's'} cannot be scored for punctuality —
            the expected or actual delivery date is missing, or the expected date was recorded before the LR date.
            They are excluded from every on-time figure on this page rather than counted as on time.
          </p>
        )}

        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card
            className="xl:col-span-2"
            title="On-time rate by month"
            subtitle="Punctuality trend against shipment volume"
          >
            <LineChart
              labels={onTime.byMonth.map((m) => fmtMonth(m.month))}
              datasets={[
                { label: 'On time %', data: onTime.byMonth.map((m) => m.pct), color: '#10b981', fill: true },
              ]}
              suffix="%"
              height={290}
            />
          </Card>

          <Card title="Delay distribution" subtitle="How far off the expected date deliveries land">
            <DoughnutChart
              labels={onTime.delayDistribution.map((d) => d.bucket)}
              data={onTime.delayDistribution.map((d) => d.count)}
              colors={onTime.delayDistribution.map((d) => DELAY_COLORS[d.bucket] ?? '#6b7280')}
              centerValue={fmtPct(kpis.onTimePct)}
              centerLabel="on time"
              height={290}
            />
          </Card>
        </div>

        <div className="mb-5">
          <Card title="On-time by branch" subtitle="Ranked by shipment volume" bodyClassName="px-0 py-0">
            <DataTable columns={branchCols} rows={onTime.byBranch} keyOf={(r) => r.branch} />
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card title="POD ageing" subtitle="How long outstanding PODs have been pending since delivery">
            <BarChart
              labels={pod.ageing.map((a) => a.bucket)}
              datasets={[
                {
                  label: 'Outstanding',
                  data: pod.ageing.map((a) => a.count),
                  color: ['#10b981', '#f59e0b', '#f97316', '#ef4444'],
                },
              ]}
              height={260}
            />
          </Card>

          <Card
            className="xl:col-span-2"
            title="POD collection by branch"
            subtitle="Received against outstanding paperwork"
            bodyClassName="px-0 py-0"
          >
            <DataTable
              columns={[
                {
                  key: 'branch',
                  header: 'Branch',
                  render: (r: { branch: string }) => <span className={s.heading}>{r.branch}</span>,
                },
                {
                  key: 'shipments',
                  header: 'Shipments',
                  align: 'right',
                  render: (r: { shipments: number }) => fmtInt(r.shipments),
                },
                {
                  key: 'received',
                  header: 'Received',
                  align: 'right',
                  render: (r: { received: number }) => fmtInt(r.received),
                },
                {
                  key: 'outstanding',
                  header: 'Outstanding',
                  align: 'right',
                  render: (r: { outstanding: number }) => (
                    <span className={r.outstanding > 0 ? 'text-amber-500' : ''}>{fmtInt(r.outstanding)}</span>
                  ),
                },
                {
                  key: 'pct',
                  header: 'Collected',
                  align: 'right',
                  render: (r: { pct: number }) => <Pill tone={toneForPct(r.pct)}>{fmtPct(r.pct)}</Pill>,
                },
              ]}
              rows={pod.byBranch}
              keyOf={(r) => r.branch}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
