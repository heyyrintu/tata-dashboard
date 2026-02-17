import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';
import {
  BUCKET_RATES, BARREL_RATES, BARREL_TO_BUCKET_RATIO,
  DISTANCE_RANGES, FIXED_VEHICLES, FIXED_KM, KM_COST_RATE, TOTAL_BUDGET,
  BUCKET_CAPACITY_KG, BARREL_CAPACITY_KG,
} from '../config/constants';

// ─── Date Filter Helper ──────────────────────────────────────────────────────

function buildDateWhere(fromDate: Date | null, toDate: Date | null): Prisma.Sql {
  const parts: Prisma.Sql[] = [];
  if (fromDate) {
    parts.push(Prisma.sql`"indentDate" >= ${fromDate}`);
  }
  if (toDate) {
    const end = new Date(toDate);
    end.setUTCHours(23, 59, 59, 999);
    parts.push(Prisma.sql`"indentDate" <= ${end}`);
  }
  if (parts.length === 0) return Prisma.sql`TRUE`;
  return Prisma.join(parts, ' AND ');
}

// ─── Month Key Helper ───────────────────────────────────────────────────────
// Normalizes freightTigerMonth (Mon-YY format like "Mar-25") to YYYY-MM,
// falling back to indentDate. Handles "0ct" typo for October and filters garbage.

export function monthKeyExpr(): Prisma.Sql {
  return Prisma.sql`
    CASE
      WHEN TRIM(COALESCE("freightTigerMonth", '')) ~ '^[A-Za-z0][A-Za-z]{2}-[0-9]{2}$'
      THEN TO_CHAR(
        TO_DATE(REPLACE(TRIM("freightTigerMonth"), '0ct', 'Oct'), 'Mon-YY'),
        'YYYY-MM'
      )
      ELSE TO_CHAR("indentDate", 'YYYY-MM')
    END`;
}

// ─── QUERY 1: Summary Cards ─────────────────────────────────────────────────

export async function querySummaryCards(fromDate: Date | null, toDate: Date | null) {
  const dateFilter = buildDateWhere(fromDate, toDate);

  const result = await prisma.$queryRaw<[{
    total_indents: bigint;
    total_trips: bigint;
    total_load: number;
    total_cost: number;
    total_profit_loss: number;
    total_buckets: number;
    total_barrels: number;
    total_remaining_cost: number;
    total_vehicle_cost: number;
    all_count: bigint;
    valid_count: bigint;
  }]>`
    WITH
      filtered AS (
        SELECT * FROM trips t WHERE ${dateFilter}
      ),
      valid AS (
        SELECT * FROM filtered
        WHERE range IS NOT NULL AND TRIM(range) != ''
      ),
      single_range_indents AS (
        SELECT indent FROM valid
        WHERE range IN ('0-100Km', '101-250Km', '251-400Km', '401-600Km')
          AND indent IS NOT NULL
        GROUP BY indent
        HAVING COUNT(DISTINCT range) = 1
      ),
      standard_valid AS (
        SELECT v.* FROM valid v
        INNER JOIN single_range_indents sri ON v.indent = sri.indent
        WHERE v.range IN ('0-100Km', '101-250Km', '251-400Km', '401-600Km')
      )
    SELECT
      (SELECT COUNT(DISTINCT indent) FROM filtered WHERE indent IS NOT NULL AND TRIM(indent) != '') AS total_indents,
      (SELECT COUNT(DISTINCT indent) FROM valid WHERE indent IS NOT NULL AND TRIM(indent) != '') AS total_trips,
      COALESCE(SUM(f."totalLoad"), 0) AS total_load,
      COALESCE(SUM(f."totalCostAE"), 0) AS total_cost,
      COALESCE(SUM(f."profitLoss"), 0) AS total_profit_loss,
      COALESCE((SELECT SUM(sv."noOfBuckets") FROM standard_valid sv WHERE TRIM(sv.material) = '20L Buckets'), 0) AS total_buckets,
      COALESCE((SELECT SUM(sv."noOfBuckets") FROM standard_valid sv WHERE TRIM(sv.material) = '210L Barrels'), 0) AS total_barrels,
      COALESCE(SUM(f."remainingCost"), 0) AS total_remaining_cost,
      COALESCE((SELECT SUM(v."vehicleCost") FROM valid v), 0) AS total_vehicle_cost,
      COUNT(*) AS all_count,
      (SELECT COUNT(*) FROM valid) AS valid_count
    FROM filtered f;
  `;

  const row = result[0];
  const totalTrips = Number(row.total_trips);
  const totalBuckets = Number(row.total_buckets);
  const totalBarrels = Number(row.total_barrels);
  const avgBucketsPerTrip = totalTrips > 0
    ? Math.round((totalBuckets + totalBarrels * BARREL_TO_BUCKET_RATIO) / totalTrips)
    : 0;

  return {
    totalIndents: Number(row.total_indents),
    totalTrips,
    totalLoad: Number(row.total_load),
    totalCost: Number(row.total_cost),
    totalProfitLoss: Number(row.total_profit_loss),
    totalBuckets,
    totalBarrels,
    avgBucketsPerTrip,
    totalRemainingCost: Number(row.total_remaining_cost),
    totalVehicleCost: Number(row.total_vehicle_cost),
    allIndentsCount: Number(row.all_count),
    validIndentsCount: Number(row.valid_count),
  };
}

