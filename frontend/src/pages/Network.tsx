import { useNplData } from '../context/NplDataContext';
import FilterBar from '../components/npl/FilterBar';
import { BarChart, PALETTE, colorFor } from '../components/npl/charts';
import {
  Card,
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
import type { DistanceBandRow, ZoneRow, LaneRow } from '../services/nplApi';

/**
 * Network shape: how far the freight travels, which zones absorb it, and
 * which lanes behave differently from their distance band. Distances are
 * approximate road km from the dispatching hub - see destinationGeo.ts.
 */
export default function Network() {
  const s = useSurface();
  const { data, isLoading, isRefreshing, error, refresh } = useNplData();

  if (isLoading) return <LoadingPane />;
  if (error) return <ErrorPane message={error} onRetry={refresh} />;
  if (!data || data.meta.totalRows === 0) return <EmptyPane />;

  const { distanceBands, zones, lanes, volume } = data;

  const unmapped = distanceBands.find((b) => b.band === 'Unmapped');

  const bandCols: Column<DistanceBandRow>[] = [
    { key: 'band', header: 'Band', render: (r) => <span className={s.heading}>{r.band}</span> },
    { key: 'ships', header: 'Shipments', align: 'right', render: (r) => fmtInt(r.shipments) },
    { key: 'litres', header: 'Litres', align: 'right', render: (r) => fmtLitres(r.litres) },
    { key: 'pctVol', header: '% volume', align: 'right', render: (r) => fmtPct(r.pctLitres) },
    {
      key: 'otd',
      header: 'On time',
      align: 'right',
      render: (r) =>
        r.measurable ? <Pill tone={toneForPct(r.onTimePct)}>{fmtPct(r.onTimePct)}</Pill> : <span className={s.muted}>—</span>,
    },
    { key: 'dwell', header: 'Dwell', align: 'right', render: (r) => fmtDays(r.avgDwellDays) },
    { key: 'road', header: 'Road', align: 'right', render: (r) => fmtDays(r.avgRoadDays) },
    {
      key: 'tat',
      header: 'Total TAT',
      align: 'right',
      render: (r) => <span className={s.heading}>{fmtDays(r.avgTatDays)}</span>,
    },
  ];

  const zoneCols: Column<ZoneRow>[] = [
    { key: 'zone', header: 'Zone', render: (r) => <span className={s.heading}>{r.zone}</span> },
    { key: 'ships', header: 'Shipments', align: 'right', render: (r) => fmtInt(r.shipments) },
    { key: 'dest', header: 'Towns', align: 'right', render: (r) => fmtInt(r.destinations) },
    { key: 'litres', header: 'Litres', align: 'right', render: (r) => fmtLitres(r.litres) },
    { key: 'pctVol', header: '% volume', align: 'right', render: (r) => fmtPct(r.pctLitres) },
    {
      key: 'otd',
      header: 'On time',
      align: 'right',
      render: (r) =>
        r.measurable ? <Pill tone={toneForPct(r.onTimePct)}>{fmtPct(r.onTimePct)}</Pill> : <span className={s.muted}>—</span>,
    },
    { key: 'tat', header: 'Avg TAT', align: 'right', render: (r) => fmtDays(r.avgTatDays) },
  ];

  const laneCols: Column<LaneRow>[] = [
    { key: 'lane', header: 'Lane', render: (r) => <span className={s.heading}>{r.lane}</span> },
    {
      key: 'km',
      header: 'km',
      align: 'right',
      render: (r) => (r.km === null ? <span className={s.muted}>—</span> : fmtInt(r.km)),
    },
    { key: 'ships', header: 'Trips', align: 'right', render: (r) => fmtInt(r.shipments) },
    { key: 'litres', header: 'Litres', align: 'right', render: (r) => fmtLitres(r.litres) },
    {
      key: 'otd',
      header: 'On time',
      align: 'right',
      render: (r) =>
        r.measurable ? <Pill tone={toneForPct(r.onTimePct)}>{fmtPct(r.onTimePct)}</Pill> : <span className={s.muted}>—</span>,
    },
    { key: 'transit', header: 'Avg transit', align: 'right', render: (r) => fmtDays(r.avgTransitDays) },
  ];

  return (
    <div className={`min-h-screen ${s.page}`}>
      <div className={`mx-auto max-w-[1600px] px-6 py-6 ${isRefreshing ? 'opacity-70 transition-opacity' : ''}`}>
        <header className="mb-5">
          <h1 className={`text-xl font-semibold ${s.heading}`}>Network &amp; Distance</h1>
          <p className={`mt-0.5 text-sm ${s.muted}`}>
            How far freight travels from the hub, which zones absorb the volume, and how lanes actually perform
          </p>
        </header>

        <div className="mb-5">
          <FilterBar />
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card title="Shipments &amp; volume by distance band" subtitle="Approximate road km from the dispatching hub">
            <BarChart
              labels={distanceBands.map((b) => b.band)}
              datasets={[
                { label: '% of shipments', data: distanceBands.map((b) => b.pctShipments), color: PALETTE[0] },
                { label: '% of volume', data: distanceBands.map((b) => b.pctLitres), color: PALETTE[3] },
              ]}
              showLegend
              height={280}
              suffix="%"
            />
          </Card>

          <Card title="Band performance" subtitle="Service quality against distance" bodyClassName="p-0">
            <DataTable columns={bandCols} rows={distanceBands} keyOf={(r) => r.band} />
          </Card>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card title="Volume by zone" subtitle="Litres delivered into each zone">
            <BarChart
              labels={zones.map((z) => z.zone)}
              datasets={[
                {
                  label: 'Litres',
                  data: zones.map((z) => z.litres),
                  color: zones.map((z, i) => colorFor(z.zone, i)),
                },
              ]}
              horizontal
              height={Math.max(240, zones.length * 34)}
              suffix=" L"
            />
          </Card>

          <Card title="Zone performance" subtitle="Where TAT stretches" bodyClassName="p-0">
            <DataTable columns={zoneCols} rows={zones} keyOf={(r) => r.zone} />
          </Card>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card
            title="Busiest lanes"
            subtitle="Ranked by trip count — distance alone does not set speed"
            bodyClassName="p-0"
          >
            <DataTable columns={laneCols} rows={lanes.slice(0, 15)} keyOf={(r) => r.lane} maxHeight="26rem" />
          </Card>

          <Card title="Top destinations" subtitle="By volume delivered">
            <BarChart
              labels={volume.topDestinations.slice(0, 12).map((d) => d.destination)}
              datasets={[
                {
                  label: 'Litres',
                  data: volume.topDestinations.slice(0, 12).map((d) => d.litres),
                  color: PALETTE[0],
                },
              ]}
              horizontal
              height={Math.max(240, Math.min(12, volume.topDestinations.length) * 32)}
              suffix=" L"
            />
          </Card>
        </div>

        {unmapped && (
          <p className={`text-xs ${s.muted}`}>
            {fmtInt(unmapped.shipments)} shipment{unmapped.shipments === 1 ? '' : 's'} could not be placed
            on the map and sit in the Unmapped band. Add the town to{' '}
            <code className="rounded bg-gray-500/15 px-1 py-0.5">backend/src/config/destinationGeo.ts</code>{' '}
            to include it.
          </p>
        )}
      </div>
    </div>
  );
}
