import * as XLSX from 'xlsx';

/**
 * Check all cost columns to see if we're using the right one
 */
const checkAllCostColumns = () => {
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
    
    // Get all May - 0-100Km rows
    const may0100Rows = jsonData.filter((row: any) => {
      const month = normalizeMonth(row['Freight Tiger Month'] || '');
      const range = (row['Range'] || '').toString().trim().toLowerCase();
      return month === '2025-05' && (range.includes('0-100') || range.includes('0 100'));
    });
    
    console.log(`\n📊 May - 0-100Km rows: ${may0100Rows.length}`);
    
    // Check different cost columns
    const costColumns = ['Any Other Cost', 'Total Cost_1', 'Total Cost'];
    
    costColumns.forEach(column => {
      const cost = may0100Rows.reduce((sum: number, row: any) => {
        const value = row[column];
        if (value !== undefined && value !== null && value !== '') {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            return sum + numValue;
          }
        }
        return sum;
      }, 0);
      
      console.log(`  ${column}: ₹${cost.toLocaleString('en-IN')}`);
    });
    
    // Check if there are rows with cost in "Any Other Cost" but 0 in others
    const rowsWithAnyOtherCost = may0100Rows.filter((row: any) => {
      const anyOtherCost = parseFloat(row['Any Other Cost'] || 0);
      const totalCost1 = parseFloat(row['Total Cost_1'] || 0);
      const totalCost = parseFloat(row['Total Cost'] || 0);
      return anyOtherCost > 0 && (totalCost1 === 0 || totalCost === 0);
    });
    
    if (rowsWithAnyOtherCost.length > 0) {
      console.log(`\n  ⚠️  Found ${rowsWithAnyOtherCost.length} rows with "Any Other Cost" but 0 in other columns:`);
      rowsWithAnyOtherCost.forEach((row, idx) => {
        const anyOtherCost = parseFloat((row as any)['Any Other Cost'] || 0);
        console.log(`    ${idx + 1}. Indent: ${(row as any)['Indent']}, Any Other Cost: ₹${anyOtherCost}, Total Cost_1: ₹${parseFloat((row as any)['Total Cost_1'] || 0)}, Total Cost: ₹${parseFloat((row as any)['Total Cost'] || 0)}`);
      });
    }
    
    // Calculate expected total
    const expectedTotal = 196078.5;
    const currentTotal = may0100Rows.reduce((sum: number, row: any) => {
      return sum + parseFloat(row['Any Other Cost'] || row['Total Cost_1'] || row['Total Cost'] || 0);
    }, 0);
    
    const missing = expectedTotal - currentTotal;
    console.log(`\n📊 Summary:`);
    console.log(`  Current Total (Any Other Cost): ₹${currentTotal.toLocaleString('en-IN')}`);
    console.log(`  Expected Total: ₹${expectedTotal.toLocaleString('en-IN')}`);
    console.log(`  Missing: ₹${missing.toLocaleString('en-IN')}`);
    
    // Check if there are rows that should be included but aren't
    console.log(`\n🔍 Checking for rows that might be missing:`);
    
    // Check all May rows regardless of range
    const allMayRows = jsonData.filter((row: any) => {
      const month = normalizeMonth(row['Freight Tiger Month'] || '');
      return month === '2025-05';
    });
    
    // Check rows with cost but no range or different range
    const mayRowsWithCost = allMayRows.filter((row: any) => {
      const cost = parseFloat(row['Any Other Cost'] || row['Total Cost_1'] || row['Total Cost'] || 0);
      return cost > 0;
    });
    
    const mayRowsNotIn0100 = mayRowsWithCost.filter((row: any) => {
      const range = (row['Range'] || '').toString().trim().toLowerCase();
      return !range.includes('0-100') && !range.includes('0 100');
    });
    
    console.log(`  May rows with cost but NOT in 0-100Km range: ${mayRowsNotIn0100.length}`);
    const costNotIn0100 = mayRowsNotIn0100.reduce((sum: number, row: any) => {
      return sum + parseFloat(row['Any Other Cost'] || row['Total Cost_1'] || row['Total Cost'] || 0);
    }, 0);
    console.log(`  Total cost of those rows: ₹${costNotIn0100.toLocaleString('en-IN')}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkAllCostColumns();