// ─── QUERY 2: Range-wise Breakdown ──────────────────────────────────────────

export async function queryRangeWise(fromDate: Date | null, toDate: Date | null) {
  const dateFilter = buildDateWhere(fromDate, toDate);

  const rows = await prisma.$queryRaw<Array<{
    range: string;
    indent_count: bigint;
    unique_indent_count: bigint;
    total_load: number;
    bucket_count: number;
    barrel_count: number;
    total_cost_ae: number;
    profit_loss: number;
    total_km: number;
  }>>`
    SELECT
      CASE
        WHEN range IN ('0-100Km', '101-250Km', '251-400Km', '401-600Km') THEN range
        ELSE 'Other'
      END AS range,
      COUNT(*) AS indent_count,
      COUNT(DISTINCT indent) AS unique_indent_count,
      COALESCE(SUM("totalLoad"), 0) AS total_load,
      COALESCE(SUM(CASE WHEN TRIM(material) = '20L Buckets' THEN "noOfBuckets" ELSE 0 END), 0) AS bucket_count,
      COALESCE(SUM(CASE WHEN TRIM(material) = '210L Barrels' THEN "noOfBuckets" ELSE 0 END), 0) AS barrel_count,
      COALESCE(SUM("totalCostAE"), 0) AS total_cost_ae,
      COALESCE(SUM("profitLoss"), 0) AS profit_loss,
      COALESCE(SUM("totalKm"), 0) AS total_km
    FROM trips
    WHERE ${dateFilter}
      AND range IS NOT NULL AND TRIM(range) != ''
      AND LOWER(COALESCE(remarks, '')) NOT LIKE '%cancel%'
    GROUP BY
      CASE WHEN range IN ('0-100Km', '101-250Km', '251-400Km', '401-600Km') THEN range ELSE 'Other' END
    ORDER BY
      MIN(CASE
        WHEN range = '0-100Km' THEN 1
        WHEN range = '101-250Km' THEN 2
        WHEN range = '251-400Km' THEN 3
        WHEN range = '401-600Km' THEN 4
        ELSE 5
      END);
  `;

  const totalRows = rows.reduce((s, r) => s + Number(r.indent_count), 0);
  const rangeMap = new Map(rows.map(r => [r.range, r]));

  const rangeData: Array<{
    range: string; indentCount: number; uniqueIndentCount: number;
    totalLoad: number; percentage: number; bucketCount: number; barrelCount: number;
    totalCostAE: number; profitLoss: number; totalKm: number;
    bucketRevenue: number; barrelRevenue: number; totalRevenue: number;
  }> = [...DISTANCE_RANGES].map(label => {
    const r = rangeMap.get(label);
    const indentCount = r ? Number(r.indent_count) : 0;
    const bucketCount = r ? Number(r.bucket_count) : 0;
    const barrelCount = r ? Number(r.barrel_count) : 0;
    return {
      range: label,
      indentCount,
      uniqueIndentCount: r ? Number(r.unique_indent_count) : 0,
      totalLoad: r ? Number(r.total_load) : 0,
      percentage: totalRows > 0 ? parseFloat(((indentCount / totalRows) * 100).toFixed(2)) : 0,
      bucketCount,
      barrelCount,
      totalCostAE: r ? Number(r.total_cost_ae) : 0,
      profitLoss: r ? Number(r.profit_loss) : 0,
      totalKm: r ? Number(r.total_km) : 0,
      bucketRevenue: bucketCount * (BUCKET_RATES[label] || 0),
      barrelRevenue: barrelCount * (BARREL_RATES[label] || 0),
      totalRevenue: bucketCount * (BUCKET_RATES[label] || 0) + barrelCount * (BARREL_RATES[label] || 0),
    };
  });

  const other = rangeMap.get('Other');
  if (other) {
    const indentCount = Number(other.indent_count);
    rangeData.push({
      range: 'Other',
      indentCount,
      uniqueIndentCount: Number(other.unique_indent_count),
      totalLoad: Number(other.total_load),
      percentage: totalRows > 0 ? parseFloat(((indentCount / totalRows) * 100).toFixed(2)) : 0,
      bucketCount: Number(other.bucket_count),
      barrelCount: Number(other.barrel_count),
      totalCostAE: Number(other.total_cost_ae),
      profitLoss: Number(other.profit_loss),
      totalKm: Number(other.total_km),
      bucketRevenue: 0,
      barrelRevenue: 0,
      totalRevenue: 0,
    });
  }

  // Totals for remaining cost from valid (non-cancelled) rows only — same population as rangeData
  const remainingCostResult = await prisma.$queryRaw<[{ total: number }]>`
    SELECT COALESCE(SUM("remainingCost"), 0) AS total FROM trips
    WHERE ${dateFilter}
      AND range IS NOT NULL AND TRIM(range) != ''
      AND LOWER(COALESCE(remarks, '')) NOT LIKE '%cancel%'
  `;

  return {
    rangeData,
    totalRows,
    totalUniqueIndents: rangeData.reduce((s, r) => s + r.uniqueIndentCount, 0),
    totalLoad: rangeData.reduce((s, r) => s + r.totalLoad, 0),
    totalBuckets: rangeData.reduce((s, r) => s + r.bucketCount, 0),
    totalBarrels: rangeData.reduce((s, r) => s + r.barrelCount, 0),
    totalCost: rangeData.reduce((s, r) => s + r.totalCostAE, 0),
    totalProfitLoss: rangeData.reduce((s, r) => s + r.profitLoss, 0),
    totalRevenue: rangeData.reduce((s, r) => s + r.totalRevenue, 0),
    totalRemainingCost: Number(remainingCostResult[0].total),
    totalVehicleCost: rangeData.reduce((s, r) => s + r.totalCostAE, 0) - Number(remainingCostResult[0].total),
  };
}

