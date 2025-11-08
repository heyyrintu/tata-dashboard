import { connectDatabase } from '../config/database';
import Trip from '../models/Trip';

/**
 * Script to check if profitLoss exists in database
 */
const checkProfitLossInDB = async () => {
  try {
    await connectDatabase();
    
    const totalIndents = await Trip.countDocuments({});
    console.log(`\n📊 Database:`);
    console.log(`  Total indents: ${totalIndents}`);
    
    // Check indents with profitLoss
    const indentsWithPL = await Trip.countDocuments({ profitLoss: { $exists: true, $ne: 0 } });
    const indentsWithPLZero = await Trip.countDocuments({ profitLoss: 0 });
    const indentsWithoutPL = await Trip.countDocuments({ profitLoss: { $exists: false } });
    
    console.log(`\n💰 Profit & Loss in Database:`);
    console.log(`  Indents with profitLoss > 0: ${indentsWithPL}`);
    console.log(`  Indents with profitLoss = 0: ${indentsWithPLZero}`);
    console.log(`  Indents without profitLoss field: ${indentsWithoutPL}`);
    
    // Calculate total profit/loss from database
    const allIndents = await Trip.find({});
    const totalPL = allIndents.reduce((sum, indent) => sum + ((indent as any).profitLoss || 0), 0);
    console.log(`  Total Profit & Loss: ₹${totalPL.toLocaleString('en-IN')}`);
    
    // Check sample indents
    console.log(`\n📝 Sample indents (first 5):`);
    allIndents.slice(0, 5).forEach((indent, index) => {
      console.log(`  ${index + 1}. ${indent.indent}: profitLoss=${(indent as any).profitLoss ?? 'undefined'}`);
    });
    
    if (indentsWithoutPL > 0 || totalPL === 0) {
      console.log(`\n⚠️  WARNING: Database doesn't have profitLoss data!`);
      console.log(`   Please re-upload the Excel file to populate the profitLoss field.`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkProfitLossInDB();

