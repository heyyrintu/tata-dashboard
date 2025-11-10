import { connectDatabase } from '../config/database';
import Trip from '../models/Trip';

/**
 * Script to check if totalKm exists in database
 */
const checkTotalKmInDB = async () => {
  try {
    await connectDatabase();
    
    const totalIndents = await Trip.countDocuments({});
    console.log(`\n📊 Database:`);
    console.log(`  Total indents: ${totalIndents}`);
    
    // Check indents with totalKm
    const indentsWithKm = await Trip.countDocuments({ totalKm: { $exists: true, $ne: 0 } });
    const indentsWithKmZero = await Trip.countDocuments({ totalKm: 0 });
    const indentsWithoutKm = await Trip.countDocuments({ totalKm: { $exists: false } });
    
    console.log(`\n🚗 Total Km in Database:`);
    console.log(`  Indents with totalKm > 0: ${indentsWithKm}`);
    console.log(`  Indents with totalKm = 0: ${indentsWithKmZero}`);
    console.log(`  Indents without totalKm field: ${indentsWithoutKm}`);
    
    // Calculate total km from database
    const allIndents = await Trip.find({}).lean();
    const totalKm = allIndents.reduce((sum, indent) => sum + (Number((indent as any).totalKm) || 0), 0);
    console.log(`  Total Km in database: ${totalKm.toLocaleString('en-IN')} km`);
    
    // Check sample indents
    console.log(`\n📝 Sample indents (first 10):`);
    allIndents.slice(0, 10).forEach((indent, index) => {
      console.log(`  ${index + 1}. ${indent.indent}: totalKm=${(indent as any).totalKm ?? 'undefined'}, range=${indent.range}`);
    });
    
    // Check indents with totalKm > 0
    const indentsWithKmData = allIndents.filter((indent: any) => indent.totalKm && Number(indent.totalKm) > 0);
    if (indentsWithKmData.length > 0) {
      console.log(`\n✅ Sample indents with totalKm > 0 (first 5):`);
      indentsWithKmData.slice(0, 5).forEach((indent: any, index: number) => {
        console.log(`  ${index + 1}. ${indent.indent}: totalKm=${indent.totalKm}, range=${indent.range}`);
      });
    } else {
      console.log(`\n⚠️  WARNING: No indents found with totalKm > 0!`);
    }
    
    if (indentsWithoutKm > 0 || totalKm === 0) {
      console.log(`\n⚠️  WARNING: Database doesn't have totalKm data!`);
      console.log(`   Please re-upload the Excel file to populate the totalKm field.`);
      console.log(`   Make sure the Excel file has column U with header 'Total Km ( TpT)' or similar.`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkTotalKmInDB();

