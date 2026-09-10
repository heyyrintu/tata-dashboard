import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { businessUnitOf, BUSINESS_UNITS, type BusinessUnit } from '../config/businessUnit';
import { carrierLabel, resolveCarrier } from '../config/vendorPrivacy';
import {
  normaliseDestination,
  roadKm,
  distanceBand,
  zoneOf,
  DISTANCE_BANDS,
} from '../config/destinationGeo';

/**
 * Analytics for the NPL DEF delivery dataset.
 *
 * The whole filtered set is pulled into memory and aggregated in JS rather than
 * issuing ~20 separate groupBy queries. The MIS sheet holds a few hundred rows
 * per month, so even several years of history stays comfortably small, and one
 * pass keeps every metric consistent with the same filter.
 */

export interface ShipmentFilters {
  from?: Date | null;
  to?: Date | null;
  branch?: string | null;
  vendor?: string | null;
  sku?: string | null;
  loadType?: string | null;
  deliveryStatus?: string | null;
}

/** Guard against an unbounded scan if the table ever grows unexpectedly. */
const MAX_ROWS = 200_000;

type Row = {
  id: number;
  branch: string | null;
  partyName: string | null;
  destination: string | null;
  lane: string | null;
  lrDate: Date | null;
  monthKey: string | null;
  material: string | null;
  materialSku: string | null;
  buckets: number | null;
  totalQuantityLtr: number | null;
  loadType: string | null;
  expectedDeliveryDate: Date | null;
  actualDeliveryDate: Date | null;
  dispatchDate: Date | null;
  deliveryStatus: string | null;
  damage: boolean | null;
  delayDays: number | null;
  isOnTime: boolean | null;
  dispatchToDeliveryDays: number | null;
  vehicleNumber: string | null;
  vendorName: string | null;
  podStatus: string | null;
  podReceived: boolean | null;
  dataFlags: string | null;
};

const SELECT = {
  id: true,
  branch: true,
  partyName: true,
  destination: true,
  lane: true,
  lrDate: true,
  monthKey: true,
  material: true,
  materialSku: true,
  buckets: true,
  totalQuantityLtr: true,
  loadType: true,
  expectedDeliveryDate: true,
  actualDeliveryDate: true,
  dispatchDate: true,
  deliveryStatus: true,
  damage: true,
  delayDays: true,
  isOnTime: true,
  dispatchToDeliveryDays: true,
  vehicleNumber: true,
  vendorName: true,
  podStatus: true,
  podReceived: true,
  dataFlags: true,
} satisfies Prisma.ShipmentSelect;

export function buildWhere(f: ShipmentFilters): Prisma.ShipmentWhereInput {
  const where: Prisma.ShipmentWhereInput = {};

  if (f.from || f.to) {
    where.lrDate = {};
    if (f.from) (where.lrDate as Prisma.DateTimeFilter).gte = f.from;
    if (f.to) (where.lrDate as Prisma.DateTimeFilter).lte = f.to;
  }
  if (f.branch) where.branch = f.branch;
  if (f.vendor) where.vendorName = f.vendor;
  if (f.sku) where.materialSku = f.sku;
  if (f.loadType) where.loadType = f.loadType;
  if (f.deliveryStatus) where.deliveryStatus = f.deliveryStatus;

  return where;
}

// ---------------------------------------------------------------- helpers

const pct = (num: number, den: number): number =>
  den === 0 ? 0 : Math.round((num / den) * 1000) / 10;

const round1 = (n: number): number => Math.round(n * 10) / 10;

const isoDay = (d: Date): string => d.toISOString().slice(0, 10);

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

/** Group rows by a key, dropping rows whose key is null/blank. */
function groupBy<T>(rows: Row[], key: (r: Row) => string | null | undefined, make: (k: string, rs: Row[]) => T): T[] {
  const m = new Map<string, Row[]>();
  for (const r of rows) {
    const k = key(r);
    if (!k) continue;
    const list = m.get(k);
    if (list) list.push(r);
    else m.set(k, [r]);
  }
  return [...m.entries()].map(([k, rs]) => make(k, rs));
}

const litresOf = (rs: Row[]) => rs.reduce((a, r) => a + (r.totalQuantityLtr || 0), 0);
const bucketsOf = (rs: Row[]) => rs.reduce((a, r) => a + (r.buckets || 0), 0);

