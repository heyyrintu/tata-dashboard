import { connectDatabase } from '../config/database';
import Trip from '../models/Trip';

/**
 * Test month normalization and check cost calculations
 */
const testMonthNormalization = async () => {
  try {
    await connectDatabase();
    
    // Test the normalization function
    const normalizeFreightTigerMonth = (monthValue: string): string | null => {
      if (!monthValue || typeof monthValue !== 'string') return null;
      const trimmed = monthValue.trim();
      const fixedTypo = trimmed.replace(/^0ct/i, 'Oct');
      const monthPatterns = [
        /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-'](\d{2,4})$/i,
        /^(\d{1,2})[-/](\d{2,4})$/,
      ];
      
      for (const pattern of monthPatterns) {
        const match = fixedTypo.match(pattern);
        if (match) {
          let monthStr = match[1];
          let yearStr = match[2];
          
          const monthNames: { [key: string]: string } = {
            'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
            'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
            'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
          };
          
          if (monthNames[monthStr.toLowerCase()]) {
            monthStr = monthNames[monthStr.toLowerCase()];
          } else if (parseInt(monthStr) >= 1 && parseInt(monthStr) <= 12) {
            monthStr = monthStr.padStart(2, '0');
          } else {
            continue;
          }
          
          if (yearStr.length === 2) {
            const yearNum = parseInt(yearStr);
            yearStr = yearNum >= 50 ? `19${yearStr}` : `20${yearStr}`;
          }
          
          return `${yearStr}-${monthStr}`;
        }
      }
      return null;
    };
    
    console.log(`\n🧪 Testing month normalization:`);
    const testCases = ['May\'25', 'Jun\'25', 'Jul\'25', 'May-25', 'Jun-25', 'Jul-25'];
    testCases.forEach(test => {
      const normalized = normalizeFreightTigerMonth(test);
      console.log(`  "${test}" -> "${normalized}"`);
    });
    
    // Now check database with normalized months
    console.log(`\n📊 Checking database with normalized months:`);
    
    // May - 0-100Km
    const may0100 = await Trip.find({});
    const may0100Filtered = may0100.filter((indent: any) => {
      if (!indent.range || indent.range !== '0-100Km') return false;
      const normalized = normalizeFreightTigerMonth(indent.freightTigerMonth || '');
      return normalized === '2025-05';
    });
    const may0100Cost = may0100Filtered.reduce((sum, indent) => sum + ((indent as any).totalCost || 0), 0);
    console.log(`\n  May - 0-100Km:`);
    console.log(`    Rows: ${may0100Filtered.length}`);
    console.log(`    Total Cost: ₹${may0100Cost.toLocaleString('en-IN')}`);
    console.log(`    Expected: ₹11,636 (reported as low)`);
    
    // June - 101-250Km
    const june101250 = may0100.filter((indent: any) => {
      if (!indent.range || indent.range !== '101-250Km') return false;
      const normalized = normalizeFreightTigerMonth(indent.freightTigerMonth || '');
      return normalized === '2025-06';
    });
    const june101250Cost = june101250.reduce((sum, indent) => sum + ((indent as any).totalCost || 0), 0);
    console.log(`\n  June - 101-250Km:`);
    console.log(`    Rows: ${june101250.length}`);
    console.log(`    Total Cost: ₹${june101250Cost.toLocaleString('en-IN')}`);
    console.log(`    Expected: ₹51,420 (reported as low)`);
    
    // July - 101-250Km
    const july101250 = may0100.filter((indent: any) => {
      if (!indent.range || indent.range !== '101-250Km') return false;
      const normalized = normalizeFreightTigerMonth(indent.freightTigerMonth || '');
      return normalized === '2025-07';
    });
    const july101250Cost = july101250.reduce((sum, indent) => sum + ((indent as any).totalCost || 0), 0);
    console.log(`\n  July - 101-250Km:`);
    console.log(`    Rows: ${july101250.length}`);
    console.log(`    Total Cost: ₹${july101250Cost.toLocaleString('en-IN')}`);
    console.log(`    Expected: ₹82,010 (reported as low)`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testMonthNormalization();

