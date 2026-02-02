import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { parseDateParam } from '../utils/dateFilter';
import { calculateCardValues } from '../utils/cardCalculations';
import { calculateRangeWiseSummary } from '../utils/rangeWiseCalculations';

/**
 * Debug endpoint to show all calculations side-by-side
 * GET /api/debug/calculations?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
 */
export const debugCalculations = async (req: Request, res: Response) => {
  try {
    const fromDate = parseDateParam(req.query.fromDate as string);
    const toDate = parseDateParam(req.query.toDate as string);

    console.log(`[debugCalculations] ===== START =====`);
    console.log(`[debugCalculations] Date params: fromDate=${fromDate?.toISOString().split('T')[0] || 'null'}, toDate=${toDate?.toISOString().split('T')[0] || 'null'}`);

    const allIndents = await prisma.trip.findMany();
    console.log(`[debugCalculations] Total indents in DB: ${allIndents.length}`);

    // Calculate card values
    const cardResults = calculateCardValues(allIndents as any, fromDate, toDate);

    // Calculate range-wise summary
    const rangeWiseResults = await calculateRangeWiseSummary(fromDate || undefined, toDate || undefined);

    // Manual verification calculations
    const sampleIndents = allIndents.slice(0, 10).map((indent: any) => ({
      indent: indent.indent,
      indentDate: indent.indentDate,
      range: indent.range,
      material: indent.material,
      noOfBuckets: indent.noOfBuckets,
      totalLoad: indent.totalLoad
    }));

    const debugInfo = {
      dateRange: {
        from: fromDate?.toISOString().split('T')[0] || null,
        to: toDate?.toISOString().split('T')[0] || null
      },
      totalIndentsInDB: allIndents.length,
      cardCalculations: {
        card1_totalIndents: cardResults.totalIndents,
        card2_totalTrips: cardResults.totalTrips,
        card3_totalLoad_kg: cardResults.totalLoad,
        card3_totalLoad_tons: (cardResults.totalLoad / 1000).toFixed(2),
        card4_totalBuckets: cardResults.totalBuckets,
        card4_totalBarrels: cardResults.totalBarrels,
        card5_avgBucketsPerTrip: cardResults.avgBucketsPerTrip,
        allIndentsCount: cardResults.allIndentsCount,
        validIndentsCount: cardResults.validIndentsCount
      },
      rangeWiseCalculations: {
        totalUniqueIndents: rangeWiseResults.totalUniqueIndents,
        totalLoad_kg: rangeWiseResults.totalLoad,
        totalLoad_tons: (rangeWiseResults.totalLoad / 1000).toFixed(2),
        totalBuckets: rangeWiseResults.totalBuckets,
        totalBarrels: rangeWiseResults.totalBarrels,
        totalRows: rangeWiseResults.totalRows,
        rangeDataCount: rangeWiseResults.rangeData.length
      },
      verification: {
        card2_matches_rangeWise: cardResults.totalTrips === rangeWiseResults.totalUniqueIndents,
        card3_matches_rangeWise: cardResults.totalLoad === rangeWiseResults.totalLoad,
        card4_buckets_matches: cardResults.totalBuckets === rangeWiseResults.totalBuckets,
        card4_barrels_matches: cardResults.totalBarrels === rangeWiseResults.totalBarrels
      },
      sampleIndents: sampleIndents
    };

    console.log(`[debugCalculations] ===== RESULTS =====`);
    console.log(JSON.stringify(debugInfo, null, 2));
    console.log(`[debugCalculations] ===== END =====`);

    res.json({
      success: true,
      ...debugInfo
    });
  } catch (error) {
    console.error(`[debugCalculations] ERROR:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to debug calculations'
    });
  }
};