/** On-time stats over the subset where both expected and actual dates exist. */
function onTimeStats(rs: Row[]) {
  const measurable = rs.filter((r) => r.isOnTime !== null && r.isOnTime !== undefined);
  const onTime = measurable.filter((r) => r.isOnTime === true).length;
  const delays = measurable.map((r) => r.delayDays ?? 0);
  return {
    measurable: measurable.length,
    onTime,
    late: measurable.length - onTime,
    pct: pct(onTime, measurable.length),
    avgDelayDays: delays.length ? round1(delays.reduce((a, b) => a + b, 0) / delays.length) : 0,
  };
}

function avgTransit(rs: Row[]): number | null {
  const v = rs.map((r) => r.dispatchToDeliveryDays).filter((n): n is number => n !== null && n !== undefined);
  return v.length ? round1(v.reduce((a, b) => a + b, 0) / v.length) : null;
}

const DATA_FLAG_LABELS: Record<string, { label: string; impact: string }> = {
  pack_size_mismatch: {
    label: 'Litres disagree with the pack size in the material name',
    impact: 'Volume totals for these rows are understated or overstated. Fix TOTAL QUANTITY IN LTRS in the sheet.',
  },
  expected_before_lr: {
    label: 'Expected delivery date falls before the LR date',
    impact: 'Excluded from on-time %, since the target date cannot be real.',
  },
  dispatch_year_corrected: {
    label: 'Dispatch date year corrected on import',
    impact: 'Dispatch was stamped a year before the LR; the year was aligned to the LR date.',
  },
  delivered_before_dispatch: {
    label: 'Delivered before it was dispatched',
    impact: 'Transit time is not computed for these rows.',
  },
  missing_litres: {
    label: 'Buckets recorded with no litres',
    impact: 'These shipments count toward shipment totals but contribute no volume.',
  },
  vendor_alias_applied: {
    label: 'Vendor name merged into its canonical spelling',
    impact:
      'Not an error - the sheet spells one carrier several ways, and these rows were merged so the vendor scorecard shows a single entry. Edit backend/src/config/vendorAliases.ts to change.',
  },
  missing_lr_date: {
    label: 'No LR date',
    impact: 'Excluded from every date-based trend and month grouping.',
  },
};


/** Days an order sat at the hub before the truck left. */
function dwellDays(r: Row): number | null {
  if (!r.lrDate || !r.dispatchDate) return null;
  const d = daysBetween(r.dispatchDate, r.lrDate);
  return d >= 0 ? d : null;
}

/** Days from LR raised to delivery confirmed - the number the customer feels. */
function totalTatDays(r: Row): number | null {
  if (!r.lrDate || !r.actualDeliveryDate) return null;
  const d = daysBetween(r.actualDeliveryDate, r.lrDate);
  return d >= 0 ? d : null;
}

function avgOf(values: (number | null)[]): number | null {
  const v = values.filter((n): n is number => n !== null && n !== undefined);
  return v.length ? round1(v.reduce((a, b) => a + b, 0) / v.length) : null;
}

/** ISO week key like 2026-W32, so weeks sort correctly across a year end. */
function isoWeek(d: Date): { key: string; start: Date } {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() - day + 1);
  const start = new Date(t);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { key: `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`, start };
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Lane label rebuilt from normalised parts, so DELHI and Delhi are one lane. */
function laneKey(r: Row): string | null {
  const dest = normaliseDestination(r.destination);
  if (!r.branch || !dest) return null;
  return r.branch + ' -> ' + dest;
}

/** Drop-size buckets - the bulk-vs-milk-run split. */
const DROP_SIZE_BUCKETS = [
  { bucket: '<= 100 L', min: 0, max: 100 },
  { bucket: '101-300 L', min: 101, max: 300 },
  { bucket: '301-1000 L', min: 301, max: 1000 },
  { bucket: '1001-5000 L', min: 1001, max: 5000 },
  { bucket: '5000+ L', min: 5001, max: Infinity },
];

/** Practical payload of the vehicle class used on this contract. */
const VEHICLE_CAPACITY_LTR = 4500;

type ScorecardRow = {
  kpi: string;
  actual: number | null;
  target: number;
  unit: string;
  /** true when higher is better, so the UI knows which side of target passes. */
  higherIsBetter: boolean;
  status: 'on-target' | 'close' | 'gap' | 'no-data';
};

function scoreRow(
  kpi: string,
  actual: number | null,
  target: number,
  unit: string,
  higherIsBetter: boolean,
  closeMargin: number
): ScorecardRow {
  let status: ScorecardRow['status'] = 'no-data';
  if (actual !== null) {
    const meets = higherIsBetter ? actual >= target : actual <= target;
    const near = higherIsBetter ? actual >= target - closeMargin : actual <= target + closeMargin;
    status = meets ? 'on-target' : near ? 'close' : 'gap';
  }
  return { kpi, actual, target, unit, higherIsBetter, status };
}


