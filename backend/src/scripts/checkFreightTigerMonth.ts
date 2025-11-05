import * as XLSX from 'xlsx';

/**
 * Script to check Freight Tiger Month column in Excel
 */
const checkFreightTigerMonth = () => {
  try {
    const filePath = 'C:\\Users\\RintuMondal\\OneDrive - DRONA LOGITECH PRIVATE LIMITED\\Pictures\\tata\\TATA DEF.xlsx';
    console.log(`📄 Reading Excel file: ${filePath}`);
    
    const workbook = XLSX.readFile(filePath, { type: 'file', cellDates: false });
    const sheetName = 'OPs Data';
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`\n📊 Total rows: ${data.length}`);
    
    // Check headers
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      console.log(`\n📋 All column headers:`);
      headers.forEach((header, index) => {
        console.log(`  ${index + 1}. "${header}"`);
      });
      
      // Check for Freight Tiger Month column variations
      const possibleNames = [
        'Freight Tiger Month',
        'Freight Tiger Month ',
        'Freight Tiger  Month',
        'Freight Tiger',
        'FT Month',
        'Month'
      ];
      
      console.log(`\n🔍 Checking for Freight Tiger Month column:`);
      let foundColumn = false;
      possibleNames.forEach(name => {
        if (headers.includes(name)) {
          console.log(`  ✅ Found: "${name}"`);
          foundColumn = true;
          
          // Show sample values
          const sampleValues = new Set<string>();
          data.slice(0, 20).forEach(row => {
            const value = row[name];
            if (value) {
              sampleValues.add(String(value).trim());
            }
          });
          console.log(`  📝 Sample values (first 20 rows):`);
          Array.from(sampleValues).slice(0, 10).forEach(val => {
            console.log(`     - "${val}"`);
          });
        }
      });
      
      if (!foundColumn) {
        console.log(`  ❌ Column not found with exact names`);
        console.log(`  🔎 Searching for columns containing "Freight" or "Tiger" or "Month":`);
        headers.forEach(header => {
          const lower = header.toLowerCase();
          if (lower.includes('freight') || lower.includes('tiger') || lower.includes('month')) {
            console.log(`     Found: "${header}"`);
          }
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

checkFreightTigerMonth();

