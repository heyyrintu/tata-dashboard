import mongoose from 'mongoose';
import Trip from '../models/Trip';
import { format, parse } from 'date-fns';

// Copy of normalizeFreightTigerMonth function
const normalizeFreightTigerMonth = (monthValue: string): string | null => {
  if (!monthValue || typeof monthValue !== 'string') return null;
  const trimmed = monthValue.trim();
  if (trimmed === '') return null;

  try {
    const parsed = parse(trimmed, "MMM''yy", new Date());
    if (!isNaN(parsed.getTime())) {
      return format(parsed, 'yyyy-MM');
    }
  } catch (e) {}

  try {
    const parsed = parse(trimmed, 'MMMM yyyy', new Date());
    if (!isNaN(parsed.getTime())) {
      return format(parsed, 'yyyy-MM');
    }
  } catch (e) {}

  const mmYYYYPattern = /^(\d{1,2})[-\/](\d{4})$/;
  const mmMatch = trimmed.match(mmYYYYPattern);
  if (mmMatch) {
    const month = parseInt(mmMatch[1], 10);
    const year = parseInt(mmMatch[2], 10);
    if (month >= 1 && month <= 12) {
      return `${year}-${String(month).padStart(2, '0')}`;
    }
  }

  const yyyyMMPattern = /^(\d{4})-(\d{2})$/;
  const yyyyMMMatch = trimmed.match(yyyyMMPattern);
  if (yyyyMMMatch) {
    const year = parseInt(yyyyMMMatch[1], 10);
    const month = parseInt(yyyyMMMatch[2], 10);
    if (month >= 1 && month <= 12) {
      return `${year}-${String(month).padStart(2, '0')}`;
    }
  }
  return null;
};

const checkOctoberData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tata-dashboard';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const trips = await Trip.find({});
    console.log(`\nTotal trips in database: ${trips.length}`);

    // Check valid indents (with range)
    const validIndents = trips.filter(t => t.range && t.range.trim() !== '');
    console.log(`Valid indents (with range): ${validIndents.length}`);

    // Check October data
    console.log('\n=== CHECKING OCTOBER DATA ===');
    
    // Check by Freight Tiger Month
    const octByFreightTiger = validIndents.filter(t => {
      if (t.freightTigerMonth && typeof t.freightTigerMonth === 'string') {
        const normalized = normalizeFreightTigerMonth(t.freightTigerMonth.trim());
        return normalized === '2025-10';
      }
      return false;
    });
    console.log(`\nOctober indents by Freight Tiger Month (normalized to 2025-10): ${octByFreightTiger.length}`);
    
    if (octByFreightTiger.length > 0) {
      console.log('Sample Freight Tiger Month values:');
      octByFreightTiger.slice(0, 5).forEach(t => {
        console.log(`  - "${t.freightTigerMonth}" (normalized: ${normalizeFreightTigerMonth(t.freightTigerMonth.trim())})`);
      });
    }

    // Check all Freight Tiger Month values that might be October
    const allFreightTigerMonths = validIndents
      .filter(t => t.freightTigerMonth)
      .map(t => t.freightTigerMonth.toString().trim())
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .sort();
    
    console.log(`\nAll unique Freight Tiger Month values (${allFreightTigerMonths.length} total):`);
    allFreightTigerMonths.forEach(m => {
      const normalized = normalizeFreightTigerMonth(m);
      console.log(`  - "${m}" -> ${normalized || 'NULL'}`);
    });

    // Check October-related values
    const octRelated = allFreightTigerMonths.filter(m => 
      m.toLowerCase().includes('oct') || 
      m.includes('10') ||
      m.includes('October')
    );
    console.log(`\nOctober-related Freight Tiger Month values: ${octRelated.length}`);
    octRelated.forEach(m => {
      const normalized = normalizeFreightTigerMonth(m);
      console.log(`  - "${m}" -> ${normalized || 'NULL'}`);
    });

    // Check by indentDate
    const octByIndentDate = validIndents.filter(t => {
      if (t.indentDate && t.indentDate instanceof Date && !isNaN(t.indentDate.getTime())) {
        const month = format(t.indentDate, 'yyyy-MM');
        return month === '2025-10';
      }
      return false;
    });
    console.log(`\nOctober indents by indentDate (2025-10): ${octByIndentDate.length}`);
    
    if (octByIndentDate.length > 0) {
      console.log('Sample indentDate values:');
      octByIndentDate.slice(0, 5).forEach(t => {
        console.log(`  - ${t.indentDate?.toISOString().split('T')[0]}`);
      });
    }

    // Check if October was manually added
    const monthKeys = new Set<string>();
    validIndents.forEach(indent => {
      if (indent.freightTigerMonth && typeof indent.freightTigerMonth === 'string' && indent.freightTigerMonth.trim() !== '') {
        const normalizedMonth = normalizeFreightTigerMonth(indent.freightTigerMonth.trim());
        if (normalizedMonth) {
          monthKeys.add(normalizedMonth);
        }
      } else if (indent.indentDate && indent.indentDate instanceof Date && !isNaN(indent.indentDate.getTime())) {
        monthKeys.add(format(indent.indentDate, 'yyyy-MM'));
      }
    });
    
    console.log(`\nMonths found in data: ${Array.from(monthKeys).sort().join(', ')}`);
    console.log(`October (2025-10) in monthKeys: ${monthKeys.has('2025-10')}`);

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkOctoberData();

