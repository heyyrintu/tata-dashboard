import * as XLSX from 'xlsx';

/**
 * Find missing rows by checking all possible month/range formats
 */
const findMissingRows = () => {
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
    
    // Helper functions
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
    console.log(`\n🔍 Finding ALL May - 0-100Km rows (checking all formats):`);
    
    // Get all rows that might be May
    const allMayRows = jsonData.filter((row: any) => {
      const month = (row['Freight Tiger Month'] || '').toString().toLowerCase();
      return month.includes('may') || month.includes('05') || month.includes('5');
    });
    
    console.log(`  Total rows with "may" in month: ${allMayRows.length}`);
    
    // Check each row
    const may0100Rows: any[] = [];
    allMayRows.forEach((row: any, index: number) => {
      const month = normalizeMonth(row['Freight Tiger Month'] || '');
      const range = normalizeRange(row['Range'] || '');
      const cost = parseFloat(row['Any Other Cost'] || row['Total Cost_1'] || row['Total Cost'] || 0);
      
      if (month === '2025-05' && range === '0-100Km') {
        may0100Rows.push({ row, index: index + 2, cost, monthRaw: row['Freight Tiger Month'], rangeRaw: row['Range'] });
      } else if (range === '0-100Km' || range.includes('0-100') || range.includes('0 100')) {
        // Potential match but month doesn't match
        if (month !== '2025-05') {
          console.log(`  ⚠️  Row ${index + 2}: Month="${row['Freight Tiger Month']}" (normalized: ${month}), Range="${row['Range']}" (normalized: ${range}), Cost=₹${cost}`);
        }
      }
    });
    
    const totalCost = may0100Rows.reduce((sum, item) => sum + item.cost, 0);
    
    console.log(`\n📊 Results:`);
    console.log(`  Rows found: ${may0100Rows.length}`);
    console.log(`  Total Cost: ₹${totalCost.toLocaleString('en-IN')}`);
    console.log(`  Expected: ₹1,96,078.5`);
    console.log(`  Difference: ₹${Math.abs(totalCost - 196078.5).toLocaleString('en-IN')}`);
    
    // Show all rows
    console.log(`\n📝 All May - 0-100Km rows:`);
    may0100Rows.forEach((item, idx) => {
      console.log(`  ${idx + 1}. Row ${item.index}: Indent=${item.row['Indent']}, Cost=₹${item.cost}, Month="${item.monthRaw}", Range="${item.rangeRaw}"`);
    });
    
    // Check if there are rows with different month formats
    console.log(`\n🔍 Checking for rows with different month formats:`);
    const monthFormats = new Map<string, number>();
    allMayRows.forEach((row: any) => {
      const month = (row['Freight Tiger Month'] || '').toString();
      monthFormats.set(month, (monthFormats.get(month) || 0) + 1);
    });
    console.log(`  Month formats found:`);
    monthFormats.forEach((count, format) => {
      console.log(`    "${format}": ${count} rows`);
    });
    
    // Check for rows with 0-100Km range but different month
    console.log(`\n🔍 Checking for 0-100Km rows with May-like months:`);
    const mayLikeRows = jsonData.filter((row: any) => {
      const range = normalizeRange(row['Range'] || '');
      const month = (row['Freight Tiger Month'] || '').toString().toLowerCase();
      return (range === '0-100Km' || range.includes('0-100')) && 
             (month.includes('may') || month.includes('05') || month.includes('5'));
    });
    
    mayLikeRows.forEach((row: any, index: number) => {
      const month = normalizeMonth(row['Freight Tiger Month'] || '');
      const range = normalizeRange(row['Range'] || '');
      const cost = parseFloat(row['Any Other Cost'] || row['Total Cost_1'] || row['Total Cost'] || 0);
      if (month !== '2025-05' || range !== '0-100Km') {
        console.log(`  Row ${index + 2}: Month="${row['Freight Tiger Month']}" (→${month}), Range="${row['Range']}" (→${range}), Cost=₹${cost}`);
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

findMissingRows();

