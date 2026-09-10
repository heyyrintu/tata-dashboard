import { useNplData } from '../context/NplDataContext';
import FilterBar from '../components/npl/FilterBar';
import { LineChart, BarChart, PALETTE } from '../components/npl/charts';
import {
  Card,
  StatCard,
  LoadingPane,
  ErrorPane,
  EmptyPane,
  useSurface,
  toneForPct,
  fmtInt,
  fmtPct,
  fmtDays,
  fmtDate,
} from '../components/npl/ui';
import {
  IconTruckDelivery,
  IconInbox,
  IconStack2,
  IconClockHour4,
} from '@tabler/icons-react';

/**
 * Throughput: how work arrives, how it leaves, and the queue that builds
 * between the two. This is the section that explains why TAT is what it is -
 * on-time rate moves with intake, not with driving speed.
 */
export default function Throughput() {
  const s = useSurface();
  const { data, isLoading, isRefreshing, error, refresh } = useNplData();

  if (isLoading) return <LoadingPane />;
  if (error) return <ErrorPane message={error} onRetry={refresh} />;
  if (!data || data.meta.totalRows === 0) return <EmptyPane />;

  const { perDay, backlog, flowRates, weekly, weekday, cycleTime, flow } = data;

  const dayLabels = perDay.map((d) => fmtDate(d.date));
  const weekLabels = weekly.map((w) => `Wk ${w.week.slice(-2)}`);

  return (
    <div className={`min-h-screen ${s.page}`}>
      <div className={`mx-auto max-w-[1600px] px-6 py-6 ${isRefreshing ? 'opacity-70 transition-opacity' : ''}`}>
        <header className="mb-5">
          <h1 className={`text-xl font-semibold ${s.heading}`}>Throughput &amp; Cycle Time</h1>
          <p className={`mt-0.5 text-sm ${s.muted}`}>
            Order intake against dispatch, the backlog between them, and how long a shipment takes end to end
          </p>
        </header>

        <div className="mb-5">
          <FilterBar />
        </div>

        <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard
            label="Avg intake / working day"
            value={fmtInt(flowRates.avgIncomingPerDay)}
            hint={`${fmtInt(flowRates.avgIncomingLitresPerDay)} L per day`}
            icon={<IconInbox className="h-4 w-4" />}
          />
          <StatCard
            label="Avg dispatch / dispatch day"
            value={fmtInt(flowRates.avgOutgoingPerDay)}
            hint={`${fmtInt(flowRates.avgOutgoingLitresPerDay)} L per day`}
            icon={<IconTruckDelivery className="h-4 w-4" />}
          />
          <StatCard
            label="Peak open orders"
            value={fmtInt(flowRates.peakOpenOrders)}
            tone={flowRates.peakOpenOrders > 50 ? 'warn' : 'default'}
            hint="Largest received-minus-dispatched gap in the period"
            icon={<IconStack2 className="h-4 w-4" />}
          />
          <StatCard
            label="Avg cycle time"
            value={fmtDays(cycleTime.avgDays)}
            tone={cycleTime.avgDays !== null && cycleTime.avgDays > 4 ? 'warn' : 'good'}
            hint={`Median ${fmtDays(cycleTime.medianDays)} · ${fmtInt(cycleTime.measured)} measured`}
            icon={<IconClockHour4 className="h-4 w-4" />}
          />
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card
            title="Per-day intake vs dispatch"
            subtitle="Incoming = LR raised · Outgoing = dispatched"
          >
            <BarChart
              labels={dayLabels}
              datasets={[
                { label: 'Incoming (LR)', data: perDay.map((d) => d.incoming), color: PALETTE[0] },
                { label: 'Outgoing (dispatch)', data: perDay.map((d) => d.outgoing), color: PALETTE[3] },
              ]}
              showLegend
              height={280}
            />
            <p className={`mt-3 text-xs ${s.subtle}`}>
              Orders arriving in spikes while dispatch happens in bursts is the signature of a reactive
              dispatch calendar rather than a levelled daily plan.
            </p>
          </Card>

          <Card title="Litres per day" subtitle="Volume received against volume dispatched">
            <LineChart
              labels={dayLabels}
              datasets={[
                { label: 'Incoming L', data: perDay.map((d) => d.incomingLitres), color: PALETTE[0], fill: true },
                { label: 'Outgoing L', data: perDay.map((d) => d.outgoingLitres), color: PALETTE[3], fill: true },
              ]}
              height={280}
              suffix=" L"
            />
          </Card>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card
            title="Weekly volume vs on-time %"
            subtitle="Does service hold up when intake climbs?"
          >
            <LineChart
              labels={weekLabels}
              datasets={[
                { label: 'Shipments', data: weekly.map((w) => w.shipments), color: PALETTE[0] },
                { label: 'On-time %', data: weekly.map((w) => w.onTimePct), color: PALETTE[4], yAxisID: 'y1' },
              ]}
              height={280}
            />
            <p className={`mt-3 text-xs ${s.subtle}`}>
              When on-time rate falls as shipment count rises, the constraint is planning and hub
              capacity — not transit speed.
            </p>
          </Card>

          <Card title="Weekday rhythm" subtitle="Which days take orders in, and which push trucks out">
            <BarChart
              labels={weekday.map((w) => w.day)}
              datasets={[
                { label: 'Incoming (LR)', data: weekday.map((w) => w.incoming), color: PALETTE[0] },
                { label: 'Outgoing (dispatch)', data: weekday.map((w) => w.outgoing), color: PALETTE[3] },
              ]}
              showLegend
              height={280}
            />
          </Card>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card
            title="Open orders at the warehouse"
            subtitle="Cumulative received minus cumulative dispatched"
          >
            <LineChart
              labels={backlog.map((b) => fmtDate(b.date))}
              datasets={[
                { label: 'Cumulative received', data: backlog.map((b) => b.cumulativeReceived), color: PALETTE[0] },
                { label: 'Cumulative dispatched', data: backlog.map((b) => b.cumulativeDispatched), color: PALETTE[1] },
                { label: 'Open at warehouse', data: backlog.map((b) => b.open), color: PALETTE[4], fill: true },
              ]}
              height={300}
            />
          </Card>

          <Card
            title="Cycle time distribution"
            subtitle="Days from LR raised to delivery confirmed"
            action={
              <span className="text-xs">
                <span className={s.muted}>within 7 days </span>
                <span className={toneForPct(cycleTime.withinTargetPct) === 'good' ? 'text-emerald-500' : 'text-amber-500'}>
                  {fmtPct(cycleTime.withinTargetPct)}
                </span>
              </span>
            }
          >
            <BarChart
              labels={cycleTime.histogram.map((h) => h.label)}
              datasets={[
                {
                  label: 'Shipments',
                  data: cycleTime.histogram.map((h) => h.count),
                  // Green inside the 7-day service window, red beyond it.
                  color: cycleTime.histogram.map((h) => (h.days <= 7 ? '#10b981' : '#ef4444')),
                },
              ]}
              height={300}
            />
            <p className={`mt-3 text-xs ${s.subtle}`}>
              Of the average {fmtDays(flow.tatSplit.totalDays)} cycle,{' '}
              {fmtDays(flow.tatSplit.warehouseDwellDays)} is spent waiting at the hub and{' '}
              {fmtDays(flow.tatSplit.roadDays)} on the road.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
