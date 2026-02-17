import { Request, Response } from 'express';
import { parseDateParam } from '../utils/dateFilter';
import {
  querySummaryCards, queryRangeWise, queryLocations, queryFulfillment,
  queryLoadOverTime, queryRevenueByRange, queryRevenueOverTime,
  queryCostByRange, queryCostOverTime, queryProfitLossByRange,
  queryProfitLossOverTime, queryMonthOnMonth, queryVehicleCost,
  monthKeyExpr,
} from '../services/analyticsQueryService';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { BARREL_TO_BUCKET_RATIO, FIXED_VEHICLES } from '../config/constants';
import { format } from 'date-fns';
import { filterIndentsByDate } from '../utils/dateFiltering';
import * as XLSX from 'xlsx';

// ─── Helper ──────────────────────────────────────────────────────────────────

function dateRange(fromDate: Date | null, toDate: Date | null) {
  return {
    from: fromDate?.toISOString().split('T')[0] || null,
    to: toDate?.toISOString().split('T')[0] || null,
  };
}

function formatMonthLabel(monthKey: string): string {
  if (!monthKey || !monthKey.includes('-')) return monthKey || 'Unknown';
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return monthKey;
  const monthDate = new Date(year, month - 1, 1);
  return format(monthDate, "MMM''yy");
}

// ─── Summary Cards (KPI) ────────────────────────────────────────────────────

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const fromDate = parseDateParam(req.query.fromDate as string);
    const toDate = parseDateParam(req.query.toDate as string);
    const cards = await querySummaryCards(fromDate, toDate);
    res.json({
      success: true,
      totalIndents: cards.totalIndents,
      totalIndentsUnique: cards.totalTrips,
      totalLoad: cards.totalLoad,
      totalBuckets: cards.totalBuckets,
      totalBarrels: cards.totalBarrels,
      avgBucketsPerTrip: cards.avgBucketsPerTrip,
      totalCost: cards.totalCost,
      totalProfitLoss: cards.totalProfitLoss,
      dateRange: dateRange(fromDate, toDate),
      recordsProcessed: cards.validIndentsCount,
    });
  } catch (error) {
    console.error('[getAnalytics] ERROR:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch analytics' });
  }
};

// ─── Range-wise Breakdown ───────────────────────────────────────────────────

export const getRangeWiseAnalytics = async (req: Request, res: Response) => {
  try {
    const fromDate = parseDateParam(req.query.fromDate as string);
    const toDate = parseDateParam(req.query.toDate as string);
    const [rangeResult, locations] = await Promise.all([
      queryRangeWise(fromDate, toDate),
      queryLocations(fromDate, toDate),
    ]);
    res.json({
      success: true,
      rangeData: rangeResult.rangeData,
      locations,
      totalUniqueIndents: rangeResult.totalUniqueIndents,
      totalLoad: rangeResult.totalLoad,
      totalCost: rangeResult.totalCost,
      totalProfitLoss: rangeResult.totalProfitLoss,
      totalRemainingCost: rangeResult.totalRemainingCost,
      totalVehicleCost: rangeResult.totalVehicleCost,
      totalBuckets: rangeResult.totalBuckets,
      totalBarrels: rangeResult.totalBarrels,
      totalRows: rangeResult.totalRows,
      dateRange: dateRange(fromDate, toDate),
    });
  } catch (error) {
    console.error('[getRangeWiseAnalytics] ERROR:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch range-wise analytics' });
  }
};

// ─── Fulfillment ────────────────────────────────────────────────────────────

export const getFulfillmentAnalytics = async (req: Request, res: Response) => {
  try {
    const fromDate = parseDateParam(req.query.fromDate as string);
    const toDate = parseDateParam(req.query.toDate as string);
    const result = await queryFulfillment(fromDate, toDate);
    res.json({
      success: true,
      fulfillmentData: result.fulfillmentData,
      totalTrips: result.totalTrips,
      dateRange: dateRange(fromDate, toDate),
    });
  } catch (error) {
    console.error('[getFulfillmentAnalytics] ERROR:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch fulfillment analytics' });
  }
};

// ─── Load Over Time ─────────────────────────────────────────────────────────

