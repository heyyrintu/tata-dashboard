import * as XLSX from 'xlsx';
import { ITrip } from '../models/Trip';

interface ExcelRow {
  [key: string]: any;
}

// Normalize range values to standard format
const normalizeRange = (range: string | null | undefined): string => {
  if (!range || typeof range !== 'string') return '';
  
  // Trim whitespace and convert to lowercase for comparison
  const normalized = range.trim().toLowerCase();
  
  // Handle various formats: "0-100km", "0-100Km", "0-100KM", "0-100 km", etc.
  if (normalized.startsWith('0-100') || normalized.startsWith('0 100')) {
    return '0-100Km';
  }
  if (normalized.startsWith('101-250') || normalized.startsWith('101 250')) {
    return '101-250Km';
  }
  if (normalized.startsWith('251-400') || normalized.startsWith('251 400')) {
    return '251-400Km';
  }
  if (normalized.startsWith('401-600') || normalized.startsWith('401 600')) {
    return '401-600Km';
  }
  
  // Return original if no match (empty string will be filtered out)
  return '';
};

export const parseExcelFile = (filePath: string): ITrip[] => {
  try {
    const workbook = XLSX.readFile(filePath, { type: 'file', cellDates: true });
    
    // Find 'OPs Data' sheet
    let sheetName = 'OPs Data';
    if (!workbook.SheetNames.includes(sheetName)) {
      // Fallback to first sheet if 'OPs Data' not found
      sheetName = workbook.SheetNames[0];
      console.log(`Warning: 'OPs Data' sheet not found, using first sheet: ${sheetName}`);
    }
    
    const worksheet = workbook.Sheets[sheetName];
    const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

    // Validate required columns
    const requiredColumns = ['Indent', 'Allocation Date'];
    const headers = Object.keys(data[0] || {});
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    // Map Excel data to Trip model
    const indents: ITrip[] = data.map((row, index) => {
      return {
        sNo: row['S.NO'] || index + 1,
        indentDate: convertToDate(row['Indent Date']),
        indent: row['Indent'] || '',
        allocationDate: convertToDate(row['Allocation Date']),
        customerName: row['Customer Name'] || '',
        location: row['Location'] || '',
        vehicleModel: row['Vehicle Model'] || '',
        vehicleNumber: row['Vehicle Number'] || '',
        vehicleBased: row['Vehicle Based'] || '',
        lrNo: row['LR No.'] || '',
        material: row['Material'] || '',
        loadPerBucket: parseFloat(row['Load Per bucket (Kgs)']) || 0,
        noOfBuckets: parseFloat(row['No. of Buckets/Barrels']) || 0,
        totalLoad: parseFloat(row['T. Load (Kgs)']) || 0,
        podReceived: row['POD Received'] || '',
        loadingCharge: parseFloat(row['Loading Charge (Rs.95 per Ton)']) || 0,
        unloadingCharge: parseFloat(row['Unloading Charge']) || 0,
        actualRunning: parseFloat(row['Actual Running']) || 0,
        billableRunning: parseFloat(row['Billable Running']) || 0,
        range: normalizeRange(row['Range']),
      } as any;
    });

    // Filter out rows with missing critical data - use indentDate instead of allocationDate
    return indents.filter(indent => indent.indent && indent.indentDate);
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const convertToDate = (value: any): Date => {
  if (!value) return new Date();
  
  if (value instanceof Date) {
    return value;
  }
  
  if (typeof value === 'number') {
    // Excel serial date
    return XLSX.SSF.parse_date_code(value);
  }
  
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  return new Date();
};

