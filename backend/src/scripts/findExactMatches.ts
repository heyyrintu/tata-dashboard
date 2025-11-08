import * as XLSX from 'xlsx';

/**
 * Find exact matches by checking all possible formats
 */
const findExactMatches = () => {
  try {
    const filePath = 'C:\\Users\\RintuMondal\\OneDrive - DRONA LOGITECH PRIVATE LIMITED\\Pictures\\tata\\TATA DEF.xlsx';
    console.log(`📄 Reading Excel file: ${filePath}`);
    
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
    
    // Test cases with expected values
    const testCases = [
      { month: 'May', monthKey: '2025-05', range: '0-100Km', expected: 196078.5 },
      { month: 'June', monthKey: '2025-06', range: '101-250Km', expected: 386296.25 },
      { month: 'July', monthKey: '2025-07', range: '101-250Km', expected: 348554 }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🔍 ${testCase.month} - ${testCase.range} (Expected: ₹${testCase.expected.toLocaleString('en-IN')})`);
      console.log(`${'='.repeat(80)}`);
      
      // Try multiple month formats
      const monthFormats = [
        testCase.monthKey,
        `${testCase.month}-25`,
        `${testCase.month}'25`,
        `${testCase.month.toLowerCase()}-25`,
        `${testCase.month.toLowerCase()}'25`
      ];
      
      // Try multiple range formats
      const rangeFormats = [
        testCase.range,
        testCase.range.toLowerCase(),
        testCase.range.replace('Km', 'km'),
        testCase.range.replace('Km', 'KM')
      ];
      
      let bestMatch: { rows: any[], cost: number, monthFormat: string, rangeFormat: string } | null = null;
      let bestCost = 0;
      
      // Try all combinations
      for (const monthFormat of monthFormats) {
        for (const rangeFormat of rangeFormats) {
          const rows = jsonData.filter((row: any) => {
            const month = (row['Freight Tiger Month'] || '').toString().trim();
            const range = (row['Range'] || '').toString().trim();
            
            // Check month match (flexible)
            let monthMatch = false;
            if (monthFormat === testCase.monthKey) {
              // Try to normalize
              const normalized = normalizeMonth(month);
              monthMatch = normalized === monthFormat;
            } else {
              monthMatch = month.toLowerCase().includes(monthFormat.toLowerCase().replace(/\d/g, '')) && 
                          month.includes('25');
            }
            
            // Check range match (flexible)
            const rangeLower = range.toLowerCase();
            const targetRangeLower = rangeFormat.toLowerCase();
            const rangeMatch = rangeLower.includes('0-100') && targetRangeLower.includes('0-100') ||
                              rangeLower.includes('101-250') && targetRangeLower.includes('101-250') ||
                              rangeLower.includes('251-400') && targetRangeLower.includes('251-400') ||
                              rangeLower.includes('401-600') && targetRangeLower.includes('401-600');
            
            return monthMatch && rangeMatch;
          });
          
          const cost = rows.reduce((sum: number, row: any) => {
            const costValue = row['Any Other Cost'] || row['Total Cost_1'] || row['Total Cost'] || 0;
            return sum + (parseFloat(costValue) || 0);
          }, 0);
          
          if (Math.abs(cost - testCase.expected) < Math.abs(bestCost - testCase.expected)) {
            bestCost = cost;
            bestMatch = { rows, cost, monthFormat, rangeFormat };
          }
        }
      }
      
      if (bestMatch) {
        console.log(`\n📊 Best Match:`);
        console.log(`  Rows found: ${bestMatch.rows.length}`);
        console.log(`  Total Cost: ₹${bestMatch.cost.toLocaleString('en-IN')}`);
        console.log(`  Expected: ₹${testCase.expected.toLocaleString('en-IN')}`);
        console.log(`  Difference: ₹${Math.abs(bestMatch.cost - testCase.expected).toLocaleString('en-IN')}`);
        
        if (Math.abs(bestMatch.cost - testCase.expected) > 0.01) {
          console.log(`\n  ⚠️  Still not matching! Checking individual rows...`);
          
          // Show all rows with their raw values
          console.log(`\n  📝 All matching rows (first 20):`);
          bestMatch.rows.slice(0, 20).forEach((row, idx) => {
            const cost = parseFloat(row['Any Other Cost'] || row['Total Cost_1'] || row['Total Cost'] || 0);
            console.log(`    ${idx + 1}. Indent: ${row['Indent']}, Month: "${row['Freight Tiger Month']}", Range: "${row['Range']}", Cost: ₹${cost}`);
          });
          
          // Check if there are rows with different formats that should be included
          console.log(`\n  🔍 Checking for rows with different formats:`);
          const allRows = jsonData.filter((row: any) => {
            const month = (row['Freight Tiger Month'] || '').toString().toLowerCase();
            const range = (row['Range'] || '').toString().toLowerCase();
            return (month.includes('may') || month.includes('jun') || month.includes('jul')) &&
                   (range.includes('0-100') || range.includes('101-250'));
          });
          
          console.log(`    Total rows with may/jun/jul and 0-100/101-250: ${allRows.length}`);
        }
      }
    }
    
    function normalizeMonth(monthValue: string): string | null {
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
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

findExactMatches();

