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
          col.toLowerCase().includes('total') && col.toLowerCase().includes('km')
        );
        if (foundCol) {
          columnUName = foundCol;
          console.log(`[ExcelParser] Found Total Km column by name: "${columnUName}"`);
          break;
        }
      }
      
      // If not found by name, try index 20 (Column U)
      if (!columnUName && columns.length > 20) {
        columnUName = columns[20];
        console.log(`[ExcelParser] Using Column U (index 20) by position: "${columnUName}"`);
        console.warn(`[ExcelParser] ⚠️  WARNING: Column at index 20 is "${columnUName}", not "Total Km"!`);
      } else if (!columnUName) {
        console.warn(`[ExcelParser] WARNING: Could not find Total Km column by name or index!`);
      }
      
      // Try to find "Total Cost" column by name
      const totalCostColumnNames = [
        'Total Cost_1',
        'Total Cost',
        'TotalCost',
        'TOTAL COST'
      ];
      
      for (const colName of totalCostColumnNames) {
        const foundCol = columns.find(col => 
          normalizeColumnName(col) === normalizeColumnName(colName) ||
          (col.toLowerCase().includes('total') && col.toLowerCase().includes('cost'))
        );
        if (foundCol) {
          columnAEName = foundCol;
          console.log(`[ExcelParser] Found Total Cost column by name: "${columnAEName}"`);
          break;
        }
      }
      
      // If not found by name, try index 30 (Column AE)
      if (!columnAEName && columns.length > 30) {
        columnAEName = columns[30];
        console.log(`[ExcelParser] Using Column AE (index 30) by position: "${columnAEName}"`);
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
      
      // Parse Total Km from Column U (21st column, index 20)
      // Use column name if available (exactly like September script)
      const totalKm = columnUName 
        ? parseNumericValue(row[columnUName])
        : (() => {
            const rowKeys = Object.keys(row);
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
      
      return {
        sNo: parseNumericValue(row['S.No'] || row['S.No.'] || row['SNo'] || index + 1),
        indentDate: convertToDate(row['Indent Date'] || row['IndentDate'] || row['Indent  Date']),
        indent: String(row['Indent'] || row['INDENT'] || '').trim(),
        allocationDate: convertToDate(row['Allocation Date'] || row['AllocationDate'] || row['Allocation  Date']),
        customerName: String(row['Customer Name'] || row['CustomerName'] || row['Customer  Name'] || '').trim(),
        location: String(row['Location'] || row['LOCATION'] || '').trim(),
        vehicleModel: String(row['Vehicle Model'] || row['VehicleModel'] || row['Vehicle  Model'] || '').trim(),
        vehicleNumber: String(row['Vehicle Number'] || row['VehicleNumber'] || row['Vehicle  Number'] || '').trim(),
        vehicleBased: String(row['Vehicle Based'] || row['VehicleBased'] || row['Vehicle  Based'] || '').trim(),
        lrNo: String(row['LR No'] || row['LRNo'] || row['LR  No'] || row['LR No.'] || '').trim(),
        material: String(row['Material'] || row['MATERIAL'] || '').trim(),
        loadPerBucket: parseNumericValue(row['Load/Bucket'] || row['Load/Bucket'] || row['Load Per Bucket']),
        noOfBuckets: parseNumericValue(row['No. of Buckets'] || row['No of Buckets'] || row['No.Of Buckets'] || row['No of Buckets']),
        totalLoad: parseNumericValue(row['Total Load'] || row['TotalLoad'] || row['Total  Load']),
        podReceived: String(row['POD Received'] || row['PODReceived'] || row['POD  Received'] || '').trim(),
        loadingCharge: parseNumericValue(row['Loading Charge'] || row['LoadingCharge'] || row['Loading  Charge']),
        unloadingCharge: parseNumericValue(row['Unloading Charge'] || row['UnloadingCharge'] || row['Unloading  Charge']),
        actualRunning: parseNumericValue(row['Actual Running'] || row['ActualRunning'] || row['Actual  Running']),
        billableRunning: parseNumericValue(row['Billable Running'] || row['BillableRunning'] || row['Billable  Running']),
        range: normalizeRange(row['Range'] || row['RANGE']),
        remarks: String(row['Remarks'] || row['REMARKS'] || '').trim(),
        freightTigerMonth: String(row['Freight Tiger Month'] || row['FreightTigerMonth'] || '').trim(),
        totalCostAE: totalCostAE, // From Column AE (index 30) - main total cost
        profitLoss: (() => {
          const rowKeys = Object.keys(row);
          if (rowKeys.length > 36 && rowKeys[36]) {
            return parseNumericValue(row[rowKeys[36]]);
          }
          return parseNumericValue(row['P & L'] || row['P&L'] || 0);
        })(),
        totalKm: totalKm, // From Column U (21st column, index 20) - Total Km
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
