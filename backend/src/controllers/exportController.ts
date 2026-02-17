import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { parseDateParam } from '../utils/dateFilter';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

/**
 * Export all indents to Excel
 */
export const exportAllIndentsToExcel = async (req: Request, res: Response) => {
  try {
    const fromDate = parseDateParam(req.query.fromDate as string);
    const toDate = parseDateParam(req.query.toDate as string);

    // Build where clause to push date filtering into SQL
    const where: any = {};
    if (fromDate || toDate) {
      where.indentDate = {};
      if (fromDate) where.indentDate.gte = fromDate;
      if (toDate) {
        const endOfDay = new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate(), 23, 59, 59, 999));
        where.indentDate.lte = endOfDay;
      }
    }

    const filteredIndents = await prisma.trip.findMany({
      where,
      orderBy: { indentDate: 'asc' },
    });

    // Prepare Excel data
    const excelData = filteredIndents.map((indent: any, index: number) => ({
      'S.No': index + 1,
      'Indent Date': indent.indentDate 
        ? (indent.indentDate instanceof Date 
            ? format(indent.indentDate, 'dd-MM-yyyy') 
            : format(new Date(indent.indentDate), 'dd-MM-yyyy'))
        : '',
      'Indent': indent.indent || '',
      'Allocation Date': indent.allocationDate
        ? (indent.allocationDate instanceof Date
            ? format(indent.allocationDate, 'dd-MM-yyyy')
            : format(new Date(indent.allocationDate), 'dd-MM-yyyy'))
        : '',
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
      'Total Cost': indent.totalCost || 0,
      'Profit/Loss': indent.profitLoss || 0,
      'Created At': indent.createdAt
        ? (indent.createdAt instanceof Date
            ? format(indent.createdAt, 'dd-MM-yyyy HH:mm:ss')
            : format(new Date(indent.createdAt), 'dd-MM-yyyy HH:mm:ss'))
        : '',
      'Updated At': indent.updatedAt
        ? (indent.updatedAt instanceof Date
            ? format(indent.updatedAt, 'dd-MM-yyyy HH:mm:ss')
            : format(new Date(indent.updatedAt), 'dd-MM-yyyy HH:mm:ss'))
        : ''
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 8 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 20 },
      { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 20 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'All Indents');
    
    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    // Set filename
    const dateRangeStr = fromDate && toDate 
      ? `${format(fromDate, 'yyyy-MM-dd')}_to_${format(toDate, 'yyyy-MM-dd')}`
      : fromDate
      ? `${format(fromDate, 'yyyy-MM-dd')}_onwards`
      : toDate
      ? `up_to_${format(toDate, 'yyyy-MM-dd')}`
      : 'all_dates';
    const filename = `All_Indents_${dateRangeStr}.xlsx`;

    // Set headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length.toString());

    // Send file
    res.send(excelBuffer);
  } catch (error) {
    console.error('[EXPORT] ERROR:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export indents'
    });
  }
};

