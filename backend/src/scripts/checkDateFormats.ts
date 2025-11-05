import * as XLSX from 'xlsx';

/**
 * Script to check how dates are being parsed from Excel
 * Usage: npx ts-node src/scripts/checkDateFormats.ts
 */

const checkDateFormats = () => {
  try {
    const filePath = 'C:\\Users\\RintuMondal\\OneDrive - DRONA LOGITECH PRIVATE LIMITED\\Pictures\\tata\\TATA DEF.xlsx';
    console.log(`📄 Reading Excel file: ${filePath}`);
    
    const workbook = XLSX.readFile(filePath, { type: 'file', cellDates: true });
    const sheetName = 'OPs Data';
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);
    
    // Check rows that my script found as Oct 10
    console.log(`\n🔍 Checking rows that were identified as Oct 10, 2025:\n`);
    
    data.forEach((row, index) => {
      const indentDate = row['Indent Date'];
      if (!indentDate) return;
      
      const date = indentDate instanceof Date ? indentDate : new Date(indentDate);
      
      // Check if it's around Oct 10-11
      if (date.getMonth() === 9 && (date.getDate() === 10 || date.getDate() === 11)) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        console.log(`Row ${index + 1}:`);
        console.log(`  Indent: ${row['Indent'] || 'N/A'}`);
        console.log(`  Raw Indent Date value: ${indentDate}`);
        console.log(`  Parsed as Date object: ${date.toString()}`);
        console.log(`  ISO format: ${date.toISOString().split('T')[0]}`);
        console.log(`  DD-MM-YYYY: ${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`);
        console.log(`  MM-DD-YYYY: ${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}-${year}`);
        console.log('');
      }
    });
    
    // Also read raw cell values to see what Excel actually stores
    console.log(`\n📋 Reading raw cell values from Excel:\n`);
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    // Find "Indent Date" column
    const headerRow = 0;
    let indentDateCol = -1;
    for (let col = 0; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col });
      const cell = worksheet[cellAddress];
      if (cell && (cell.v === 'Indent Date' || cell.v === 'Indent  Date')) {
        indentDateCol = col;
        break;
      }
    }
    
    if (indentDateCol >= 0) {
      console.log(`Found "Indent Date" column at index: ${indentDateCol}`);
      // Check a few rows to see raw values
      for (let row = 1; row <= Math.min(10, range.e.r); row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: indentDateCol });
        const cell = worksheet[cellAddress];
        if (cell) {
          const indent = worksheet[XLSX.utils.encode_cell({ r: row, c: 1 })];
          if (indent && (indent.v || '').toString().includes('10/25/07') || 
                       (indent.v || '').toString().includes('10/25/08') || 
                       (indent.v || '').toString().includes('10/25/09')) {
            console.log(`\nRow ${row + 1} (Indent: ${indent.v}):`);
            console.log(`  Raw cell value: ${cell.v}`);
            console.log(`  Cell type: ${cell.t}`);
            if (cell.w) console.log(`  Formatted value: ${cell.w}`);
            if (cell instanceof Date) {
              console.log(`  As Date: ${cell.toString()}`);
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

checkDateFormats();

