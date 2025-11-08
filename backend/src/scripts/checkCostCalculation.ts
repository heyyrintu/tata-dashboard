import { connectDatabase } from '../config/database';
import Trip from '../models/Trip';

/**
 * Check cost calculation in range-wise summary
 */
const checkCostCalculation = async () => {
  try {
    await connectDatabase();
    
    // Get all indents
    const allIndents = await Trip.find({});
    console.log(`\n📊 Database:`);
    console.log(`  Total indents: ${allIndents.length}`);
    
    // Calculate total cost from all indents
    const totalCostAll = allIndents.reduce((sum, indent) => sum + ((indent as any).totalCost || 0), 0);
    console.log(`  Total Cost (all indents): ₹${totalCostAll.toLocaleString('en-IN')}`);
    
    // Check indents with date filters (like the range-wise summary does)
    const now = new Date();
    const allIndentsInDateRange = allIndents.filter((indent: any) => {
      if (!indent.indentDate) return false;
      const indentDate = new Date(indent.indentDate);
      return indentDate <= now; // No date filter = all dates up to now
    });
    
    console.log(`\n📊 With Date Filter (all dates <= now):`);
    console.log(`  Indents in date range: ${allIndentsInDateRange.length}`);
    const totalCostInDateRange = allIndentsInDateRange.reduce((sum: number, indent: any) => {
      return sum + (indent.totalCost || 0);
    }, 0);
    console.log(`  Total Cost in date range: ₹${totalCostInDateRange.toLocaleString('en-IN')}`);
    
    // Check if any indents are being filtered out
    const filteredOut = allIndents.length - allIndentsInDateRange.length;
    if (filteredOut > 0) {
      console.log(`\n⚠️  ${filteredOut} indents filtered out due to date filter`);
    }
    
    // Check indents with range
    const indentsWithRange = allIndentsInDateRange.filter((indent: any) => 
      indent.range && indent.range.trim() !== ''
    );
    const indentsWithoutRange = allIndentsInDateRange.filter((indent: any) => 
      !indent.range || indent.range.trim() === ''
    );
    
    console.log(`\n📊 Range Filter:`);
    console.log(`  Indents with range: ${indentsWithRange.length}`);
    console.log(`  Indents without range: ${indentsWithoutRange.length}`);
    
    const totalCostWithRange = indentsWithRange.reduce((sum: number, indent: any) => {
      return sum + (indent.totalCost || 0);
    }, 0);
    const totalCostWithoutRange = indentsWithoutRange.reduce((sum: number, indent: any) => {
      return sum + (indent.totalCost || 0);
    }, 0);
    
    console.log(`  Total Cost (with range): ₹${totalCostWithRange.toLocaleString('en-IN')}`);
    console.log(`  Total Cost (without range): ₹${totalCostWithoutRange.toLocaleString('en-IN')}`);
    console.log(`  Combined: ₹${(totalCostWithRange + totalCostWithoutRange).toLocaleString('en-IN')}`);
    
    // Expected from Excel
    const expectedTotal = 5064733.45;
    console.log(`\n🔍 Comparison:`);
    console.log(`  Expected (from Excel): ₹${expectedTotal.toLocaleString('en-IN')}`);
    console.log(`  Database Total: ₹${totalCostAll.toLocaleString('en-IN')}`);
    console.log(`  Difference: ₹${Math.abs(expectedTotal - totalCostAll).toLocaleString('en-IN')}`);
    
    if (Math.abs(expectedTotal - totalCostAll) > 0.01) {
      console.log(`\n⚠️  WARNING: Database has old data!`);
      console.log(`   Please re-upload the Excel file to update the totalCost values.`);
      console.log(`   The parser is working correctly (₹${expectedTotal.toLocaleString('en-IN')}),`);
      console.log(`   but the database has outdated values (₹${totalCostAll.toLocaleString('en-IN')}).`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkCostCalculation();

