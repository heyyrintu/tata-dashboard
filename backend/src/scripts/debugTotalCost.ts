import * as XLSX from 'xlsx';
import { connectDatabase } from '../config/database';
import Trip from '../models/Trip';

/**
 * Script to debug total cost mismatch between Excel and database
 */
const debugTotalCost = async () => {
  try {
    await connectDatabase();
    
    const filePath = 'C:\\Users\\RintuMondal\\OneDrive - DRONA LOGITECH PRIVATE LIMITED\\Pictures\\tata\\TATA DEF.xlsx';
    console.log(`📄 Reading Excel file: ${filePath}`);
    
    // Read Excel file
    const workbook = XLSX.readFile(filePath, { 
      type: 'file', 
      cellDates: false,
      cellFormula: true  // Read formulas to get calculated values
    });
    
    const sheetName = 'OPs Data';
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      console.error(`Sheet "${sheetName}" not found!`);
      process.exit(1);
    }
    
    // Convert to JSON to get column names
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      defval: null,
      raw: false 
    });
    
    console.log(`\n📊 Excel file has ${jsonData.length} rows`);
    
    // Check column names
    if (jsonData.length > 0) {
      console.log(`\n🔍 Column names (first row):`);
      const firstRow = jsonData[0] as any;
      const columns = Object.keys(firstRow);
      console.log(`  Total columns: ${columns.length}`);
      
      // Find Total Cost columns
      const totalCostColumns = columns.filter(col => 
        col.toLowerCase().includes('total cost') || 
        col.toLowerCase().includes('totalcost') ||
        col === 'Any Other Cost'
      );
      console.log(`\n💰 Total Cost related columns found:`);
      totalCostColumns.forEach(col => {
        const index = columns.indexOf(col);
        console.log(`  - "${col}" (index: ${index})`);
      });
      
      // Check column AE (index 30) directly
      console.log(`\n🔍 Checking column AE (index 30) directly from Excel:`);
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      let excelTotalCost = 0;
      let rowsWithCost = 0;
      let rowsWithZeroCost = 0;
      let rowsWithNullCost = 0;
      
      // Check first 20 rows for column AE
      for (let row = 1; row <= Math.min(20, range.e.r); row++) {
        const cell = XLSX.utils.encode_cell({ r: row, c: 30 }); // Column AE (index 30)
        const cellValue = worksheet[cell];
        if (cellValue) {
          const value = cellValue.v !== undefined ? cellValue.v : (cellValue.w || '');
          const numValue = parseFloat(value) || 0;
          excelTotalCost += numValue;
          if (numValue !== 0) rowsWithCost++;
          else rowsWithZeroCost++;
          if (row <= 5) {
            console.log(`  Row ${row + 1} (${cell}): ${value} (parsed: ${numValue})`);
          }
        } else {
          rowsWithNullCost++;
        }
      }
      
      console.log(`\n📊 Excel Column AE Summary (first 20 rows):`);
      console.log(`  Total Cost: ₹${excelTotalCost.toLocaleString('en-IN')}`);
      console.log(`  Rows with cost > 0: ${rowsWithCost}`);
      console.log(`  Rows with cost = 0: ${rowsWithZeroCost}`);
      console.log(`  Rows with null cost: ${rowsWithNullCost}`);
      
      // Calculate total from all rows using JSON data
      console.log(`\n📊 Calculating total from JSON data (all rows):`);
      let jsonTotalCost = 0;
      let jsonRowsWithCost = 0;
      
      jsonData.forEach((row: any, index: number) => {
        // Try different column names
        const costValue = row['Any Other Cost'] || 
                         row['Total Cost_1'] || 
                         row['Total Cost'] || 
                         0;
        const numValue = parseFloat(costValue) || 0;
        jsonTotalCost += numValue;
        if (numValue !== 0) jsonRowsWithCost++;
        if (index < 5) {
          console.log(`  Row ${index + 1}: ${costValue} (parsed: ${numValue})`);
        }
      });
      
      console.log(`  Total Cost from JSON: ₹${jsonTotalCost.toLocaleString('en-IN')}`);
      console.log(`  Rows with cost > 0: ${jsonRowsWithCost}`);
    }
    
    // Check database
    console.log(`\n📊 Database Summary:`);
    const totalIndents = await Trip.countDocuments({});
    console.log(`  Total indents in DB: ${totalIndents}`);
    
    const indentsWithCost = await Trip.countDocuments({ totalCost: { $exists: true, $ne: 0 } });
    const indentsWithZeroCost = await Trip.countDocuments({ totalCost: 0 });
    const indentsWithoutCost = await Trip.countDocuments({ totalCost: { $exists: false } });
    
    console.log(`  Indents with totalCost > 0: ${indentsWithCost}`);
    console.log(`  Indents with totalCost = 0: ${indentsWithZeroCost}`);
    console.log(`  Indents without totalCost field: ${indentsWithoutCost}`);
    
    // Calculate total from database
    const allIndents = await Trip.find({});
    const dbTotalCost = allIndents.reduce((sum, indent) => sum + ((indent as any).totalCost || 0), 0);
    console.log(`  Total Cost from DB: ₹${dbTotalCost.toLocaleString('en-IN')}`);
    
    // Check sample indents
    console.log(`\n📝 Sample indents (first 5):`);
    allIndents.slice(0, 5).forEach((indent, index) => {
      console.log(`  ${index + 1}. ${indent.indent}: totalCost=${(indent as any).totalCost ?? 'undefined'}`);
    });
    
    // Check if there's a mismatch
    console.log(`\n🔍 Comparison:`);
    if (jsonData.length > 0) {
      const firstRow = jsonData[0] as any;
      const excelTotal = jsonData.reduce((sum: number, row: any) => {
        const costValue = row['Any Other Cost'] || row['Total Cost_1'] || row['Total Cost'] || 0;
        return sum + (parseFloat(costValue) || 0);
      }, 0);
      
      console.log(`  Excel Total (from JSON): ₹${excelTotal.toLocaleString('en-IN')}`);
      console.log(`  Database Total: ₹${dbTotalCost.toLocaleString('en-IN')}`);
      console.log(`  Difference: ₹${Math.abs(excelTotal - dbTotalCost).toLocaleString('en-IN')}`);
      
      if (Math.abs(excelTotal - dbTotalCost) > 0.01) {
        console.log(`\n⚠️  WARNING: Mismatch detected!`);
        console.log(`   Please check the Excel parser logic for column AE.`);
      } else {
        console.log(`\n✅ Values match!`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

debugTotalCost();

