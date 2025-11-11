import { connectDatabase } from '../config/database';
import Trip from '../models/Trip';
import { parseExcelFile } from '../utils/excelParser';
import * as path from 'path';
import * as fs from 'fs';
import * as XLSX from 'xlsx';

/**
 * Script to check why totalKm is 0 in database but September script shows correct values
 */
const checkDBvsExcel = async () => {
  try {
    await connectDatabase();
    
    console.log(`\n🔍 ===== CHECKING DATABASE vs EXCEL =====\n`);
    
    // 1. Check database
    console.log(`📊 DATABASE CHECK:`);
    const totalIndents = await Trip.countDocuments({});
    const indentsWithKm = await Trip.countDocuments({ totalKm: { $exists: true, $ne: 0 } });
    const indentsWithKmZero = await Trip.countDocuments({ totalKm: 0 });
    const indentsWithoutKm = await Trip.countDocuments({ totalKm: { $exists: false } });
    
    console.log(`  Total indents: ${totalIndents}`);
    console.log(`  With totalKm > 0: ${indentsWithKm}`);
    console.log(`  With totalKm = 0: ${indentsWithKmZero}`);
    console.log(`  Without totalKm field: ${indentsWithoutKm}`);
    
    const allIndents = await Trip.find({}).lean();
    const totalKmInDB = allIndents.reduce((sum, indent) => sum + (Number((indent as any).totalKm) || 0), 0);
    console.log(`  Total Km in database: ${totalKmInDB.toLocaleString('en-IN')} km\n`);
    
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
      process.exit(1);
    }
    
    console.log(`📊 EXCEL FILE CHECK:`);
    console.log(`  File: ${excelPath}\n`);
    
    // Read Excel directly to get column name
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
    
    if (jsonData.length === 0) {
      console.error(`❌ No data in Excel file!`);
      process.exit(1);
    }
    
    const firstRow = jsonData[0];
    const columns = Object.keys(firstRow);
    const columnUName = columns.length > 20 ? columns[20] : 'NOT FOUND';
    
    console.log(`  Total columns: ${columns.length}`);
    console.log(`  Column U (index 20): "${columnUName}"`);
    console.log(`  First 25 column names:`);
    columns.slice(0, 25).forEach((col, idx) => {
      const marker = idx === 20 ? ' ← Column U' : '';
      console.log(`    [${idx}] ${col}${marker}`);
    });
    console.log(``);
    
    // 3. Parse using excelParser
    console.log(`📊 EXCEL PARSER CHECK:`);
    const parsedIndents = parseExcelFile(excelPath);
    const parsedWithKm = parsedIndents.filter(indent => indent.totalKm && indent.totalKm > 0);
    const totalKmParsed = parsedIndents.reduce((sum, indent) => sum + (Number(indent.totalKm) || 0), 0);
    
    console.log(`  Total parsed indents: ${parsedIndents.length}`);
    console.log(`  With totalKm > 0: ${parsedWithKm.length}`);
    console.log(`  Total Km from parser: ${totalKmParsed.toLocaleString('en-IN')} km\n`);
    
    // 4. Compare direct Excel reading vs parser
    console.log(`📊 DIRECT EXCEL READING (like September script):`);
    let directTotalKm = 0;
    let directRowsWithKm = 0;
    const sampleDirectValues: Array<{ indent: string; value: number }> = [];
    
    jsonData.forEach((row: any, idx: number) => {
      const columnUValue = row[columnUName];
      const numericValue = parseNumericValue(columnUValue);
      if (numericValue > 0) {
        directTotalKm += numericValue;
        directRowsWithKm++;
        if (sampleDirectValues.length < 10) {
          sampleDirectValues.push({
            indent: row['Indent'] || row['INDENT'] || `Row ${idx + 1}`,
            value: numericValue
          });
        }
      }
    });
    
    console.log(`  Total rows in Excel: ${jsonData.length}`);
    console.log(`  Rows with Column U > 0: ${directRowsWithKm}`);
    console.log(`  Total Km (direct reading): ${directTotalKm.toLocaleString('en-IN')} km`);
    if (sampleDirectValues.length > 0) {
      console.log(`  Sample values (first 10):`);
      sampleDirectValues.forEach((item, idx) => {
        console.log(`    ${idx + 1}. ${item.indent}: ${item.value.toLocaleString('en-IN')}`);
      });
    }
    console.log(``);
    
    // 5. Compare parser method
    console.log(`📊 PARSER METHOD COMPARISON:`);
    console.log(`  Parser uses: rowKeys[20] (index-based)`);
    console.log(`  Direct uses: row[columnUName] (name-based)`);
    console.log(`  Column name: "${columnUName}"`);
    
    // Check if parser is using the right column
    const sampleParsed = parsedIndents.slice(0, 10);
    const sampleDirect = jsonData.slice(0, 10);
    
    console.log(`\n  Comparing first 10 rows:`);
    for (let i = 0; i < Math.min(10, sampleParsed.length, sampleDirect.length); i++) {
      const parsed = sampleParsed[i];
      const direct = sampleDirect[i];
      const directValue = parseNumericValue(direct[columnUName]);
      const indent = parsed.indent || direct['Indent'] || direct['INDENT'] || `Row ${i + 1}`;
      
      console.log(`    Row ${i + 1} (${indent}):`);
      console.log(`      Parser totalKm: ${parsed.totalKm ?? 'undefined'}`);
      console.log(`      Direct Column U: ${directValue}`);
      console.log(`      Match: ${parsed.totalKm === directValue ? '✅' : '❌'}`);
    }
    console.log(``);
    
    // 6. Summary
    console.log(`📊 SUMMARY:`);
    console.log(`  Database totalKm: ${totalKmInDB.toLocaleString('en-IN')} km`);
    console.log(`  Parser totalKm: ${totalKmParsed.toLocaleString('en-IN')} km`);
    console.log(`  Direct Excel totalKm: ${directTotalKm.toLocaleString('en-IN')} km`);
    
    if (totalKmInDB === 0 && totalKmParsed > 0) {
      console.log(`\n⚠️  ISSUE: Database has 0 but parser shows ${totalKmParsed.toLocaleString('en-IN')} km`);
      console.log(`   Solution: Run 'npm run update-total-km' to update database`);
    } else if (totalKmInDB === 0 && totalKmParsed === 0 && directTotalKm > 0) {
      console.log(`\n⚠️  ISSUE: Parser is not reading Column U correctly!`);
      console.log(`   Parser shows 0 but direct reading shows ${directTotalKm.toLocaleString('en-IN')} km`);
      console.log(`   The parser might be using the wrong column index.`);
    } else if (totalKmInDB > 0) {
      console.log(`\n✅ Database has totalKm data`);
    }
    
    console.log(`\n🔍 ============================================\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

function parseNumericValue(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  if (value === '-' || value === 'N/A' || value === 'NA') return 0;
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '').trim()) : Number(value);
  return isNaN(num) ? 0 : num;
}

checkDBvsExcel();

