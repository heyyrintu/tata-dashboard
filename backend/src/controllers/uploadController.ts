import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../lib/prisma';
import dashboardCache from '../services/cacheService';
import { parseNplWorkbook, ShipmentInput } from '../utils/nplExcelParser';
import { logger } from '../utils/logger';

export interface UploadResult {
  success: boolean;
  recordCount: number;
  fileName?: string;
  message: string;
  error?: string;
  sheets?: { name: string; branch: string; rows: number; skipped: number }[];
  flagCounts?: Record<string, number>;
  warnings?: string[];
}

const BATCH_SIZE = 200;

function toPrismaRow(s: ShipmentInput) {
  return {
    srNo: s.srNo ?? null,
    sourceSheet: s.sourceSheet ?? null,
    branch: s.branch ?? null,
    pickupLocation: s.pickupLocation ?? null,
    partyName: s.partyName ?? null,
    destination: s.destination ?? null,
    lane: s.lane ?? null,
    invoiceNumber: s.invoiceNumber ?? null,
    lrNo: s.lrNo ?? null,
    lrDate: s.lrDate ?? null,
    material: s.material ?? null,
    materialSku: s.materialSku ?? null,
    packSizeLtr: s.packSizeLtr ?? null,
    buckets: s.buckets ?? 0,
    totalQuantityLtr: s.totalQuantityLtr ?? 0,
    loadType: s.loadType ?? null,
    expectedDeliveryDate: s.expectedDeliveryDate ?? null,
    actualDeliveryDate: s.actualDeliveryDate ?? null,
    dispatchDate: s.dispatchDate ?? null,
    dispatchFrom: s.dispatchFrom ?? null,
    deliveryStatus: s.deliveryStatus ?? null,
    deliveryStatusRaw: s.deliveryStatusRaw ?? null,
    lrStatus: s.lrStatus ?? null,
    damage: s.damage ?? false,
    delayDays: s.delayDays ?? null,
    isOnTime: s.isOnTime ?? null,
    dispatchToDeliveryDays: s.dispatchToDeliveryDays ?? null,
    loadingCharges: s.loadingCharges ?? 0,
    unloadingCharges: s.unloadingCharges ?? 0,
    vehicleNumber: s.vehicleNumber ?? null,
    vehicleType: s.vehicleType ?? null,
    vendorName: s.vendorName ?? null,
    dispatchVehicle: s.dispatchVehicle ?? null,
    routeCode: s.routeCode ?? null,
    ply: s.ply ?? 0,
    podStatus: s.podStatus ?? null,
    podStatusRaw: s.podStatusRaw ?? null,
    podReceived: s.podReceived ?? false,
    monthKey: s.monthKey ?? null,
    remarks: s.remarks ?? null,
    dataFlags: s.dataFlags ?? null,
  };
}

/**
 * Parse an NPL MIS workbook and replace the shipments table with its contents.
 *
 * The upload is a full replace, not a merge: the master sheet is the single
 * source of truth and is re-issued in full each time, so appending would
 * duplicate every prior row. The delete and the inserts share one transaction,
 * so a parse or write failure leaves the previous data intact.
 */
export const processExcelFile = async (
  fileBuffer: Buffer | null,
  filePath: string | null,
  fileName?: string
): Promise<UploadResult> => {
  let tempFilePath: string | null = null;

  try {
    if (fileBuffer) {
      const tempDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      const safeName = (fileName || 'upload.xlsx').replace(/[^a-zA-Z0-9._-]/g, '_');
      tempFilePath = path.join(tempDir, `temp_${Date.now()}_${safeName}`);
      fs.writeFileSync(tempFilePath, fileBuffer);
    }

    const finalPath = filePath || tempFilePath;
    if (!finalPath) throw new Error('No file path or buffer provided');

    const report = parseNplWorkbook(finalPath);

    if (report.rows.length === 0) {
      return {
        success: false,
        recordCount: 0,
        fileName,
        message: 'No valid shipment rows found in the workbook.',
        error: 'No valid shipment rows found in the workbook.',
        sheets: report.sheets,
        warnings: report.warnings,
      };
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.shipment.deleteMany();
        for (let i = 0; i < report.rows.length; i += BATCH_SIZE) {
          await tx.shipment.createMany({
            data: report.rows.slice(i, i + BATCH_SIZE).map(toPrismaRow),
          });
        }
      },
      { timeout: 120_000 }
    );

    dashboardCache.invalidate();
    await prisma.dashboardSnapshot.deleteMany().catch(() => undefined);

    logger.info('NPL workbook imported', {
      fileName,
      records: report.rows.length,
      sheets: report.sheets.length,
      flags: report.flagCounts,
    });

    return {
      success: true,
      recordCount: report.rows.length,
      fileName,
      message: `Imported ${report.rows.length} shipments from ${report.sheets.length} sheets.`,
      sheets: report.sheets,
      flagCounts: report.flagCounts,
      warnings: report.warnings,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('NPL workbook import failed', { fileName, error: message });
    return {
      success: false,
      recordCount: 0,
      fileName,
      message: `Import failed: ${message}`,
      error: message,
    };
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch {
        /* best effort */
      }
    }
  }
};

export const uploadExcel = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file uploaded.' });
    return;
  }

  const result = await processExcelFile(null, req.file.path, req.file.originalname);

  // Multer already wrote the upload to disk; drop it once parsed.
  try {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
  } catch {
    /* best effort */
  }

  res.status(result.success ? 200 : 400).json(result);
};
