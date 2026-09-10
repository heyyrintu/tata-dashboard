import { useNplData } from '../context/NplDataContext';
import FilterBar from '../components/npl/FilterBar';
import { BarChart } from '../components/npl/charts';
import {
  Card,
  StatCard,
  LoadingPane,
  ErrorPane,
  EmptyPane,
  useSurface,
  fmtInt,
  fmtPct,
} from '../components/npl/ui';
import { IconCircleCheck, IconAlertTriangle, IconFileSpreadsheet } from '@tabler/icons-react';

/**
 * Surfaces every correction and exclusion the importer made, so the numbers on
 * the other pages can be trusted or challenged rather than taken on faith.
 */
export default function DataQuality() {
  const s = useSurface();
  const { data, isLoading, isRefreshing, error, refresh } = useNplData();

  if (isLoading) return <LoadingPane />;
  if (error) return <ErrorPane message={error} onRetry={refresh} />;
  if (!data || data.meta.totalRows === 0) return <EmptyPane />;

  const { dataQuality, meta, kpis } = data;
  const affected = dataQuality.reduce((a, d) => a + d.count, 0);
  const cleanPct = meta.filteredRows ? ((meta.filteredRows - affected) / meta.filteredRows) * 100 : 100;

  return (
    <div className={`min-h-screen ${s.page}`}>
      <div className={`mx-auto max-w-[1400px] px-6 py-6 ${isRefreshing ? 'opacity-70 transition-opacity' : ''}`}>
        <header className="mb-5">
          <h1 className={`text-xl font-semibold ${s.heading}`}>Data Quality</h1>
          <p className={`mt-0.5 text-sm ${s.muted}`}>
            What the importer corrected, excluded, or could not verify in the source workbook
          </p>
        </header>

        <div className="mb-5">
          <FilterBar />
        </div>

        <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard
            label="Rows imported"
            value={fmtInt(meta.filteredRows)}
            hint={`of ${fmtInt(meta.totalRows)} total`}
            icon={<IconFileSpreadsheet className="h-4 w-4" />}
          />
          <StatCard
            label="Clean rows"
            value={fmtPct(cleanPct)}
            tone={cleanPct >= 95 ? 'good' : cleanPct >= 85 ? 'warn' : 'bad'}
            hint="No issues detected"
            icon={<IconCircleCheck className="h-4 w-4" />}
          />
          <StatCard
            label="Flagged rows"
            value={fmtInt(affected)}
            tone={affected > 0 ? 'warn' : 'good'}
            hint={`${dataQuality.length} distinct issue types`}
            icon={<IconAlertTriangle className="h-4 w-4" />}
          />
          <StatCard
            label="Unscoreable"
            value={fmtInt(kpis.shipments - kpis.onTimeMeasurable)}
            tone={kpis.shipments - kpis.onTimeMeasurable > 0 ? 'warn' : 'good'}
            hint="Excluded from on-time %"
          />
        </div>

        {dataQuality.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <IconCircleCheck className="h-9 w-9 text-emerald-500" />
              <p className={`text-sm font-medium ${s.heading}`}>No data-quality issues in this selection</p>
              <p className={`text-xs ${s.muted}`}>Every row imported cleanly.</p>
            </div>
          </Card>
        ) : (
          <>
            <div className="mb-5">
              <Card title="Issues by type" subtitle="Row counts for each detected problem">
                <BarChart
                  labels={dataQuality.map((d) => d.label)}
                  datasets={[
                    {
                      label: 'Rows',
                      data: dataQuality.map((d) => d.count),
                      color: '#f59e0b',
                    },
                  ]}
                  horizontal
                  height={Math.max(220, dataQuality.length * 56)}
                />
              </Card>
            </div>

            <div className="grid gap-4">
              {dataQuality.map((d) => (
                <Card key={d.flag}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <IconAlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                        <h3 className={`text-sm font-semibold ${s.heading}`}>{d.label}</h3>
                      </div>
                      <p className={`mt-2 text-sm ${s.subtle}`}>{d.impact}</p>
                      <code className={`mt-2 inline-block rounded px-1.5 py-0.5 text-[11px] ${s.muted} ${
                        s.light ? 'bg-gray-100' : 'bg-white/5'
                      }`}>
                        {d.flag}
                      </code>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold tabular-nums text-amber-500">{fmtInt(d.count)}</p>
                      <p className={`text-xs ${s.muted}`}>{fmtPct(d.pct)} of rows</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <p className={`mt-5 rounded-xl border px-4 py-3 text-xs ${s.divider} ${s.muted}`}>
              Volumes are reported exactly as the sheet records them. Where litres disagree with the pack size in
              the material name, the row is flagged rather than rewritten — correcting it here would break
              reconciliation against the sheet&apos;s own TOTAL row and hide the error from whoever needs to fix it
              at source. Find flagged rows on the{' '}
              <span className={s.heading}>Shipments</span> page by the amber flag beside the LR number.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
