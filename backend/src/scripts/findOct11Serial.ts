import * as XLSX from 'xlsx';

/**
 * Find the correct Excel serial for Oct 11, 2025
 */
const findOct11Serial = () => {
  const filePath = 'C:\\Users\\RintuMondal\\OneDrive - DRONA LOGITECH PRIVATE LIMITED\\Pictures\\tata\\TATA DEF.xlsx';
  const workbook = XLSX.readFile(filePath, { type: 'file', cellDates: false });
  const sheetName = 'OPs Data';
  const worksheet = workbook.Sheets[sheetName];
  const data: any[] = XLSX.utils.sheet_to_json(worksheet);
  
  // Find rows with indents S/DRONA/10/25/07, 08, 09
  const targetIndents = ['S/DRONA/10/25/07', 'S/DRONA/10/25/08', 'S/DRONA/10/25/09'];
  
  console.log('Looking for indents with Oct 11 date:\n');
  
  data.forEach((row, index) => {
    const indent = row['Indent'];
    if (targetIndents.includes(indent)) {
      const indentDate = row['Indent Date'];
      console.log(`Row ${index + 1}:`);
      console.log(`  Indent: ${indent}`);
      console.log(`  Excel Serial: ${indentDate} (type: ${typeof indentDate})`);
      
      // Convert Excel serial to date - using Dec 31, 1899 epoch to match Excel's DD-MM-YYYY display
      const excelEpoch = new Date(1899, 11, 31); // Dec 31, 1899
      const daysSinceEpoch = indentDate - 1;
      const date = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
      
      console.log(`  Parsed date (local): ${date.toString()}`);
      console.log(`  Year: ${date.getFullYear()}, Month: ${date.getMonth() + 1}, Day: ${date.getDate()}`);
      console.log(`  DD-MM-YYYY: ${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`);
      console.log('');
    }
  });
  
  // Also test what serial would give Oct 11, 2025
  console.log('\n\nCalculating what serial Oct 11, 2025 should be:');
  const targetDate = new Date(2025, 9, 11); // Oct 11, 2025 (month 9 = October, 0-indexed)
  const epoch = new Date(1899, 11, 31); // Dec 31, 1899 (corrected epoch)
  const daysDiff = Math.floor((targetDate.getTime() - epoch.getTime()) / (24 * 60 * 60 * 1000));
  const expectedSerial = daysDiff + 1;
  console.log(`Expected serial: ${expectedSerial}`);
  
  // Test serials around 45941
  console.log('\n\nTesting serials around 45941:');
  for (let serial = 45940; serial <= 45943; serial++) {
    const testEpoch = new Date(1899, 11, 31); // Dec 31, 1899 (corrected epoch)
    const testDays = serial - 1;
    const testDate = new Date(testEpoch.getTime() + testDays * 24 * 60 * 60 * 1000);
    console.log(`Serial ${serial}: ${testDate.getFullYear()}-${String(testDate.getMonth() + 1).padStart(2, '0')}-${String(testDate.getDate()).padStart(2, '0')} (DD-MM-YYYY: ${String(testDate.getDate()).padStart(2, '0')}-${String(testDate.getMonth() + 1).padStart(2, '0')}-${testDate.getFullYear()})`);
  }
};

findOct11Serial();