/**
 * The filter bar sends the pseudonym shown in the UI ("Carrier 4F2"), which
 * matches nothing in the database. Swap it back for the real name before the
 * query is built. Only runs when a carrier filter is actually set.
 */
async function resolveFilters<T extends ShipmentFilters>(f: T): Promise<T> {
  if (!f.vendor) return f;
  const vendors = await prisma.shipment.findMany({
    where: { vendorName: { not: null } },
    select: { vendorName: true },
    distinct: ['vendorName'],
  });
  return { ...f, vendor: resolveCarrier(f.vendor, vendors.map((v) => v.vendorName as string)) };
}

/** Strip internal carrier identity and normalise the town on outgoing rows. */
function forClient<T extends { vendorName: string | null; destination: string | null; lane: string | null }>(row: T): T {
  return {
    ...row,
    vendorName: carrierLabel(row.vendorName),
    destination: normaliseDestination(row.destination),
    lane: row.lane,
  };
}

// ---------------------------------------------------------------- main

export async function getDashboard(rawFilters: ShipmentFilters) {
  const filters = await resolveFilters(rawFilters);
  const where = buildWhere(filters);

  const [rows, totalRows] = await Promise.all([
    prisma.shipment.findMany({ where, select: SELECT, take: MAX_ROWS, orderBy: { lrDate: 'asc' } }) as Promise<Row[]>,
    prisma.shipment.count(),
  ]);

  const litres = litresOf(rows);
  const buckets = bucketsOf(rows);
  const ot = onTimeStats(rows);

  const delivered = rows.filter((r) => r.deliveryStatus === 'Delivered');
  const podReceived = rows.filter((r) => r.podReceived === true);
  const returned = rows.filter((r) => r.deliveryStatus === 'Returned' || r.deliveryStatus === 'Refused');

  const dates = rows.map((r) => r.lrDate).filter((d): d is Date => !!d);

  // ---- delivery status funnel
  const deliveryStatus = groupBy(
    rows,
    (r) => r.deliveryStatus,
    (status, rs) => ({ status, count: rs.length, litres: litresOf(rs), pct: pct(rs.length, rows.length) })
  ).sort((a, b) => b.count - a.count);

  // ---- POD
  const podStatus = groupBy(
    rows,
    (r) => r.podStatus,
    (status, rs) => ({ status, count: rs.length, litres: litresOf(rs), pct: pct(rs.length, rows.length) })
  ).sort((a, b) => b.count - a.count);

  // POD ageing: how long an outstanding POD has been sitting since delivery.
  const today = new Date();
  const podAgeingBuckets = [
    { bucket: '0-7 days', min: 0, max: 7 },
    { bucket: '8-15 days', min: 8, max: 15 },
    { bucket: '16-30 days', min: 16, max: 30 },
    { bucket: '30+ days', min: 31, max: Infinity },
  ];
  const outstandingPods = rows.filter((r) => !r.podReceived && r.actualDeliveryDate);
  const podAgeing = podAgeingBuckets.map((b) => ({
    bucket: b.bucket,
    count: outstandingPods.filter((r) => {
      const age = daysBetween(today, r.actualDeliveryDate as Date);
      return age >= b.min && age <= b.max;
    }).length,
  }));

  const podByBranch = groupBy(
    rows,
    (r) => r.branch,
    (branch, rs) => ({
      branch,
      shipments: rs.length,
      received: rs.filter((r) => r.podReceived).length,
      outstanding: rs.filter((r) => !r.podReceived).length,
      pct: pct(rs.filter((r) => r.podReceived).length, rs.length),
    })
  ).sort((a, b) => b.shipments - a.shipments);

  // ---- on-time cuts
  const onTimeByBranch = groupBy(rows, (r) => r.branch, (branch, rs) => ({ branch, shipments: rs.length, ...onTimeStats(rs) }))
    .filter((x) => x.measurable > 0)
    .sort((a, b) => b.shipments - a.shipments);

  const onTimeByMonth = groupBy(rows, (r) => r.monthKey, (month, rs) => ({ month, shipments: rs.length, ...onTimeStats(rs) })).sort(
    (a, b) => a.month.localeCompare(b.month)
  );

  const delayDistribution = [
    { bucket: 'Early', count: 0 },
    { bucket: 'On time', count: 0 },
    { bucket: '1-2 days late', count: 0 },
    { bucket: '3-5 days late', count: 0 },
    { bucket: '6+ days late', count: 0 },
  ];
  for (const r of rows) {
    if (r.delayDays === null || r.delayDays === undefined) continue;
    const d = r.delayDays;
    if (d < 0) delayDistribution[0].count++;
    else if (d === 0) delayDistribution[1].count++;
    else if (d <= 2) delayDistribution[2].count++;
    else if (d <= 5) delayDistribution[3].count++;
    else delayDistribution[4].count++;
  }

  // ---- volume
  const byDay = groupBy(rows, (r) => (r.lrDate ? isoDay(r.lrDate) : null), (date, rs) => ({
    date,
    shipments: rs.length,
    litres: litresOf(rs),
    buckets: bucketsOf(rs),
  })).sort((a, b) => a.date.localeCompare(b.date));

  const byMonth = groupBy(rows, (r) => r.monthKey, (month, rs) => ({
    month,
    shipments: rs.length,
    litres: litresOf(rs),
    buckets: bucketsOf(rs),
    onTimePct: onTimeStats(rs).pct,
  })).sort((a, b) => a.month.localeCompare(b.month));

  const byBranch = groupBy(rows, (r) => r.branch, (branch, rs) => ({
    branch,
    shipments: rs.length,
    litres: litresOf(rs),
    buckets: bucketsOf(rs),
    onTimePct: onTimeStats(rs).pct,
    podPct: pct(rs.filter((r) => r.podReceived).length, rs.length),
    avgTransitDays: avgTransit(rs),
  })).sort((a, b) => b.litres - a.litres);

  const bySku = groupBy(rows, (r) => r.materialSku, (sku, rs) => ({
    sku,
    shipments: rs.length,
    litres: litresOf(rs),
    buckets: bucketsOf(rs),
  })).sort((a, b) => b.litres - a.litres);

  const byLoadType = groupBy(rows, (r) => r.loadType, (loadType, rs) => ({
    loadType,
    shipments: rs.length,
    litres: litresOf(rs),
    pct: pct(rs.length, rows.length),
  })).sort((a, b) => b.shipments - a.shipments);

  const topParties = groupBy(rows, (r) => r.partyName, (party, rs) => ({
    party,
    shipments: rs.length,
    litres: litresOf(rs),
    onTimePct: onTimeStats(rs).pct,
  }))
    .sort((a, b) => b.litres - a.litres)
    .slice(0, 15);

  const topDestinations = groupBy(rows, (r) => normaliseDestination(r.destination), (destination, rs) => ({
    destination,
    shipments: rs.length,
    litres: litresOf(rs),
  }))
    .sort((a, b) => b.litres - a.litres)
    .slice(0, 15);

  // ---- carrier performance
  const vendors = groupBy(rows, (r) => r.vendorName, (vendor, rs) => {
    const s = onTimeStats(rs);
    return {
      vendor: carrierLabel(vendor),
      shipments: rs.length,
      litres: litresOf(rs),
      onTimePct: s.pct,
      measurable: s.measurable,
      avgDelayDays: s.avgDelayDays,
      podPct: pct(rs.filter((r) => r.podReceived).length, rs.length),
      returns: rs.filter((r) => r.deliveryStatus === 'Returned' || r.deliveryStatus === 'Refused').length,
      vehicles: new Set(rs.map((r) => r.vehicleNumber).filter(Boolean)).size,
      avgTransitDays: avgTransit(rs),
      branches: [...new Set(rs.map((r) => r.branch).filter(Boolean))] as string[],
    };
  }).sort((a, b) => b.shipments - a.shipments);

  const vehicles = groupBy(rows, (r) => r.vehicleNumber, (vehicleNumber, rs) => ({
    vehicleNumber,
    trips: rs.length,
    litres: litresOf(rs),
    onTimePct: onTimeStats(rs).pct,
    avgTransitDays: avgTransit(rs),
    vendor: carrierLabel(rs.find((r) => r.vendorName)?.vendorName ?? null),
    branches: [...new Set(rs.map((r) => r.branch).filter(Boolean))] as string[],
  }))
    .sort((a, b) => b.trips - a.trips)
    .slice(0, 25);

  const lanes = groupBy(rows, laneKey, (lane, rs) => {
    const s = onTimeStats(rs);
    return {
      lane,
      branch: rs[0].branch,
      destination: normaliseDestination(rs[0].destination),
      km: roadKm(rs[0].branch, normaliseDestination(rs[0].destination)),
      shipments: rs.length,
      litres: litresOf(rs),
      onTimePct: s.pct,
      measurable: s.measurable,
      avgTransitDays: avgTransit(rs),
    };
  })
    .sort((a, b) => b.shipments - a.shipments)
    .slice(0, 25);

  // ---- data quality
  const flagCounts: Record<string, number> = {};
  for (const r of rows) {
    if (!r.dataFlags) continue;
    for (const f of r.dataFlags.split(',')) flagCounts[f] = (flagCounts[f] || 0) + 1;
  }
  const dataQuality = Object.entries(flagCounts)
    .map(([flag, count]) => ({
      flag,
      count,
      pct: pct(count, rows.length),
      label: DATA_FLAG_LABELS[flag]?.label ?? flag,
      impact: DATA_FLAG_LABELS[flag]?.impact ?? '',
    }))
    .sort((a, b) => b.count - a.count);


  // ---- order flow: received -> dispatched -> delivered, and where time goes
  const dispatchedRows = rows.filter((r) => r.dispatchDate);
  const avgDwell = avgOf(rows.map(dwellDays));
  const avgRoad = avgTransit(rows);
  const tatValues = rows.map(totalTatDays);
  const avgTat = avgOf(tatValues);

  const flow = {
    received: rows.length,
    receivedLitres: litres,
    dispatched: dispatchedRows.length,
    dispatchedLitres: litresOf(dispatchedRows),
    delivered: delivered.length,
    deliveredLitres: litresOf(delivered),
    inTransit: rows.filter((r) => r.deliveryStatus === 'In Transit').length,
    atWarehouse: rows.length - dispatchedRows.length,
    onTime: ot.onTime,
    late: ot.late,
    dispatchCompliancePct: pct(dispatchedRows.length, rows.length),
    tatSplit: {
      warehouseDwellDays: avgDwell,
      roadDays: avgRoad,
      totalDays: avgTat,
      // Share of end-to-end time burned before the truck moves.
      dwellSharePct:
        avgDwell !== null && avgRoad !== null && avgDwell + avgRoad > 0
          ? pct(avgDwell, avgDwell + avgRoad)
          : null,
    },
  };

  // ---- trips: one trip is one vehicle leaving on one day
  const tripMap = new Map<string, Row[]>();
  for (const r of dispatchedRows) {
    if (!r.vehicleNumber || !r.dispatchDate) continue;
    const k = r.vehicleNumber + '|' + isoDay(r.dispatchDate);
    const list = tripMap.get(k);
    if (list) list.push(r);
    else tripMap.set(k, [r]);
  }
  const tripList = [...tripMap.values()].map((rs) => ({
    litres: litresOf(rs),
    shipments: rs.length,
    destinations: new Set(rs.map((r) => normaliseDestination(r.destination)).filter(Boolean)).size,
  }));
  const avgLitresPerTrip = tripList.length
    ? Math.round(tripList.reduce((a, t) => a + t.litres, 0) / tripList.length)
    : null;

  const wellFilled = tripList.filter((t) => t.litres >= 2000 && t.destinations <= 1).length;
  const underFilled = tripList.filter((t) => t.litres < 2000 && t.destinations <= 1).length;
  const clubbed = tripList.filter((t) => t.destinations > 1).length;
  const trips = {
    total: tripList.length,
    capacityLtr: VEHICLE_CAPACITY_LTR,
    avgLitresPerTrip,
    avgShipmentsPerTrip: tripList.length
      ? round1(tripList.reduce((a, t) => a + t.shipments, 0) / tripList.length)
      : null,
    avgFillPct: avgLitresPerTrip ? pct(avgLitresPerTrip, VEHICLE_CAPACITY_LTR) : 0,
    mix: [
      { bucket: 'Well filled (2,000 L+)', trips: wellFilled },
      { bucket: 'Under filled (< 2,000 L)', trips: underFilled },
      { bucket: 'Multi-destination clubbed', trips: clubbed },
    ],
    unassignedShipments: dispatchedRows.filter((r) => !r.vehicleNumber).length,
  };

  // ---- scorecard against standard 3PL benchmarks
  const scorecard: ScorecardRow[] = [
    scoreRow('On-time delivery', ot.measurable ? ot.pct : null, 95, '%', true, 5),
    scoreRow('Avg TAT (LR to delivery)', avgTat, 4, 'days', false, 1),
    scoreRow('Warehouse dwell (LR to dispatch)', avgDwell, 2, 'days', false, 1),
    scoreRow('Dispatch compliance', flow.dispatchCompliancePct, 95, '%', true, 5),
    scoreRow('Vehicle fill', avgLitresPerTrip, 4000, 'L/trip', true, 500),
    scoreRow('Return rate', pct(returned.length, rows.length), 1, '%', false, 1),
    scoreRow('Damage rate', pct(rows.filter((r) => r.damage === true).length, rows.length), 0, '%', false, 0.5),
    scoreRow('POD collection', pct(podReceived.length, rows.length), 95, '%', true, 5),
  ];

  // ---- business unit mix (the tag lives in the material description)
  const buRows = new Map<BusinessUnit, Row[]>();
  for (const r of rows) {
    const bu = businessUnitOf(r.material);
    const list = buRows.get(bu);
    if (list) list.push(r);
    else buRows.set(bu, [r]);
  }
  const businessUnit = BUSINESS_UNITS.filter((bu) => buRows.has(bu)).map((bu) => {
    const rs = buRows.get(bu) as Row[];
    const ftl = rs.filter((r) => r.loadType === 'FTL');
    const ptl = rs.filter((r) => r.loadType === 'PTL');
    return {
      bu,
      shipments: rs.length,
      litres: litresOf(rs),
      pctShipments: pct(rs.length, rows.length),
      pctLitres: pct(litresOf(rs), litres),
      ftlShipments: ftl.length,
      ftlLitres: litresOf(ftl),
      ptlShipments: ptl.length,
      ptlLitres: litresOf(ptl),
      onTimePct: onTimeStats(rs).pct,
    };
  });

  // ---- drop-size economics: many tiny drops vs a few huge loads
  const dropSize = DROP_SIZE_BUCKETS.map((b) => {
    const rs = rows.filter((r) => {
      const l = r.totalQuantityLtr || 0;
      return l >= b.min && l <= b.max;
    });
    return {
      bucket: b.bucket,
      shipments: rs.length,
      litres: litresOf(rs),
      pctShipments: pct(rs.length, rows.length),
      pctLitres: pct(litresOf(rs), litres),
    };
  });

  // ---- cycle time histogram, capped so one outlier cannot stretch the axis
  const CYCLE_CAP = 21;
  const cycleCounts: number[] = new Array(CYCLE_CAP + 1).fill(0);
  let cycleMeasured = 0;
  for (const v of tatValues) {
    if (v === null) continue;
    cycleMeasured++;
    cycleCounts[Math.min(v, CYCLE_CAP)]++;
  }
  const sortedTat = tatValues.filter((n): n is number => n !== null).sort((a, b) => a - b);
  const cycleTime = {
    measured: cycleMeasured,
    avgDays: avgTat,
    medianDays: sortedTat.length ? sortedTat[Math.floor(sortedTat.length / 2)] : null,
    withinTargetPct: sortedTat.length ? pct(sortedTat.filter((d) => d <= 7).length, sortedTat.length) : 0,
    histogram: cycleCounts.map((count, days) => ({
      days,
      label: days === CYCLE_CAP ? String(CYCLE_CAP) + '+' : String(days),
      count,
    })),
  };

  // ---- per-day intake vs dispatch, and the backlog opening between them
  type DayCell = { incoming: number; outgoing: number; incomingLitres: number; outgoingLitres: number };
  const dayMap = new Map<string, DayCell>();
  const touchDay = (key: string): DayCell => {
    let e = dayMap.get(key);
    if (!e) {
      e = { incoming: 0, outgoing: 0, incomingLitres: 0, outgoingLitres: 0 };
      dayMap.set(key, e);
    }
    return e;
  };
  for (const r of rows) {
    if (r.lrDate) {
      const e = touchDay(isoDay(r.lrDate));
      e.incoming++;
      e.incomingLitres += r.totalQuantityLtr || 0;
    }
    if (r.dispatchDate) {
      const e = touchDay(isoDay(r.dispatchDate));
      e.outgoing++;
      e.outgoingLitres += r.totalQuantityLtr || 0;
    }
  }
  const perDay = [...dayMap.entries()]
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  let cumIn = 0;
  let cumOut = 0;
  const backlog = perDay.map((d) => {
    cumIn += d.incoming;
    cumOut += d.outgoing;
    return { date: d.date, cumulativeReceived: cumIn, cumulativeDispatched: cumOut, open: cumIn - cumOut };
  });

  const workingDays = perDay.filter((d) => d.incoming > 0).length;
  const dispatchDays = perDay.filter((d) => d.outgoing > 0).length;
  const flowRates = {
    avgIncomingPerDay: workingDays ? round1(rows.length / workingDays) : 0,
    avgIncomingLitresPerDay: workingDays ? Math.round(litres / workingDays) : 0,
    avgOutgoingPerDay: dispatchDays ? round1(dispatchedRows.length / dispatchDays) : 0,
    avgOutgoingLitresPerDay: dispatchDays ? Math.round(litresOf(dispatchedRows) / dispatchDays) : 0,
    peakOpenOrders: backlog.reduce((m, b) => Math.max(m, b.open), 0),
  };

  // ---- weekly trend: does service hold up when intake spikes?
  const weekly = groupBy(
    rows,
    (r) => (r.lrDate ? isoWeek(r.lrDate).key : null),
    (week, rs) => {
      const s = onTimeStats(rs);
      return {
        week,
        weekStart: isoDay(isoWeek(rs[0].lrDate as Date).start),
        shipments: rs.length,
        litres: litresOf(rs),
        onTimePct: s.pct,
        measurable: s.measurable,
      };
    }
  ).sort((a, b) => a.week.localeCompare(b.week));

  // ---- weekday rhythm: which days take orders in vs push trucks out
  const weekday = WEEKDAYS.map((day) => ({ day, incoming: 0, outgoing: 0 }));
  const weekdayIndex = (d: Date) => (d.getUTCDay() + 6) % 7;
  for (const r of rows) {
    if (r.lrDate) weekday[weekdayIndex(r.lrDate)].incoming++;
    if (r.dispatchDate) weekday[weekdayIndex(r.dispatchDate)].outgoing++;
  }

  // ---- distance bands measured from the dispatching hub
  const distanceBands = DISTANCE_BANDS.map((band) => {
    const rs = rows.filter(
      (r) => distanceBand(roadKm(r.branch, normaliseDestination(r.destination))) === band
    );
    const s = onTimeStats(rs);
    return {
      band,
      shipments: rs.length,
      litres: litresOf(rs),
      pctShipments: pct(rs.length, rows.length),
      pctLitres: pct(litresOf(rs), litres),
      onTimePct: s.pct,
      measurable: s.measurable,
      avgTatDays: avgOf(rs.map(totalTatDays)),
      avgDwellDays: avgOf(rs.map(dwellDays)),
      avgRoadDays: avgTransit(rs),
      delivered: rs.filter((r) => r.deliveryStatus === 'Delivered').length,
    };
  }).filter((b) => b.shipments > 0);

  // ---- zone rollup
  const zones = groupBy(
    rows,
    (r) => zoneOf(normaliseDestination(r.destination)),
    (zone, rs) => {
      const s = onTimeStats(rs);
      return {
        zone,
        shipments: rs.length,
        litres: litresOf(rs),
        pctLitres: pct(litresOf(rs), litres),
        onTimePct: s.pct,
        measurable: s.measurable,
        avgTatDays: avgOf(rs.map(totalTatDays)),
        destinations: new Set(rs.map((r) => normaliseDestination(r.destination)).filter(Boolean)).size,
      };
    }
  ).sort((a, b) => b.litres - a.litres);

  return {
    meta: {
      totalRows,
      filteredRows: rows.length,
      truncated: rows.length >= MAX_ROWS,
      dateRange: dates.length
        ? {
            from: isoDay(new Date(Math.min(...dates.map((d) => d.getTime())))),
            to: isoDay(new Date(Math.max(...dates.map((d) => d.getTime())))),
          }
        : null,
      generatedAt: new Date().toISOString(),
    },
    kpis: {
      shipments: rows.length,
      litres,
      buckets,
      onTimePct: ot.pct,
      onTimeMeasurable: ot.measurable,
      onTimeLate: ot.late,
      avgDelayDays: ot.avgDelayDays,
      deliveredCount: delivered.length,
      deliveredPct: pct(delivered.length, rows.length),
      inTransitCount: rows.filter((r) => r.deliveryStatus === 'In Transit').length,
      pendingCount: rows.filter((r) => r.deliveryStatus === 'Pending').length,
      returnedCount: returned.length,
      returnedPct: pct(returned.length, rows.length),
      podReceivedCount: podReceived.length,
      podReceivedPct: pct(podReceived.length, rows.length),
      podOutstandingCount: rows.length - podReceived.length,
      damageCount: rows.filter((r) => r.damage === true).length,
      avgTransitDays: avgTransit(rows),
      branchCount: new Set(rows.map((r) => r.branch).filter(Boolean)).size,
      vendorCount: new Set(rows.map((r) => r.vendorName).filter(Boolean)).size,
      partyCount: new Set(rows.map((r) => r.partyName).filter(Boolean)).size,
      vehicleCount: new Set(rows.map((r) => r.vehicleNumber).filter(Boolean)).size,
      destinationCount: new Set(rows.map((r) => r.destination).filter(Boolean)).size,
    },
    deliveryStatus,
    pod: { byStatus: podStatus, ageing: podAgeing, byBranch: podByBranch },
    onTime: { byBranch: onTimeByBranch, byMonth: onTimeByMonth, delayDistribution },
    volume: { byDay, byMonth, byBranch, bySku, byLoadType, topParties, topDestinations },
    vendors,
    vehicles,
    lanes,
    flow,
    scorecard,
    businessUnit,
    dropSize,
    cycleTime,
    perDay,
    backlog,
    flowRates,
    weekly,
    weekday,
    distanceBands,
    zones,
    trips,
    dataQuality,
  };
}

