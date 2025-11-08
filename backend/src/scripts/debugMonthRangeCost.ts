import { connectDatabase } from '../config/database';
import Trip from '../models/Trip';
import * as XLSX from 'xlsx';

/**
 * Debug script to check total cost for specific months and ranges
 */
const debugMonthRangeCost = async () => {
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
    
    console.log(`\n📊 Excel file has ${jsonData.length} rows`);
    
    // Helper function to normalize month
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
    
    // Helper function to normalize range
    const normalizeRange = (range: string | null | undefined): string => {
      if (!range || typeof range !== 'string') return '';
      const trimmed = range.trim().toLowerCase();
      if (trimmed.startsWith('0-100') || trimmed.startsWith('0 100')) return '0-100Km';
      if (trimmed.startsWith('101-250') || trimmed.startsWith('101 250')) return '101-250Km';
      if (trimmed.startsWith('251-400') || trimmed.startsWith('251 400')) return '251-400Km';
      if (trimmed.startsWith('401-600') || trimmed.startsWith('401 600')) return '401-600Km';
      return trimmed;
    };
    
    // Check Excel data for May, June, July
    const monthsToCheck = [
      { name: 'May', normalized: '2025-05' },
      { name: 'June', normalized: '2025-06' },
      { name: 'July', normalized: '2025-07' }
    ];
    
    const rangesToCheck = [
      { name: '0-100Km', excel: '0-100km' },
      { name: '101-250Km', excel: '101-250km' }
    ];
    
    console.log(`\n🔍 Checking Excel data for specific months and ranges:`);
    
    for (const month of monthsToCheck) {
      for (const range of rangesToCheck) {
        const excelRows = jsonData.filter((row: any) => {
          const freightTigerMonth = normalizeMonth(row['Freight Tiger Month'] || '');
          const rangeValue = normalizeRange(row['Range'] || '');
          return freightTigerMonth === month.normalized && rangeValue === range.name;
        });
        
        const totalCost = excelRows.reduce((sum: number, row: any) => {
          const costValue = row['Any Other Cost'] || row['Total Cost_1'] || row['Total Cost'] || 0;
          return sum + (parseFloat(costValue) || 0);
        }, 0);
        
        console.log(`\n  ${month.name} - ${range.name}:`);
        console.log(`    Excel rows: ${excelRows.length}`);
        console.log(`    Total Cost (Excel): ₹${totalCost.toLocaleString('en-IN')}`);
        
        if (excelRows.length > 0 && excelRows.length <= 10) {
          console.log(`    Sample rows:`);
          excelRows.forEach((row: any, index: number) => {
            const costValue = row['Any Other Cost'] || row['Total Cost_1'] || row['Total Cost'] || 0;
            console.log(`      ${index + 1}. Indent: ${row['Indent']}, Range: ${row['Range']}, Cost: ₹${parseFloat(costValue) || 0}`);
          });
        }
      }
    }
    
    // Check database data
    console.log(`\n📊 Checking Database data for specific months and ranges:`);
    
    for (const month of monthsToCheck) {
      for (const range of rangesToCheck) {
        const dbIndents = await Trip.find({
          freightTigerMonth: month.normalized,
          range: range.name
        });
        
        const totalCost = dbIndents.reduce((sum, indent) => sum + ((indent as any).totalCost || 0), 0);
        
        console.log(`\n  ${month.name} - ${range.name}:`);
        console.log(`    DB rows: ${dbIndents.length}`);
        console.log(`    Total Cost (DB): ₹${totalCost.toLocaleString('en-IN')}`);
        
        if (dbIndents.length > 0 && dbIndents.length <= 10) {
          console.log(`    Sample rows:`);
          dbIndents.slice(0, 10).forEach((indent, index) => {
            console.log(`      ${index + 1}. Indent: ${indent.indent}, Range: ${indent.range}, Cost: ₹${(indent as any).totalCost || 0}`);
          });
        }
      }
    }
    
    // Specific checks for reported issues
    console.log(`\n🔍 Specific checks for reported issues:`);
    
    // May - 0-100Km
    const may0100Excel = jsonData.filter((row: any) => {
      const month = normalizeMonth(row['Freight Tiger Month'] || '');
      const range = normalizeRange(row['Range'] || '');
      return month === '2025-05' && range === '0-100Km';
    });
    const may0100ExcelCost = may0100Excel.reduce((sum: number, row: any) => {
      const costValue = row['Any Other Cost'] || row['Total Cost_1'] || row['Total Cost'] || 0;
      return sum + (parseFloat(costValue) || 0);
    }, 0);
    
    const may0100DB = await Trip.find({ freightTigerMonth: '2025-05', range: '0-100Km' });
    const may0100DBCost = may0100DB.reduce((sum, indent) => sum + ((indent as any).totalCost || 0), 0);
    
    console.log(`\n  May - 0-100Km:`);
    console.log(`    Excel: ${may0100Excel.length} rows, Total: ₹${may0100ExcelCost.toLocaleString('en-IN')}`);
    console.log(`    DB: ${may0100DB.length} rows, Total: ₹${may0100DBCost.toLocaleString('en-IN')}`);
    console.log(`    Reported: ₹11,636`);
    console.log(`    Difference (Excel - DB): ₹${(may0100ExcelCost - may0100DBCost).toLocaleString('en-IN')}`);
    
    // June - 101-250Km
    const june101250Excel = jsonData.filter((row: any) => {
      const month = normalizeMonth(row['Freight Tiger Month'] || '');
      const range = normalizeRange(row['Range'] || '');
      return month === '2025-06' && range === '101-250Km';
    });
    const june101250ExcelCost = june101250Excel.reduce((sum: number, row: any) => {
      const costValue = row['Any Other Cost'] || row['Total Cost_1'] || row['Total Cost'] || 0;
      return sum + (parseFloat(costValue) || 0);
    }, 0);
    
    const june101250DB = await Trip.find({ freightTigerMonth: '2025-06', range: '101-250Km' });
    const june101250DBCost = june101250DB.reduce((sum, indent) => sum + ((indent as any).totalCost || 0), 0);
    
    console.log(`\n  June - 101-250Km:`);
    console.log(`    Excel: ${june101250Excel.length} rows, Total: ₹${june101250ExcelCost.toLocaleString('en-IN')}`);
    console.log(`    DB: ${june101250DB.length} rows, Total: ₹${june101250DBCost.toLocaleString('en-IN')}`);
    console.log(`    Reported: ₹51,420`);
    console.log(`    Difference (Excel - DB): ₹${(june101250ExcelCost - june101250DBCost).toLocaleString('en-IN')}`);
    
    // July - 101-250Km
    const july101250Excel = jsonData.filter((row: any) => {
      const month = normalizeMonth(row['Freight Tiger Month'] || '');
      const range = normalizeRange(row['Range'] || '');
      return month === '2025-07' && range === '101-250Km';
    });
    const july101250ExcelCost = july101250Excel.reduce((sum: number, row: any) => {
      const costValue = row['Any Other Cost'] || row['Total Cost_1'] || row['Total Cost'] || 0;
      return sum + (parseFloat(costValue) || 0);
    }, 0);
    
    const july101250DB = await Trip.find({ freightTigerMonth: '2025-07', range: '101-250Km' });
    const july101250DBCost = july101250DB.reduce((sum, indent) => sum + ((indent as any).totalCost || 0), 0);
    
    console.log(`\n  July - 101-250Km:`);
    console.log(`    Excel: ${july101250Excel.length} rows, Total: ₹${july101250ExcelCost.toLocaleString('en-IN')}`);
    console.log(`    DB: ${july101250DB.length} rows, Total: ₹${july101250DBCost.toLocaleString('en-IN')}`);
    console.log(`    Reported: ₹82,010`);
    console.log(`    Difference (Excel - DB): ₹${(july101250ExcelCost - july101250DBCost).toLocaleString('en-IN')}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

debugMonthRangeCost();

