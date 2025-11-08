import * as XLSX from 'xlsx';
import { ITrip } from '../models/Trip';

interface ExcelRow {
  [key: string]: any;
}

// Normalize range values to standard format
const normalizeRange = (range: string | null | undefined): string => {
  if (!range || typeof range !== 'string') return '';
  
  const trimmed = range.trim();
  if (trimmed === '') return '';
  
  // Trim whitespace and convert to lowercase for comparison
  const normalized = trimmed.toLowerCase();
  
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
  
  // Return original trimmed value if no match - this will be included in "Other" category
  return trimmed;
};

export const parseExcelFile = (filePath: string): ITrip[] => {
  try {
    // Read WITHOUT cellDates to get raw values, then parse manually as DD-MM-YYYY
    // Read with cellFormula: true to get calculated values from formulas (needed for column AE)
    const workbook = XLSX.readFile(filePath, { 
      type: 'file', 
      cellDates: false,
      cellFormula: true  // Read formulas to get calculated values (needed for column AE)
    });
    
    // Find 'OPs Data' sheet
    let sheetName = 'OPs Data';
    if (!workbook.SheetNames.includes(sheetName)) {
      // Fallback to first sheet if 'OPs Data' not found
      sheetName = workbook.SheetNames[0];
      console.log(`Warning: 'OPs Data' sheet not found, using first sheet: ${sheetName}`);
    }
    
    const worksheet = workbook.Sheets[sheetName];
    
    // Extend range to include column AE (index 30) and AK (index 36) if needed
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    if (range.e.c < 36) {
      range.e.c = 36; // Extend to column AK (for P & L)
      worksheet['!ref'] = XLSX.utils.encode_range(range);
    }
    
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
        remarks: row['REMARKS'] || row['Remarks'] || '',
        freightTigerMonth: convertFreightTigerMonth(row['Freight Tiger Month']),
        // Use column AE (index 30) for Total Cost - this is the 2nd "Total Cost" column
        // Column AE has formula: W+Y+AB+AD (sum of multiple cost components)
        // When reading with sheet_to_json, column AE is at index 30
        totalCost: (() => {
          const rowKeys = Object.keys(row);
          // Column AE is the 31st column (0-indexed: 30)
          // Get value from column index 30 directly
          if (rowKeys.length > 30 && rowKeys[30]) {
            const aeValue = row[rowKeys[30]];
            if (aeValue !== undefined && aeValue !== null && aeValue !== '') {
              const numValue = parseFloat(aeValue);
              if (!isNaN(numValue)) {
                return numValue;
              }
            }
          }
          // Fallback: try common header names for column AE
          const aeValue = row['Any Other Cost'] || row['Total Cost_1'];
          if (aeValue !== undefined && aeValue !== null && aeValue !== '') {
            const numValue = parseFloat(aeValue);
            if (!isNaN(numValue)) {
              return numValue;
            }
          }
          // Last fallback: original "Total Cost" column (column T, index 19)
          return parseFloat(row['Total Cost']) || 0;
        })(),
        // Use column AK (index 36) for Profit & Loss - column header 'P & L'
        // Column AK is the 37th column (0-indexed: 36)
        profitLoss: (() => {
          const rowKeys = Object.keys(row);
          // Get value from column index 36 directly
          if (rowKeys.length > 36 && rowKeys[36]) {
            const akValue = row[rowKeys[36]];
            if (akValue !== undefined && akValue !== null && akValue !== '') {
              const numValue = parseFloat(akValue);
              if (!isNaN(numValue)) {
                return numValue;
              }
            }
          }
          // Fallback: try header name 'P & L'
          const akValue = row['P & L'] || row['P&L'];
          if (akValue !== undefined && akValue !== null && akValue !== '') {
            const numValue = parseFloat(akValue);
            if (!isNaN(numValue)) {
              return numValue;
            }
          }
          return 0;
        })(),
      } as any;
    });

    // Filter out rows with missing critical data - use indentDate instead of allocationDate
    return indents.filter(indent => indent.indent && indent.indentDate);
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const convertToDate = (value: any): Date => {
  if (!value && value !== 0) return new Date();
  
  // If it's already a Date object (shouldn't happen with cellDates: false, but handle it)
  if (value instanceof Date) {
    return value;
  }
  
  // Excel serial date number (days since 1900-01-01)
  if (typeof value === 'number') {
    // Excel epoch: Dec 31, 1899
    // Excel serial 1 = Jan 1, 1900
    // Use 1899-12-31 as epoch to match Excel's display format (DD-MM-YYYY)
    const excelEpoch = new Date(1899, 11, 31); // Dec 31, 1899 (month is 0-indexed)
    const daysSinceEpoch = value - 1; // Serial 1 = day 0 from Dec 31, 1899 = Jan 1, 1900
    const date = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
    // Return date in local timezone (not UTC) to match Excel's display
    return date;
  }
  
  // String format - parse as DD-MM-YYYY (Indian format)
  if (typeof value === 'string') {
    const trimmed = value.trim();
    
    // Try DD-MM-YYYY or DD/MM/YYYY pattern first (Indian format)
    const ddmmyyyyPattern = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/;
    const match = trimmed.match(ddmmyyyyPattern);
    
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      
      // Always treat as DD-MM-YYYY for Indian date format
      // If day > 12, it's definitely DD-MM-YYYY
      // If day <= 12, we still assume DD-MM-YYYY (Indian format)
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    // Try standard Date parsing as fallback
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  return new Date();
};

// Convert Freight Tiger Month (Excel serial date or string) to month format
const convertFreightTigerMonth = (value: any): string => {
  if (!value && value !== 0) return '';
  
  // If it's already a string, try to use it as-is
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // If it's already a month format, return it
    if (trimmed.length > 0 && isNaN(Number(trimmed))) {
      return trimmed;
    }
    // If it's a number as string, convert it
    const numValue = parseFloat(trimmed);
    if (!isNaN(numValue)) {
      value = numValue;
    }
  }
  
  // If it's a number (Excel serial date), convert to date then to month format
  if (typeof value === 'number') {
    // Excel epoch: Dec 31, 1899
    const excelEpoch = new Date(1899, 11, 31);
    const daysSinceEpoch = value - 1;
    const date = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
    
    // Format as "MMM'yy" (e.g., "May'25")
    if (!isNaN(date.getTime())) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const year = String(date.getFullYear()).slice(-2);
      return `${month}'${year}`;
    }
  }
  
  // If it's a Date object, format it
  if (value instanceof Date && !isNaN(value.getTime())) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[value.getMonth()];
    const year = String(value.getFullYear()).slice(-2);
    return `${month}'${year}`;
  }
  
  return '';
};

