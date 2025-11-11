import { connectDatabase } from '../config/database';
import Trip from '../models/Trip';
import { parseExcelFile } from '../utils/excelParser';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Quick diagnostic script to check why totalKm is 0
 */
const quickCheck = async () => {
  try {
    await connectDatabase();
    
    console.log(`\n🔍 ===== QUICK CHECK: TOTAL KM =====\n`);
    
    // 1. Check database
    const totalRecords = await Trip.countDocuments({});
    const recordsWithKm = await Trip.countDocuments({ totalKm: { $exists: true, $ne: 0 } });
    const recordsWithKmZero = await Trip.countDocuments({ totalKm: 0 });
    const recordsWithoutKm = await Trip.countDocuments({ totalKm: { $exists: false } });
    
    console.log(`📊 DATABASE:`);
    console.log(`  Total records: ${totalRecords}`);
    console.log(`  With totalKm > 0: ${recordsWithKm}`);
    console.log(`  With totalKm = 0: ${recordsWithKmZero}`);
    console.log(`  Without totalKm field: ${recordsWithoutKm}`);
    
    const dbTotal = await Trip.aggregate([
      { $group: { _id: null, total: { $sum: { $ifNull: ['$totalKm', 0] } } } }
    ]);
    const dbTotalKm = dbTotal.length > 0 ? dbTotal[0].total : 0;
    console.log(`  Total Km in DB: ${dbTotalKm.toLocaleString('en-IN')} km\n`);
    
    // 2. Check Excel file
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
        break;
      }
    }
    
    if (!excelPath) {
      console.error(`❌ Excel file not found!`);
      console.log(`\n💡 SOLUTION: Run 'npm run update-total-km' to update database`);
      process.exit(1);
    }
    
    console.log(`📊 EXCEL PARSER:`);
    console.log(`  File: ${excelPath}\n`);
    
    const parsedIndents = parseExcelFile(excelPath);
    const parsedWithKm = parsedIndents.filter(indent => indent.totalKm && indent.totalKm > 0);
    const parsedTotalKm = parsedIndents.reduce((sum, indent) => sum + (Number(indent.totalKm) || 0), 0);
    
    console.log(`  Parsed indents: ${parsedIndents.length}`);
    console.log(`  With totalKm > 0: ${parsedWithKm.length}`);
    console.log(`  Total Km from parser: ${parsedTotalKm.toLocaleString('en-IN')} km\n`);
    
    // 3. Sample records
    console.log(`📝 SAMPLE RECORDS FROM PARSER (first 5 with totalKm > 0):`);
    parsedWithKm.slice(0, 5).forEach((indent, idx) => {
      console.log(`  ${idx + 1}. ${indent.indent}: totalKm = ${indent.totalKm}`);
    });
    console.log(``);
    
    // 4. Diagnosis
    console.log(`🔍 DIAGNOSIS:`);
    if (dbTotalKm === 0 && parsedTotalKm > 0) {
      console.log(`  ❌ Database has 0 but parser shows ${parsedTotalKm.toLocaleString('en-IN')} km`);
      console.log(`  💡 SOLUTION: Run 'npm run update-total-km' to update database\n`);
    } else if (dbTotalKm === 0 && parsedTotalKm === 0) {
      console.log(`  ❌ Both database and parser show 0`);
      console.log(`  💡 This means the parser is not reading Column U correctly`);
      console.log(`  💡 Check the Excel file column structure\n`);
    } else if (dbTotalKm > 0) {
      console.log(`  ✅ Database has totalKm data: ${dbTotalKm.toLocaleString('en-IN')} km`);
      console.log(`  💡 If dashboard shows 0, check the date filter or API response\n`);
    }
    
    console.log(`🔍 ============================================\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

quickCheck();

