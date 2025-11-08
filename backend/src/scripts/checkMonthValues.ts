import { connectDatabase } from '../config/database';
import Trip from '../models/Trip';

/**
 * Check what month values exist in the database
 */
const checkMonthValues = async () => {
  try {
    await connectDatabase();
    
    const allIndents = await Trip.find({});
    console.log(`\n📊 Total indents in DB: ${allIndents.length}`);
    
    // Get unique freightTigerMonth values
    const monthCounts = new Map<string, number>();
    allIndents.forEach((indent: any) => {
      const month = indent.freightTigerMonth || 'NULL';
      monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
    });
    
    console.log(`\n📅 Freight Tiger Month values in database:`);
    const sortedMonths = Array.from(monthCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    sortedMonths.forEach(([month, count]) => {
      console.log(`  ${month}: ${count} rows`);
    });
    
    // Check for May, June, July with different formats
    console.log(`\n🔍 Checking for May/June/July data:`);
    
    // Check May
    const mayVariations = [
      '2025-05',
      'May-25',
      'May-2025',
      'may-25',
      'MAY-25',
      '05-25',
      '5-25'
    ];
    for (const mayVar of mayVariations) {
      const count = await Trip.countDocuments({ freightTigerMonth: mayVar });
      if (count > 0) {
        const totalCost = (await Trip.find({ freightTigerMonth: mayVar })).reduce((sum, indent) => 
          sum + ((indent as any).totalCost || 0), 0);
        console.log(`  May (${mayVar}): ${count} rows, Total Cost: ₹${totalCost.toLocaleString('en-IN')}`);
      }
    }
    
    // Check June
    const juneVariations = [
      '2025-06',
      'Jun-25',
      'June-25',
      'Jun-2025',
      'June-2025',
      'jun-25',
      'JUNE-25',
      '06-25',
      '6-25'
    ];
    for (const juneVar of juneVariations) {
      const count = await Trip.countDocuments({ freightTigerMonth: juneVar });
      if (count > 0) {
        const totalCost = (await Trip.find({ freightTigerMonth: juneVar })).reduce((sum, indent) => 
          sum + ((indent as any).totalCost || 0), 0);
        console.log(`  June (${juneVar}): ${count} rows, Total Cost: ₹${totalCost.toLocaleString('en-IN')}`);
      }
    }
    
    // Check July
    const julyVariations = [
      '2025-07',
      'Jul-25',
      'July-25',
      'Jul-2025',
      'July-2025',
      'jul-25',
      'JULY-25',
      '07-25',
      '7-25'
    ];
    for (const julyVar of julyVariations) {
      const count = await Trip.countDocuments({ freightTigerMonth: julyVar });
      if (count > 0) {
        const totalCost = (await Trip.find({ freightTigerMonth: julyVar })).reduce((sum, indent) => 
          sum + ((indent as any).totalCost || 0), 0);
        console.log(`  July (${julyVar}): ${count} rows, Total Cost: ₹${totalCost.toLocaleString('en-IN')}`);
      }
    }
    
    // Check sample indents to see month format
    console.log(`\n📝 Sample indents (first 20) with month values:`);
    allIndents.slice(0, 20).forEach((indent, index) => {
      console.log(`  ${index + 1}. ${indent.indent}: month="${(indent as any).freightTigerMonth || 'NULL'}", range="${indent.range || 'NULL'}", cost=₹${(indent as any).totalCost || 0}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkMonthValues();