/** Distinct values for the filter bar, plus the overall date bounds. */
export async function getFilterOptions() {
  const [branches, vendors, skus, loadTypes, statuses, bounds] = await Promise.all([
    prisma.shipment.findMany({ where: { branch: { not: null } }, select: { branch: true }, distinct: ['branch'], orderBy: { branch: 'asc' } }),
    prisma.shipment.findMany({ where: { vendorName: { not: null } }, select: { vendorName: true }, distinct: ['vendorName'], orderBy: { vendorName: 'asc' } }),
    prisma.shipment.findMany({ where: { materialSku: { not: null } }, select: { materialSku: true }, distinct: ['materialSku'] }),
    prisma.shipment.findMany({ where: { loadType: { not: null } }, select: { loadType: true }, distinct: ['loadType'] }),
    prisma.shipment.findMany({ where: { deliveryStatus: { not: null } }, select: { deliveryStatus: true }, distinct: ['deliveryStatus'] }),
    prisma.shipment.aggregate({ _min: { lrDate: true }, _max: { lrDate: true } }),
  ]);

  return {
    branches: branches.map((b) => b.branch as string),
    // Pseudonyms, matching what the charts show. resolveFilters maps them back.
    vendors: [...new Set(vendors.map((v) => carrierLabel(v.vendorName) as string))].sort(),
    // Sort SKUs by pack size, not alphabetically, so 5L < 10L < 20L < 210L.
    skus: skus
      .map((s) => s.materialSku as string)
      .sort((a, b) => parseFloat(a) - parseFloat(b)),
    loadTypes: loadTypes.map((l) => l.loadType as string),
    deliveryStatuses: statuses.map((s) => s.deliveryStatus as string),
    dateRange: {
      from: bounds._min.lrDate ? isoDay(bounds._min.lrDate) : null,
      to: bounds._max.lrDate ? isoDay(bounds._max.lrDate) : null,
    },
  };
}

