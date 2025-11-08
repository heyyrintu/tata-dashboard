import { connectDatabase } from '../config/database';
import Trip from '../models/Trip';
import * as XLSX from 'xlsx';

/**
 * Deep debug to find missing rows
 */
const deepDebugCost = async () => {
  try {
    await connectDatabase();
    
    const filePath = 'C:\\Users\\RintuMondal\\OneDrive - DRONA LOGITECH PRIVATE LIMITED\\Pictures\\tata\\TATA DEF.xlsx';
    console.log(`📄 Reading Excel file: ${filePath}`);
    
    // Read Excel file
    const workbook = XLSX.readFile(filePath, { 
      type: 'file', 
      cellDates: false,
      cellFormula: true
    });
    
    const sheetName = 'OPs Data';
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      defval: null,
      raw: false 
    });
    
    // Helper functions
    const normalizeMonth = (monthValue: string): string | null => {
      if (!monthValue || typeof monthValue !== 'string') return null;
      const trimmed = monthValue.trim().replace(/^0ct/i, 'Oct');
      const monthPatterns = [
        /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-'](\d{2,4})$/i,
      ];
      for (const pattern of monthPatterns) {
        const match = trimmed.match(pattern);
        if (match) {
          const monthNames: { [key: string]: string } = {
            'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
            'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
            'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
          };
          const monthStr = monthNames[match[1].toLowerCase()] || match[1];
          const yearStr = match[2].length === 2 ? (parseInt(match[2]) >= 50 ? `19${match[2]}` : `20${match[2]}`) : match[2];
          return `${yearStr}-${monthStr}`;
        }
      }
      return null;
    };
    
    const normalizeRange = (range: string | null | undefined): string => {
      if (!range || typeof range !== 'string') return '';
      const trimmed = range.trim().toLowerCase();
      if (trimmed.startsWith('0-100') || trimmed.startsWith('0 100')) return '0-100Km';
      if (trimmed.startsWith('101-250') || trimmed.startsWith('101 250')) return '101-250Km';
      if (trimmed.startsWith('251-400') || trimmed.startsWith('251 400')) return '251-400Km';
      if (trimmed.startsWith('401-600') || trimmed.startsWith('401 600')) return '401-600Km';
      return trimmed;
    };
    
    // Test cases
    const testCases = [
      { month: 'May', monthKey: '2025-05', range: '0-100Km', expected: 196078.5 },
      { month: 'June', monthKey: '2025-06', range: '101-250Km', expected: 386296.25 },
      { month: 'July', monthKey: '2025-07', range: '101-250Km', expected: 348554 }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🔍 DEEP DEBUG: ${testCase.month} - ${testCase.range}`);
      console.log(`${'='.repeat(80)}`);
      
      // Get Excel data
      const excelRows = jsonData.filter((row: any) => {
        const month = normalizeMonth(row['Freight Tiger Month'] || '');
        const range = normalizeRange(row['Range'] || '');
        return month === testCase.monthKey && range === testCase.range;
      });
      
      const excelTotalCost = excelRows.reduce((sum: number, row: any) => {
        const costValue = row['Any Other Cost'] || row['Total Cost_1'] || row['Total Cost'] || 0;
        return sum + (parseFloat(costValue) || 0);
      }, 0);
      
      console.log(`\n📊 Excel Analysis:`);
      console.log(`  Total rows: ${excelRows.length}`);
      console.log(`  Total Cost: ₹${excelTotalCost.toLocaleString('en-IN')}`);
      console.log(`  Expected: ₹${testCase.expected.toLocaleString('en-IN')}`);
      console.log(`  Difference: ₹${Math.abs(excelTotalCost - testCase.expected).toLocaleString('en-IN')}`);
      
      // Get database data
      const dbIndents = await Trip.find({});
      const dbFiltered = dbIndents.filter((indent: any) => {
        const normalizedMonth = normalizeMonth(indent.freightTigerMonth || '');
        return normalizedMonth === testCase.monthKey && indent.range === testCase.range;
      });
      
      const dbTotalCost = dbFiltered.reduce((sum, indent) => sum + ((indent as any).totalCost || 0), 0);
      
      console.log(`\n📊 Database Analysis:`);
      console.log(`  Total rows: ${dbFiltered.length}`);
      console.log(`  Total Cost: ₹${dbTotalCost.toLocaleString('en-IN')}`);
      console.log(`  Difference from Excel: ₹${Math.abs(excelTotalCost - dbTotalCost).toLocaleString('en-IN')}`);
      
      // Find missing rows
      console.log(`\n🔍 Finding missing rows:`);
      
      // Create a map of Excel rows by indent + sNo
      const excelMap = new Map<string, any>();
      excelRows.forEach((row: any, index: number) => {
        const indent = (row['Indent'] || '').toString().trim();
        const sNo = (row['S.No'] || row['S.No.'] || index + 1).toString();
        const key = `${indent}_${sNo}`;
        excelMap.set(key, row);
      });
      
      // Create a map of DB rows by indent + sNo
      const dbMap = new Map<string, any>();
      dbFiltered.forEach((indent: any) => {
        const key = `${indent.indent}_${indent.sNo || ''}`;
        dbMap.set(key, indent);
      });
      
      // Find rows in Excel but not in DB
      const missingInDB: any[] = [];
      excelMap.forEach((excelRow, key) => {
        if (!dbMap.has(key)) {
          missingInDB.push(excelRow);
        }
      });
      
      // Find rows in DB but not in Excel
      const extraInDB: any[] = [];
      dbMap.forEach((dbIndent, key) => {
        if (!excelMap.has(key)) {
          extraInDB.push(dbIndent);
        }
      });
      
      console.log(`  Rows in Excel but not in DB: ${missingInDB.length}`);
      if (missingInDB.length > 0) {
        console.log(`  Missing rows (first 10):`);
        missingInDB.slice(0, 10).forEach((row, index) => {
          const cost = parseFloat(row['Any Other Cost'] || row['Total Cost_1'] || row['Total Cost'] || 0);
          console.log(`    ${index + 1}. Indent: ${row['Indent']}, S.No: ${row['S.No'] || row['S.No.']}, Cost: ₹${cost}, Month: ${row['Freight Tiger Month']}, Range: ${row['Range']}`);
        });
        const missingCost = missingInDB.reduce((sum, row) => {
          const cost = parseFloat(row['Any Other Cost'] || row['Total Cost_1'] || row['Total Cost'] || 0);
          return sum + cost;
        }, 0);
        console.log(`  Total missing cost: ₹${missingCost.toLocaleString('en-IN')}`);
      }
      
      console.log(`  Rows in DB but not in Excel: ${extraInDB.length}`);
      if (extraInDB.length > 0) {
        console.log(`  Extra rows (first 10):`);
        extraInDB.slice(0, 10).forEach((indent, index) => {
          console.log(`    ${index + 1}. Indent: ${indent.indent}, S.No: ${indent.sNo}, Cost: ₹${(indent as any).totalCost || 0}, Month: ${indent.freightTigerMonth}, Range: ${indent.range}`);
        });
      }
      
      // Check for cost mismatches
      console.log(`\n🔍 Checking cost mismatches (same indent, different cost):`);
      let mismatchCount = 0;
      let mismatchCost = 0;
      excelMap.forEach((excelRow, key) => {
        if (dbMap.has(key)) {
          const dbIndent = dbMap.get(key);
          const excelCost = parseFloat(excelRow['Any Other Cost'] || excelRow['Total Cost_1'] || excelRow['Total Cost'] || 0);
          const dbCost = (dbIndent as any).totalCost || 0;
          if (Math.abs(excelCost - dbCost) > 0.01) {
            mismatchCount++;
            mismatchCost += (excelCost - dbCost);
            if (mismatchCount <= 5) {
              console.log(`    ${key}: Excel=₹${excelCost}, DB=₹${dbCost}, Diff=₹${(excelCost - dbCost).toLocaleString('en-IN')}`);
            }
          }
        }
      });
      if (mismatchCount > 0) {
        console.log(`  Total mismatches: ${mismatchCount}, Total cost difference: ₹${mismatchCost.toLocaleString('en-IN')}`);
      }
      
      // Check rows with zero cost
      const excelZeroCost = excelRows.filter((row: any) => {
        const cost = parseFloat(row['Any Other Cost'] || row['Total Cost_1'] || row['Total Cost'] || 0);
        return cost === 0;
      });
      const dbZeroCost = dbFiltered.filter((indent: any) => ((indent as any).totalCost || 0) === 0);
      
      console.log(`\n🔍 Zero cost rows:`);
      console.log(`  Excel: ${excelZeroCost.length} rows with zero cost`);
      console.log(`  DB: ${dbZeroCost.length} rows with zero cost`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

deepDebugCost();

