import { connectDatabase } from '../config/database';
import Trip from '../models/Trip';
import { parseExcelFile } from '../utils/excelParser';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Script to update totalKm in existing database records by re-parsing Excel
 */
const updateTotalKmInDB = async () => {
  try {
    await connectDatabase();
    
    console.log(`\n🔄 ===== UPDATING TOTAL KM IN DATABASE =====\n`);
    
    // Find Excel file
    const possiblePaths = [
      path.join(__dirname, '../../../MIS MASTER SHEET July 2025.xlsx'),
      path.join(__dirname, '../../../../MIS MASTER SHEET July 2025.xlsx'),
      path.join(process.cwd(), 'MIS MASTER SHEET July 2025.xlsx'),
      path.join(process.cwd(), '../MIS MASTER SHEET July 2025.xlsx'),
    ];
    
    let excelPath: string | null = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        excelPath = possiblePath;
        console.log(`✅ Found Excel file at: ${excelPath}\n`);
        break;
      }
    }
    
    if (!excelPath) {
      console.error(`❌ Excel file not found!`);
      console.error(`   Please make sure the Excel file is in the project root.`);
      process.exit(1);
    }
    
    // Parse Excel file
    console.log(`📖 Parsing Excel file...\n`);
    const indents = parseExcelFile(excelPath);
    
    console.log(`✅ Parsed ${indents.length} indents from Excel\n`);
    
    // Create a map of indent -> totalKm for quick lookup (include all numeric values)
    const indentKmMap = new Map<string, number>();
    indents.forEach(indent => {
      if (indent.indent) {
        const kmValue = indent.totalKm;
        // Include all numeric values (0 is valid)
        if (kmValue !== undefined && kmValue !== null && !isNaN(Number(kmValue))) {
          // If multiple rows have same indent, sum them
          const existing = indentKmMap.get(indent.indent) || 0;
          indentKmMap.set(indent.indent, existing + Number(kmValue));
        }
      }
    });
    
    console.log(`📊 Created map with ${indentKmMap.size} unique indents and totalKm values\n`);
    
    // Get all records from database
    const dbRecords = await Trip.find({}).lean();
    console.log(`📊 Found ${dbRecords.length} records in database\n`);
    
    // Update records
    let updatedCount = 0;
    let notFoundCount = 0;
    let totalKmUpdated = 0;
    
    console.log(`🔄 Updating records...\n`);
    
    for (const record of dbRecords) {
      const indent = record.indent;
      if (indent && indentKmMap.has(indent)) {
        const totalKm = indentKmMap.get(indent)!;
        await Trip.updateOne(
          { _id: record._id },
          { $set: { totalKm: totalKm } }
        );
        updatedCount++;
        totalKmUpdated += totalKm;
        
        if (updatedCount <= 5) {
          console.log(`  ✅ Updated: ${indent} -> totalKm: ${totalKm}`);
        }
      } else {
        notFoundCount++;
        if (notFoundCount <= 5) {
          console.log(`  ⚠️  Not found in Excel: ${indent}`);
        }
      }
    }
    
    console.log(`\n📊 Update Summary:`);
    console.log(`  Records updated: ${updatedCount}`);
    console.log(`  Records not found in Excel: ${notFoundCount}`);
    console.log(`  Total Km updated: ${totalKmUpdated.toLocaleString('en-IN')} km\n`);
    
    // Verify update
    const verifyCount = await Trip.countDocuments({ totalKm: { $exists: true, $ne: 0 } });
    const verifyTotal = await Trip.aggregate([
      { $group: { _id: null, total: { $sum: { $ifNull: ['$totalKm', 0] } } } }
    ]);
    const verifyTotalKm = verifyTotal.length > 0 ? verifyTotal[0].total : 0;
    
    console.log(`✅ Verification:`);
    console.log(`  Records with totalKm > 0: ${verifyCount}`);
    console.log(`  Total Km in database: ${verifyTotalKm.toLocaleString('en-IN')} km\n`);
    
    // Sample records
    const sampleRecords = await Trip.find({ totalKm: { $gt: 0 } }).limit(5).lean();
    console.log(`📝 Sample updated records:`);
    sampleRecords.forEach((record: any, idx: number) => {
      console.log(`  ${idx + 1}. ${record.indent}: totalKm = ${record.totalKm}`);
    });
    console.log(``);
    
    if (verifyTotalKm > 0) {
      console.log(`✅ SUCCESS: Total Km has been updated in the database!`);
    } else {
      console.log(`❌ WARNING: Total Km is still 0. Check if indent matching is working.`);
    }
    
    console.log(`\n🔄 ============================================\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updateTotalKmInDB();

