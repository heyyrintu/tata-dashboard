import * as XLSX from 'xlsx';
import { ITrip } from '../models/Trip';

interface ExcelRow {
  [key: string]: any;
}

/**
 * Normalize column name for matching
 */
function normalizeColumnName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  return name.trim().replace(/\s+/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

/**
 * Parse numeric value, returning 0 for null/empty/invalid
 */
function parseNumericValue(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  if (value === '-' || value === 'N/A' || value === 'NA') return 0;
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '').trim()) : Number(value);
  return isNaN(num) ? 0 : num;
}

// Normalize range values to standard format
const normalizeRange = (range: string | null | undefined): string => {
  if (!range || typeof range !== 'string') return '';
  const trimmed = range.trim();
  if (trimmed === '') return '';
  const normalized = trimmed.toLowerCase();
  if (normalized.startsWith('0-100') || normalized.startsWith('0 100')) return '0-100Km';
  if (normalized.startsWith('101-250') || normalized.startsWith('101 250')) return '101-250Km';
  if (normalized.startsWith('251-400') || normalized.startsWith('251 400')) return '251-400Km';
  if (normalized.startsWith('401-600') || normalized.startsWith('401 600')) return '401-600Km';
  return trimmed;
};

export const parseExcelFile = (filePath: string): ITrip[] => {
  try {
    const workbook = XLSX.readFile(filePath, { 
      type: 'file', 
      cellDates: false,
      cellFormula: true
    });
    
    const targetSheetName = 'OPs Data';
    if (!workbook.SheetNames.includes(targetSheetName)) {
      const fallbackSheet = workbook.SheetNames[0];
      console.warn(`[ExcelParser] Sheet '${targetSheetName}' not found. Using '${fallbackSheet}' instead.`);
    }
    
    const sheetName = workbook.SheetNames.includes(targetSheetName) ? targetSheetName : workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Use same options as September script for consistency
    const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, { 
      defval: null,
      raw: false 
    });
    
    console.log(`[ExcelParser] Reading data from '${sheetName}' sheet`);
    console.log(`[ExcelParser] Total rows: ${jsonData.length}`);
    
    // Get column names from first row to ensure correct column mapping
    // Try to find by name first, then fall back to index
    let columnUName: string | null = null;
    let columnAEName: string | null = null;
    if (jsonData.length > 0) {
      const firstRow = jsonData[0];
      const columns = Object.keys(firstRow);
      console.log(`[ExcelParser] Total columns found: ${columns.length}`);
      
      // Try to find "Total Km" column by name (case-insensitive, handles variations)
      // In actual Excel: Column U (index 20) = "Total Km ( TpT)"
      // But XLSX maps it to index 22 in object keys due to merged cells/header structure
      const totalKmColumnNames = [
        'Total Km ( TpT)',
        'Total Km (TpT)',
        'Total Km',
        'Total KM',
        'Total km',
        'TotalKm',
        'TOTAL KM',
        'TOTAL Km'
      ];
      
      for (const colName of totalKmColumnNames) {
        const foundCol = columns.find(col => 
          normalizeColumnName(col) === normalizeColumnName(colName) ||
          (col.toLowerCase().includes('total') && col.toLowerCase().includes('km'))
        );
        if (foundCol) {
          columnUName = foundCol;
          console.log(`[ExcelParser] Found Total Km column by name: "${columnUName}"`);
          break;
        }
      }
      
      // If not found by name, try index 22 (XLSX maps Column U to index 22 in object keys)
      // This is because XLSX uses the first row as keys, and merged cells shift the mapping
      if (!columnUName && columns.length > 22) {
        columnUName = columns[22];
        console.log(`[ExcelParser] Using Column U (mapped to index 22) by position: "${columnUName}"`);
        if (!columnUName.toLowerCase().includes('total') || !columnUName.toLowerCase().includes('km')) {
          console.warn(`[ExcelParser] ⚠️  WARNING: Column at index 22 is "${columnUName}", may not be "Total Km"!`);
        }
      } else if (!columnUName && columns.length > 20) {
        // Fallback to index 20
        columnUName = columns[20];
        console.log(`[ExcelParser] Using fallback index 20: "${columnUName}"`);
      } else if (!columnUName) {
        console.warn(`[ExcelParser] WARNING: Could not find Total Km column by name or index!`);
      }
      
      // Try to find "Total Cost" column by name
      // In actual Excel: Column AE (index 30) = "Total Cost_1"
      // But XLSX maps it to index 30 in object keys
      const totalCostColumnNames = [
        'Total Cost_1',
        'Total Cost',
        'TotalCost',
        'TOTAL COST'
      ];
      
      for (const colName of totalCostColumnNames) {
        const foundCol = columns.find(col => 
          normalizeColumnName(col) === normalizeColumnName(colName) ||
          (col.toLowerCase().includes('total') && col.toLowerCase().includes('cost') && !col.toLowerCase().includes('loading') && !col.toLowerCase().includes('unload'))
        );
        if (foundCol) {
          columnAEName = foundCol;
          console.log(`[ExcelParser] Found Total Cost column by name: "${columnAEName}"`);
          break;
        }
      }
      
      // If not found by name, try index 30 (Column AE) - this should be correct
      if (!columnAEName && columns.length > 30) {
        columnAEName = columns[30];
        console.log(`[ExcelParser] Using Column AE (index 30) by position: "${columnAEName}"`);
        if (!columnAEName.toLowerCase().includes('total') || !columnAEName.toLowerCase().includes('cost')) {
          console.warn(`[ExcelParser] ⚠️  WARNING: Column at index 30 is "${columnAEName}", may not be "Total Cost"!`);
        }
      } else if (!columnAEName) {
        console.warn(`[ExcelParser] WARNING: Could not find Total Cost column by name or index!`);
      }
    } else {
      console.warn(`[ExcelParser] WARNING: No data rows found in Excel file!`);
    }
    
    // Track parsing statistics
    let totalKmParsed = 0;
    let rowsWithKm = 0;
    let sampleValues: Array<{ indent: string; value: number }> = [];
    
    const indents: ITrip[] = jsonData.map((row: ExcelRow, index: number) => {
      // Parse Total Cost from Column AE (index 30) - main total cost for all calculations
      // Use column name if available (exactly like September script)
      const totalCostAE = columnAEName 
        ? parseNumericValue(row[columnAEName])
        : (() => {
            const rowKeys = Object.keys(row);
            return rowKeys.length > 30 && rowKeys[30] 
              ? parseNumericValue(row[rowKeys[30]]) 
              : 0;
          })();
      
      // Parse Total Km from Column U (index 20 in Excel, but XLSX maps to index 22 in object keys)
      // Use column name if available (this is the most reliable method)
      const totalKm = columnUName 
        ? parseNumericValue(row[columnUName])
        : (() => {
            const rowKeys = Object.keys(row);
            // Try index 22 first (XLSX mapping), then fallback to 20
            if (rowKeys.length > 22 && rowKeys[22]) {
              return parseNumericValue(row[rowKeys[22]]);
            }
            return rowKeys.length > 20 && rowKeys[20] 
              ? parseNumericValue(row[rowKeys[20]]) 
              : 0;
          })();
      
      // Track statistics
      if (totalKm > 0) {
        totalKmParsed += totalKm;
        rowsWithKm++;
        if (sampleValues.length < 5) {
          const indent = String(row['Indent'] || row['INDENT'] || `Row ${index + 1}`).trim();
          sampleValues.push({ indent, value: totalKm });
        }
      }
      
      // Get row keys for index-based fallback
      const rowKeys = Object.keys(row);
      
      return {
        sNo: parseNumericValue(row['S.NO'] || row['S.No'] || row['S.No.'] || row['SNo'] || index + 1),
        indentDate: convertToDate(row['Indent Date'] || row['IndentDate'] || row['Indent  Date']),
        indent: String(row['Indent'] || row['INDENT'] || '').trim(),
        allocationDate: convertToDate(row['Allocation Date'] || row['AllocationDate'] || row['Allocation  Date']),
        customerName: String(row['Customer Name'] || row['CustomerName'] || row['Customer  Name'] || '').trim(),
        // Range is at index 5 (Column F) in actual Excel
        range: normalizeRange(row['Range'] || row['RANGE'] || (rowKeys.length > 7 ? row[rowKeys[7]] : '')),
        // Location is at index 6 (Column G) in actual Excel
        location: String(row['Location'] || row['LOCATION'] || (rowKeys.length > 8 ? String(row[rowKeys[8]] || '').trim() : '')).trim(),
        // Vehicle Number is at index 7 (Column H) in actual Excel - CORRECT
        vehicleNumber: String(row['Vehicle Number'] || row['VehicleNumber'] || row['Vehicle  Number'] || (rowKeys.length > 9 ? String(row[rowKeys[9]] || '').trim() : '')).trim(),
        // Vehicle Model is at index 8 (Column I) in actual Excel
        vehicleModel: String(row['Vehicle Model'] || row['VehicleModel'] || row['Vehicle  Model'] || (rowKeys.length > 10 ? String(row[rowKeys[10]] || '').trim() : '')).trim(),
        // Vehicle Based is at index 9 (Column J) in actual Excel
        vehicleBased: String(row['Vehicle Based'] || row['VehicleBased'] || row['Vehicle  Based'] || (rowKeys.length > 11 ? String(row[rowKeys[11]] || '').trim() : '')).trim(),
        // LR No is at index 10 (Column K) in actual Excel
        lrNo: String(row['LR No.'] || row['LR No'] || row['LRNo'] || row['LR  No'] || (rowKeys.length > 12 ? String(row[rowKeys[12]] || '').trim() : '')).trim(),
        // Material is at index 11 (Column L) in actual Excel
        material: String(row['Material'] || row['MATERIAL'] || (rowKeys.length > 13 ? String(row[rowKeys[13]] || '').trim() : '')).trim(),
        // Load Per bucket (Kgs) is at index 12 (Column M) in actual Excel
        loadPerBucket: parseNumericValue(row['Load Per bucket (Kgs)'] || row['Load/Bucket'] || row['Load/Bucket'] || row['Load Per Bucket'] || (rowKeys.length > 14 ? row[rowKeys[14]] : 0)),
        // No. of Buckets/Barrels is at index 13 (Column N) in actual Excel
        noOfBuckets: parseNumericValue(row['No. of Buckets/Barrels'] || row['No. of Buckets'] || row['No of Buckets'] || row['No.Of Buckets'] || (rowKeys.length > 15 ? row[rowKeys[15]] : 0)),
        // T. Load (Kgs) is at index 14 (Column O) in actual Excel
        totalLoad: parseNumericValue(row['T. Load (Kgs)'] || row['Total Load'] || row['TotalLoad'] || row['Total  Load'] || (rowKeys.length > 16 ? row[rowKeys[16]] : 0)),
        // POD Received is at index 15 (Column P) in actual Excel
        podReceived: String(row['POD Received'] || row['PODReceived'] || row['POD  Received'] || (rowKeys.length > 17 ? String(row[rowKeys[17]] || '').trim() : '')).trim(),
        // Loading Charge - not directly in Excel, may need to calculate or set to 0
        loadingCharge: parseNumericValue(row['Loading Charge'] || row['LoadingCharge'] || row['Loading  Charge'] || row['Total Cost(Loading)'] || 0),
        // Unloading Charge - not directly in Excel, may need to calculate or set to 0
        unloadingCharge: parseNumericValue(row['Unloading Charge'] || row['UnloadingCharge'] || row['Unloading  Charge'] || row['Total cost Unload'] || 0),
        // Actual Running - not in Excel, set to 0
        actualRunning: parseNumericValue(row['Actual Running'] || row['ActualRunning'] || row['Actual  Running'] || 0),
        // Billable Running - not in Excel, set to 0
        billableRunning: parseNumericValue(row['Billable Running'] || row['BillableRunning'] || row['Billable  Running'] || 0),
        // Freight Tiger Month is at index 17 (Column R) in actual Excel
        freightTigerMonth: String(row['Freight Tiger Month'] || row['FreightTigerMonth'] || (rowKeys.length > 19 ? String(row[rowKeys[19]] || '').trim() : '')).trim(),
        // REMARKS is at index 18 (Column S) in actual Excel
        remarks: String(row['REMARKS'] || row['Remarks'] || (rowKeys.length > 20 ? String(row[rowKeys[20]] || '').trim() : '')).trim(),
        // Total Km ( TpT) is at index 20 (Column U) in actual Excel
        // XLSX maps it to index 22 in object keys due to header structure
        totalKm: totalKm, // From Column U - Total Km - already parsed above using column name
        // Total Cost_1 is at index 30 (Column AE) in actual Excel - main total cost
        totalCostAE: totalCostAE, // Already parsed above
        // P & L is at index 36 (Column AK) in actual Excel
        profitLoss: (() => {
          if (rowKeys.length > 36 && rowKeys[36]) {
            return parseNumericValue(row[rowKeys[36]]);
          }
          return parseNumericValue(row['P & L'] || row['P&L'] || 0);
        })(),
      } as ITrip;
    });

    const filtered = indents.filter(indent => indent.indent && indent.indentDate);
    console.log(`[ExcelParser] Parsed ${filtered.length} valid indents (filtered from ${indents.length} total rows)`);
    
    // Log totalKm parsing statistics
    console.log(`[ExcelParser] Total Km parsing statistics:`);
    console.log(`  Rows with totalKm > 0: ${rowsWithKm}`);
    console.log(`  Total Km parsed: ${totalKmParsed.toLocaleString('en-IN')} km`);
    if (sampleValues.length > 0) {
      console.log(`  Sample values (first 5):`);
      sampleValues.forEach((item, idx) => {
        console.log(`    ${idx + 1}. ${item.indent}: ${item.value.toLocaleString('en-IN')} km`);
      });
    }
    if (rowsWithKm === 0 && columnUName) {
      console.warn(`[ExcelParser] ⚠️  WARNING: No totalKm values found! Column U name: "${columnUName}"`);
      console.warn(`[ExcelParser] This might indicate a column mapping issue.`);
    }
    
    return filtered;
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const convertToDate = (value: any): Date => {
  if (!value && value !== 0) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    return new Date(excelEpoch.getTime() + value * millisecondsPerDay);
  }
  if (typeof value === 'string') {
    const cleaned = value.trim();
    if (cleaned === '' || cleaned === '-') return new Date();
    const ddmmyyyy = cleaned.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
};
