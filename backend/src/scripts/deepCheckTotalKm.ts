import { connectDatabase } from '../config/database';
import Trip from '../models/Trip';
import { parseExcelFile } from '../utils/excelParser';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Deep check script to verify totalKm in database and compare with Excel
 */
const deepCheckTotalKm = async () => {
  try {
    await connectDatabase();
    
    console.log(`\n🔍 ===== DEEP CHECK: TOTAL KM IN DATABASE =====\n`);
    
    // 1. Check database state
    const totalIndents = await Trip.countDocuments({});
    const indentsWithKm = await Trip.countDocuments({ totalKm: { $exists: true, $ne: 0 } });
    const indentsWithKmZero = await Trip.countDocuments({ totalKm: 0 });
    const indentsWithoutKm = await Trip.countDocuments({ totalKm: { $exists: false } });
    const indentsWithKmNull = await Trip.countDocuments({ totalKm: null });
    
    console.log(`📊 Database Statistics:`);
    console.log(`  Total indents: ${totalIndents}`);
    console.log(`  With totalKm > 0: ${indentsWithKm}`);
    console.log(`  With totalKm = 0: ${indentsWithKmZero}`);
    console.log(`  Without totalKm field: ${indentsWithoutKm}`);
    console.log(`  With totalKm = null: ${indentsWithKmNull}\n`);
    
    // 2. Check totalKm values in database
    const allIndents = await Trip.find({}).lean();
    const totalKmInDB = allIndents.reduce((sum, indent) => sum + (Number((indent as any).totalKm) || 0), 0);
    console.log(`📊 Total Km in database: ${totalKmInDB.toLocaleString('en-IN')} km\n`);
    
    // 3. Sample records with detailed info
    console.log(`📝 Sample records (first 10):`);
    allIndents.slice(0, 10).forEach((record: any, idx: number) => {
      console.log(`  ${idx + 1}. Indent: ${record.indent}`);
      console.log(`     totalKm: ${record.totalKm ?? 'undefined'} (type: ${typeof record.totalKm})`);
      console.log(`     totalKm exists: ${'totalKm' in record}`);
      console.log(`     totalKm is null: ${record.totalKm === null}`);
      console.log(`     totalKm is undefined: ${record.totalKm === undefined}`);
      console.log(`     range: ${record.range}`);
      console.log(`     totalCost: ${record.totalCost ?? 'undefined'}`);
      console.log(``);
    });
    
    // 4. Check records with totalKm > 0
    const recordsWithKm = allIndents.filter((indent: any) => indent.totalKm && Number(indent.totalKm) > 0);
    if (recordsWithKm.length > 0) {
      console.log(`✅ Records with totalKm > 0 (first 10):`);
      recordsWithKm.slice(0, 10).forEach((record: any, idx: number) => {
        console.log(`  ${idx + 1}. Indent: ${record.indent}, totalKm: ${record.totalKm}`);
      });
      console.log(``);
    } else {
      console.log(`❌ NO records found with totalKm > 0!\n`);
    }
    
    // 5. Check by range to see if any range has totalKm
    console.log(`📊 Total Km by Range:`);
    const rangeGroups = new Map<string, { count: number; totalKm: number }>();
    allIndents.forEach((indent: any) => {
      const range = indent.range || 'Unknown';
      if (!rangeGroups.has(range)) {
        rangeGroups.set(range, { count: 0, totalKm: 0 });
      }
      const group = rangeGroups.get(range)!;
      group.count++;
      group.totalKm += Number(indent.totalKm) || 0;
    });
    
    rangeGroups.forEach((data, range) => {
      console.log(`  ${range}: ${data.count} indents, Total Km: ${data.totalKm.toLocaleString('en-IN')} km`);
    });
    console.log(``);
    
    // 6. Try to parse Excel file and compare
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
    
    if (excelPath) {
      console.log(`📖 Parsing Excel file to compare...\n`);
      try {
        const indents = parseExcelFile(excelPath);
        const totalKmParsed = indents.reduce((sum, indent) => sum + (indent.totalKm || 0), 0);
        const indentsWithKmParsed = indents.filter(indent => indent.totalKm && indent.totalKm > 0);
        
        console.log(`📊 Excel Parsing Results:`);
        console.log(`  Total indents parsed: ${indents.length}`);
        console.log(`  With totalKm > 0: ${indentsWithKmParsed.length}`);
        console.log(`  Total Km from Excel: ${totalKmParsed.toLocaleString('en-IN')} km\n`);
        
        console.log(`📊 Comparison:`);
        console.log(`  Database Total Km: ${totalKmInDB.toLocaleString('en-IN')} km`);
        console.log(`  Excel Total Km: ${totalKmParsed.toLocaleString('en-IN')} km`);
        console.log(`  Difference: ${(totalKmParsed - totalKmInDB).toLocaleString('en-IN')} km\n`);
        
        if (totalKmInDB === 0 && totalKmParsed > 0) {
          console.log(`❌ ISSUE IDENTIFIED:`);
          console.log(`   Excel parser is working (${totalKmParsed.toLocaleString('en-IN')} km)`);
          console.log(`   But database has 0 km`);
          console.log(`   This means data needs to be re-uploaded!\n`);
        }
      } catch (parseError) {
        console.error(`❌ Error parsing Excel:`, parseError);
      }
    }
    
    // 7. Check MongoDB schema
    console.log(`📊 MongoDB Schema Check:`);
    const sampleDoc = await Trip.findOne({}).lean();
    if (sampleDoc) {
      const keys = Object.keys(sampleDoc);
      console.log(`  Document keys: ${keys.join(', ')}`);
      console.log(`  Has totalKm key: ${keys.includes('totalKm')}`);
      if (keys.includes('totalKm')) {
        console.log(`  totalKm value: ${(sampleDoc as any).totalKm}`);
        console.log(`  totalKm type: ${typeof (sampleDoc as any).totalKm}`);
      }
    }
    console.log(``);
    
    // 8. Direct MongoDB query to check
    console.log(`📊 Direct MongoDB Aggregation:`);
    const aggregationResult = await Trip.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ['$totalKm', 0] } },
          count: { $sum: 1 },
          countWithKm: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$totalKm', null] }, { $ne: ['$totalKm', undefined] }, { $gt: ['$totalKm', 0] }] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
    
    if (aggregationResult.length > 0) {
      const result = aggregationResult[0];
      console.log(`  Total documents: ${result.count}`);
      console.log(`  Documents with totalKm > 0: ${result.countWithKm}`);
      console.log(`  Sum of totalKm: ${result.total.toLocaleString('en-IN')} km\n`);
    }
    
    console.log(`🔍 ============================================\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

deepCheckTotalKm();

