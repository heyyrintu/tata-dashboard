import * as XLSX from 'xlsx';
import path from 'path';

/**
 * Script to export rows from "OPs Data" sheet where Oct 10 is present
 * Usage: npx ts-node src/scripts/exportOct10Data.ts
 */

const exportOct10Data = () => {
  try {
    const filePath = 'C:\\Users\\RintuMondal\\OneDrive - DRONA LOGITECH PRIVATE LIMITED\\Pictures\\tata\\TATA DEF.xlsx';
    console.log(`📄 Reading Excel file: ${filePath}`);
    
    // Read WITHOUT cellDates to get raw values (Excel serial numbers or strings)
    const workbook = XLSX.readFile(filePath, { type: 'file', cellDates: false });
    
    // Use "OPs Data" sheet
    const sheetName = 'OPs Data';
    if (!workbook.SheetNames.includes(sheetName)) {
      console.error(`❌ Sheet "${sheetName}" not found!`);
      return;
    }
    
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`\n📊 Total rows in "${sheetName}": ${data.length}`);
    
    // Helper function to parse date as DD-MM-YYYY
    const parseDateDDMMYYYY = (value: any): Date | null => {
      if (!value && value !== 0) return null;
      
      if (value instanceof Date) {
        return value;
      }
      
      // Excel serial date number
      if (typeof value === 'number') {
        // Excel epoch: Dec 31, 1899
        // Excel serial 1 = Jan 1, 1900
        // Use 1899-12-31 as epoch to match Excel's display format (DD-MM-YYYY)
        const excelEpoch = new Date(1899, 11, 31); // Dec 31, 1899 (month is 0-indexed)
        const daysSinceEpoch = value - 1; // Serial 1 = day 0 from Dec 31, 1899 = Jan 1, 1900
        const date = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
        // Use local date components (not UTC) to avoid timezone issues
        return date;
      }
      
      // String format - parse as DD-MM-YYYY
      if (typeof value === 'string') {
        const trimmed = value.trim();
        const ddmmyyyyPattern = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/;
        const match = trimmed.match(ddmmyyyyPattern);
        
        if (match) {
          const day = parseInt(match[1], 10);
          const month = parseInt(match[2], 10);
          const year = parseInt(match[3], 10);
          
          if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
            return new Date(year, month - 1, day);
          }
        }
      }
      
      return null;
    };
    
    // Filter rows where Indent Date is Oct 11, 2025 (11-10-2025 in DD-MM-YYYY format)
    const oct11Rows = data.filter((row, index) => {
      const indentDate = row['Indent Date'];
      const date = parseDateDDMMYYYY(indentDate);
      
      if (!date || isNaN(date.getTime())) return false;
      
      // Check if it's October 11, 2025 (month is 0-indexed, so 9 = October)
      // Use local date components (not UTC) to match Excel's display
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-indexed (9 = October)
      const day = date.getDate();
      
      return year === 2025 && month === 9 && day === 11;
    });
    
    console.log(`\n✅ Found ${oct11Rows.length} rows with Oct 11 date (11-10-2025 in DD-MM-YYYY)`);
    
    if (oct11Rows.length === 0) {
      console.log('❌ No Oct 11 data found!');
      return;
    }
    
    // Display the rows
    console.log(`\n📋 Oct 11, 2025 rows (11-10-2025):`);
    oct11Rows.forEach((row, index) => {
      const indentDate = parseDateDDMMYYYY(row['Indent Date']);
      const allocDate = parseDateDDMMYYYY(row['Allocation Date']);
      const indentDateStr = indentDate ? `${String(indentDate.getDate()).padStart(2, '0')}-${String(indentDate.getMonth() + 1).padStart(2, '0')}-${indentDate.getFullYear()}` : 'N/A';
      const allocDateStr = allocDate ? `${String(allocDate.getDate()).padStart(2, '0')}-${String(allocDate.getMonth() + 1).padStart(2, '0')}-${allocDate.getFullYear()}` : 'N/A';
      
      console.log(`\nRow ${index + 1}:`);
      console.log(`  Indent: ${row['Indent'] || 'N/A'}`);
      console.log(`  Indent Date: ${indentDateStr} (serial: ${row['Indent Date']})`);
      console.log(`  Allocation Date: ${allocDateStr} (serial: ${row['Allocation Date']})`);
      console.log(`  Vehicle Number: ${row['Vehicle Number'] || 'N/A'}`);
      console.log(`  Range: ${row['Range'] || 'N/A'}`);
      console.log(`  Total Load: ${row['T. Load (Kgs)'] || 0} kg`);
      console.log(`  REMARKS: ${row['REMARKS'] || row['Remarks'] || 'N/A'}`);
    });
    
    // Create new workbook with Oct 11 data
    const newWorkbook = XLSX.utils.book_new();
    const newWorksheet = XLSX.utils.json_to_sheet(oct11Rows);
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Oct 11 Data');
    
    // Export to main project directory (parent of backend)
    const outputPath = path.join(process.cwd(), '..', 'Oct11_Data.xlsx');
    XLSX.writeFile(newWorkbook, outputPath);
    
    console.log(`\n✅ Exported ${oct11Rows.length} rows to: ${outputPath}`);
    console.log(`📁 File location: ${path.resolve(outputPath)}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

exportOct10Data();

