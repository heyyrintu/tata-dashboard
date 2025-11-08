import { connectDatabase } from '../config/database';
import Trip from '../models/Trip';

/**
 * Check what range values are actually stored in the database
 */
const checkDBRangeValues = async () => {
  try {
    await connectDatabase();
    
    // Get all May indents
    const allMay = await Trip.find({});
    const mayIndents = allMay.filter((indent: any) => {
      const month = (indent.freightTigerMonth || '').toString().trim();
      return month === "May'25" || month === "May-25" || month.toLowerCase().includes('may');
    });
    
    console.log(`\n📊 May indents in database: ${mayIndents.length}`);
    
    // Group by range
    const rangeGroups = new Map<string, any[]>();
    mayIndents.forEach((indent: any) => {
      const range = (indent.range || '').toString().trim();
      if (!rangeGroups.has(range)) {
        rangeGroups.set(range, []);
      }
      rangeGroups.get(range)!.push(indent);
    });
    
    console.log(`\n📊 May indents by Range (as stored in DB):`);
    rangeGroups.forEach((indents, range) => {
      const cost = indents.reduce((sum: number, i: any) => {
        return sum + ((i as any).totalCost || 0);
      }, 0);
      console.log(`  "${range}": ${indents.length} rows, Total Cost: ₹${cost.toLocaleString('en-IN')}`);
    });
    
    // Check for 0-100Km rows (all variations)
    const all0100Rows = mayIndents.filter((indent: any) => {
      const range = (indent.range || '').toString().trim().toLowerCase();
      return range.includes('0-100') || range.includes('0 100');
    });
    
    const all0100Cost = all0100Rows.reduce((sum: number, indent: any) => {
      return sum + ((indent as any).totalCost || 0);
    }, 0);
    
    console.log(`\n📊 All 0-100Km rows (all variations in DB):`);
    console.log(`  Total rows: ${all0100Rows.length}`);
    console.log(`  Total Cost: ₹${all0100Cost.toLocaleString('en-IN')}`);
    console.log(`  Expected: ₹1,96,078.5`);
    console.log(`  Difference: ₹${Math.abs(all0100Cost - 196078.5).toLocaleString('en-IN')}`);
    
    // Check if querying with exact "0-100Km" matches all rows
    const exact0100Km = mayIndents.filter((indent: any) => {
      return indent.range === '0-100Km';
    });
    
    const exact0100KmCost = exact0100Km.reduce((sum: number, indent: any) => {
      return sum + ((indent as any).totalCost || 0);
    }, 0);
    
    console.log(`\n📊 Rows with exact "0-100Km" in DB:`);
    console.log(`  Total rows: ${exact0100Km.length}`);
    console.log(`  Total Cost: ₹${exact0100KmCost.toLocaleString('en-IN')}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkDBRangeValues();

