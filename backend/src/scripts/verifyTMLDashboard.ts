import mongoose from 'mongoose';
import Trip from '../models/Trip';
import { connectDatabase } from '../config/database';
import { calculateCardValues } from '../utils/cardCalculations';
import { calculateRangeWiseSummary } from '../utils/rangeWiseCalculations';
import { format } from 'date-fns';

const verifyTMLDashboard = async () => {
  try {
    console.log('========================================');
    console.log('TML DEF DASHBOARD - COMPLETE VERIFICATION');
    console.log('========================================\n');

    await connectDatabase();
    console.log('✓ Database connected\n');

    // 1. CHECK DATABASE STATE
    console.log('========================================');
    console.log('1. DATABASE STATE CHECK');
    console.log('========================================\n');
    
    const totalTrips = await Trip.countDocuments({});
    console.log(`Total trips in database: ${totalTrips}`);
    
    if (totalTrips === 0) {
      console.log('⚠️  WARNING: Database is EMPTY!');
      await mongoose.disconnect();
      return;
    }

    // Check data sorting
    const tripsSorted = await Trip.find({}).sort({ indentDate: 1 }).limit(5).lean();
    console.log('\nData sorting check (first 5 trips by indentDate):');
    tripsSorted.forEach((trip, idx) => {
      const date = trip.indentDate instanceof Date ? format(trip.indentDate, 'yyyy-MM-dd') : String(trip.indentDate);
      console.log(`  ${idx + 1}. ${trip.indent} - ${date}`);
    });

    // 2. CHECK CARD CALCULATIONS (SummaryCards)
    console.log('\n========================================');
    console.log('2. SUMMARY CARDS CALCULATIONS');
    console.log('========================================\n');
    
    const allTrips = await Trip.find({}).sort({ indentDate: 1 }).lean();
    const cardResults = calculateCardValues(allTrips, null, null);
    
    console.log('Card Values (no date filter):');
    console.log(`  Card 1 (Total Indents): ${cardResults.totalIndents}`);
    console.log(`  Card 2 (Total Trips): ${cardResults.totalTrips}`);
    console.log(`  Card 3 (Total Load): ${cardResults.totalLoad} kg = ${(cardResults.totalLoad / 1000).toFixed(2)} tons`);
    console.log(`  Card 4 (Buckets): ${cardResults.totalBuckets}`);
    console.log(`  Card 4 (Barrels): ${cardResults.totalBarrels}`);
    console.log(`  Card 5 (Avg Buckets/Trip): ${cardResults.avgBucketsPerTrip}`);

    // 3. CHECK RANGE-WISE CALCULATIONS (RangeWiseTable)
    console.log('\n========================================');
    console.log('3. RANGE-WISE CALCULATIONS');
    console.log('========================================\n');
    
    const rangeWiseResults = await calculateRangeWiseSummary(null, null);
    
    console.log('Range-Wise Summary (no date filter):');
    console.log(`  Total Unique Indents: ${rangeWiseResults.totalUniqueIndents}`);
    console.log(`  Total Load: ${rangeWiseResults.totalLoad} kg`);
    console.log(`  Total Buckets: ${rangeWiseResults.totalBuckets}`);
    console.log(`  Total Barrels: ${rangeWiseResults.totalBarrels}`);
    console.log(`  Total Cost: ₹${rangeWiseResults.totalCost.toLocaleString('en-IN')}`);
    console.log(`  Total Profit/Loss: ₹${rangeWiseResults.totalProfitLoss.toLocaleString('en-IN')}`);
    console.log(`  Total Rows: ${rangeWiseResults.totalRows}`);
    
    console.log('\nRange Data:');
    rangeWiseResults.rangeData.forEach(range => {
      console.log(`  ${range.range}:`);
      console.log(`    Indent Count: ${range.indentCount}`);
      console.log(`    Total Load: ${range.totalLoad} kg`);
      console.log(`    Buckets: ${range.bucketCount}, Barrels: ${range.barrelCount}`);
      console.log(`    Total Cost: ₹${(range.totalCostAE || 0).toLocaleString('en-IN')}`);
    });

    // 4. VERIFY DATA CONSISTENCY
    console.log('\n========================================');
    console.log('4. DATA CONSISTENCY CHECK');
    console.log('========================================\n');
    
    // Check if Card 2 matches Range-Wise totalUniqueIndents
    if (cardResults.totalTrips === rangeWiseResults.totalUniqueIndents) {
      console.log(`✓ Card 2 (${cardResults.totalTrips}) matches Range-Wise totalUniqueIndents (${rangeWiseResults.totalUniqueIndents})`);
    } else {
      console.log(`✗ MISMATCH: Card 2 (${cardResults.totalTrips}) != Range-Wise totalUniqueIndents (${rangeWiseResults.totalUniqueIndents})`);
    }

    // Check if Card 3 matches Range-Wise totalLoad
    if (cardResults.totalLoad === rangeWiseResults.totalLoad) {
      console.log(`✓ Card 3 Total Load (${cardResults.totalLoad} kg) matches Range-Wise totalLoad (${rangeWiseResults.totalLoad} kg)`);
    } else {
      console.log(`✗ MISMATCH: Card 3 Total Load (${cardResults.totalLoad} kg) != Range-Wise totalLoad (${rangeWiseResults.totalLoad} kg)`);
    }

    // Check if Card 4 Buckets match
    if (cardResults.totalBuckets === rangeWiseResults.totalBuckets) {
      console.log(`✓ Card 4 Buckets (${cardResults.totalBuckets}) matches Range-Wise totalBuckets (${rangeWiseResults.totalBuckets})`);
    } else {
      console.log(`✗ MISMATCH: Card 4 Buckets (${cardResults.totalBuckets}) != Range-Wise totalBuckets (${rangeWiseResults.totalBuckets})`);
    }

    // Check if Card 4 Barrels match
    if (cardResults.totalBarrels === rangeWiseResults.totalBarrels) {
      console.log(`✓ Card 4 Barrels (${cardResults.totalBarrels}) matches Range-Wise totalBarrels (${rangeWiseResults.totalBarrels})`);
    } else {
      console.log(`✗ MISMATCH: Card 4 Barrels (${cardResults.totalBarrels}) != Range-Wise totalBarrels (${rangeWiseResults.totalBarrels})`);
    }

    // 5. CHECK DATA SORTING IN QUERIES
    console.log('\n========================================');
    console.log('5. DATA SORTING VERIFICATION');
    console.log('========================================\n');
    
    // Check if queries are sorted
    const unsortedSample = await Trip.find({}).limit(5).lean();
    const sortedSample = await Trip.find({}).sort({ indentDate: 1 }).limit(5).lean();
    
    console.log('First 5 trips (unsorted):');
    unsortedSample.forEach((trip, idx) => {
      const date = trip.indentDate instanceof Date ? format(trip.indentDate, 'yyyy-MM-dd') : String(trip.indentDate);
      console.log(`  ${idx + 1}. ${trip.indent} - ${date}`);
    });
    
    console.log('\nFirst 5 trips (sorted by indentDate):');
    sortedSample.forEach((trip, idx) => {
      const date = trip.indentDate instanceof Date ? format(trip.indentDate, 'yyyy-MM-dd') : String(trip.indentDate);
      console.log(`  ${idx + 1}. ${trip.indent} - ${date}`);
    });

    // 6. CHECK CRITICAL FIELDS
    console.log('\n========================================');
    console.log('6. CRITICAL FIELDS CHECK');
    console.log('========================================\n');
    
    const tripsWithLoad = await Trip.countDocuments({ totalLoad: { $gt: 0 } });
    const tripsWithBuckets = await Trip.countDocuments({ noOfBuckets: { $gt: 0 } });
    const tripsWithIndentDate = await Trip.countDocuments({ indentDate: { $exists: true, $ne: null } });
    const tripsWithRange = await Trip.countDocuments({ range: { $exists: true, $ne: '' } });
    
    console.log(`Trips with totalLoad > 0: ${tripsWithLoad}/${totalTrips}`);
    console.log(`Trips with noOfBuckets > 0: ${tripsWithBuckets}/${totalTrips}`);
    console.log(`Trips with indentDate: ${tripsWithIndentDate}/${totalTrips}`);
    console.log(`Trips with range: ${tripsWithRange}/${totalTrips}`);

    // 7. CHECK DATE RANGES
    console.log('\n========================================');
    console.log('7. DATE RANGE CHECK');
    console.log('========================================\n');
    
    const dateStats = await Trip.aggregate([
      {
        $group: {
          _id: null,
          minDate: { $min: '$indentDate' },
          maxDate: { $max: '$indentDate' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    if (dateStats[0]) {
      const minDate = dateStats[0].minDate instanceof Date ? format(dateStats[0].minDate, 'yyyy-MM-dd') : String(dateStats[0].minDate);
      const maxDate = dateStats[0].maxDate instanceof Date ? format(dateStats[0].maxDate, 'yyyy-MM-dd') : String(dateStats[0].maxDate);
      console.log(`Date range: ${minDate} to ${maxDate}`);
      console.log(`Total trips: ${dateStats[0].count}`);
    }

    console.log('\n========================================');
    console.log('VERIFICATION COMPLETE');
    console.log('========================================\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('ERROR:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

verifyTMLDashboard();

