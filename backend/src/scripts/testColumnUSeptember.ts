import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Script to test reading data from Column U (21st column, index 20) for September
 * and return the total value range-wise (0-100Km, 101-250Km, 251-400Km, 401-600Km)
 */
const testColumnUSeptember = async () => {
  try {
    console.log(`\n🔍 ===== TESTING COLUMN U (SEPTEMBER) - RANGE WISE =====\n`);
    
    // Find Excel file
    const possiblePaths = [
      path.join(__dirname, '../../../MIS MASTER SHEET July 2025.xlsx'),
      path.join(__dirname, '../../../../MIS MASTER SHEET July 2025.xlsx'),
      path.join(process.cwd(), 'MIS MASTER SHEET July 2025.xlsx'),
      path.join(process.cwd(), '../MIS MASTER SHEET July 2025.xlsx'),
      'C:\\Users\\RintuMondal\\OneDrive - DRONA LOGITECH PRIVATE LIMITED\\Pictures\\tata\\TATA DEF.xlsx',
    ];
    
    let excelPath: string | null = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        excelPath = possiblePath;
        console.log(`✅ Found Excel file at: ${excelPath}\n`);
        break;
      }
    }
    
    if (!excelPath) {
      console.error(`❌ Excel file not found!`);
      console.error(`   Please make sure the Excel file is in one of the expected locations.`);
      process.exit(1);
    }
    
    // Read Excel file
    console.log(`📖 Reading Excel file...`);
    const workbook = XLSX.readFile(excelPath, { 
      type: 'file', 
      cellDates: false,
      cellFormula: true
    });
    
    const targetSheetName = 'OPs Data';
    if (!workbook.SheetNames.includes(targetSheetName)) {
      console.warn(`⚠️  Sheet '${targetSheetName}' not found. Using '${workbook.SheetNames[0]}' instead.`);
    }
    
    const sheetName = workbook.SheetNames.includes(targetSheetName) ? targetSheetName : workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON to get column names
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { 
      defval: null,
      raw: false 
    });
    
    console.log(`📊 Total rows in Excel: ${jsonData.length}\n`);
    
    if (jsonData.length === 0) {
      console.error(`❌ No data found in Excel file!`);
      process.exit(1);
    }
    
    // Get column names
    const firstRow = jsonData[0];
    const columns = Object.keys(firstRow);
    
    console.log(`📋 Column Information:`);
    console.log(`  Total columns: ${columns.length}`);
    
    // Check if column U (index 20) exists
    if (columns.length <= 20) {
      console.error(`❌ Column U (index 20) does not exist! Only ${columns.length} columns found.`);
      process.exit(1);
    }
    
    const columnUName = columns[20];
    console.log(`  Column U (index 20): "${columnUName}"`);
    
    // Show first few column names for reference
    console.log(`\n📋 First 25 columns:`);
    columns.slice(0, 25).forEach((col, idx) => {
      const marker = idx === 20 ? ' ← Column U' : '';
      console.log(`  [${idx}] ${col}${marker}`);
    });
    
    // Normalize month function (similar to other scripts)
    const normalizeFreightTigerMonth = (monthValue: string): string | null => {
      if (!monthValue || typeof monthValue !== 'string') return null;
      const trimmed = monthValue.trim();
      const fixedTypo = trimmed.replace(/^0ct/i, 'Oct');
      const monthPatterns = [
        /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-'](\d{2,4})$/i,
        /^(\d{1,2})[-/](\d{2,4})$/,
      ];
      
      for (const pattern of monthPatterns) {
        const match = fixedTypo.match(pattern);
        if (match) {
          let monthStr = match[1];
          let yearStr = match[2];
          
          const monthNames: { [key: string]: string } = {
            'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
            'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
            'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
          };
          
          if (monthNames[monthStr.toLowerCase()]) {
            monthStr = monthNames[monthStr.toLowerCase()];
          } else if (parseInt(monthStr) >= 1 && parseInt(monthStr) <= 12) {
            monthStr = monthStr.padStart(2, '0');
          } else {
            continue;
          }
          
          if (yearStr.length === 2) {
            const yearNum = parseInt(yearStr);
            yearStr = yearNum >= 50 ? `19${yearStr}` : `20${yearStr}`;
          }
          
          return `${yearStr}-${monthStr}`;
        }
      }
      return null;
    };
    
    // Parse numeric value
    const parseNumericValue = (value: any): number => {
      if (value === null || value === undefined || value === '') return 0;
      if (value === '-' || value === 'N/A' || value === 'NA') return 0;
      const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '').trim()) : Number(value);
      return isNaN(num) ? 0 : num;
    };
    
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
    
    // Filter for September rows
    console.log(`\n🔍 Filtering for September data...`);
    const septemberRows = jsonData.filter((row: any) => {
      const monthValue = row['Freight Tiger Month'] || row['FreightTigerMonth'] || '';
      const normalized = normalizeFreightTigerMonth(monthValue);
      return normalized === '2025-09' || normalized === '2024-09';
    });
    
    console.log(`  Total September rows found: ${septemberRows.length}`);
    
    if (septemberRows.length === 0) {
      console.warn(`⚠️  No September rows found!`);
      console.log(`\n📅 Checking available months in data:`);
      const monthSet = new Set<string>();
      jsonData.forEach((row: any) => {
        const monthValue = row['Freight Tiger Month'] || row['FreightTigerMonth'] || '';
        const normalized = normalizeFreightTigerMonth(monthValue);
        if (normalized) monthSet.add(normalized);
      });
      console.log(`  Available months: ${Array.from(monthSet).sort().join(', ')}`);
      process.exit(0);
    }
    
    // Process values from Column U grouped by range
    console.log(`\n📊 Processing Column U values for September (Range-wise)...`);
    
    // Define standard ranges
    const standardRanges = ['0-100Km', '101-250Km', '251-400Km', '401-600Km'];
    
    // Initialize range data structure
    interface RangeData {
      range: string;
      total: number;
      rowCount: number;
      rowsWithValue: number;
      rowsWithZero: number;
      rowsWithNull: number;
      sampleValues: Array<{ indent: string; value: number }>;
    }
    
    const rangeDataMap = new Map<string, RangeData>();
    standardRanges.forEach(range => {
      rangeDataMap.set(range, {
        range,
        total: 0,
        rowCount: 0,
        rowsWithValue: 0,
        rowsWithZero: 0,
        rowsWithNull: 0,
        sampleValues: []
      });
    });
    
    // Track "Other" range for non-standard ranges
    const otherRangeData: RangeData = {
      range: 'Other',
      total: 0,
      rowCount: 0,
      rowsWithValue: 0,
      rowsWithZero: 0,
      rowsWithNull: 0,
      sampleValues: []
    };
    
    // Process each September row
    septemberRows.forEach((row: any) => {
      // Get range and normalize it
      const rangeValue = row['Range'] || row['RANGE'] || '';
      const normalizedRange = normalizeRange(rangeValue);
      
      // Get value from Column U (index 20)
      const columnUValue = row[columnUName];
      const numericValue = parseNumericValue(columnUValue);
      
      // Determine which range data to update
      let targetRangeData: RangeData;
      if (standardRanges.includes(normalizedRange)) {
        targetRangeData = rangeDataMap.get(normalizedRange)!;
      } else {
        targetRangeData = otherRangeData;
      }
      
      // Update range statistics
      targetRangeData.rowCount++;
      targetRangeData.total += numericValue;
      
      if (numericValue > 0) {
        targetRangeData.rowsWithValue++;
        if (targetRangeData.sampleValues.length < 5) {
          targetRangeData.sampleValues.push({
            indent: row['Indent'] || row['INDENT'] || 'N/A',
            value: numericValue
          });
        }
      } else if (numericValue === 0) {
        targetRangeData.rowsWithZero++;
      } else {
        targetRangeData.rowsWithNull++;
      }
    });
    
    // Display results range-wise
    console.log(`\n✅ ===== RESULTS (RANGE-WISE) =====\n`);
    
    let grandTotal = 0;
    let totalRows = 0;
    
    // Display standard ranges
    standardRanges.forEach(range => {
      const data = rangeDataMap.get(range)!;
      grandTotal += data.total;
      totalRows += data.rowCount;
      
      console.log(`📊 ${range}:`);
      console.log(`   Total Value: ${data.total.toLocaleString('en-IN')}`);
      console.log(`   Row Count: ${data.rowCount}`);
      console.log(`   Rows with value > 0: ${data.rowsWithValue}`);
      console.log(`   Rows with value = 0: ${data.rowsWithZero}`);
      console.log(`   Rows with null/empty: ${data.rowsWithNull}`);
      
      if (data.sampleValues.length > 0) {
        console.log(`   Sample values:`);
        data.sampleValues.forEach((item, idx) => {
          console.log(`     ${idx + 1}. Indent: ${item.indent}, Value: ${item.value.toLocaleString('en-IN')}`);
        });
      }
      console.log(``);
    });
    
    // Display "Other" range if it has data
    if (otherRangeData.rowCount > 0) {
      grandTotal += otherRangeData.total;
      totalRows += otherRangeData.rowCount;
      
      console.log(`📊 Other (Non-standard ranges):`);
      console.log(`   Total Value: ${otherRangeData.total.toLocaleString('en-IN')}`);
      console.log(`   Row Count: ${otherRangeData.rowCount}`);
      console.log(`   Rows with value > 0: ${otherRangeData.rowsWithValue}`);
      console.log(`   Rows with value = 0: ${otherRangeData.rowsWithZero}`);
      console.log(`   Rows with null/empty: ${otherRangeData.rowsWithNull}`);
      
      if (otherRangeData.sampleValues.length > 0) {
        console.log(`   Sample values:`);
        otherRangeData.sampleValues.forEach((item, idx) => {
          console.log(`     ${idx + 1}. Indent: ${item.indent}, Value: ${item.value.toLocaleString('en-IN')}`);
        });
      }
      console.log(``);
    }
    
    // Display summary
    console.log(`✅ ===== SUMMARY =====`);
    console.log(`📊 Column U (${columnUName}) - September Total (All Ranges): ${grandTotal.toLocaleString('en-IN')}`);
    console.log(`📈 Total September rows processed: ${totalRows}`);
    console.log(`\n`);
    
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error:`, error);
    process.exit(1);
  }
};

testColumnUSeptember();

