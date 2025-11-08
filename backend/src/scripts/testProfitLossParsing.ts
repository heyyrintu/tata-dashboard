import * as XLSX from 'xlsx';
import { parseExcelFile } from '../utils/excelParser';

/**
 * Script to test profit/loss parsing from Excel column AK
 */
const testProfitLossParsing = () => {
  try {
    const filePath = 'C:\\Users\\RintuMondal\\OneDrive - DRONA LOGITECH PRIVATE LIMITED\\Pictures\\tata\\TATA DEF.xlsx';
    console.log(`📄 Parsing Excel file: ${filePath}`);
    
    const parsedIndents = parseExcelFile(filePath);
    console.log(`\n📊 Parsed ${parsedIndents.length} indents`);
    
    // Check profit/loss values
    const indentsWithPL = parsedIndents.filter(indent => indent.profitLoss && indent.profitLoss !== 0);
    const totalPL = parsedIndents.reduce((sum, indent) => sum + (indent.profitLoss || 0), 0);
    
    console.log(`\n💰 Profit & Loss Analysis:`);
    console.log(`  Indents with profitLoss > 0: ${indentsWithPL.length}`);
    console.log(`  Indents with profitLoss < 0: ${parsedIndents.filter(i => (i.profitLoss || 0) < 0).length}`);
    console.log(`  Indents with profitLoss = 0: ${parsedIndents.filter(i => (i.profitLoss || 0) === 0).length}`);
    console.log(`  Total Profit & Loss: ₹${totalPL.toLocaleString('en-IN')}`);
    
    // Check first 10 indents
    console.log(`\n🔍 Checking first 10 indents for profitLoss:`);
    parsedIndents.slice(0, 10).forEach((indent, index) => {
      console.log(`  ${index + 1}. Indent: ${indent.indent}, Profit & Loss: ₹${indent.profitLoss || 0}`);
    });
    
    // Also check Excel directly
    console.log(`\n🔍 Checking Excel file directly for column AK:`);
    const workbook = XLSX.readFile(filePath, { 
      type: 'file', 
      cellDates: false,
      cellFormula: true
    });
    const worksheet = workbook.Sheets['OPs Data'];
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    if (range.e.c < 36) {
      range.e.c = 36;
      worksheet['!ref'] = XLSX.utils.encode_range(range);
    }
    
    let totalFromExcel = 0;
    let rowsWithValue = 0;
    for (let row = 1; row <= Math.min(10, range.e.r); row++) {
      const cell = XLSX.utils.encode_cell({ r: row, c: 36 });
      const cellValue = worksheet[cell];
      if (cellValue) {
        const value = cellValue.v !== undefined ? cellValue.v : (cellValue.w || '');
        const numValue = parseFloat(value) || 0;
        totalFromExcel += numValue;
        if (numValue !== 0) rowsWithValue++;
        console.log(`  Row ${row + 1} (${cell}): ${value} (parsed: ${numValue})`);
      }
    }
    
    console.log(`\n📊 Excel Direct Read (first 10 rows):`);
    console.log(`  Total P&L: ₹${totalFromExcel.toLocaleString('en-IN')}`);
    console.log(`  Rows with non-zero values: ${rowsWithValue}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testProfitLossParsing();

