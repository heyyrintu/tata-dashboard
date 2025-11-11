import mongoose from 'mongoose';
import Trip from '../models/Trip';
import { connectDatabase } from '../config/database';
import { format } from 'date-fns';
import { normalizeFreightTigerMonth } from '../utils/freightTigerMonth';

const testMonthOnMonth = async () => {
  try {
    console.log('========================================');
    console.log('TESTING MONTH ON MONTH DATA');
    console.log('========================================\n');

    await connectDatabase();
    console.log('✓ Database connected\n');

    const allIndents = await Trip.find({}).sort({ indentDate: 1 }).lean();
    console.log(`Total indents: ${allIndents.length}\n`);

    if (allIndents.length === 0) {
      console.log('⚠️  Database is empty!');
      await mongoose.disconnect();
      return;
    }

    // Check freightTigerMonth field
    const withFreightTigerMonth = allIndents.filter(i => i.freightTigerMonth && String(i.freightTigerMonth).trim() !== '');
    const withIndentDate = allIndents.filter(i => i.indentDate && i.indentDate instanceof Date && !isNaN(i.indentDate.getTime()));
    
    console.log('MONTH FIELD STATISTICS:');
    console.log(`  Indents with freightTigerMonth: ${withFreightTigerMonth.length}`);
    console.log(`  Indents with indentDate: ${withIndentDate.length}\n`);

    // Sample freightTigerMonth values
    if (withFreightTigerMonth.length > 0) {
      console.log('SAMPLE freightTigerMonth VALUES:');
      const uniqueMonths = new Set(withFreightTigerMonth.slice(0, 10).map(i => String(i.freightTigerMonth)));
      Array.from(uniqueMonths).forEach(month => {
        const normalized = normalizeFreightTigerMonth(month);
        console.log(`  "${month}" -> ${normalized || 'FAILED TO NORMALIZE'}`);
      });
      console.log();
    }

    // Sample indentDate values
    if (withIndentDate.length > 0) {
      console.log('SAMPLE indentDate VALUES:');
      const sampleDates = withIndentDate.slice(0, 5).map(i => ({
        indent: i.indent,
        indentDate: i.indentDate instanceof Date ? format(i.indentDate, 'yyyy-MM-dd') : String(i.indentDate),
        monthKey: i.indentDate instanceof Date ? format(i.indentDate, 'yyyy-MM') : 'INVALID'
      }));
      sampleDates.forEach(s => {
        console.log(`  ${s.indent}: ${s.indentDate} -> ${s.monthKey}`);
      });
      console.log();
    }

    // Find unique months
    const monthKeys = new Set<string>();
    let freightTigerMonthCount = 0;
    let indentDateFallbackCount = 0;
    
    allIndents.forEach(indent => {
      if (indent.freightTigerMonth && typeof indent.freightTigerMonth === 'string' && indent.freightTigerMonth.trim() !== '') {
        const normalizedMonth = normalizeFreightTigerMonth(indent.freightTigerMonth.trim());
        if (normalizedMonth) {
          monthKeys.add(normalizedMonth);
          freightTigerMonthCount++;
        }
      } else if (indent.indentDate && indent.indentDate instanceof Date && !isNaN(indent.indentDate.getTime())) {
        monthKeys.add(format(indent.indentDate, 'yyyy-MM'));
        indentDateFallbackCount++;
      }
    });
    
    console.log('MONTH DETECTION RESULTS:');
    console.log(`  Using freightTigerMonth: ${freightTigerMonthCount} indents`);
    console.log(`  Using indentDate fallback: ${indentDateFallbackCount} indents`);
    console.log(`  Unique months found: ${monthKeys.size}`);
    console.log(`  Month keys: ${Array.from(monthKeys).sort().join(', ')}\n`);

    if (monthKeys.size === 0) {
      console.log('⚠️  WARNING: No months detected! This will cause null data.\n');
      console.log('CHECKING WHY:');
      
      // Check first 10 indents
      console.log('\nFirst 10 indents:');
      allIndents.slice(0, 10).forEach((indent, idx) => {
        console.log(`\n${idx + 1}. Indent: ${indent.indent}`);
        console.log(`   freightTigerMonth: "${indent.freightTigerMonth || 'NULL'}" (type: ${typeof indent.freightTigerMonth})`);
        console.log(`   indentDate: ${indent.indentDate instanceof Date ? indent.indentDate.toISOString() : String(indent.indentDate)} (type: ${typeof indent.indentDate})`);
        
        if (indent.freightTigerMonth) {
          const normalized = normalizeFreightTigerMonth(String(indent.freightTigerMonth));
          console.log(`   Normalized freightTigerMonth: ${normalized || 'FAILED'}`);
        }
        if (indent.indentDate instanceof Date) {
          console.log(`   Month key from indentDate: ${format(indent.indentDate, 'yyyy-MM')}`);
        }
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('ERROR:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

testMonthOnMonth();