export interface ShipmentPageQuery extends ShipmentFilters {
  page?: number;
  pageSize?: number;
  search?: string | null;
  sortBy?: string | null;
  sortDir?: 'asc' | 'desc';
}

const SORTABLE = new Set([
  'lrDate', 'branch', 'partyName', 'destination', 'totalQuantityLtr', 'buckets',
  'deliveryStatus', 'podStatus', 'vendorName', 'delayDays', 'lrNo', 'vehicleNumber',
]);

/** Paginated drill-down table behind the charts. */
export async function getShipments(rawQuery: ShipmentPageQuery) {
  const q = await resolveFilters(rawQuery);
  const page = Math.max(1, q.page || 1);
  const pageSize = Math.min(200, Math.max(1, q.pageSize || 50));

  const where = buildWhere(q);
  if (q.search) {
    const contains = q.search.trim();
    if (contains) {
      where.OR = [
        { partyName: { contains, mode: 'insensitive' } },
        { destination: { contains, mode: 'insensitive' } },
        { lrNo: { contains, mode: 'insensitive' } },
        { invoiceNumber: { contains, mode: 'insensitive' } },
        { vehicleNumber: { contains, mode: 'insensitive' } },
        { vendorName: { contains, mode: 'insensitive' } },
      ];
    }
  }

  const sortBy = q.sortBy && SORTABLE.has(q.sortBy) ? q.sortBy : 'lrDate';
  const sortDir: 'asc' | 'desc' = q.sortDir === 'asc' ? 'asc' : 'desc';

  const [rows, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.shipment.count({ where }),
  ]);

  return { rows: rows.map(forClient), total, page, pageSize, pageCount: Math.ceil(total / pageSize) };
}

/** Every row matching the filter, ordered for export. Bounded by MAX_ROWS. */
export async function getAllShipments(rawFilters: ShipmentFilters) {
  const f = await resolveFilters(rawFilters);
  const rows = await prisma.shipment.findMany({
    where: buildWhere(f),
    orderBy: [{ lrDate: 'asc' }, { id: 'asc' }],
    take: MAX_ROWS,
  });
  return rows.map(forClient);
}