// ─── QUERY 3: Revenue by Range ──────────────────────────────────────────────

export async function queryRevenueByRange(fromDate: Date | null, toDate: Date | null) {
  const dateFilter = buildDateWhere(fromDate, toDate);

  const rows = await prisma.$queryRaw<Array<{
    range: string;
    bucket_count: number;
    barrel_count: number;
    bucket_revenue: number;
    barrel_revenue: number;
    total_revenue: number;
  }>>`
    SELECT
      range,
      COALESCE(SUM(CASE WHEN TRIM(material) = '20L Buckets' THEN "noOfBuckets" ELSE 0 END), 0) AS bucket_count,
      COALESCE(SUM(CASE WHEN TRIM(material) = '210L Barrels' THEN "noOfBuckets" ELSE 0 END), 0) AS barrel_count,
      COALESCE(SUM(
        CASE WHEN TRIM(material) = '20L Buckets' THEN
          "noOfBuckets" * CASE range
            WHEN '0-100Km' THEN 21.0 WHEN '101-250Km' THEN 40.0
            WHEN '251-400Km' THEN 68.0 WHEN '401-600Km' THEN 105.0 ELSE 0 END
        ELSE 0 END
      ), 0) AS bucket_revenue,
      COALESCE(SUM(
        CASE WHEN TRIM(material) = '210L Barrels' THEN
          "noOfBuckets" * CASE range
            WHEN '0-100Km' THEN 220.5 WHEN '101-250Km' THEN 420.0
            WHEN '251-400Km' THEN 714.0 WHEN '401-600Km' THEN 1081.5 ELSE 0 END
        ELSE 0 END
      ), 0) AS barrel_revenue,
      COALESCE(SUM(
        CASE
          WHEN TRIM(material) = '20L Buckets' THEN "noOfBuckets" * CASE range
            WHEN '0-100Km' THEN 21.0 WHEN '101-250Km' THEN 40.0
            WHEN '251-400Km' THEN 68.0 WHEN '401-600Km' THEN 105.0 ELSE 0 END
          WHEN TRIM(material) = '210L Barrels' THEN "noOfBuckets" * CASE range
            WHEN '0-100Km' THEN 220.5 WHEN '101-250Km' THEN 420.0
            WHEN '251-400Km' THEN 714.0 WHEN '401-600Km' THEN 1081.5 ELSE 0 END
          ELSE 0
        END
      ), 0) AS total_revenue
    FROM trips
    WHERE ${dateFilter}
      AND range IN ('0-100Km', '101-250Km', '251-400Km', '401-600Km')
    GROUP BY range
    ORDER BY CASE range
      WHEN '0-100Km' THEN 1 WHEN '101-250Km' THEN 2
      WHEN '251-400Km' THEN 3 WHEN '401-600Km' THEN 4 END;
  `;

  const rowMap = new Map(rows.map(r => [r.range, r]));
  const revenueByRange = [...DISTANCE_RANGES].map(label => {
    const r = rowMap.get(label);
    return {
      range: label,
      bucketRate: BUCKET_RATES[label] || 0,
      barrelRate: BARREL_RATES[label] || 0,
      bucketCount: r ? Number(r.bucket_count) : 0,
      barrelCount: r ? Number(r.barrel_count) : 0,
      bucketRevenue: r ? Number(r.bucket_revenue) : 0,
      barrelRevenue: r ? Number(r.barrel_revenue) : 0,
      revenue: r ? Number(r.total_revenue) : 0,
    };
  });

  return {
    revenueByRange,
    totalRevenue: revenueByRange.reduce((s, r) => s + r.revenue, 0),
  };
}

