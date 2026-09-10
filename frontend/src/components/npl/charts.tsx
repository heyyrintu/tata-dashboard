import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type TooltipItem,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

/**
 * Categorical palette. Ordered so neighbouring series stay distinguishable,
 * and readable against both the light and dark page backgrounds.
 */
export const PALETTE = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#a855f7',
  '#ef4444',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
  '#f97316',
  '#6366f1',
];

/** Fixed colours so a status keeps the same colour on every chart. */
export const STATUS_COLORS: Record<string, string> = {
  Delivered: '#10b981',
  Received: '#10b981',
  'In Transit': '#3b82f6',
  'Handover to NPL': '#6366f1',
  Pending: '#f59e0b',
  'At WH': '#f59e0b',
  Returned: '#ef4444',
  Refused: '#dc2626',
};

export const colorFor = (label: string, i: number): string =>
  STATUS_COLORS[label] ?? PALETTE[i % PALETTE.length];

function useAxis() {
  const { theme } = useTheme();
  const light = theme === 'light';
  return {
    grid: light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)',
    tick: light ? '#4b5563' : '#9ca3af',
    legend: light ? '#374151' : '#d1d5db',
    tooltipBg: light ? '#ffffff' : '#0f1629',
    tooltipText: light ? '#111827' : '#f9fafb',
    tooltipBorder: light ? '#e5e7eb' : 'rgba(255,255,255,0.12)',
  };
}

const nf = new Intl.NumberFormat('en-IN');

/**
 * Shared legend/tooltip styling. Generic over the chart type so the spread at
 * each call site keeps Chart.js's per-type option shapes intact.
 */
function baseOptions<T extends 'line' | 'bar'>(
  a: ReturnType<typeof useAxis>,
  showLegend: boolean
): ChartOptions<T> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom',
        labels: { color: a.legend, boxWidth: 10, boxHeight: 10, usePointStyle: true, padding: 16 },
      },
      tooltip: {
        backgroundColor: a.tooltipBg,
        titleColor: a.tooltipText,
        bodyColor: a.tooltipText,
        borderColor: a.tooltipBorder,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
      },
    },
  } as ChartOptions<T>;
}

export function LineChart({
  labels,
  datasets,
  height = 280,
  showLegend = true,
  yLabel,
  suffix = '',
}: {
  labels: string[];
  datasets: { label: string; data: number[]; color?: string; fill?: boolean; yAxisID?: string }[];
  height?: number;
  showLegend?: boolean;
  yLabel?: string;
  suffix?: string;
}) {
  const a = useAxis();
  const base = baseOptions<'line'>(a, showLegend);

  return (
    <div style={{ height }}>
      <Line
        data={{
          labels,
          datasets: datasets.map((d, i) => {
            const c = d.color ?? PALETTE[i % PALETTE.length];
            return {
              label: d.label,
              data: d.data,
              borderColor: c,
              backgroundColor: d.fill ? `${c}22` : c,
              fill: d.fill ?? false,
              tension: 0.35,
              borderWidth: 2,
              pointRadius: labels.length > 40 ? 0 : 3,
              pointHoverRadius: 5,
              yAxisID: d.yAxisID,
            };
          }),
        }}
        options={{
          ...base,
          plugins: {
            ...base.plugins,
            tooltip: {
              ...base.plugins?.tooltip,
              callbacks: {
                label: (ctx: TooltipItem<'line'>) =>
                  `${ctx.dataset.label}: ${nf.format(Number(ctx.parsed.y))}${suffix}`,
              },
            },
          },
          scales: {
            x: { grid: { color: a.grid }, ticks: { color: a.tick, maxRotation: 0, autoSkipPadding: 16 } },
            y: {
              grid: { color: a.grid },
              ticks: { color: a.tick, callback: (v) => nf.format(Number(v)) },
              title: yLabel ? { display: true, text: yLabel, color: a.tick } : undefined,
              beginAtZero: true,
            },
          },
        }}
      />
    </div>
  );
}

export function BarChart({
  labels,
  datasets,
  height = 280,
  horizontal = false,
  showLegend = false,
  stacked = false,
  suffix = '',
  max,
}: {
  labels: string[];
  datasets: { label: string; data: number[]; color?: string | string[] }[];
  height?: number;
  horizontal?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
  suffix?: string;
  max?: number;
}) {
  const a = useAxis();
  const base = baseOptions<'bar'>(a, showLegend);

  const valueAxis = {
    grid: { color: a.grid },
    ticks: { color: a.tick, callback: (v: string | number) => nf.format(Number(v)) },
    beginAtZero: true,
    stacked,
    max,
  };
  const catAxis = { grid: { display: false }, ticks: { color: a.tick }, stacked };

  return (
    <div style={{ height }}>
      <Bar
        data={{
          labels,
          datasets: datasets.map((d, i) => ({
            label: d.label,
            data: d.data,
            backgroundColor: d.color ?? PALETTE[i % PALETTE.length],
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: horizontal ? 22 : 46,
          })),
        }}
        options={{
          ...base,
          indexAxis: horizontal ? 'y' : 'x',
          plugins: {
            ...base.plugins,
            tooltip: {
              ...base.plugins?.tooltip,
              callbacks: {
                label: (ctx: TooltipItem<'bar'>) =>
                  `${ctx.dataset.label}: ${nf.format(Number(horizontal ? ctx.parsed.x : ctx.parsed.y))}${suffix}`,
              },
            },
          },
          scales: horizontal ? { x: valueAxis, y: catAxis } : { x: catAxis, y: valueAxis },
        }}
      />
    </div>
  );
}

export function DoughnutChart({
  labels,
  data,
  colors,
  height = 260,
  centerLabel,
  centerValue,
  suffix = '',
}: {
  labels: string[];
  data: number[];
  colors?: string[];
  height?: number;
  centerLabel?: string;
  centerValue?: string;
  suffix?: string;
}) {
  const a = useAxis();
  const total = data.reduce((x, y) => x + y, 0);

  return (
    <div className="relative" style={{ height }}>
      <Doughnut
        data={{
          labels,
          datasets: [
            {
              data,
              backgroundColor: colors ?? labels.map((l, i) => colorFor(l, i)),
              borderWidth: 0,
              hoverOffset: 6,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: a.legend,
                boxWidth: 10,
                boxHeight: 10,
                usePointStyle: true,
                padding: 14,
                font: { size: 11 },
              },
            },
            tooltip: {
              backgroundColor: a.tooltipBg,
              titleColor: a.tooltipText,
              bodyColor: a.tooltipText,
              borderColor: a.tooltipBorder,
              borderWidth: 1,
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: (ctx: TooltipItem<'doughnut'>) => {
                  const v = Number(ctx.parsed);
                  const pct = total ? ((v / total) * 100).toFixed(1) : '0.0';
                  return `${ctx.label}: ${nf.format(v)}${suffix} (${pct}%)`;
                },
              },
            },
          },
        }}
      />
      {(centerValue || centerLabel) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-12">
          {centerValue && (
            <span className="text-2xl font-semibold tabular-nums" style={{ color: a.tooltipText }}>
              {centerValue}
            </span>
          )}
          {centerLabel && (
            <span className="mt-0.5 text-xs" style={{ color: a.tick }}>
              {centerLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
