import { connectDatabase } from '../config/database';
import Trip from '../models/Trip';
import { parseExcelFile } from '../utils/excelParser';
import * as path from 'path';
import * as fs from 'fs';
import * as XLSX from 'xlsx';

/**
 * Script to update totalKm in existing database records by re-parsing Excel
 */
const updateTotalKmInDB = async () => {
  try {
    await connectDatabase();
    
    // Note: columnUName will be set after reading Excel file
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
    
    // Read column name from Excel file
    let columnUName = 'Column U';
    try {
      const workbook = XLSX.readFile(excelPath, { 
        type: 'file', 
        cellDates: false,
        cellFormula: true
      });
      const targetSheetName = 'OPs Data';
      const sheetName = workbook.SheetNames.includes(targetSheetName) ? targetSheetName : workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { 
        defval: null,
        raw: false 
      });
      
      if (jsonData.length > 0) {
        const firstRow = jsonData[0];
        const columns = Object.keys(firstRow);
        if (columns.length > 20) {
          columnUName = columns[20];
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not read column name from Excel, using default: ${columnUName}`);
    }
    
    console.log(`📋 Column Information:`);
    console.log(`  Column U (21st column, index 20): "${columnUName}"\n`);
    
    // Parse Excel file
    console.log(`📖 Parsing Excel file...\n`);
    const indents = parseExcelFile(excelPath);
    
    console.log(`✅ Parsed ${indents.length} indents from Excel\n`);
    
    // Check if totalKm is being parsed correctly
    const indentsWithKm = indents.filter(indent => indent.totalKm && indent.totalKm > 0);
    const totalKmFromExcel = indents.reduce((sum, indent) => sum + (Number(indent.totalKm) || 0), 0);
    console.log(`📊 Excel Parsing Check (Column U - 21st column, index 20 - "${columnUName}"):`);
    console.log(`  Indents with totalKm > 0: ${indentsWithKm.length}`);
    console.log(`  Total Km from Excel (Column U - "${columnUName}"): ${totalKmFromExcel.toLocaleString('en-IN')} km\n`);
    
    if (indentsWithKm.length === 0) {
      console.error(`❌ WARNING: No totalKm values found in parsed Excel data!`);
      console.error(`   This means the Excel parser is not reading Column U (21st column, index 20 - "${columnUName}") correctly.`);
      console.error(`   Please check the Excel file column structure.\n`);
    }
    
    // Create a map using indent + indentDate for more accurate matching
    // Use case-insensitive indent matching and normalize dates
    // Key format: "indent|indentDate" (lowercase indent)
    const indentKmMap = new Map<string, number>();
    indents.forEach(indent => {
      if (indent.indent && indent.indentDate) {
        const normalizedIndent = String(indent.indent).trim().toLowerCase();
        const dateStr = indent.indentDate instanceof Date 
          ? indent.indentDate.toISOString().split('T')[0]
          : new Date(indent.indentDate).toISOString().split('T')[0];
        const key = `${normalizedIndent}|${dateStr}`;
        const kmValue = indent.totalKm;
        // Include all numeric values (0 is valid)
        if (kmValue !== undefined && kmValue !== null && !isNaN(Number(kmValue))) {
          // Store the value, but if key already exists, keep the higher value (or sum if needed)
          const existingValue = indentKmMap.get(key) || 0;
          indentKmMap.set(key, Number(kmValue));
        }
      }
    });
    
    console.log(`📊 Created map with ${indentKmMap.size} unique rows and totalKm values (from Column U - 21st column, index 20 - "${columnUName}")\n`);
    
    // Get all records from database
    const dbRecords = await Trip.find({}).lean();
    console.log(`📊 Found ${dbRecords.length} records in database\n`);
    
    // Update records
    let updatedCount = 0;
    let notFoundCount = 0;
    let totalKmUpdated = 0;
    
    console.log(`🔄 Updating records...\n`);
    
    // Also create a map with original case for better matching
    const indentKmMapOriginalCase = new Map<string, number>();
    indents.forEach(indent => {
      if (indent.indent && indent.indentDate) {
        const originalIndent = String(indent.indent).trim();
        const dateStr = indent.indentDate instanceof Date 
          ? indent.indentDate.toISOString().split('T')[0]
          : new Date(indent.indentDate).toISOString().split('T')[0];
        const key = `${originalIndent}|${dateStr}`;
        const kmValue = indent.totalKm;
        if (kmValue !== undefined && kmValue !== null && !isNaN(Number(kmValue))) {
          indentKmMapOriginalCase.set(key, Number(kmValue));
        }
      }
    });
    
    for (const record of dbRecords) {
      const indent = record.indent;
      const indentDate = record.indentDate;
      
      if (indent && indentDate) {
        const normalizedIndent = String(indent).trim().toLowerCase();
        const dateStr = new Date(indentDate).toISOString().split('T')[0];
        
        // Try normalized key first (lowercase)
        let key = `${normalizedIndent}|${dateStr}`;
        let totalKm = indentKmMap.get(key);
        
        // If not found, try original case
        if (totalKm === undefined) {
          const originalKey = `${String(indent).trim()}|${dateStr}`;
          totalKm = indentKmMapOriginalCase.get(originalKey);
        }
        
        if (totalKm !== undefined) {
          await Trip.updateOne(
            { _id: record._id },
            { $set: { totalKm: totalKm } }
          );
          updatedCount++;
          totalKmUpdated += totalKm;
          
          if (updatedCount <= 5) {
            console.log(`  ✅ Updated: ${indent} (${dateStr}) -> totalKm (Column U - "${columnUName}"): ${totalKm}`);
          }
        } else {
          notFoundCount++;
          if (notFoundCount <= 10) {
            console.log(`  ⚠️  Not found in Excel: ${indent} (${dateStr})`);
          }
        }
      } else {
        notFoundCount++;
      }
    }
    
    console.log(`\n📊 Update Summary (Column U - 21st column, index 20 - "${columnUName}"):`);
    console.log(`  Records updated: ${updatedCount}`);
    console.log(`  Records not found in Excel: ${notFoundCount}`);
    console.log(`  Total Km updated (from Column U - "${columnUName}"): ${totalKmUpdated.toLocaleString('en-IN')} km\n`);
    
    // Verify update
    const verifyCount = await Trip.countDocuments({ totalKm: { $exists: true, $ne: 0 } });
    const verifyTotal = await Trip.aggregate([
      { $group: { _id: null, total: { $sum: { $ifNull: ['$totalKm', 0] } } } }
    ]);
    const verifyTotalKm = verifyTotal.length > 0 ? verifyTotal[0].total : 0;
    
    console.log(`✅ Verification (Column U - 21st column, index 20 - "${columnUName}"):`);
    console.log(`  Records with totalKm > 0: ${verifyCount}`);
    console.log(`  Total Km in database (from Column U - "${columnUName}"): ${verifyTotalKm.toLocaleString('en-IN')} km\n`);
    
    // Sample records
    const sampleRecords = await Trip.find({ totalKm: { $gt: 0 } }).limit(5).lean();
    console.log(`📝 Sample updated records (Column U - 21st column, index 20 - "${columnUName}"):`);
    sampleRecords.forEach((record: any, idx: number) => {
      console.log(`  ${idx + 1}. ${record.indent}: totalKm (Column U - "${columnUName}") = ${record.totalKm}`);
    });
    console.log(``);
    
    if (verifyTotalKm > 0) {
      console.log(`✅ SUCCESS: Total Km (Column U - 21st column, index 20 - "${columnUName}") has been updated in the database!`);
    } else {
      console.log(`❌ WARNING: Total Km (Column U - "${columnUName}") is still 0. Check if indent matching is working.`);
    }
    
    console.log(`\n🔄 ============================================\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updateTotalKmInDB();

