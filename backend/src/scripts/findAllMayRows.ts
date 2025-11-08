import * as XLSX from 'xlsx';

/**
 * Find ALL May rows regardless of range format
 */
const findAllMayRows = () => {
  try {
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
    
    // Get ALL May rows
    const allMayRows = jsonData.filter((row: any) => {
      const month = normalizeMonth(row['Freight Tiger Month'] || '');
      return month === '2025-05';
    });
    
    console.log(`\n📊 ALL May rows: ${allMayRows.length}`);
    
    // Group by range
    const rangeGroups = new Map<string, any[]>();
    allMayRows.forEach((row: any) => {
      const range = (row['Range'] || '').toString().trim();
      if (!rangeGroups.has(range)) {
        rangeGroups.set(range, []);
      }
      rangeGroups.get(range)!.push(row);
    });
    
    console.log(`\n📊 May rows by Range:`);
    rangeGroups.forEach((rows, range) => {
      const cost = rows.reduce((sum: number, r: any) => {
        return sum + parseFloat(r['Any Other Cost'] || r['Total Cost_1'] || r['Total Cost'] || 0);
      }, 0);
      console.log(`  "${range}": ${rows.length} rows, Total Cost: ₹${cost.toLocaleString('en-IN')}`);
    });
    
    // Check for 0-100Km rows (all variations)
    const all0100Rows = allMayRows.filter((row: any) => {
      const range = (row['Range'] || '').toString().trim().toLowerCase();
      return range.includes('0-100') || range.includes('0 100');
    });
    
    const all0100Cost = all0100Rows.reduce((sum: number, row: any) => {
      return sum + parseFloat(row['Any Other Cost'] || row['Total Cost_1'] || row['Total Cost'] || 0);
    }, 0);
    
    console.log(`\n📊 All 0-100Km rows (all variations):`);
    console.log(`  Total rows: ${all0100Rows.length}`);
    console.log(`  Total Cost: ₹${all0100Cost.toLocaleString('en-IN')}`);
    console.log(`  Expected: ₹1,96,078.5`);
    console.log(`  Difference: ₹${Math.abs(all0100Cost - 196078.5).toLocaleString('en-IN')}`);
    
    // Check if there are rows with empty or null range
    const emptyRangeRows = allMayRows.filter((row: any) => {
      const range = (row['Range'] || '').toString().trim();
      return !range || range === '' || range === 'null' || range === 'undefined';
    });
    
    if (emptyRangeRows.length > 0) {
      console.log(`\n⚠️  Found ${emptyRangeRows.length} rows with empty/null range:`);
      const emptyRangeCost = emptyRangeRows.reduce((sum: number, r: any) => {
        return sum + parseFloat(r['Any Other Cost'] || r['Total Cost_1'] || r['Total Cost'] || 0);
      }, 0);
      console.log(`  Total Cost: ₹${emptyRangeCost.toLocaleString('en-IN')}`);
      emptyRangeRows.slice(0, 5).forEach((row, idx) => {
        const cost = parseFloat(row['Any Other Cost'] || row['Total Cost_1'] || row['Total Cost'] || 0);
        console.log(`    ${idx + 1}. Indent: ${row['Indent']}, Range: "${row['Range']}", Cost: ₹${cost}`);
      });
    }
    
    // Check for rows that might be in a different column
    console.log(`\n🔍 Checking for rows with cost but different range values:`);
    const rowsWithCost = allMayRows.filter((row: any) => {
      const cost = parseFloat(row['Any Other Cost'] || row['Total Cost_1'] || row['Total Cost'] || 0);
      return cost > 0;
    });
    
    console.log(`  Total May rows with cost > 0: ${rowsWithCost.length}`);
    const totalCostAll = rowsWithCost.reduce((sum: number, r: any) => {
      return sum + parseFloat(r['Any Other Cost'] || r['Total Cost_1'] || r['Total Cost'] || 0);
    }, 0);
    console.log(`  Total Cost (all May rows with cost): ₹${totalCostAll.toLocaleString('en-IN')}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

findAllMayRows();