// ─── QUERY 4: Revenue Over Time ─────────────────────────────────────────────

export async function queryRevenueOverTime(
  fromDate: Date | null,
  toDate: Date | null,
  granularity: string
) {
  const dateFilter = buildDateWhere(fromDate, toDate);

  const timeKey = granularity === 'daily'
    ? Prisma.sql`TO_CHAR("indentDate", 'YYYY-MM-DD')`
    : granularity === 'weekly'
    ? Prisma.sql`'Week ' || EXTRACT(WEEK FROM "indentDate")::text || ', ' || EXTRACT(YEAR FROM "indentDate")::text`
    : monthKeyExpr();

  const whereClause = granularity === 'monthly'
    ? Prisma.sql`"indentDate" IS NOT NULL`
    : Prisma.sql`${dateFilter} AND "indentDate" IS NOT NULL`;

  const rows = await prisma.$queryRaw<Array<{ time_key: string; total_revenue: number }>>`
    SELECT
      ${timeKey} AS time_key,
      COALESCE(SUM(
        CASE
          WHEN TRIM(material) = '20L Buckets' THEN "noOfBuckets" * CASE range
            WHEN '0-100Km' THEN 21.0 WHEN '101-250Km' THEN 40.0
            WHEN '251-400Km' THEN 68.0 WHEN '401-600Km' THEN 105.0 ELSE 0 END
          WHEN TRIM(material) = '210L Barrels' THEN "noOfBuckets" * CASE range
            WHEN '0-100Km' THEN 220.5 WHEN '101-250Km' THEN 420.0
            WHEN '251-400Km' THEN 714.0 WHEN '401-600Km' THEN 1081.5 ELSE 0 END
          ELSE 0
        END
      ), 0) AS total_revenue
    FROM trips
    WHERE ${whereClause}
      AND range IN ('0-100Km', '101-250Km', '251-400Km', '401-600Km')
    GROUP BY ${timeKey}
    ORDER BY ${timeKey};
  `;

  return rows.map(r => ({
    date: String(r.time_key),
    revenue: Number(r.total_revenue),
  }));
}

