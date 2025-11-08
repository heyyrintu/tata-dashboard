import { Request, Response } from 'express';
import path from 'path';
import { parseExcelFile } from '../utils/excelParser';
import Trip from '../models/Trip';
import fs from 'fs';
import { fileTypeFromFile } from 'file-type';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';

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

    // MIME type validation removed - accept all file types
    // Log file type for debugging purposes only
    try {
      const fileType = await fileTypeFromFile(finalPath);
      if (fileType) {
        logger.debug('File type detected', {
          fileName,
          mimeType: fileType.mime,
          ext: fileType.ext
        });
      }
    } catch (mimeError) {
      // Ignore MIME type detection errors - not blocking
      logger.debug('MIME type detection skipped', {
        fileName,
        error: mimeError instanceof Error ? mimeError.message : 'Unknown error'
      });
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

    // Debug: Check if totalCost is being parsed
    const indentsWithCost = indents.filter(indent => indent.totalCost && indent.totalCost > 0);
    logger.debug('Parsed indents with cost', {
      totalIndents: indents.length,
      indentsWithCost: indentsWithCost.length
    });
    if (indentsWithCost.length > 0) {
      const sampleTotalCost = indentsWithCost.slice(0, 5).reduce((sum, indent) => sum + (indent.totalCost || 0), 0);
      logger.debug('Sample total cost', {
        sampleTotalCost: `₹${sampleTotalCost.toLocaleString('en-IN')}`
      });
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
      logger.debug('Inserted batch', {
        batchNumber: Math.floor(i / batchSize) + 1,
        batchSize: batch.length,
        totalInserted: insertedCount,
        totalExpected: indents.length
      });
    }
    
    // Verify data was inserted correctly
    const totalInserted = await Trip.countDocuments({});
    const insertedWithCost = await Trip.countDocuments({ totalCost: { $exists: true, $ne: 0 } });
    const totalCostInserted = await Trip.aggregate([
      { $group: { _id: null, total: { $sum: { $ifNull: ['$totalCost', 0] } } } }
    ]);
    const totalCostValue = totalCostInserted.length > 0 ? totalCostInserted[0].total : 0;
    
    // Calculate expected total cost from parsed indents
    const expectedTotalCost = indents.reduce((sum, indent) => sum + (indent.totalCost || 0), 0);
    
    logger.info('Upload complete', {
      totalInserted,
      expectedCount: indents.length,
      insertedWithCost,
      totalCostInDB: `₹${totalCostValue.toLocaleString('en-IN')}`,
      expectedTotalCost: `₹${expectedTotalCost.toLocaleString('en-IN')}`
    });
    
    if (totalInserted !== indents.length) {
      logger.warn('Inserted count mismatch', {
        inserted: totalInserted,
        expected: indents.length
      });
    }
    
    if (Math.abs(totalCostValue - expectedTotalCost) > 0.01) {
      logger.warn('Total cost mismatch', {
        dbTotal: `₹${totalCostValue.toLocaleString('en-IN')}`,
        expected: `₹${expectedTotalCost.toLocaleString('en-IN')}`
      });
    }

    return {
      success: true,
      recordCount: indents.length,
      fileName: fileName,
      message: `Successfully uploaded ${indents.length} records`
    };
  } catch (error) {
    logger.error('Error processing Excel file', {
      fileName,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
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
        logger.error('Failed to cleanup temp file', {
          error: cleanupError instanceof Error ? cleanupError.message : 'Unknown error'
        });
      }
    }
    // Clean up uploaded file from multer if provided
    if (filePath && !fileBuffer && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        logger.error('Failed to cleanup uploaded file', {
          error: cleanupError instanceof Error ? cleanupError.message : 'Unknown error'
        });
      }
    }
  }
};

/**
 * HTTP endpoint for file upload via multer
 */
export const uploadExcel = async (req: Request, res: Response) => {
  const requestId = req.id || 'unknown';
  
  try {
    if (!req.file) {
      logger.warn('File upload attempt with no file', { requestId });
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded.' 
      });
    }

    logger.info('Processing file upload', {
      requestId,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });

    const filePath = req.file.path;
    const result = await processExcelFile(null, filePath, req.file.originalname);

    if (result.success) {
      logger.info('File upload successful', {
        requestId,
        fileName: result.fileName,
        recordCount: result.recordCount
      });
      
      res.json({
        success: true,
        recordCount: result.recordCount,
        fileName: result.fileName,
        message: result.message
      });
    } else {
      logger.warn('File upload failed', {
        requestId,
        fileName: result.fileName,
        error: result.error
      });
      
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to process Excel file'
      });
    }
  } catch (error) {
    logger.error('Unexpected error during file upload', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Use error handler middleware instead of direct response
    throw error;
  }
};

