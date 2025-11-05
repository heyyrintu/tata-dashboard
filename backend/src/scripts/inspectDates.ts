import * as XLSX from 'xlsx';

/**
 * Script to inspect raw date values from Excel
 */
const inspectDates = () => {
  try {
    const filePath = 'C:\\Users\\RintuMondal\\OneDrive - DRONA LOGITECH PRIVATE LIMITED\\Pictures\\tata\\TATA DEF.xlsx';
    console.log(`📄 Reading Excel file: ${filePath}`);
    
    // Read without cellDates to see raw values
    const workbook = XLSX.readFile(filePath, { type: 'file', cellDates: false });
    const sheetName = 'OPs Data';
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`\n📊 Total rows: ${data.length}\n`);
    
    // Check first 10 rows with dates
    console.log('First 10 rows with Indent Date values:\n');
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      const indentDate = row['Indent Date'];
      const indent = row['Indent'];
      
      console.log(`Row ${i + 1}:`);
      console.log(`  Indent: ${indent || 'N/A'}`);
      console.log(`  Indent Date raw value: ${indentDate}`);
      console.log(`  Type: ${typeof indentDate}`);
      
      if (typeof indentDate === 'number') {
        // Convert Excel serial to date - using Dec 31, 1899 epoch to match Excel's DD-MM-YYYY display
        const excelEpoch = new Date(1899, 11, 31); // Dec 31, 1899
        const daysSinceEpoch = indentDate - 1;
        const date = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
        console.log(`  As Date: ${date.toISOString().split('T')[0]}`);
        console.log(`  DD-MM-YYYY: ${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`);
      }
      
      console.log('');
    }
    
    // Check rows around Oct 10-11
    console.log('\n\nRows that might be Oct 10-11:\n');
    data.forEach((row, index) => {
      const indentDate = row['Indent Date'];
      const indent = row['Indent'];
      
      if (!indentDate) return;
      
      let date: Date | null = null;
      if (typeof indentDate === 'number') {
        // Convert Excel serial to date - using Dec 31, 1899 epoch to match Excel's DD-MM-YYYY display
        const excelEpoch = new Date(1899, 11, 31); // Dec 31, 1899
        const daysSinceEpoch = indentDate - 1;
        date = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
      } else if (typeof indentDate === 'string') {
        date = new Date(indentDate);
      }
      
      if (date && !isNaN(date.getTime())) {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const year = date.getFullYear();
        
        // Check if it's around Oct 10-11
        if (year === 2025 && month === 10 && (day === 10 || day === 11)) {
          console.log(`Row ${index + 1}:`);
          console.log(`  Indent: ${indent || 'N/A'}`);
          console.log(`  Raw Indent Date: ${indentDate} (type: ${typeof indentDate})`);
          console.log(`  Parsed as: ${date.toISOString().split('T')[0]}`);
          console.log(`  DD-MM-YYYY: ${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`);
          console.log('');
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

inspectDates();

