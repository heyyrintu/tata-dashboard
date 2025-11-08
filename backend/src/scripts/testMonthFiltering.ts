import { connectDatabase } from '../config/database';
import Trip from '../models/Trip';
import { format } from 'date-fns';

/**
 * Test month filtering to see what's being excluded
 */
const testMonthFiltering = async () => {
  try {
    await connectDatabase();
    
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
    
    // Test May - 0-100Km
    console.log(`\n🔍 Testing May - 0-100Km filtering:`);
    
    // Get all May indents with 0-100Km range
    const allMay0100 = await Trip.find({});
    const may0100ByMonth = allMay0100.filter((indent: any) => {
      if (!indent.range || indent.range !== '0-100Km') return false;
      const normalized = normalizeFreightTigerMonth(indent.freightTigerMonth || '');
      return normalized === '2025-05';
    });
    
    console.log(`  Total rows with May'25 and 0-100Km: ${may0100ByMonth.length}`);
    const totalCostByMonth = may0100ByMonth.reduce((sum, indent) => sum + ((indent as any).totalCost || 0), 0);
    console.log(`  Total Cost (by month only): ₹${totalCostByMonth.toLocaleString('en-IN')}`);
    
    // Now simulate what happens with date filtering (May 2025)
    const fromDate = new Date('2025-05-01');
    const toDate = new Date('2025-05-31');
    toDate.setHours(23, 59, 59, 999);
    
    const may0100ByMonthAndDate = may0100ByMonth.filter((indent: any) => {
      if (!indent.indentDate) return false;
      const indentDate = new Date(indent.indentDate);
      return indentDate >= fromDate && indentDate <= toDate;
    });
    
    console.log(`  Rows after date filter (2025-05-01 to 2025-05-31): ${may0100ByMonthAndDate.length}`);
    const totalCostByMonthAndDate = may0100ByMonthAndDate.reduce((sum, indent) => sum + ((indent as any).totalCost || 0), 0);
    console.log(`  Total Cost (by month + date): ₹${totalCostByMonthAndDate.toLocaleString('en-IN')}`);
    
    // Check which rows are being excluded
    const excluded = may0100ByMonth.filter((indent: any) => {
      if (!indent.indentDate) return true;
      const indentDate = new Date(indent.indentDate);
      return !(indentDate >= fromDate && indentDate <= toDate);
    });
    
    if (excluded.length > 0) {
      console.log(`\n  ⚠️  ${excluded.length} rows excluded by date filter:`);
      excluded.slice(0, 10).forEach((indent: any) => {
        console.log(`    - ${indent.indent}: month="${indent.freightTigerMonth}", date="${indent.indentDate}", cost=₹${indent.totalCost || 0}`);
      });
      const excludedCost = excluded.reduce((sum, indent) => sum + ((indent as any).totalCost || 0), 0);
      console.log(`    Total excluded cost: ₹${excludedCost.toLocaleString('en-IN')}`);
    }
    
    // Check indentDate values for May rows
    console.log(`\n  📅 IndentDate distribution for May - 0-100Km:`);
    const dateGroups = new Map<string, number>();
    may0100ByMonth.forEach((indent: any) => {
      if (indent.indentDate) {
        const date = new Date(indent.indentDate);
        const monthKey = format(date, 'yyyy-MM');
        dateGroups.set(monthKey, (dateGroups.get(monthKey) || 0) + 1);
      } else {
        dateGroups.set('NULL', (dateGroups.get('NULL') || 0) + 1);
      }
    });
    dateGroups.forEach((count, month) => {
      console.log(`    ${month}: ${count} rows`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testMonthFiltering();

