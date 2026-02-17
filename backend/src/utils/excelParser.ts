import * as XLSX from 'xlsx';

// Trip input type for creating records (matches Prisma schema)
export interface TripInput {
  sNo?: number;
  indentDate?: Date;
  indent?: string;
  allocationDate?: Date;
  customerName?: string;
  location?: string;
  vehicleModel?: string;
  vehicleNumber?: string;
  vehicleBased?: string;
  lrNo?: string;
  material?: string;
  loadPerBucket?: number;
  noOfBuckets?: number;
  totalLoad?: number;
  podReceived?: string;
  loadingCharge?: number;
  unloadingCharge?: number;
  actualRunning?: number;
  billableRunning?: number;
  range?: string;
  remarks?: string;
  freightTigerMonth?: string;
  totalCostAE?: number;
  totalCostLoading?: number;
  totalCostUnload?: number;
  anyOtherCost?: number;
  remainingCost?: number;
  vehicleCost?: number;
  profitLoss?: number;
  totalKm?: number;
}

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

export const parseExcelFile = (filePath: string): TripInput[] => {
  try {
    const workbook = XLSX.readFile(filePath, { 
      type: 'file', 
      cellDates: false,
      cellFormula: false
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
    
    
    // Get column names from first row to ensure correct column mapping
    // Try to find by name first, then fall back to index
    let columnUName: string | null = null;
    let columnAEName: string | null = null;
    let columnYName: string | null = null; // Column Y (index 24) - Total Cost(Loading)
    let columnABName: string | null = null; // Column AB (index 27) - Total cost Unload
    let columnADName: string | null = null; // Column AD (index 29) - Any Other Cost
    let columnAKName: string | null = null; // Column AK (index 36) - P & L (Profit & Loss)
    if (jsonData.length > 0) {
      const firstRow = jsonData[0];
      const columns = Object.keys(firstRow);
      
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
          break;
        }
      }
      
      // If not found by name, try index 20 (Column U)
      if (!columnUName && columns.length > 20) {
        columnUName = columns[20];
        console.warn(`[ExcelParser] Column at index 20 is "${columnUName}", not "Total Km" — using by position`);
      } else if (!columnUName) {
        console.warn(`[ExcelParser] WARNING: Could not find Total Km column by name or index!`);
      }
      
      // Find cost columns by name first, then fall back to index
      // Column Y - Total Cost(Loading)
      const loadingCostNames = ['Total Cost(Loading)', 'Total Cost (Loading)', 'TotalCostLoading', 'Total Cost Loading'];
      for (const name of loadingCostNames) {
        const found = columns.find(c => normalizeColumnName(c) === normalizeColumnName(name));
        if (found) { columnYName = found; break; }
      }
      if (!columnYName && columns.length > 24) {
        columnYName = columns[24];
      }
      // Column AB - Total cost Unload
      const unloadCostNames = ['Total cost Unload', 'Total Cost Unload', 'Total Cost(Unloading)', 'Total Cost (Unload)', 'TotalCostUnload'];
      for (const name of unloadCostNames) {
        const found = columns.find(c => normalizeColumnName(c) === normalizeColumnName(name));
        if (found) { columnABName = found; break; }
      }
      if (!columnABName && columns.length > 27) {
        columnABName = columns[27];
      }
      // Column AD - Any Other Cost
      const otherCostNames = ['Any Other Cost', 'Any other Cost', 'AnyOtherCost', 'Other Cost'];
      for (const name of otherCostNames) {
        const found = columns.find(c => normalizeColumnName(c) === normalizeColumnName(name));
        if (found) { columnADName = found; break; }
      }
      if (!columnADName && columns.length > 29) {
        columnADName = columns[29];
      }
      // Column AE - Total Cost (the MAIN cost column)
      // Must match exactly "Total Cost" - NOT "Total Cost(Loading)" or "Total cost Unload"
      const totalCostNames = ['Total Cost', 'TotalCost', 'TOTAL COST', 'Total  Cost'];
      for (const name of totalCostNames) {
        const found = columns.find(c => {
          const norm = normalizeColumnName(c);
          return norm === normalizeColumnName(name) && !norm.toLowerCase().includes('loading') && !norm.toLowerCase().includes('unload');
        });
        if (found) { columnAEName = found; break; }
      }
      if (!columnAEName) {
        // Fallback: find any column whose normalized name is exactly "Total Cost" (no extra words)
        const found = columns.find(c => {
          const norm = normalizeColumnName(c).toLowerCase();
          return norm === 'total cost';
        });
        if (found) columnAEName = found;
      }
      if (!columnAEName && columns.length > 30) {
        columnAEName = columns[30];
        console.warn(`[ExcelParser] Could not find "Total Cost" column by name, falling back to index 30: "${columnAEName}"`);
      }

      // Column AK - P & L (Profit & Loss)
      const profitLossNames = ['P & L', 'P&L', 'P &L', 'P& L', 'Profit & Loss', 'Profit Loss', 'ProfitLoss', 'Profit/Loss', 'P & L (%)'];
      for (const name of profitLossNames) {
        const found = columns.find(c => normalizeColumnName(c) === normalizeColumnName(name));
        if (found) { columnAKName = found; break; }
      }
      if (!columnAKName) {
        // Broader search: any column containing 'p' and 'l' that looks like profit/loss
        const found = columns.find(c => {
          const norm = normalizeColumnName(c).toLowerCase();
          return (norm === 'p & l' || norm === 'p&l' || norm.includes('profit') && norm.includes('loss'));
        });
        if (found) columnAKName = found;
      }
      if (!columnAKName && columns.length > 36) {
        columnAKName = columns[36];
        console.warn(`[ExcelParser] Could not find "P & L" column by name, falling back to index 36: "${columnAKName}"`);
      }
    } else {
      console.warn(`[ExcelParser] WARNING: No data rows found in Excel file!`);
    }
    
    let rowsWithKm = 0;
    
    // Get column names for index-based access
    const rowKeys = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
    let columnNIndex = -1; // No. of Buckets/Barrels
    let columnOIndex = -1; // T. Load (Kgs)
    
    // Find column indices
    for (let i = 0; i < rowKeys.length; i++) {
      const colName = normalizeColumnName(String(rowKeys[i] || ''));
      if (colName.includes('bucket') && colName.includes('barrel')) {
        columnNIndex = i;
      }
      if (colName.includes('load') && (colName.includes('kg') || colName.includes('kgs'))) {
        columnOIndex = i;
      }
    }
    
    // Fallback to expected indices if not found by name
    if (columnNIndex === -1 && rowKeys.length > 13) columnNIndex = 13; // Column N
    if (columnOIndex === -1 && rowKeys.length > 14) columnOIndex = 14; // Column O
    
    const indents: TripInput[] = jsonData.map((row: ExcelRow, index: number) => {
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
      
      // Parse Total Cost(Loading) from Column Y (index 24)
      const totalCostLoading = columnYName 
        ? parseNumericValue(row[columnYName])
        : (() => {
            const rowKeys = Object.keys(row);
            return rowKeys.length > 24 && rowKeys[24] 
              ? parseNumericValue(row[rowKeys[24]]) 
              : 0;
          })();
      
      // Parse Total cost Unload from Column AB (index 27)
      const totalCostUnload = columnABName 
        ? parseNumericValue(row[columnABName])
        : (() => {
            const rowKeys = Object.keys(row);
            return rowKeys.length > 27 && rowKeys[27] 
              ? parseNumericValue(row[rowKeys[27]]) 
              : 0;
          })();
      
      // Parse Any Other Cost from Column AD (index 29)
      const anyOtherCost = columnADName 
        ? parseNumericValue(row[columnADName])
        : (() => {
            const rowKeys = Object.keys(row);
            return rowKeys.length > 29 && rowKeys[29] 
              ? parseNumericValue(row[rowKeys[29]]) 
              : 0;
          })();
      
      // Calculate remaining cost (sum of the 3 columns)
      const remainingCost = totalCostLoading + totalCostUnload + anyOtherCost;
      
      // Calculate vehicle cost (Total Cost - Remaining Cost)
      const vehicleCost = totalCostAE - remainingCost;
      
      if (totalKm > 0) rowsWithKm++;
      
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
        loadPerBucket: parseNumericValue(row['Load Per bucket (Kgs)'] || row['Load/Bucket'] || row['Load Per Bucket']),
        // Column N (index 13) - No. of Buckets/Barrels
        noOfBuckets: (() => {
          // Try by name first
          const byName = parseNumericValue(row['No. of Buckets/Barrels'] || row['No. of Buckets'] || row['No of Buckets'] || row['No.Of Buckets']);
          if (byName > 0) return byName;
          // Fallback to index
          return columnNIndex >= 0 && rowKeys.length > columnNIndex ? parseNumericValue(row[rowKeys[columnNIndex]]) : 0;
        })(),
        // Column O (index 14) - T. Load (Kgs)
        totalLoad: (() => {
          // Try by name first
          const byName = parseNumericValue(row['T. Load (Kgs)'] || row['T. Load'] || row['Total Load'] || row['TotalLoad'] || row['Total  Load']);
          if (byName > 0) return byName;
          // Fallback to index
          return columnOIndex >= 0 && rowKeys.length > columnOIndex ? parseNumericValue(row[rowKeys[columnOIndex]]) : 0;
        })(),
        podReceived: String(row['POD Received'] || row['PODReceived'] || row['POD  Received'] || '').trim(),
        loadingCharge: parseNumericValue(row['Loading Charge'] || row['LoadingCharge'] || row['Loading  Charge']),
        unloadingCharge: parseNumericValue(row['Unloading Charge'] || row['UnloadingCharge'] || row['Unloading  Charge']),
        actualRunning: parseNumericValue(row['Actual Running'] || row['ActualRunning'] || row['Actual  Running']),
        billableRunning: parseNumericValue(row['Billable Running'] || row['BillableRunning'] || row['Billable  Running']),
        range: normalizeRange(row['Range'] || row['RANGE']),
        remarks: String(row['Remarks'] || row['REMARKS'] || '').trim(),
        freightTigerMonth: String(row['Freight Tiger Month'] || row['FreightTigerMonth'] || '').trim(),
        totalCostAE: totalCostAE, // From Column AE (index 30) - main total cost
        totalCostLoading: totalCostLoading, // From Column Y (index 24) - Total Cost(Loading)
        totalCostUnload: totalCostUnload, // From Column AB (index 27) - Total cost Unload
        anyOtherCost: anyOtherCost, // From Column AD (index 29) - Any Other Cost
        remainingCost: remainingCost, // Calculated: totalCostLoading + totalCostUnload + anyOtherCost
        vehicleCost: vehicleCost, // Calculated: totalCostAE - remainingCost
        profitLoss: columnAKName
          ? parseNumericValue(row[columnAKName])
          : (() => {
              const rowKeys = Object.keys(row);
              return rowKeys.length > 36 && rowKeys[36]
                ? parseNumericValue(row[rowKeys[36]])
                : 0;
            })(),
        totalKm: totalKm, // From Column U (21st column, index 20) - Total Km
      } as TripInput;
    });

    const filtered = indents.filter(indent => indent.indent && indent.indentDate);

    if (rowsWithKm === 0 && columnUName) {
      console.warn(`[ExcelParser] No totalKm values found — column "${columnUName}" may be mapped incorrectly`);
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