// ─── QUERY 5: Cost Over Time ────────────────────────────────────────────────

export async function queryCostOverTime(
  fromDate: Date | null,
  toDate: Date | null,
  granularity: string
) {
  const dateFilter = buildDateWhere(fromDate, toDate);

  const timeKey = granularity === 'daily'
    ? Prisma.sql`TO_CHAR("indentDate", 'YYYY-MM-DD')`
    : granularity === 'weekly'
    ? Prisma.sql`'Week ' || EXTRACT(WEEK FROM "indentDate")::text || ', ' || EXTRACT(YEAR FROM "indentDate")::text`
    : monthKeyExpr();

  const whereClause = granularity === 'monthly'
    ? Prisma.sql`"indentDate" IS NOT NULL`
    : Prisma.sql`${dateFilter} AND "indentDate" IS NOT NULL`;

  const rows = await prisma.$queryRaw<Array<{ time_key: string; total_cost: number }>>`
    SELECT
      ${timeKey} AS time_key,
      COALESCE(SUM("totalCostAE"), 0) AS total_cost
    FROM trips
    WHERE ${whereClause}
      AND range IN ('0-100Km', '101-250Km', '251-400Km', '401-600Km')
    GROUP BY ${timeKey}
    ORDER BY ${timeKey};
  `;

  return rows.map(r => ({
    date: String(r.time_key),
    cost: Number(r.total_cost),
  }));
}

// ─── QUERY 6: P&L Over Time ────────────────────────────────────────────────

export async function queryProfitLossOverTime(
  fromDate: Date | null,
  toDate: Date | null,
  granularity: string
) {
  const dateFilter = buildDateWhere(fromDate, toDate);

  const timeKey = granularity === 'daily'
    ? Prisma.sql`TO_CHAR("indentDate", 'YYYY-MM-DD')`
    : granularity === 'weekly'
    ? Prisma.sql`'Week ' || EXTRACT(WEEK FROM "indentDate")::text || ', ' || EXTRACT(YEAR FROM "indentDate")::text`
    : monthKeyExpr();

  const whereClause = granularity === 'monthly'
    ? Prisma.sql`"indentDate" IS NOT NULL`
    : Prisma.sql`${dateFilter} AND "indentDate" IS NOT NULL`;

  const rows = await prisma.$queryRaw<Array<{ time_key: string; total_pl: number }>>`
    SELECT
      ${timeKey} AS time_key,
      COALESCE(SUM("profitLoss"), 0) AS total_pl
    FROM trips
    WHERE ${whereClause}
      AND range IN ('0-100Km', '101-250Km', '251-400Km', '401-600Km')
    GROUP BY ${timeKey}
    ORDER BY ${timeKey};
  `;

  return rows.map(r => ({
    date: String(r.time_key),
    profitLoss: Number(r.total_pl),
  }));
}

// ─── QUERY 7: Cost by Range ────────────────────────────────────────────────

