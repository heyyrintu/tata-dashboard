import { connectDatabase } from '../config/database';
import Trip from '../models/Trip';
import * as XLSX from 'xlsx';

/**
 * Check if duplicate rows are being handled correctly
 */
const checkDuplicateRows = async () => {
  try {
    await connectDatabase();
    
    const filePath = 'C:\\Users\\RintuMondal\\OneDrive - DRONA LOGITECH PRIVATE LIMITED\\Pictures\\tata\\TATA DEF.xlsx';
    const workbook = XLSX.readFile(filePath, { type: 'file', cellDates: false, cellFormula: true });
    const worksheet = workbook.Sheets['OPs Data'];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null, raw: false });
    
    const normalizeMonth = (monthValue: string): string | null => {
      if (!monthValue || typeof monthValue !== 'string') return null;
      const trimmed = monthValue.trim().replace(/^0ct/i, 'Oct');
      const monthPatterns = [/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-'](\d{2,4})$/i];
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
    
    const normalizeRange = (range: string | null | undefined): string => {
      if (!range || typeof range !== 'string') return '';
      const trimmed = range.trim().toLowerCase();
      if (trimmed.startsWith('0-100') || trimmed.startsWith('0 100')) return '0-100Km';
      if (trimmed.startsWith('101-250') || trimmed.startsWith('101 250')) return '101-250Km';
      if (trimmed.startsWith('251-400') || trimmed.startsWith('251 400')) return '251-400Km';
      if (trimmed.startsWith('401-600') || trimmed.startsWith('401 600')) return '401-600Km';
      return trimmed;
    };
    
    // Test May - 0-100Km
    console.log(`\n🔍 May - 0-100Km Analysis:`);
    
    // Get ALL rows that match May and 0-100Km (including duplicates)
    const allMay0100Rows = jsonData.filter((row: any) => {
      const month = normalizeMonth(row['Freight Tiger Month'] || '');
      const range = normalizeRange(row['Range'] || '');
      return month === '2025-05' && range === '0-100Km';
    });
    
    const totalCostAll = allMay0100Rows.reduce((sum: number, row: any) => {
      const cost = parseFloat(row['Any Other Cost'] || row['Total Cost_1'] || row['Total Cost'] || 0);
      return sum + cost;
    }, 0);
    
    console.log(`  Total rows (including all duplicates): ${allMay0100Rows.length}`);
    console.log(`  Total Cost (all rows): ₹${totalCostAll.toLocaleString('en-IN')}`);
    console.log(`  Expected: ₹1,96,078.5`);
    console.log(`  Difference: ₹${Math.abs(totalCostAll - 196078.5).toLocaleString('en-IN')}`);
    
    // Check for duplicate indents
    const indentMap = new Map<string, number>();
    allMay0100Rows.forEach((row: any) => {
      const indent = (row['Indent'] || '').toString().trim();
      indentMap.set(indent, (indentMap.get(indent) || 0) + 1);
    });
    
    const duplicateIndents = Array.from(indentMap.entries()).filter(([_, count]) => count > 1);
    console.log(`  Duplicate indents: ${duplicateIndents.length}`);
    if (duplicateIndents.length > 0) {
      console.log(`  Duplicate indent details:`);
      duplicateIndents.forEach(([indent, count]) => {
        const rows = allMay0100Rows.filter((r: any) => (r['Indent'] || '').toString().trim() === indent);
        const cost = rows.reduce((sum: number, r: any) => {
          return sum + parseFloat(r['Any Other Cost'] || r['Total Cost_1'] || r['Total Cost'] || 0);
        }, 0);
        console.log(`    ${indent}: ${count} rows, Total Cost: ₹${cost.toLocaleString('en-IN')}`);
      });
    }
    
    // Check if there are rows with different range formats
    console.log(`\n  Checking for rows with different range formats:`);
    const allMayRows = jsonData.filter((row: any) => {
      const month = normalizeMonth(row['Freight Tiger Month'] || '');
      return month === '2025-05';
    });
    
    const rangeFormats = new Map<string, number>();
    allMayRows.forEach((row: any) => {
      const range = (row['Range'] || '').toString().trim();
      rangeFormats.set(range, (rangeFormats.get(range) || 0) + 1);
    });
    
    console.log(`  Range formats in May:`);
    rangeFormats.forEach((count, format) => {
      if (format.toLowerCase().includes('0-100') || format.toLowerCase().includes('0 100')) {
        const rows = allMayRows.filter((r: any) => (r['Range'] || '').toString().trim() === format);
        const cost = rows.reduce((sum: number, r: any) => {
          return sum + parseFloat(r['Any Other Cost'] || r['Total Cost_1'] || r['Total Cost'] || 0);
        }, 0);
        console.log(`    "${format}": ${count} rows, Total Cost: ₹${cost.toLocaleString('en-IN')}`);
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkDuplicateRows();

