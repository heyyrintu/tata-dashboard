import { Request, Response } from 'express';
import path from 'path';
import { parseExcelFile } from '../utils/excelParser';
import Trip from '../models/Trip';
import fs from 'fs';

export const uploadExcel = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    const filePath = req.file.path;
    
    try {
      // Parse the Excel file
      const trips = parseExcelFile(filePath);

      if (trips.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid data found in Excel file'
        });
      }

      // Delete all existing data before inserting new data
      await Trip.deleteMany({});

      // Insert new data
      await Trip.insertMany(trips);

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        recordCount: trips.length,
        fileName: req.file.originalname,
        message: `Successfully uploaded ${trips.length} records`
      });
    } catch (parseError) {
      // Clean up file on error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      throw parseError;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process Excel file'
    });
  }
};