export async function queryCostByRange(fromDate: Date | null, toDate: Date | null) {
  const where: Prisma.TripWhereInput = {
    range: { in: [...DISTANCE_RANGES] },
    ...(fromDate || toDate ? {
      indentDate: {
        ...(fromDate ? { gte: fromDate } : {}),
        ...(toDate ? { lte: (() => { const d = new Date(toDate); d.setUTCHours(23, 59, 59, 999); return d; })() } : {}),
      },
    } : {}),
  };

  const grouped = await prisma.trip.groupBy({
    by: ['range'],
    where,
    _sum: { totalCostAE: true },
  });

  const costByRange = [...DISTANCE_RANGES].map(label => {
    const g = grouped.find(r => r.range === label);
    return { range: label, cost: g?._sum.totalCostAE ?? 0 };
  });

  return {
    costByRange,
    totalCost: costByRange.reduce((s, r) => s + r.cost, 0),
  };
}

// ─── QUERY 8: P&L by Range ────────────────────────────────────────────────

export async function queryProfitLossByRange(fromDate: Date | null, toDate: Date | null) {
  const where: Prisma.TripWhereInput = {
    range: { in: [...DISTANCE_RANGES] },
    ...(fromDate || toDate ? {
      indentDate: {
        ...(fromDate ? { gte: fromDate } : {}),
        ...(toDate ? { lte: (() => { const d = new Date(toDate); d.setUTCHours(23, 59, 59, 999); return d; })() } : {}),
      },
    } : {}),
  };

  const grouped = await prisma.trip.groupBy({
    by: ['range'],
    where,
    _sum: { profitLoss: true },
  });

  const profitLossByRange = [...DISTANCE_RANGES].map(label => {
    const g = grouped.find(r => r.range === label);
    return { range: label, profitLoss: g?._sum.profitLoss ?? 0 };
  });

  return {
    profitLossByRange,
    totalProfitLoss: profitLossByRange.reduce((s, r) => s + r.profitLoss, 0),
  };
}

// ─── QUERY 9: Vehicle Cost ──────────────────────────────────────────────────

export async function queryVehicleCost(fromDate: Date | null, toDate: Date | null) {
  const where: Prisma.TripWhereInput = {
    vehicleNumber: { in: [...FIXED_VEHICLES] },
    ...(fromDate || toDate ? {
      indentDate: {
        ...(fromDate ? { gte: fromDate } : {}),
        ...(toDate ? { lte: (() => { const d = new Date(toDate); d.setUTCHours(23, 59, 59, 999); return d; })() } : {}),
      },
    } : {}),
  };

  const grouped = await prisma.trip.groupBy({
    by: ['vehicleNumber'],
    where,
    _sum: { totalKm: true },
  });

  return FIXED_VEHICLES.map(vehicleNumber => {
    const g = grouped.find(r => r.vehicleNumber === vehicleNumber);
    const actualKm = g?._sum.totalKm ?? 0;
    const remainingKm = FIXED_KM - actualKm;
    const costForRemainingKm = remainingKm * KM_COST_RATE;
    // extraCost = cost consumed so far = actualKm * KM_COST_RATE
    // (equivalent to TOTAL_BUDGET - costForRemainingKm since TOTAL_BUDGET = FIXED_KM * KM_COST_RATE)
    const extraCost = actualKm * KM_COST_RATE;
    return { vehicleNumber, fixedKm: FIXED_KM, actualKm, remainingKm, costForRemainingKm, extraCost };
  });
}

// ─── QUERY 10: Load Over Time ───────────────────────────────────────────────

