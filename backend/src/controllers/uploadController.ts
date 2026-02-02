import { Request, Response } from 'express';
import path from 'path';
import { parseExcelFile } from '../utils/excelParser';
import prisma from '../lib/prisma';
import fs from 'fs';

interface UploadResult {
  success: boolean;
  recordCount: number;
  fileName?: string;
  message: string;
  error?: string;
}

/**
 * Internal function to process Excel file from buffer or file path
 * This can be called from HTTP upload or email processing
 */
export const processExcelFile = async (
  fileBuffer: Buffer | null,
  filePath: string | null,
  fileName?: string
): Promise<UploadResult> => {
  let tempFilePath: string | null = null;

  try {
    // If buffer is provided, save to temp file first
    if (fileBuffer) {
      const tempDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      tempFilePath = path.join(tempDir, `temp_${Date.now()}_${fileName || 'upload.xlsx'}`);
      fs.writeFileSync(tempFilePath, fileBuffer);
    }

    const finalPath = filePath || tempFilePath;
    if (!finalPath) {
      throw new Error('No file path or buffer provided');
    }

    // Parse the Excel file
    const indents = parseExcelFile(finalPath);

    if (indents.length === 0) {
      return {
        success: false,
        recordCount: 0,
        fileName: fileName,
        message: 'No valid data found in Excel file',
        error: 'No valid data found in Excel file'
      };
    }

    // Sort indents by indentDate (time) - oldest first
    indents.sort((a, b) => {
      const dateA = a.indentDate instanceof Date ? a.indentDate.getTime() : new Date(a.indentDate).getTime();
      const dateB = b.indentDate instanceof Date ? b.indentDate.getTime() : new Date(b.indentDate).getTime();
      return dateA - dateB;
    });

    console.log(`[uploadController] Sorted ${indents.length} indents by indentDate (oldest first)`);
    if (indents.length > 0) {
      const firstDate = indents[0].indentDate instanceof Date ? indents[0].indentDate : new Date(indents[0].indentDate);
      const lastDate = indents[indents.length - 1].indentDate instanceof Date ? indents[indents.length - 1].indentDate : new Date(indents[indents.length - 1].indentDate);
      console.log(`[uploadController] Date range: ${firstDate.toISOString().split('T')[0]} to ${lastDate.toISOString().split('T')[0]}`);
    }

    // Delete all existing data before inserting new data
    console.log('[uploadController] Deleting existing trips...');
    const deleteResult = await prisma.trip.deleteMany();
    console.log(`[uploadController] Deleted ${deleteResult.count} existing trips`);

    // Insert new data in batches to avoid timeout
    const batchSize = 100;
    let insertedCount = 0;
    for (let i = 0; i < indents.length; i += batchSize) {
      const batch = indents.slice(i, i + batchSize);

      // Convert batch data to Prisma format
      const prismaData = batch.map(indent => ({
        sNo: indent.sNo,
        indentDate: indent.indentDate instanceof Date ? indent.indentDate : new Date(indent.indentDate),
        indent: indent.indent,
        allocationDate: indent.allocationDate instanceof Date ? indent.allocationDate : (indent.allocationDate ? new Date(indent.allocationDate) : null),
        customerName: indent.customerName,
        location: indent.location,
        vehicleModel: indent.vehicleModel,
        vehicleNumber: indent.vehicleNumber,
        vehicleBased: indent.vehicleBased,
        lrNo: indent.lrNo,
        material: indent.material,
        loadPerBucket: indent.loadPerBucket || 0,
        noOfBuckets: indent.noOfBuckets || 0,
        totalLoad: indent.totalLoad || 0,
        podReceived: indent.podReceived,
        loadingCharge: indent.loadingCharge || 0,
        unloadingCharge: indent.unloadingCharge || 0,
        actualRunning: indent.actualRunning || 0,
        billableRunning: indent.billableRunning || 0,
        range: indent.range,
        remarks: indent.remarks,
        freightTigerMonth: indent.freightTigerMonth,
        totalCostAE: indent.totalCostAE || 0,
        totalCostLoading: indent.totalCostLoading || 0,
        totalCostUnload: indent.totalCostUnload || 0,
        anyOtherCost: indent.anyOtherCost || 0,
        remainingCost: indent.remainingCost || 0,
        vehicleCost: indent.vehicleCost || 0,
        profitLoss: indent.profitLoss || 0,
        totalKm: indent.totalKm || 0,
      }));

      await prisma.trip.createMany({
        data: prismaData,
        skipDuplicates: true
      });
      insertedCount += batch.length;
      console.log(`[uploadController] Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} indents (${insertedCount}/${indents.length})`);
    }

    // Verify data was inserted correctly
    const totalInserted = await prisma.trip.count();
    const insertedWithCost = await prisma.trip.count({
      where: {
        totalCostAE: { not: 0 }
      }
    });
    const insertedWithKm = await prisma.trip.count({
      where: {
        totalKm: { not: 0 }
      }
    });

    const aggregateResult = await prisma.trip.aggregate({
      _sum: {
        totalCostAE: true,
        totalKm: true
      }
    });
    const totalCostValue = aggregateResult._sum.totalCostAE ?? 0;
    const totalKmValue = aggregateResult._sum.totalKm ?? 0;

    console.log(`[uploadController] ===== UPLOAD COMPLETE =====`);
    console.log(`[uploadController] Total indents inserted: ${totalInserted} (expected: ${indents.length})`);
    console.log(`[uploadController] Indents with totalCostAE > 0: ${insertedWithCost}`);
    console.log(`[uploadController] Indents with totalKm > 0: ${insertedWithKm}`);
    console.log(`[uploadController] Total cost in database: ₹${totalCostValue.toLocaleString('en-IN')}`);
    console.log(`[uploadController] Total Km in database: ${totalKmValue.toLocaleString('en-IN')} km`);

    console.log(`[uploadController] ============================`);

    // Calculate expected values from parsed indents
    const expectedTotalCost = indents.reduce((sum, indent) => sum + (indent.totalCostAE || 0), 0);
    const expectedTotalKm = indents.reduce((sum, indent) => sum + (Number(indent.totalKm) || 0), 0);

    console.log(`  Expected total cost: ₹${expectedTotalCost.toLocaleString('en-IN')}`);
    console.log(`  Expected total Km: ${expectedTotalKm.toLocaleString('en-IN')} km`);

    if (totalInserted !== indents.length) {
      console.warn(`[uploadController] WARNING: Inserted count (${totalInserted}) doesn't match parsed count (${indents.length})`);
    }

    if (Math.abs(totalCostValue - expectedTotalCost) > 0.01) {
      console.warn(`[uploadController] WARNING: Database total cost (₹${totalCostValue.toLocaleString('en-IN')}) doesn't match expected (₹${expectedTotalCost.toLocaleString('en-IN')})`);
    }

    if (Math.abs(totalKmValue - expectedTotalKm) > 0.01) {
      console.warn(`[uploadController] WARNING: Database total Km (${totalKmValue.toLocaleString('en-IN')} km) doesn't match expected (${expectedTotalKm.toLocaleString('en-IN')} km)`);
    } else if (totalKmValue > 0) {
      console.log(`[uploadController] ✅ Total Km verified: ${totalKmValue.toLocaleString('en-IN')} km from Column U (21st column, index 20)`);
    }

    // Pre-calculate all dashboard endpoints after successful upload
    console.log(`[uploadController] ===== PRE-CALCULATING DASHBOARD DATA =====`);
    try {
      // Import calculation functions
      const { calculateCardValues } = await import('../utils/cardCalculations');
      const { calculateRangeWiseSummary } = await import('../utils/rangeWiseCalculations');
      const { calculateVehicleCosts } = await import('../utils/vehicleCostCalculations');

      // Get all trips (sorted by indentDate)
      const allTrips = await prisma.trip.findMany({
        orderBy: { indentDate: 'asc' }
      });
      console.log(`[uploadController] Fetched ${allTrips.length} trips (sorted by indentDate)`);

      // Pre-calculate TML DEF Dashboard data (MainDashboard)
      console.log(`[uploadController] Calculating TML DEF Dashboard data...`);
      const cardResults = calculateCardValues(allTrips as any, null, null);
      const rangeWiseResults = await calculateRangeWiseSummary(null, null);
      console.log(`[uploadController] ✓ TML DEF Dashboard: ${cardResults.totalIndents} indents, ${cardResults.totalTrips} trips, ${cardResults.totalLoad} kg load`);

      // Pre-calculate Finance Dashboard data (PowerBIDashboard)
      console.log(`[uploadController] Calculating Finance Dashboard data...`);
      const vehicleCostResults = calculateVehicleCosts(allTrips as any, null, null);
      console.log(`[uploadController] ✓ Finance Dashboard: ${vehicleCostResults.length} vehicle cost entries`);

      // Calculate revenue, cost, profit-loss summaries
      const totalRevenue = rangeWiseResults.rangeData.reduce((sum: number, r: any) => {
        const revenue = (r.bucketCount || 0) * 11636 + (r.barrelCount || 0) * 51420;
        return sum + revenue;
      }, 0);
      const totalCost = rangeWiseResults.totalCost || 0;
      const totalProfitLoss = rangeWiseResults.totalProfitLoss || 0;
      console.log(`[uploadController] ✓ Finance Summary: Revenue ₹${totalRevenue.toLocaleString('en-IN')}, Cost ₹${totalCost.toLocaleString('en-IN')}, P&L ₹${totalProfitLoss.toLocaleString('en-IN')}`);

      console.log(`[uploadController] ===== DASHBOARD DATA PRE-CALCULATION COMPLETE =====`);
    } catch (calcError) {
      console.error(`[uploadController] ⚠️  Warning: Failed to pre-calculate dashboard data:`, calcError);
      // Don't fail the upload if pre-calculation fails
    }

    return {
      success: true,
      recordCount: indents.length,
      fileName: fileName,
      message: `Successfully uploaded ${indents.length} records (sorted by time)`
    };
  } catch (error) {
    return {
      success: false,
      recordCount: 0,
      fileName: fileName,
      message: error instanceof Error ? error.message : 'Failed to process Excel file',
      error: error instanceof Error ? error.message : 'Failed to process Excel file'
    };
  } finally {
    // Clean up temp file if created from buffer
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error('[uploadController] Failed to cleanup temp file:', cleanupError);
      }
    }
    // Clean up uploaded file from multer if provided
    if (filePath && !fileBuffer && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error('[uploadController] Failed to cleanup uploaded file:', cleanupError);
      }
    }
  }
};

/**
 * HTTP endpoint for file upload via multer
 */
export const uploadExcel = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const filePath = req.file.path;
    const result = await processExcelFile(null, filePath, req.file.originalname);

    if (result.success) {
      res.json({
        success: true,
        recordCount: result.recordCount,
        fileName: result.fileName,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to process Excel file'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process Excel file'
    });
  }
};
