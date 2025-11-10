import { connectDatabase } from '../config/database';
import Trip from '../models/Trip';
import { parseExcelFile } from '../utils/excelParser';
import * as path from 'path';

/**
 * Deep debug script to check totalKm parsing from Excel
 */
const debugTotalKmParsing = async () => {
  try {
    await connectDatabase();
    
    console.log(`\n🔍 ===== DEEP DEBUG: TOTAL KM PARSING =====\n`);
    
    // Check database first
    const totalIndents = await Trip.countDocuments({});
    const indentsWithKm = await Trip.countDocuments({ totalKm: { $exists: true, $ne: 0 } });
    const totalKmInDB = await Trip.aggregate([
      { $group: { _id: null, total: { $sum: { $ifNull: ['$totalKm', 0] } } } }
    ]);
    const totalKmValue = totalKmInDB.length > 0 ? totalKmInDB[0].total : 0;
    
    console.log(`📊 Current Database State:`);
    console.log(`  Total indents: ${totalIndents}`);
    console.log(`  Indents with totalKm > 0: ${indentsWithKm}`);
    console.log(`  Total Km in database: ${totalKmValue.toLocaleString('en-IN')} km\n`);
    
    // Check sample records
    const sampleRecords = await Trip.find({}).limit(5).lean();
    console.log(`📝 Sample records from database:`);
    sampleRecords.forEach((record: any, idx: number) => {
      console.log(`  ${idx + 1}. Indent: ${record.indent}`);
      console.log(`     totalKm: ${record.totalKm ?? 'undefined'} (type: ${typeof record.totalKm})`);
      console.log(`     range: ${record.range}`);
      console.log(`     totalCost: ${record.totalCost ?? 'undefined'}`);
      console.log(``);
    });
    
    // Try to find Excel file in common locations
    const possiblePaths = [
      path.join(__dirname, '../../../MIS MASTER SHEET July 2025.xlsx'),
      path.join(__dirname, '../../../../MIS MASTER SHEET July 2025.xlsx'),
      path.join(process.cwd(), 'MIS MASTER SHEET July 2025.xlsx'),
      path.join(process.cwd(), '../MIS MASTER SHEET July 2025.xlsx'),
    ];
    
    let excelPath: string | null = null;
    for (const possiblePath of possiblePaths) {
      const fs = require('fs');
      if (fs.existsSync(possiblePath)) {
        excelPath = possiblePath;
        console.log(`✅ Found Excel file at: ${excelPath}\n`);
        break;
      }
    }
    
    if (!excelPath) {
      console.log(`⚠️  Excel file not found in common locations.`);
      console.log(`   Please provide the path to your Excel file.\n`);
      console.log(`💡 To test parsing, upload the file through the UI and check the logs.`);
      process.exit(0);
    }
    
    // Parse the Excel file
    console.log(`📖 Parsing Excel file...\n`);
    try {
      const indents = parseExcelFile(excelPath);
      
      console.log(`✅ Parsed ${indents.length} indents from Excel\n`);
      
      // Analyze totalKm parsing
      const indentsWithKmParsed = indents.filter(indent => indent.totalKm && indent.totalKm > 0);
      const indentsWithKmZero = indents.filter(indent => indent.totalKm === 0);
      const indentsWithoutKm = indents.filter(indent => indent.totalKm === undefined || indent.totalKm === null);
      
      console.log(`📊 Parsing Results:`);
      console.log(`  Total indents parsed: ${indents.length}`);
      console.log(`  With totalKm > 0: ${indentsWithKmParsed.length}`);
      console.log(`  With totalKm = 0: ${indentsWithKmZero.length}`);
      console.log(`  Without totalKm (undefined/null): ${indentsWithoutKm.length}\n`);
      
      // Show first 10 parsed indents
      console.log(`📝 First 10 parsed indents:`);
      indents.slice(0, 10).forEach((indent, idx) => {
        console.log(`  ${idx + 1}. Indent: ${indent.indent}`);
        console.log(`     totalKm: ${indent.totalKm ?? 'undefined'} (type: ${typeof indent.totalKm})`);
        console.log(`     range: ${indent.range}`);
        console.log(``);
      });
      
      // Show indents with totalKm > 0
      if (indentsWithKmParsed.length > 0) {
        console.log(`✅ Indents with totalKm > 0 (first 10):`);
        indentsWithKmParsed.slice(0, 10).forEach((indent, idx) => {
          console.log(`  ${idx + 1}. Indent: ${indent.indent}, totalKm: ${indent.totalKm}`);
        });
        console.log(``);
      } else {
        console.log(`❌ NO indents found with totalKm > 0!\n`);
        console.log(`🔍 This means the Excel parser is not finding the 'total_km' column.`);
        console.log(`   Check the Excel file column header name.\n`);
      }
      
      // Calculate total
      const totalKmParsed = indents.reduce((sum, indent) => sum + (indent.totalKm || 0), 0);
      console.log(`📊 Total Km from parsed data: ${totalKmParsed.toLocaleString('en-IN')} km\n`);
      
      // Compare with database
      if (totalKmValue === 0 && totalKmParsed === 0) {
        console.log(`❌ ISSUE IDENTIFIED: Both database and parsed data have 0 totalKm!`);
        console.log(`   This confirms the Excel parser is not finding the column.\n`);
        console.log(`💡 Next steps:`);
        console.log(`   1. Check the Excel file column header name`);
        console.log(`   2. Make sure the column is named exactly 'total_km'`);
        console.log(`   3. Check that the column is at position U (index 20)`);
        console.log(`   4. Verify the column has numeric values\n`);
      } else if (totalKmValue === 0 && totalKmParsed > 0) {
        console.log(`⚠️  WARNING: Parsed data has totalKm but database doesn't!`);
        console.log(`   This means parsing works but data wasn't saved to database.\n`);
      } else if (totalKmValue > 0 && totalKmParsed === 0) {
        console.log(`⚠️  WARNING: Database has totalKm but current parsing shows 0!`);
        console.log(`   This means the Excel file structure may have changed.\n`);
      }
      
    } catch (parseError) {
      console.error(`❌ Error parsing Excel file:`, parseError);
      console.error(`   Make sure the file path is correct and the file is accessible.\n`);
    }
    
    console.log(`🔍 ============================================\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

debugTotalKmParsing();