export async function queryLoadOverTime(
  fromDate: Date | null,
  toDate: Date | null,
  granularity: string
) {
  const dateFilter = buildDateWhere(fromDate, toDate);

  const timeKey = granularity === 'daily'
    ? Prisma.sql`TO_CHAR("indentDate", 'YYYY-MM-DD')`
    : granularity === 'weekly'
    ? Prisma.sql`'Week ' || EXTRACT(WEEK FROM "indentDate")::text || ', ' || EXTRACT(YEAR FROM "indentDate")::text`
    : monthKeyExpr();

  const whereClause = granularity === 'monthly'
    ? Prisma.sql`"indentDate" IS NOT NULL`
    : Prisma.sql`${dateFilter} AND "indentDate" IS NOT NULL`;

  const rows = await prisma.$queryRaw<Array<{
    time_key: string;
    total_load: number;
    indent_count: bigint;
    bucket_count: number;
    barrel_count: number;
    avg_fulfillment: number;
  }>>`
    SELECT
      ${timeKey} AS time_key,
      COALESCE(SUM("totalLoad"), 0) AS total_load,
      COUNT(*) AS indent_count,
      COALESCE(SUM(CASE WHEN TRIM(material) = '20L Buckets' THEN "noOfBuckets" ELSE 0 END), 0) AS bucket_count,
      COALESCE(SUM(CASE WHEN TRIM(material) = '210L Barrels' THEN "noOfBuckets" ELSE 0 END), 0) AS barrel_count,
      COALESCE(AVG(
        ("totalLoad" / NULLIF(
          CASE WHEN TRIM(material) = '210L Barrels' THEN ${BARREL_CAPACITY_KG}::float ELSE ${BUCKET_CAPACITY_KG}::float END,
        0)) * 100.0
      ), 0) AS avg_fulfillment
    FROM trips
    WHERE ${whereClause}
    GROUP BY ${timeKey}
    ORDER BY ${timeKey};
  `;

  return rows.map(r => ({
    date: String(r.time_key),
    totalLoad: Number(r.total_load),
    indentCount: Number(r.indent_count),
    bucketCount: Number(r.bucket_count),
    barrelCount: Number(r.barrel_count),
    avgFulfillment: Number(r.avg_fulfillment),
  }));
}

// ─── QUERY 11: Fulfillment ──────────────────────────────────────────────────

export async function queryFulfillment(fromDate: Date | null, toDate: Date | null) {
  const dateFilter = buildDateWhere(fromDate, toDate);

  const rows = await prisma.$queryRaw<Array<{
    bucket_band: string;
    indent_count: bigint;
    unique_indent_count: bigint;
  }>>`
    WITH bucket_equiv AS (
      SELECT
        indent,
        CASE
          WHEN TRIM(material) = '20L Buckets' THEN COALESCE("noOfBuckets", 0)
          WHEN TRIM(material) = '210L Barrels' THEN COALESCE("noOfBuckets", 0) * ${BARREL_TO_BUCKET_RATIO}
          ELSE 0
        END AS bucket_equiv
      FROM trips
      WHERE ${dateFilter}
        AND range IS NOT NULL AND TRIM(range) != ''
        AND indent IS NOT NULL
    ),
    classified AS (
      SELECT indent, bucket_equiv,
        CASE
          WHEN bucket_equiv <= 150 THEN '0 - 150'
          WHEN bucket_equiv <= 200 THEN '151 - 200'
          WHEN bucket_equiv <= 250 THEN '201 - 250'
          WHEN bucket_equiv <= 300 THEN '251 - 300'
          ELSE '300+'
        END AS bucket_band,
        CASE
          WHEN bucket_equiv <= 150 THEN 1
          WHEN bucket_equiv <= 200 THEN 2
          WHEN bucket_equiv <= 250 THEN 3
          WHEN bucket_equiv <= 300 THEN 4
          ELSE 5
        END AS band_order
      FROM bucket_equiv
    )
    SELECT
      bucket_band,
      COUNT(*) AS indent_count,
      COUNT(DISTINCT indent) AS unique_indent_count
    FROM classified
    GROUP BY bucket_band, band_order
    ORDER BY band_order;
  `;

  const ALL_BANDS = ['0 - 150', '151 - 200', '201 - 250', '251 - 300', '300+'];
  const rowMap = new Map(rows.map(r => [r.bucket_band, r]));

  const fulfillmentData = ALL_BANDS.map(label => {
    const r = rowMap.get(label);
    return {
      range: label,
      bucketRange: label,
      tripCount: r ? Number(r.indent_count) : 0,
      indentCount: r ? Number(r.indent_count) : 0,
      uniqueIndentCount: r ? Number(r.unique_indent_count) : 0,
    };
  });

  return {
    fulfillmentData,
    totalTrips: fulfillmentData.reduce((s, r) => s + r.tripCount, 0),
  };
}

// ─── QUERY 12: Month-on-Month ───────────────────────────────────────────────

