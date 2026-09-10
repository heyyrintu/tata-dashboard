import type { ReactNode } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { IconAlertTriangle, IconInbox, IconLoader2 } from '@tabler/icons-react';

/** Shared presentation primitives for the NPL dashboard. */

export function useSurface() {
  const { theme } = useTheme();
  const light = theme === 'light';
  return {
    light,
    page: light ? 'bg-[#F1F1F1] text-gray-900' : 'bg-[#080d1a] text-gray-100',
    card: light
      ? 'bg-white border border-gray-200 shadow-sm'
      : 'bg-[#0f1629]/80 border border-white/10',
    muted: light ? 'text-gray-500' : 'text-gray-400',
    subtle: light ? 'text-gray-600' : 'text-gray-300',
    heading: light ? 'text-gray-900' : 'text-white',
    divider: light ? 'border-gray-200' : 'border-white/10',
    rowHover: light ? 'hover:bg-gray-50' : 'hover:bg-white/5',
    headRow: light ? 'bg-gray-50 text-gray-600' : 'bg-white/5 text-gray-400',
    input: light
      ? 'bg-white border-gray-300 text-gray-900'
      : 'bg-[#0b1222] border-white/15 text-gray-100',
  };
}

export function Card({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = '',
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const s = useSurface();
  return (
    <section className={`rounded-2xl ${s.card} ${className}`}>
      {(title || action) && (
        <header className={`flex items-start justify-between gap-4 border-b ${s.divider} px-5 py-4`}>
          <div className="min-w-0">
            {title && <h2 className={`text-sm font-semibold ${s.heading}`}>{title}</h2>}
            {subtitle && <p className={`mt-0.5 text-xs ${s.muted}`}>{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={`px-5 py-4 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

type Tone = 'default' | 'good' | 'warn' | 'bad' | 'info';

const TONE_TEXT: Record<Tone, string> = {
  default: '',
  good: 'text-emerald-500',
  warn: 'text-amber-500',
  bad: 'text-red-500',
  info: 'text-blue-500',
};

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
}) {
  const s = useSurface();
  return (
    <div className={`rounded-2xl ${s.card} px-5 py-4`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`text-xs font-medium uppercase tracking-wide ${s.muted}`}>{label}</p>
        {icon && <span className={s.muted}>{icon}</span>}
      </div>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${TONE_TEXT[tone] || s.heading}`}>{value}</p>
      {hint && <p className={`mt-1 text-xs ${s.muted}`}>{hint}</p>}
    </div>
  );
}

/** Colour a percentage by how good it is. Higher is better unless inverted. */
export function toneForPct(pct: number, { good = 90, warn = 75, invert = false } = {}): Tone {
  const v = invert ? 100 - pct : pct;
  if (v >= good) return 'good';
  if (v >= warn) return 'warn';
  return 'bad';
}

export function Pill({ children, tone = 'default' }: { children: ReactNode; tone?: Tone }) {
  const map: Record<Tone, string> = {
    default: 'bg-gray-500/15 text-gray-400',
    good: 'bg-emerald-500/15 text-emerald-500',
    warn: 'bg-amber-500/15 text-amber-500',
    bad: 'bg-red-500/15 text-red-500',
    info: 'bg-blue-500/15 text-blue-500',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[tone]}`}>
      {children}
    </span>
  );
}

/** Map a delivery or POD status to a colour tone. */
export function statusTone(status: string): Tone {
  switch (status) {
    case 'Delivered':
    case 'Received':
      return 'good';
    case 'In Transit':
    case 'Handover to NPL':
      return 'info';
    case 'Pending':
    case 'At WH':
      return 'warn';
    case 'Returned':
    case 'Refused':
      return 'bad';
    default:
      return 'default';
  }
}

export interface Column<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  render: (row: T) => ReactNode;
  width?: string;
}

export function DataTable<T>({
  columns,
  rows,
  keyOf,
  empty = 'Nothing to show for this selection.',
  maxHeight,
}: {
  columns: Column<T>[];
  rows: T[];
  keyOf: (row: T, i: number) => string | number;
  empty?: string;
  maxHeight?: string;
}) {
  const s = useSurface();

  if (rows.length === 0) {
    return <p className={`py-8 text-center text-sm ${s.muted}`}>{empty}</p>;
  }

  return (
    <div className="overflow-x-auto" style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}>
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className={`${s.headRow} text-left`}>
            {columns.map((c) => (
              <th
                key={c.key}
                className={`whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
                  c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'
                }`}
                style={c.width ? { width: c.width } : undefined}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={keyOf(row, i)} className={`border-t ${s.divider} ${s.rowHover}`}>
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`whitespace-nowrap px-3 py-2 ${
                    c.align === 'right'
                      ? 'text-right tabular-nums'
                      : c.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                  }`}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LoadingPane({ label = 'Loading dashboard…' }: { label?: string }) {
  const s = useSurface();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <IconLoader2 className="h-7 w-7 animate-spin text-blue-500" />
      <p className={`text-sm ${s.muted}`}>{label}</p>
    </div>
  );
}

export function ErrorPane({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const s = useSurface();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <IconAlertTriangle className="h-8 w-8 text-red-500" />
      <p className={`text-sm font-medium ${s.heading}`}>Could not load the dashboard</p>
      <p className={`max-w-md text-xs ${s.muted}`}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyPane({
  title = 'No shipments yet',
  message = 'Upload an NPL MIS master workbook to populate the dashboard.',
  action,
}: {
  title?: string;
  message?: string;
  action?: ReactNode;
}) {
  const s = useSurface();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <IconInbox className={`h-9 w-9 ${s.muted}`} />
      <p className={`text-sm font-medium ${s.heading}`}>{title}</p>
      <p className={`max-w-md text-xs ${s.muted}`}>{message}</p>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------- formatting

/** Indian digit grouping (1,23,456) — the audience for this MIS reads lakhs. */
export const fmtInt = (n: number | null | undefined): string =>
  n === null || n === undefined ? '—' : Math.round(n).toLocaleString('en-IN');

export const fmtLitres = (n: number | null | undefined): string =>
  n === null || n === undefined ? '—' : `${Math.round(n).toLocaleString('en-IN')} L`;

export const fmtPct = (n: number | null | undefined): string =>
  n === null || n === undefined ? '—' : `${n.toFixed(1)}%`;

export const fmtDays = (n: number | null | undefined): string =>
  n === null || n === undefined ? '—' : `${n} d`;

export const fmtDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', timeZone: 'UTC' });
};

/** "2026-08" -> "Aug 2026" */
export const fmtMonth = (key: string): string => {
  const [y, m] = key.split('-');
  const d = new Date(Date.UTC(Number(y), Number(m) - 1, 1));
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' });
};
