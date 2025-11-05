import * as XLSX from 'xlsx';

/**
 * Check raw cell values directly from worksheet
 */
const checkRawCell = () => {
  const filePath = 'C:\\Users\\RintuMondal\\OneDrive - DRONA LOGITECH PRIVATE LIMITED\\Pictures\\tata\\TATA DEF.xlsx';
  const workbook = XLSX.readFile(filePath, { type: 'file', cellDates: false });
  const sheetName = 'OPs Data';
  const worksheet = workbook.Sheets[sheetName];
  
  // Find header row
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  let indentDateCol = -1;
  let indentCol = -1;
  
  // Find column indices
  for (let col = 0; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    const cell = worksheet[cellAddress];
    if (cell) {
      const value = cell.v || '';
      if (value.toString().includes('Indent Date') || value.toString().includes('Indent  Date')) {
        indentDateCol = col;
      }
      if (value.toString().includes('Indent') && !value.toString().includes('Date')) {
        indentCol = col;
      }
    }
  }
  
  console.log(`Indent Date column: ${indentDateCol}`);
  console.log(`Indent column: ${indentCol}\n`);
  
  // Check rows with target indents
  const targetIndents = ['S/DRONA/10/25/07', 'S/DRONA/10/25/08', 'S/DRONA/10/25/09'];
  
  for (let row = 1; row <= range.e.r; row++) {
    const indentCell = worksheet[XLSX.utils.encode_cell({ r: row, c: indentCol })];
    const indent = indentCell?.v || '';
    
    if (targetIndents.includes(indent)) {
      const dateCell = worksheet[XLSX.utils.encode_cell({ r: row, c: indentDateCol })];
      console.log(`Row ${row + 1}:`);
      console.log(`  Indent: ${indent}`);
      console.log(`  Date cell raw value: ${dateCell?.v}`);
      console.log(`  Date cell type: ${dateCell?.t}`);
      console.log(`  Date cell formatted (w): ${dateCell?.w || 'N/A'}`);
      
      // Convert Excel serial to date - using Dec 31, 1899 epoch to match Excel's DD-MM-YYYY display
      if (dateCell && typeof dateCell.v === 'number') {
        const excelEpoch = new Date(1899, 11, 31); // Dec 31, 1899 (corrected epoch)
        const daysSinceEpoch = dateCell.v - 1;
        const date = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
        console.log(`  Converted (Dec 31, 1899 epoch): ${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`);
      }
      console.log('');
    }
  }
};

checkRawCell();