export async function queryMonthOnMonth() {
  const mk = monthKeyExpr();
  const rows = await prisma.$queryRaw<Array<{
    month_key: string;
    total_indents: bigint;
    total_trips: bigint;
    total_load: number;
    total_cost: number;
    total_profit_loss: number;
    total_revenue: number;
  }>>`
    SELECT
      ${mk} AS month_key,
      COUNT(DISTINCT indent) AS total_indents,
      COUNT(DISTINCT CASE WHEN range IS NOT NULL AND TRIM(range) != '' THEN indent END) AS total_trips,
      COALESCE(SUM("totalLoad"), 0) AS total_load,
      COALESCE(SUM("totalCostAE"), 0) AS total_cost,
      COALESCE(SUM("profitLoss"), 0) AS total_profit_loss,
      COALESCE(SUM(
        CASE
          WHEN TRIM(material) = '20L Buckets' THEN "noOfBuckets" * CASE range
            WHEN '0-100Km' THEN 21.0 WHEN '101-250Km' THEN 40.0
            WHEN '251-400Km' THEN 68.0 WHEN '401-600Km' THEN 105.0 ELSE 0 END
          WHEN TRIM(material) = '210L Barrels' THEN "noOfBuckets" * CASE range
            WHEN '0-100Km' THEN 220.5 WHEN '101-250Km' THEN 420.0
            WHEN '251-400Km' THEN 714.0 WHEN '401-600Km' THEN 1081.5 ELSE 0 END
          ELSE 0
        END
      ), 0) AS total_revenue
    FROM trips
    WHERE "indentDate" IS NOT NULL
    GROUP BY ${mk}
    ORDER BY month_key;
  `;

  return rows.map(r => ({
    month: String(r.month_key),
    indentCount: Number(r.total_indents),
    tripCount: Number(r.total_trips),
    totalLoad: Number(r.total_load),
    totalCost: Number(r.total_cost),
    totalProfitLoss: Number(r.total_profit_loss),
    totalRevenue: Number(r.total_revenue),
  }));
}

// ─── QUERY 13: Locations ────────────────────────────────────────────────────

export async function queryLocations(fromDate: Date | null, toDate: Date | null) {
  const dateFilter = buildDateWhere(fromDate, toDate);

  const rows = await prisma.$queryRaw<Array<{
    location: string;
    indent_count: bigint;
    total_load: number;
    range: string;
  }>>`
    SELECT
      location,
      COUNT(*) AS indent_count,
      COALESCE(SUM("totalLoad"), 0) AS total_load,
      MODE() WITHIN GROUP (ORDER BY range) AS range
    FROM trips
    WHERE ${dateFilter}
      AND location IS NOT NULL AND TRIM(location) != ''
      AND range IS NOT NULL AND TRIM(range) != ''
    GROUP BY location
    ORDER BY indent_count DESC;
  `;

  return rows.map(r => ({
    name: String(r.location),
    indentCount: Number(r.indent_count),
    totalLoad: Number(r.total_load),
    range: String(r.range),
  }));
}

// ─── QUERY 14: Metadata ────────────────────────────────────────────────────

export async function queryMeta() {
  const result = await prisma.$queryRaw<[{
    earliest: Date | null;
    latest: Date | null;
    total_rows: bigint;
  }]>`
    SELECT
      MIN("indentDate") AS earliest,
      MAX("indentDate") AS latest,
      COUNT(*) AS total_rows
    FROM trips;
  `;

  const mk = monthKeyExpr();
  const monthsResult = await prisma.$queryRaw<Array<{ month_key: string }>>`
    SELECT DISTINCT ${mk} AS month_key
    FROM trips
    WHERE "indentDate" IS NOT NULL
    ORDER BY month_key;
  `;

  const row = result[0];
  return {
    earliestIndentDate: row.earliest ? row.earliest.toISOString().split('T')[0] : null,
    latestIndentDate: row.latest ? row.latest.toISOString().split('T')[0] : null,
    availableMonths: monthsResult.map(r => String(r.month_key)),
    totalRows: Number(row.total_rows),
  };
}
