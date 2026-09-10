import { useSurface, Card, Pill, fmtInt, fmtLitres, fmtPct, fmtDays } from './ui';
import { BarChart, PALETTE } from './charts';
import type { ScorecardRow, FlowSummary } from '../../services/nplApi';
import { IconArrowNarrowRight } from '@tabler/icons-react';

/**
 * The executive layer of the monthly MIS: how the month scored against
 * benchmark targets, where orders got stuck, and which part of the cycle
 * actually consumed the time.
 */

const STATUS_TONE = {
  'on-target': 'good',
  close: 'warn',
  gap: 'bad',
  'no-data': 'default',
} as const;

const STATUS_LABEL = {
  'on-target': 'On target',
  close: 'Close',
  gap: 'Gap',
  'no-data': 'No data',
} as const;

function formatValue(row: ScorecardRow): string {
  if (row.actual === null) return '—';
  if (row.unit === '%') return fmtPct(row.actual);
  if (row.unit === 'days') return fmtDays(row.actual);
  if (row.unit === 'L/trip') return `${fmtInt(row.actual)} L`;
  return String(row.actual);
}

function formatTarget(row: ScorecardRow): string {
  const prefix = row.higherIsBetter ? '≥' : '≤';
  if (row.unit === '%') return `${prefix}${row.target}%`;
  if (row.unit === 'days') return `${prefix}${row.target} d`;
  if (row.unit === 'L/trip') return `${prefix}${fmtInt(row.target)} L`;
  return `${prefix}${row.target}`;
}

/** Distance from target, signed so the direction of the miss is readable. */
function gapOf(row: ScorecardRow): string | null {
  if (row.actual === null || row.status === 'on-target') return null;
  const diff = row.actual - row.target;
  const rounded = Math.round(Math.abs(diff) * 10) / 10;
  return `${diff > 0 ? '+' : '−'}${rounded}`;
}

export function Scorecard({ rows }: { rows: ScorecardRow[] }) {
  const s = useSurface();
  return (
    <Card
      title="Scorecard vs targets"
      subtitle="Standard 3PL benchmarks — align these with the contracted SLA"
      bodyClassName="p-0"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className={`${s.headRow} text-left`}>
              <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide">KPI</th>
              <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide">Actual</th>
              <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide">Target</th>
              <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide">Gap</th>
              <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.kpi} className={`border-t ${s.divider} ${s.rowHover}`}>
                <td className={`px-5 py-2.5 ${s.subtle}`}>{r.kpi}</td>
                <td className={`px-5 py-2.5 text-right font-semibold tabular-nums ${s.heading}`}>
                  {formatValue(r)}
                </td>
                <td className={`px-5 py-2.5 text-right tabular-nums ${s.muted}`}>{formatTarget(r)}</td>
                <td className={`px-5 py-2.5 text-right tabular-nums ${s.muted}`}>{gapOf(r) ?? '—'}</td>
                <td className="px-5 py-2.5 text-right">
                  <Pill tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function FlowStep({
  value,
  label,
  litres,
  note,
  last = false,
}: {
  value: number;
  label: string;
  litres?: number;
  note?: string;
  last?: boolean;
}) {
  const s = useSurface();
  return (
    <>
      <div className="min-w-[7rem] flex-1">
        <p className={`text-2xl font-semibold tabular-nums ${s.heading}`}>{fmtInt(value)}</p>
        <p className={`mt-0.5 text-[11px] font-semibold uppercase tracking-wide ${s.muted}`}>{label}</p>
        {litres !== undefined && <p className={`mt-1 text-xs ${s.subtle}`}>{fmtLitres(litres)}</p>}
        {note && <p className="mt-1 text-xs text-amber-500">{note}</p>}
      </div>
      {!last && <IconArrowNarrowRight size={18} className={`shrink-0 ${s.muted}`} aria-hidden />}
    </>
  );
}

export function ShipmentFlow({ flow }: { flow: FlowSummary }) {
  const s = useSurface();
  const t = flow.tatSplit;
  const dwell = t.warehouseDwellDays;
  const road = t.roadDays;

  return (
    <Card
      title="Shipment flow"
      subtitle="Orders received through to delivered, for the selected period"
    >
      <div className="flex flex-wrap items-start gap-x-3 gap-y-5">
        <FlowStep value={flow.received} label="Orders received" litres={flow.receivedLitres} />
        <FlowStep
          value={flow.dispatched}
          label="Dispatched"
          litres={flow.dispatchedLitres}
          note={flow.atWarehouse > 0 ? `${fmtInt(flow.atWarehouse)} still at warehouse` : undefined}
        />
        <FlowStep value={flow.delivered} label="Delivered" litres={flow.deliveredLitres} />
        <FlowStep
          value={flow.inTransit}
          label="In transit"
          note={flow.inTransit > 0 ? 'On the road' : undefined}
        />
        <FlowStep
          value={flow.onTime}
          label="On time"
          note={flow.late > 0 ? `${fmtInt(flow.late)} delivered late` : undefined}
          last
        />
      </div>

      {dwell !== null && road !== null && (
        <div className={`mt-5 border-t pt-4 ${s.divider}`}>
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <p className={`text-xs font-semibold uppercase tracking-wide ${s.muted}`}>
              Where the time goes
            </p>
            <p className={`text-xs ${s.subtle}`}>
              {fmtDays(dwell)} waiting at the hub · {fmtDays(road)} on the road
              {t.dwellSharePct !== null && (
                <>
                  {' '}
                  — <span className="font-semibold text-amber-500">{fmtPct(t.dwellSharePct)}</span> of
                  cycle time is consumed before the truck leaves
                </>
              )}
            </p>
          </div>
          <BarChart
            labels={['Avg delivered order']}
            datasets={[
              { label: 'Warehouse dwell (LR → dispatch)', data: [dwell], color: PALETTE[3] },
              { label: 'Road time (dispatch → delivery)', data: [road], color: PALETTE[1] },
            ]}
            horizontal
            stacked
            showLegend
            height={110}
            suffix=" d"
          />
        </div>
      )}
    </Card>
  );
}
