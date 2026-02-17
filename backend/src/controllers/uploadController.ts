import { Request, Response } from 'express';
import path from 'path';
import { parseExcelFile } from '../utils/excelParser';
import prisma from '../lib/prisma';
import fs from 'fs';
import dashboardCache from '../services/cacheService';
import { preComputeAll } from '../services/preComputeService';

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

      const sanitizedName = (fileName || 'upload.xlsx').replace(/[^a-zA-Z0-9._-]/g, '_');
      tempFilePath = path.join(tempDir, `temp_${Date.now()}_${sanitizedName}`);
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
      const dateA = a.indentDate ? (a.indentDate instanceof Date ? a.indentDate.getTime() : new Date(a.indentDate).getTime()) : 0;
      const dateB = b.indentDate ? (b.indentDate instanceof Date ? b.indentDate.getTime() : new Date(b.indentDate).getTime()) : 0;
      return dateA - dateB;
    });

    // Delete all existing data and insert new data in a transaction
    const batchSize = 100;

    await prisma.$transaction(async (tx) => {
      await tx.trip.deleteMany();

      for (let i = 0; i < indents.length; i += batchSize) {
        const batch = indents.slice(i, i + batchSize);

        const prismaData = batch.map(indent => ({
          sNo: indent.sNo,
          indentDate: indent.indentDate ? (indent.indentDate instanceof Date ? indent.indentDate : new Date(indent.indentDate)) : null,
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

        await tx.trip.createMany({
          data: prismaData,
          skipDuplicates: true
        });
      }
    }, { timeout: 60000 });

    // Verify data integrity
    const totalInserted = await prisma.trip.count();

    const aggregateResult = await prisma.trip.aggregate({
      _sum: {
        totalCostAE: true,
        totalKm: true
      }
    });
    const totalCostValue = aggregateResult._sum.totalCostAE ?? 0;
    const totalKmValue = aggregateResult._sum.totalKm ?? 0;

    // Verify data integrity
    const expectedTotalCost = indents.reduce((sum, indent) => sum + (indent.totalCostAE || 0), 0);
    const expectedTotalKm = indents.reduce((sum, indent) => sum + (Number(indent.totalKm) || 0), 0);

    if (totalInserted !== indents.length) {
      console.warn(`[uploadController] WARNING: Inserted count (${totalInserted}) doesn't match parsed count (${indents.length})`);
    }
    if (Math.abs(totalCostValue - expectedTotalCost) > 0.01) {
      console.warn(`[uploadController] WARNING: Database total cost (₹${totalCostValue.toLocaleString('en-IN')}) doesn't match expected (₹${expectedTotalCost.toLocaleString('en-IN')})`);
    }
    if (Math.abs(totalKmValue - expectedTotalKm) > 0.01) {
      console.warn(`[uploadController] WARNING: Database total Km (${totalKmValue.toLocaleString('en-IN')} km) doesn't match expected (${expectedTotalKm.toLocaleString('en-IN')} km)`);
    }

    // Invalidate cache and trigger background pre-computation
    dashboardCache.invalidate();
    setImmediate(() => {
      preComputeAll().catch(err =>
        console.error('[uploadController] Background pre-computation failed:', err)
      );
    });

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
