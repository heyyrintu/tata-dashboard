import * as XLSX from 'xlsx';
import path from 'path';

/**
 * Script to check what dates are in the Excel file
 * Usage: npx ts-node src/scripts/checkExcelDates.ts
 */

const checkExcelDates = () => {
  try {
    // Try multiple possible paths
    const possiblePaths = [
      path.join(__dirname, '../../../../TATA DEF.xlsx'),
      path.join(process.cwd(), '../../TATA DEF.xlsx'),
      path.join(process.cwd(), '../TATA DEF.xlsx'),
      'C:\\Users\\RintuMondal\\OneDrive - DRONA LOGITECH PRIVATE LIMITED\\Pictures\\tata\\TATA DEF.xlsx',
      'TATA DEF.xlsx'
    ];
    
    let filePath = '';
    for (const p of possiblePaths) {
      try {
        const fs = require('fs');
        if (fs.existsSync(p)) {
          filePath = p;
          break;
        }
      } catch (e) {
        // Continue to next path
      }
    }
    
    if (!filePath) {
      console.log('❌ Excel file not found. Searched paths:');
      possiblePaths.forEach(p => console.log(`  - ${p}`));
      return;
    }
    
    console.log(`📄 Reading Excel file: ${filePath}`);
    
    // Read WITHOUT cellDates to get raw values, then parse manually as DD-MM-YYYY
    const workbook = XLSX.readFile(filePath, { type: 'file', cellDates: false });
    
    // Find 'OPs Data' sheet or first sheet
    let sheetName = 'OPs Data';
    if (!workbook.SheetNames.includes(sheetName)) {
      sheetName = workbook.SheetNames[0];
      console.log(`⚠️  'OPs Data' sheet not found, using first sheet: ${sheetName}`);
    }
    
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`\n📊 Total rows in Excel: ${data.length}`);
    
    // Check Indent Date column
    const indentDates = new Set<string>();
    const dateCounts: { [key: string]: number } = {};
    
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
    
    data.forEach((row, index) => {
      const indentDate = row['Indent Date'];
      if (indentDate) {
        const date = convertExcelDate(indentDate);
        if (date && !isNaN(date.getTime())) {
          const dateKey = date.toISOString().split('T')[0];
          indentDates.add(dateKey);
          dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
        }
      }
    });
    
    console.log(`\n📅 Unique Indent Dates found: ${indentDates.size}`);
    console.log(`\n📋 All dates in Excel (sorted):`);
    
    const sortedDates = Array.from(indentDates).sort();
    sortedDates.forEach(date => {
      const count = dateCounts[date];
      const dateObj = new Date(date);
      console.log(`  ${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (${date}): ${count} rows`);
    });
    
    // Check specifically for Oct 10
    const oct10Found = sortedDates.filter(d => d.includes('2025-10-10') || d.includes('2024-10-10'));
    if (oct10Found.length > 0) {
      console.log(`\n⚠️  Oct 10 found in Excel: ${oct10Found.join(', ')}`);
    } else {
      console.log(`\n✅ Oct 10 NOT found in Excel file`);
    }
    
    // Show October dates
    const octoberDates = sortedDates.filter(d => d.includes('-10-'));
    console.log(`\n🍂 All October dates in Excel:`);
    octoberDates.forEach(date => {
      const count = dateCounts[date];
      const dateObj = new Date(date);
      console.log(`  ${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}: ${count} rows`);
    });
    
  } catch (error) {
    console.error('❌ Error reading Excel file:', error);
  }
};

checkExcelDates();

