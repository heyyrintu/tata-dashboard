import { Request, Response } from 'express';
import path from 'path';
import { parseExcelFile } from '../utils/excelParser';
import Trip from '../models/Trip';
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

    // Delete all existing data before inserting new data
    // Use maxTimeMS to prevent timeout errors
    await Trip.deleteMany({}).maxTimeMS(30000);

    // Insert new data in batches to avoid timeout
    const batchSize = 100;
    let insertedCount = 0;
    for (let i = 0; i < indents.length; i += batchSize) {
      const batch = indents.slice(i, i + batchSize);
      
      await Trip.insertMany(batch, { ordered: false });
      insertedCount += batch.length;
      console.log(`[uploadController] Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} indents (${insertedCount}/${indents.length})`);
      
    }
    
    // Verify data was inserted correctly
    const totalInserted = await Trip.countDocuments({});
    const insertedWithCost = await Trip.countDocuments({ totalCostAE: { $exists: true, $ne: 0 } });
    const totalCostInserted = await Trip.aggregate([
      { $group: { _id: null, total: { $sum: { $ifNull: ['$totalCostAE', 0] } } } }
    ]);
    const totalCostValue = totalCostInserted.length > 0 ? totalCostInserted[0].total : 0;
    
    console.log(`[uploadController] ===== UPLOAD COMPLETE =====`);
    console.log(`[uploadController] Total indents inserted: ${totalInserted} (expected: ${indents.length})`);
    console.log(`[uploadController] Indents with totalCostAE > 0: ${insertedWithCost}`);
    console.log(`[uploadController] Total cost in database: ₹${totalCostValue.toLocaleString('en-IN')}`);
    
    console.log(`[uploadController] ============================`);
    
    // Calculate expected total cost from parsed indents
    const expectedTotalCost = indents.reduce((sum, indent) => sum + (indent.totalCostAE || 0), 0);
    console.log(`  Expected total cost: ₹${expectedTotalCost.toLocaleString('en-IN')}`);
    
    if (totalInserted !== indents.length) {
      console.warn(`[uploadController] WARNING: Inserted count (${totalInserted}) doesn't match parsed count (${indents.length})`);
    }
    
    if (Math.abs(totalCostValue - expectedTotalCost) > 0.01) {
      console.warn(`[uploadController] WARNING: Database total cost (₹${totalCostValue.toLocaleString('en-IN')}) doesn't match expected (₹${expectedTotalCost.toLocaleString('en-IN')})`);
    }

    return {
      success: true,
      recordCount: indents.length,
      fileName: fileName,
      message: `Successfully uploaded ${indents.length} records`
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

