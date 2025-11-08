import { parseExcelFile } from '../utils/excelParser';

/**
 * Test script to verify totalCost parsing
 */
const testTotalCostParsing = () => {
  try {
    const filePath = 'C:\\Users\\RintuMondal\\OneDrive - DRONA LOGITECH PRIVATE LIMITED\\Pictures\\tata\\TATA DEF.xlsx';
    console.log(`📄 Parsing Excel file: ${filePath}`);
    
    const parsedIndents = parseExcelFile(filePath);
    console.log(`\n📊 Parsed ${parsedIndents.length} indents`);
    
    // Calculate total cost
    const totalCost = parsedIndents.reduce((sum, indent) => sum + (indent.totalCost || 0), 0);
    
    console.log(`\n💰 Total Cost Analysis:`);
    console.log(`  Total Cost: ₹${totalCost.toLocaleString('en-IN')}`);
    console.log(`  Indents with totalCost > 0: ${parsedIndents.filter(i => (i.totalCost || 0) > 0).length}`);
    console.log(`  Indents with totalCost = 0: ${parsedIndents.filter(i => (i.totalCost || 0) === 0).length}`);
    
    // Check first 10 indents
    console.log(`\n🔍 Checking first 10 indents for totalCost:`);
    parsedIndents.slice(0, 10).forEach((indent, index) => {
      console.log(`  ${index + 1}. Indent: ${indent.indent}, Total Cost: ₹${indent.totalCost || 0}`);
    });
    
    // Expected total from Excel (from previous debug script)
    const expectedTotal = 5064733.45;
    const difference = Math.abs(totalCost - expectedTotal);
    
    console.log(`\n🔍 Comparison:`);
    console.log(`  Expected (from Excel): ₹${expectedTotal.toLocaleString('en-IN')}`);
    console.log(`  Parsed Total: ₹${totalCost.toLocaleString('en-IN')}`);
    console.log(`  Difference: ₹${difference.toLocaleString('en-IN')}`);
    
    if (difference > 0.01) {
      console.log(`\n⚠️  WARNING: Mismatch detected!`);
      console.log(`   Some rows might be filtered out or totalCost not parsed correctly.`);
    } else {
      console.log(`\n✅ Values match!`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testTotalCostParsing();

