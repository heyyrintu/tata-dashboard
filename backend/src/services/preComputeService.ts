import prisma from '../lib/prisma';
import dashboardCache from './cacheService';
import {
  querySummaryCards, queryRangeWise, queryRevenueByRange,
  queryRevenueOverTime, queryCostByRange, queryCostOverTime,
  queryProfitLossByRange, queryProfitLossOverTime,
  queryVehicleCost, queryLoadOverTime,
  queryFulfillment, queryMonthOnMonth, queryLocations, queryMeta,
} from './analyticsQueryService';

/**
 * Pre-compute all dashboard data and store in both DB and memory cache.
 * Called after every successful upload.
 */
export async function preComputeAll(): Promise<void> {
  const startTime = Date.now();
  console.log('[PreCompute] Starting full pre-computation...');

  try {
    // Run all aggregation queries in parallel (each hits DB independently)
    const [
      kpi,
      rangeWise,
      revenue,
      revenueOverTime,
      costResult,
      costOverTime,
      profitLossResult,
      profitLossOverTime,
      vehicleCost,
      loadOverTime,
      fulfillment,
      monthOnMonth,
      locations,
      meta,
    ] = await Promise.all([
      querySummaryCards(null, null),
      queryRangeWise(null, null),
      queryRevenueByRange(null, null),
      queryRevenueOverTime(null, null, 'monthly'),
      queryCostByRange(null, null),
      queryCostOverTime(null, null, 'monthly'),
      queryProfitLossByRange(null, null),
      queryProfitLossOverTime(null, null, 'monthly'),
      queryVehicleCost(null, null),
      queryLoadOverTime(null, null, 'monthly'),
      queryFulfillment(null, null),
      queryMonthOnMonth(),
      queryLocations(null, null),
      queryMeta(),
    ]);

    const payload = {
      computedAt: new Date().toISOString(),
      tripCount: meta.totalRows,
      kpi: {
        totalIndents: kpi.totalIndents,
        totalTrips: kpi.totalTrips,
        totalLoad: kpi.totalLoad,
        totalBuckets: kpi.totalBuckets,
        totalBarrels: kpi.totalBarrels,
        avgBucketsPerTrip: kpi.avgBucketsPerTrip,
        totalCost: kpi.totalCost,
        totalProfitLoss: kpi.totalProfitLoss,
        totalRemainingCost: kpi.totalRemainingCost,
        totalVehicleCost: kpi.totalVehicleCost,
      },
      rangeWise: {
        ranges: rangeWise.rangeData,
        totalUniqueIndents: rangeWise.totalUniqueIndents,
        totalLoad: rangeWise.totalLoad,
        totalBuckets: rangeWise.totalBuckets,
        totalBarrels: rangeWise.totalBarrels,
        totalCost: rangeWise.totalCost,
        totalProfitLoss: rangeWise.totalProfitLoss,
        totalRevenue: rangeWise.totalRevenue,
        totalRemainingCost: rangeWise.totalRemainingCost,
        totalVehicleCost: rangeWise.totalVehicleCost,
        totalRows: rangeWise.totalRows,
      },
      locations,
      fulfillment,
      monthOnMonth,
      loadOverTime: { monthly: loadOverTime },
      revenue: {
        byRange: revenue.revenueByRange,
        totalRevenue: revenue.totalRevenue,
        overTime: revenueOverTime,
      },
      cost: {
        byRange: costResult.costByRange,
        totalCost: costResult.totalCost,
        overTime: costOverTime,
      },
      profitLoss: {
        byRange: profitLossResult.profitLossByRange,
        totalProfitLoss: profitLossResult.totalProfitLoss,
        overTime: profitLossOverTime,
      },
      vehicleCost: {
        vehicles: vehicleCost,
        summary: {
          totalActualKm: vehicleCost.reduce((s, v) => s + v.actualKm, 0),
          totalExtraCost: vehicleCost.reduce((s, v) => s + v.extraCost, 0),
        },
      },
      meta,
    };

    // Persist to DB
    await prisma.dashboardSnapshot.upsert({
      where: { cacheKey: 'all' },
      create: { cacheKey: 'all', data: payload as any, tripCount: meta.totalRows },
      update: { data: payload as any, tripCount: meta.totalRows, computedAt: new Date() },
    });

    // Store in memory
    dashboardCache.set('all', payload);

    console.log(`[PreCompute] Complete in ${Date.now() - startTime}ms. Snapshot saved and cached.`);
  } catch (err) {
    console.error('[PreCompute] ERROR during pre-computation:', err);
    throw err;
  }
}