export const getLoadOverTime = async (req: Request, res: Response) => {
  try {
    const fromDate = parseDateParam(req.query.fromDate as string);
    const toDate = parseDateParam(req.query.toDate as string);
    const granularity = (req.query.granularity as string) || 'daily';
    const data = await queryLoadOverTime(fromDate, toDate, granularity);
    res.json({
      success: true,
      data,
      granularity,
      dateRange: dateRange(fromDate, toDate),
    });
  } catch (error) {
    console.error('[getLoadOverTime] ERROR:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch load over time data' });
  }
};

// ─── Revenue ────────────────────────────────────────────────────────────────

export const getRevenueAnalytics = async (req: Request, res: Response) => {
  try {
    const fromDate = parseDateParam(req.query.fromDate as string);
    const toDate = parseDateParam(req.query.toDate as string);
    const granularity = (req.query.granularity as string) || 'daily';
    const [byRange, overTime] = await Promise.all([
      queryRevenueByRange(fromDate, toDate),
      queryRevenueOverTime(fromDate, toDate, granularity),
    ]);
    res.json({
      success: true,
      revenueByRange: byRange.revenueByRange,
      totalRevenue: byRange.totalRevenue,
      revenueOverTime: overTime,
      granularity,
      dateRange: dateRange(fromDate, toDate),
    });
  } catch (error) {
    console.error('[getRevenueAnalytics] ERROR:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch revenue analytics' });
  }
};

// ─── Cost ───────────────────────────────────────────────────────────────────

export const getCostAnalytics = async (req: Request, res: Response) => {
  try {
    const fromDate = parseDateParam(req.query.fromDate as string);
    const toDate = parseDateParam(req.query.toDate as string);
    const granularity = (req.query.granularity as string) || 'daily';
    const [byRange, overTime] = await Promise.all([
      queryCostByRange(fromDate, toDate),
      queryCostOverTime(fromDate, toDate, granularity),
    ]);
    res.json({
      success: true,
      costByRange: byRange.costByRange,
      totalCost: byRange.totalCost,
      costOverTime: overTime,
      granularity,
      dateRange: dateRange(fromDate, toDate),
    });
  } catch (error) {
    console.error('[getCostAnalytics] ERROR:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch cost analytics' });
  }
};

// ─── Profit & Loss ──────────────────────────────────────────────────────────

export const getProfitLossAnalytics = async (req: Request, res: Response) => {
  try {
    const fromDate = parseDateParam(req.query.fromDate as string);
    const toDate = parseDateParam(req.query.toDate as string);
    const granularity = (req.query.granularity as string) || 'daily';
    const [byRange, overTime] = await Promise.all([
      queryProfitLossByRange(fromDate, toDate),
      queryProfitLossOverTime(fromDate, toDate, granularity),
    ]);
    res.json({
      success: true,
      profitLossByRange: byRange.profitLossByRange,
      totalProfitLoss: byRange.totalProfitLoss,
      profitLossOverTime: overTime,
      granularity,
      dateRange: dateRange(fromDate, toDate),
    });
  } catch (error) {
    console.error('[getProfitLossAnalytics] ERROR:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch profit & loss analytics' });
  }
};

// ─── Month-on-Month ─────────────────────────────────────────────────────────

export const getMonthOnMonthAnalytics = async (_req: Request, res: Response) => {
  try {
    const rawData = await queryMonthOnMonth();
    const data = rawData.map(r => ({
      month: formatMonthLabel(r.month),
      indentCount: r.indentCount,
      tripCount: r.tripCount,
    }));
    res.json({ success: true, data });
  } catch (error) {
    console.error('[getMonthOnMonthAnalytics] Error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch month-on-month analytics' });
  }
};

// ─── Vehicle Cost (Fixed Vehicles) ──────────────────────────────────────────

export const getVehicleCostAnalytics = async (req: Request, res: Response) => {
  try {
    const fromDate = parseDateParam(req.query.fromDate as string);
    const toDate = parseDateParam(req.query.toDate as string);
    const data = await queryVehicleCost(fromDate, toDate);
    res.json({
      success: true,
      data,
      dateRange: dateRange(fromDate, toDate),
    });
  } catch (error) {
    console.error('[getVehicleCostAnalytics] ERROR:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch vehicle cost analytics' });
  }
};

// ─── Monthly Vehicle Cost (SQL) ─────────────────────────────────────────────

