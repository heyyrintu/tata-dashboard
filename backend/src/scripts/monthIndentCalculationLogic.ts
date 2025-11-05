import mongoose from 'mongoose';
import Trip from '../models/Trip';
import { format } from 'date-fns';
import { calculateTripsByVehicleDay } from '../utils/tripCount';

/**
 * Script to demonstrate month-based indent calculation logic
 * Shows exactly how Card 1 (Indent Count) and Card 2 (Trip Count) are calculated per month
 * 
 * Usage: npx ts-node src/scripts/monthIndentCalculationLogic.ts
 */

const demonstrateMonthIndentLogic = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tata-def';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    console.log('');
    console.log('='.repeat(80));
    console.log('MONTH-BASED INDENT CALCULATION LOGIC');
    console.log('='.repeat(80));
    console.log('');

    // Step 1: Query all trips from database
    console.log('STEP 1: Query all trips from database');
    console.log('--------------------------------------');
    const allIndents = await Trip.find({});
    console.log(`Total indents in database: ${allIndents.length}`);
    console.log('');

    // Step 2: Filter to only include indents with Range value (canceled indents don't have range)
    console.log('STEP 2: Filter valid indents (must have Range value)');
    console.log('-----------------------------------------------------');
    const validIndents = allIndents.filter(indent => indent.range && indent.range.trim() !== '');
    console.log(`Valid indents (with range): ${validIndents.length}`);
    console.log(`Removed (no range/canceled): ${allIndents.length - validIndents.length}`);
    console.log('');

    // Step 3: Find all unique months
    console.log('STEP 3: Identify all unique months in the data');
    console.log('----------------------------------------------');
    const monthKeys = new Set<string>();
    validIndents.forEach(indent => {
      if (indent.indentDate && indent.indentDate instanceof Date && !isNaN(indent.indentDate.getTime())) {
        const monthKey = format(indent.indentDate, 'yyyy-MM');
        monthKeys.add(monthKey);
      }
    });
    const sortedMonthKeys = Array.from(monthKeys).sort();
    console.log(`Found ${sortedMonthKeys.length} unique months:`);
    sortedMonthKeys.forEach(key => console.log(`  - ${key}`));
    console.log('');

    // Step 4: Calculate for each month
    console.log('STEP 4: Calculate indent count and trip count for each month');
    console.log('============================================================');
    console.log('');

    sortedMonthKeys.forEach(monthKey => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`MONTH: ${monthKey}`);
      console.log('='.repeat(80));

      // 4a: Define month date range
      const monthStart = new Date(monthKey + '-01');
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      console.log(`\n4a. Date Range:`);
      console.log(`   Start: ${monthStart.toISOString()}`);
      console.log(`   End:   ${monthEnd.toISOString()}`);

      // 4b: Filter validIndents to this month's date range
      console.log(`\n4b. Filtering indents for this month:`);
      const monthIndents = validIndents.filter(indent => {
        if (!indent.indentDate || !(indent.indentDate instanceof Date) || isNaN(indent.indentDate.getTime())) {
          return false;
        }
        return indent.indentDate >= monthStart && indent.indentDate <= monthEnd;
      });
      console.log(`   Total indents in this month: ${monthIndents.length}`);

      // 4c: Calculate Indent Count (Card 1 logic)
      console.log(`\n4c. Calculate INDENT COUNT (Card 1 logic):`);
      console.log(`   - Filter to only indents with valid indent value`);
      const indentsWithValue = monthIndents.filter(t => t.indent);
      console.log(`   - Indents with valid indent value: ${indentsWithValue.length}`);
      console.log(`   - Extract unique indent values:`);
      const uniqueIndents = new Set(indentsWithValue.map(t => t.indent));
      console.log(`   - Unique indent values: ${uniqueIndents.size}`);
      
      // Show sample unique indents
      const sampleIndents = Array.from(uniqueIndents).slice(0, 5);
      console.log(`   - Sample unique indents (first 5):`);
      sampleIndents.forEach(indent => console.log(`     * ${indent}`));
      const indentCount = uniqueIndents.size;
      console.log(`\n   ✅ INDENT COUNT = ${indentCount}`);

      // 4d: Calculate Trip Count (Card 2 logic)
      console.log(`\n4d. Calculate TRIP COUNT (Card 2 logic):`);
      console.log(`   - Map month indents to trip documents (indentDate, vehicleNumber, remarks)`);
      const tripDocuments = monthIndents.map(indent => ({
        indentDate: indent.indentDate,
        vehicleNumber: indent.vehicleNumber,
        remarks: indent.remarks
      }));
      console.log(`   - Total trip documents: ${tripDocuments.length}`);
      console.log(`   - Apply vehicle-day trip counting logic:`);
      console.log(`     * Group by vehicle number + date`);
      console.log(`     * Count 2 trips if "2ND TRIP" in remarks, otherwise 1 trip`);
      console.log(`     * Filter by month date range`);
      const { totalTrips } = calculateTripsByVehicleDay(tripDocuments, monthStart, monthEnd);
      console.log(`\n   ✅ TRIP COUNT = ${totalTrips}`);

      // 4e: Summary
      console.log(`\n4e. Summary for ${monthKey}:`);
      console.log(`   - Indent Count: ${indentCount}`);
      console.log(`   - Trip Count:  ${totalTrips}`);
      console.log(`   - Total Rows:  ${monthIndents.length}`);
    });

    console.log(`\n${'='.repeat(80)}`);
    console.log('COMPLETE CALCULATION SUMMARY');
    console.log('='.repeat(80));
    console.log('');
    console.log('This logic matches exactly what getAnalytics does when filtered to a specific month.');
    console.log('The month-on-month graphs use this same logic for each month.');
    console.log('');

    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

demonstrateMonthIndentLogic();

