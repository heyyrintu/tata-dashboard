import { connectDatabase } from '../config/database';
import { calculateRangeWiseSummary } from '../utils/rangeWiseCalculations';

/**
 * Test the actual API calculation for May
 */
const testMayAPI = async () => {
  try {
    await connectDatabase();
    
    // Simulate May 2025 selection (2025-05-01 to 2025-05-31)
    const fromDate = new Date('2025-05-01');
    const toDate = new Date('2025-05-31');
    toDate.setHours(23, 59, 59, 999);
    
    console.log(`\n🔍 Testing calculateRangeWiseSummary for May 2025:`);
    console.log(`  Date range: ${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`);
    
    const result = await calculateRangeWiseSummary(fromDate, toDate);
    
    console.log(`\n📊 Results:`);
    console.log(`  Total Cost: ₹${result.totalCost.toLocaleString('en-IN')}`);
    console.log(`  Total Rows: ${result.totalRows}`);
    
    console.log(`\n📊 Range-wise breakdown:`);
    result.rangeData.forEach(range => {
      if (range.range === '0-100Km') {
        console.log(`\n  ${range.range}:`);
        console.log(`    Rows: ${range.indentCount}`);
        console.log(`    Total Cost: ₹${range.totalCost.toLocaleString('en-IN')}`);
        console.log(`    Expected: ₹11,636 (reported as low)`);
        console.log(`    Difference: ₹${(range.totalCost - 11636).toLocaleString('en-IN')}`);
      }
      if (range.range === '101-250Km') {
        console.log(`\n  ${range.range}:`);
        console.log(`    Rows: ${range.indentCount}`);
        console.log(`    Total Cost: ₹${range.totalCost.toLocaleString('en-IN')}`);
      }
    });
    
    // Also test June and July
    console.log(`\n🔍 Testing June 2025:`);
    const juneFrom = new Date('2025-06-01');
    const juneTo = new Date('2025-06-30');
    juneTo.setHours(23, 59, 59, 999);
    const juneResult = await calculateRangeWiseSummary(juneFrom, juneTo);
    const june101250 = juneResult.rangeData.find(r => r.range === '101-250Km');
    if (june101250) {
      console.log(`  June - 101-250Km:`);
      console.log(`    Rows: ${june101250.indentCount}`);
      console.log(`    Total Cost: ₹${june101250.totalCost.toLocaleString('en-IN')}`);
      console.log(`    Expected: ₹51,420 (reported as low)`);
      console.log(`    Difference: ₹${(june101250.totalCost - 51420).toLocaleString('en-IN')}`);
    }
    
    console.log(`\n🔍 Testing July 2025:`);
    const julyFrom = new Date('2025-07-01');
    const julyTo = new Date('2025-07-31');
    julyTo.setHours(23, 59, 59, 999);
    const julyResult = await calculateRangeWiseSummary(julyFrom, julyTo);
    const july101250 = julyResult.rangeData.find(r => r.range === '101-250Km');
    if (july101250) {
      console.log(`  July - 101-250Km:`);
      console.log(`    Rows: ${july101250.indentCount}`);
      console.log(`    Total Cost: ₹${july101250.totalCost.toLocaleString('en-IN')}`);
      console.log(`    Expected: ₹82,010 (reported as low)`);
      console.log(`    Difference: ₹${(july101250.totalCost - 82010).toLocaleString('en-IN')}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testMayAPI();

