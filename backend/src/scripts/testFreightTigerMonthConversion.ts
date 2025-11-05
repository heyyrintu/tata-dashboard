/**
 * Test Freight Tiger Month conversion
 */

const convertFreightTigerMonth = (value: any): string => {
  if (!value && value !== 0) return '';
  
  // If it's already a string, try to use it as-is
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // If it's already a month format, return it
    if (trimmed.length > 0 && isNaN(Number(trimmed))) {
      return trimmed;
    }
    // If it's a number as string, convert it
    const numValue = parseFloat(trimmed);
    if (!isNaN(numValue)) {
      value = numValue;
    }
  }
  
  // If it's a number (Excel serial date), convert to date then to month format
  if (typeof value === 'number') {
    // Excel epoch: Dec 31, 1899
    const excelEpoch = new Date(1899, 11, 31);
    const daysSinceEpoch = value - 1;
    const date = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
    
    // Format as "MMM'yy" (e.g., "May'25")
    if (!isNaN(date.getTime())) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const year = String(date.getFullYear()).slice(-2);
      return `${month}'${year}`;
    }
  }
  
  return '';
};

// Test with sample Excel serial dates
console.log('Testing Freight Tiger Month conversion:');
console.log('');

const testValues = [
  45717, // Should be around March 2025
  45733, // Should be around March 2025
  45941, // Should be October 2025
];

testValues.forEach(val => {
  const result = convertFreightTigerMonth(val);
  console.log(`Excel serial ${val} -> "${result}"`);
});

