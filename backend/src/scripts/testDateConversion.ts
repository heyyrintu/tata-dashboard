import * as XLSX from 'xlsx';

/**
 * Test Excel date conversion
 */
const testDateConversion = () => {
  // Oct 11, 2025 should be Excel serial 45943
  // Let's test both conversion methods
  
  const excelSerial = 45943; // Expected for Oct 11, 2025
  
  console.log(`Testing Excel serial: ${excelSerial}\n`);
  
  // Method 1: Using XLSX utility (if available)
  try {
    const date1 = XLSX.SSF.parse_date_code(excelSerial);
    console.log(`Method 1 (XLSX.SSF.parse_date_code): ${date1.toISOString().split('T')[0]}`);
    console.log(`  DD-MM-YYYY: ${String(date1.getDate()).padStart(2, '0')}-${String(date1.getMonth() + 1).padStart(2, '0')}-${date1.getFullYear()}`);
  } catch (e) {
    console.log(`Method 1 failed: ${e}`);
  }
  
  // Method 2: Manual calculation (accounting for Excel's 1900 leap year bug)
  const excelEpoch = new Date(1900, 0, 1); // Jan 1, 1900
  // Excel serial 1 = Jan 1, 1900, but Excel incorrectly treats 1900 as leap year
  // So we need to subtract 1 to get days since epoch, but account for the fake Feb 29
  const daysSince1900 = excelSerial - 1; // Serial 1 = day 0
  // Excel has 366 days in 1900 (fake leap year), but we only add the days
  const date2 = new Date(excelEpoch.getTime() + daysSince1900 * 24 * 60 * 60 * 1000);
  console.log(`\nMethod 2 (manual): ${date2.toISOString().split('T')[0]}`);
  console.log(`  DD-MM-YYYY: ${String(date2.getDate()).padStart(2, '0')}-${String(date2.getMonth() + 1).padStart(2, '0')}-${date2.getFullYear()}`);
  
  // Method 3: Using 1899-12-31 as epoch (corrected to match Excel's DD-MM-YYYY display)
  const epoch1899 = new Date(1899, 11, 31); // Dec 31, 1899 (corrected epoch)
  const date3 = new Date(epoch1899.getTime() + (excelSerial - 1) * 24 * 60 * 60 * 1000);
  console.log(`\nMethod 3 (1899-12-31 epoch - CORRECTED): ${date3.toISOString().split('T')[0]}`);
  console.log(`  DD-MM-YYYY: ${String(date3.getDate()).padStart(2, '0')}-${String(date3.getMonth() + 1).padStart(2, '0')}-${date3.getFullYear()}`);
  
  // Method 4: Using 1900-01-01 as epoch with adjustment
  const epoch1900 = new Date(1900, 0, 1); // Jan 1, 1900
  // Excel serial 1 = Jan 1, 1900, but due to 1900 leap year bug, we need to adjust
  // Actually, the standard way is: days = serial - 1, then add 1 day if serial >= 60 (to skip fake Feb 29)
  let days = excelSerial - 1;
  if (excelSerial >= 60) {
    days -= 1; // Skip the fake Feb 29, 1900
  }
  const date4 = new Date(epoch1900.getTime() + days * 24 * 60 * 60 * 1000);
  console.log(`\nMethod 4 (1900 epoch with Feb 29 fix): ${date4.toISOString().split('T')[0]}`);
  console.log(`  DD-MM-YYYY: ${String(date4.getDate()).padStart(2, '0')}-${String(date4.getMonth() + 1).padStart(2, '0')}-${date4.getFullYear()}`);
  
  // Check what Excel serial 45941 (current value) should be
  console.log(`\n\nChecking serial 45941 (current value in Excel):`);
  const currentSerial = 45941;
  const dateCurrent = new Date(1899, 11, 31); // Dec 31, 1899 (corrected epoch)
  const dateCurrentParsed = new Date(dateCurrent.getTime() + (currentSerial - 1) * 24 * 60 * 60 * 1000);
  console.log(`  Parsed as: ${dateCurrentParsed.toISOString().split('T')[0]}`);
  console.log(`  DD-MM-YYYY: ${String(dateCurrentParsed.getDate()).padStart(2, '0')}-${String(dateCurrentParsed.getMonth() + 1).padStart(2, '0')}-${dateCurrentParsed.getFullYear()}`);
  
  // What serial would Oct 11, 2025 be?
  const targetDate = new Date(2025, 9, 11); // Oct 11, 2025
  const epoch = new Date(1899, 11, 31); // Dec 31, 1899 (corrected epoch)
  const daysDiff = Math.floor((targetDate.getTime() - epoch.getTime()) / (24 * 60 * 60 * 1000));
  const expectedSerial = daysDiff + 1;
  console.log(`\n\nOct 11, 2025 should be Excel serial: ${expectedSerial}`);
};

testDateConversion();

