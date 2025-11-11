import * as XLSX from 'xlsx';
import path from 'path';

/**
 * Script to check the actual column order in the Excel file
 */
const checkExcelColumns = () => {
  try {
    // Try to find the Excel file
    const possiblePaths = [
      path.join(__dirname, '../../../MIS MASTER SHEET July 2025.xlsx'),
      path.join(__dirname, '../../MIS MASTER SHEET July 2025.xlsx'),
      'C:\\Users\\RintuMondal\\Videos\\tata\\MIS MASTER SHEET July 2025.xlsx'
    ];

    let filePath: string | null = null;
    for (const p of possiblePaths) {
      if (require('fs').existsSync(p)) {
        filePath = p;
        break;
      }
    }

    if (!filePath) {
      console.error('Excel file not found. Tried paths:', possiblePaths);
      return;
    }

    console.log(`Reading Excel file: ${filePath}`);
    const workbook = XLSX.readFile(filePath, { 
      type: 'file',
      cellDates: false,
      cellFormula: true
    });

    const targetSheetName = 'OPs Data';
    const sheetName = workbook.SheetNames.includes(targetSheetName) 
      ? targetSheetName 
      : workbook.SheetNames[0];
    
    console.log(`\nSheet: ${sheetName}`);
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON to get column names
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { 
      defval: null,
      raw: false,
      header: 1  // Get as array of arrays to see exact order
    });

    if (jsonData.length === 0) {
      console.error('No data found in sheet');
      return;
    }

    // Get header row (first row)
    const headers = jsonData[0] as any[];
    console.log(`\nTotal columns: ${headers.length}`);
    console.log('\n=== COLUMN ORDER (with index) ===\n');

    headers.forEach((header, index) => {
      const columnLetter = getColumnLetter(index);
      console.log(`Index ${index.toString().padStart(2, ' ')} | Column ${columnLetter.padEnd(3, ' ')} | "${header || '(empty)'}"`);
    });

    // Also get as object to see how XLSX names them
    const jsonDataAsObject: any[] = XLSX.utils.sheet_to_json(worksheet, { 
      defval: null,
      raw: false
    });

    if (jsonDataAsObject.length > 0) {
      console.log('\n=== COLUMN NAMES AS OBJECT KEYS ===\n');
      const firstRow = jsonDataAsObject[0];
      const columnNames = Object.keys(firstRow);
      columnNames.forEach((name, index) => {
        const columnLetter = getColumnLetter(index);
        console.log(`Index ${index.toString().padStart(2, ' ')} | Column ${columnLetter.padEnd(3, ' ')} | "${name}"`);
      });

      // Find specific columns
      console.log('\n=== KEY COLUMNS FOR VEHICLE COST ===\n');
      const vehicleNumberIndex = columnNames.findIndex(col => 
        col.toLowerCase().includes('vehicle') && col.toLowerCase().includes('number')
      );
      const totalKmIndex = columnNames.findIndex(col => 
        col.toLowerCase().includes('total') && col.toLowerCase().includes('km')
      );

      if (vehicleNumberIndex >= 0) {
        console.log(`Vehicle Number: Index ${vehicleNumberIndex}, Column ${getColumnLetter(vehicleNumberIndex)}, Name: "${columnNames[vehicleNumberIndex]}"`);
      } else {
        console.log('Vehicle Number: NOT FOUND');
      }

      if (totalKmIndex >= 0) {
        console.log(`Total Km: Index ${totalKmIndex}, Column ${getColumnLetter(totalKmIndex)}, Name: "${columnNames[totalKmIndex]}"`);
      } else {
        console.log('Total Km: NOT FOUND');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
};

function getColumnLetter(index: number): string {
  let result = '';
  let num = index;
  while (num >= 0) {
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26) - 1;
  }
  return result;
}

checkExcelColumns();