export const getMonthlyVehicleCostAnalytics = async (_req: Request, res: Response) => {
  try {
    const mk = monthKeyExpr();
    const fixedKmRows = await prisma.$queryRaw<Array<{ month_key: string; actual_km: number }>>`
      SELECT
        ${mk} AS month_key,
        COALESCE(SUM("totalKm"), 0) AS actual_km
      FROM trips
      WHERE "vehicleNumber" IN (${Prisma.join([...FIXED_VEHICLES])})
        AND "indentDate" IS NOT NULL
      GROUP BY ${mk}
      ORDER BY month_key;
    `;

    const marketCostRows = await prisma.$queryRaw<Array<{ month_key: string; total_cost: number }>>`
      SELECT
        TO_CHAR(COALESCE("allocationDate", "indentDate"), 'YYYY-MM') AS month_key,
        COALESCE(SUM("totalCostAE"), 0) AS total_cost
      FROM trips
      WHERE UPPER(TRIM(COALESCE("vehicleBased", ''))) = 'MARKET'
        AND ("allocationDate" IS NOT NULL OR "indentDate" IS NOT NULL)
      GROUP BY TO_CHAR(COALESCE("allocationDate", "indentDate"), 'YYYY-MM')
      ORDER BY month_key;
    `;

    const monthlyMap = new Map<string, { actualKm: number; totalCost: number }>();
    for (const r of fixedKmRows) {
      const key = String(r.month_key);
      if (!monthlyMap.has(key)) monthlyMap.set(key, { actualKm: 0, totalCost: 0 });
      monthlyMap.get(key)!.actualKm = Number(r.actual_km);
    }
    for (const r of marketCostRows) {
      const key = String(r.month_key);
      if (!monthlyMap.has(key)) monthlyMap.set(key, { actualKm: 0, totalCost: 0 });
      monthlyMap.get(key)!.totalCost = Number(r.total_cost);
    }

    const result = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => ({
        month: formatMonthLabel(key),
        monthKey: key,
        actualKm: data.actualKm,
        costForRemainingKm: data.totalCost,
      }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[getMonthlyVehicleCostAnalytics] ERROR:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch monthly vehicle cost analytics' });
  }
};

// ─── Monthly Market Vehicle Revenue (SQL) ───────────────────────────────────

export const getMonthlyMarketVehicleRevenue = async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.$queryRaw<Array<{ month_key: string; revenue: number; cost: number }>>`
      SELECT
        TO_CHAR(COALESCE("allocationDate", "indentDate"), 'YYYY-MM') AS month_key,
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
        ), 0) AS revenue,
        COALESCE(SUM("totalCostAE"), 0) AS cost
      FROM trips
      WHERE UPPER(TRIM(COALESCE("vehicleBased", ''))) = 'MARKET'
        AND ("allocationDate" IS NOT NULL OR "indentDate" IS NOT NULL)
      GROUP BY TO_CHAR(COALESCE("allocationDate", "indentDate"), 'YYYY-MM')
      ORDER BY month_key;
    `;

    const result = rows.map(r => ({
      month: formatMonthLabel(String(r.month_key)),
      monthKey: String(r.month_key),
      revenue: Number(r.revenue),
      cost: Number(r.cost),
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[getMonthlyMarketVehicleRevenue] ERROR:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch monthly market vehicle revenue' });
  }
};

// ─── Latest Indent Date ─────────────────────────────────────────────────────

export const getLatestIndentDate = async (_req: Request, res: Response) => {
  try {
    const latestTrip = await prisma.trip.findFirst({
      orderBy: { indentDate: 'desc' },
      select: { indentDate: true },
    });
    if (!latestTrip?.indentDate) {
      return res.json({ success: true, latestIndentDate: null, message: 'No data available' });
    }
    const d = latestTrip.indentDate instanceof Date ? latestTrip.indentDate : new Date(latestTrip.indentDate);
    const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    res.json({ success: true, latestIndentDate: dateString });
  } catch (error) {
    console.error('[getLatestIndentDate] ERROR:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch latest indent date' });
  }
};

// ─── Export Missing Indents (needs raw rows for Excel) ──────────────────────

export const exportMissingIndents = async (req: Request, res: Response) => {
  try {
    const originalFromDateStr = req.query.fromDate as string | undefined;
    const originalToDateStr = req.query.toDate as string | undefined;
    const fromDate = parseDateParam(originalFromDateStr);
    const toDate = parseDateParam(originalToDateStr);

    const allIndents = await prisma.trip.findMany({ orderBy: { indentDate: 'asc' } });
    const dateFilterResult = filterIndentsByDate(allIndents, fromDate, toDate);
    const card2Indents = dateFilterResult.validIndents;

    // Replicate fulfillment assignment logic to find missing indents
    const fulfillmentIndents = new Set<string>();
    const bucketRanges = [
      { min: 0, max: 150 }, { min: 151, max: 200 },
      { min: 201, max: 250 }, { min: 251, max: 300 },
    ];

    for (const indent of card2Indents) {
      if (!indent.indent) continue;
      const material = (indent.material || '').trim();
      const noOfBuckets = indent.noOfBuckets || 0;
      let bucketCount = 0;
      if (material === '20L Buckets') bucketCount = noOfBuckets;
      else if (material === '210L Barrels') bucketCount = noOfBuckets * BARREL_TO_BUCKET_RATIO;

      let assigned = false;
      for (const range of bucketRanges) {
        if (bucketCount >= range.min && bucketCount <= range.max) { assigned = true; break; }
      }
      if (!assigned && bucketCount > 300) assigned = true;
      if (!assigned && bucketCount <= 0) assigned = true;
      if (assigned) fulfillmentIndents.add(indent.indent);
    }

    // Find missing: in Card 2 but not assigned to any fulfillment band
    const uniqueMissing = new Map<string, any>();
    for (const indent of card2Indents) {
      if (indent.indent && !fulfillmentIndents.has(indent.indent) && !uniqueMissing.has(indent.indent)) {
        uniqueMissing.set(indent.indent, indent);
      }
    }
    const missingArray = Array.from(uniqueMissing.values());

    // Build Excel data
    const excelData = missingArray.length === 0
      ? [{ 'S.No': 1, 'Indent': 'No missing indents found', 'Customer Name': 'All indents from Card 2 are included in Fulfillment Trends' }]
      : missingArray.map((indent: any, i) => ({
          'S.No': i + 1,
          'Indent Date': indent.indentDate ? format(indent.indentDate, 'yyyy-MM-dd') : '',
          'Indent': indent.indent || '',
          'Allocation Date': indent.allocationDate ? format(indent.allocationDate, 'yyyy-MM-dd') : '',
          'Customer Name': indent.customerName || '',
          'Location': indent.location || '',
          'Vehicle Model': indent.vehicleModel || '',
          'Vehicle Number': indent.vehicleNumber || '',
          'Vehicle Based': indent.vehicleBased || '',
          'LR No': indent.lrNo || '',
          'Material': indent.material || '',
          'Load Per Bucket': indent.loadPerBucket || 0,
          'No. of Buckets': indent.noOfBuckets || 0,
          'Total Load (Kgs)': indent.totalLoad || 0,
          'POD Received': indent.podReceived || '',
          'Loading Charge': indent.loadingCharge || 0,
          'Unloading Charge': indent.unloadingCharge || 0,
          'Actual Running': indent.actualRunning || 0,
          'Billable Running': indent.billableRunning || 0,
          'Range': indent.range || '',
          'Remarks': indent.remarks || '',
          'Freight Tiger Month': indent.freightTigerMonth || '',
        }));

    const card2UniqueCount = new Set(card2Indents.filter(t => t.indent).map(t => t.indent)).size;

    // Create workbook with Summary + Missing Indents sheets
    const workbook = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.aoa_to_sheet([
      ['Export Information', ''],
      ['Generated Date', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
      ['From Date', originalFromDateStr || 'All Dates'],
      ['To Date', originalToDateStr || 'All Dates'],
      ['', ''],
      ['Total Card 2 Indents (Unique)', card2UniqueCount],
      ['Indents in Fulfillment Trends (Unique)', fulfillmentIndents.size],
      ['Missing Indents (Unique)', missingArray.length],
    ]);
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet['!cols'] = [
      { wch: 8 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 20 },
      { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 20 }, { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Missing Indents');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const dateRangeStr = fromDate && toDate
      ? `${format(fromDate, 'yyyy-MM-dd')}_to_${format(toDate, 'yyyy-MM-dd')}`
      : 'all_dates';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Missing_Indents_${dateRangeStr}.xlsx"`);
    res.setHeader('Content-Length', excelBuffer.length.toString());
    res.send(excelBuffer);
  } catch (error) {
    console.error('[exportMissingIndents] Error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to export missing indents' });
  }
};
