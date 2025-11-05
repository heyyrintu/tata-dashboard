import * as XLSX from 'xlsx';

/**
 * Script to check what sheets are in the Excel file
 * Usage: npx ts-node src/scripts/checkExcelSheets.ts
 */

const checkExcelSheets = () => {
  try {
    const filePath = 'C:\\Users\\RintuMondal\\OneDrive - DRONA LOGITECH PRIVATE LIMITED\\Pictures\\tata\\TATA DEF.xlsx';
    console.log(`📄 Reading Excel file: ${filePath}`);
    
    // Read WITHOUT cellDates to get raw values, then parse manually as DD-MM-YYYY
    const workbook = XLSX.readFile(filePath, { type: 'file', cellDates: false });
    
    console.log(`\n📋 All sheets in Excel file:`);
    workbook.SheetNames.forEach((sheetName, index) => {
      const worksheet = workbook.Sheets[sheetName];
      const data: any[] = XLSX.utils.sheet_to_json(worksheet);
      console.log(`\n${index + 1}. Sheet: "${sheetName}"`);
      console.log(`   Rows: ${data.length}`);
      
      // Check if it has 'Indent Date' column
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        const hasIndentDate = headers.includes('Indent Date');
        const hasIndent = headers.includes('Indent');
        console.log(`   Has 'Indent Date' column: ${hasIndentDate ? '✅' : '❌'}`);
        console.log(`   Has 'Indent' column: ${hasIndent ? '✅' : '❌'}`);
        
        if (hasIndentDate) {
          // Helper function to convert Excel serial to date (DD-MM-YYYY format)
          const convertExcelDate = (value: any): Date | null => {
            if (!value && value !== 0) return null;
            if (value instanceof Date) return value;
            if (typeof value === 'number') {
              // Excel epoch: Dec 31, 1899 (corrected to match Excel's DD-MM-YYYY display)
              const excelEpoch = new Date(1899, 11, 31);
              const daysSinceEpoch = value - 1;
              return new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
            }
            if (typeof value === 'string') {
              const parsed = new Date(value);
              return !isNaN(parsed.getTime()) ? parsed : null;
            }
            return null;
          };
          
          // Count unique dates
          const dates = new Set<string>();
          data.forEach(row => {
            const date = row['Indent Date'];
            if (date) {
              const d = convertExcelDate(date);
              if (d && !isNaN(d.getTime())) {
                dates.add(d.toISOString().split('T')[0]);
              }
            }
          });
          console.log(`   Unique dates: ${dates.size}`);
          
          // Check for Oct 10
          const oct10Found = Array.from(dates).filter(d => d.includes('2025-10-10') || d.includes('2024-10-10'));
          if (oct10Found.length > 0) {
            console.log(`   ⚠️  Oct 10 found: ${oct10Found.join(', ')}`);
          } else {
            console.log(`   ✅ Oct 10 NOT in this sheet`);
          }
        }
      }
    });
    
    // Show which sheet the parser uses
    const parserSheet = 'OPs Data';
    const parserUses = workbook.SheetNames.includes(parserSheet) ? parserSheet : workbook.SheetNames[0];
    console.log(`\n🎯 Current parser uses: "${parserUses}"`);
    
  } catch (error) {
    console.error('❌ Error reading Excel file:', error);
  }
};

checkExcelSheets();

