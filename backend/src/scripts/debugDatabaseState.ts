import mongoose from 'mongoose';
import Trip from '../models/Trip';
import { connectDatabase } from '../config/database';

const debugDatabaseState = async () => {
  try {
    console.log('========================================');
    console.log('DATABASE STATE DEBUG - START');
    console.log('========================================\n');

    // Connect to database
    await connectDatabase();
    console.log('✓ Database connected\n');

    // Count total trips
    const totalTrips = await Trip.countDocuments({});
    console.log(`Total trips in database: ${totalTrips}\n`);

    if (totalTrips === 0) {
      console.log('⚠️  WARNING: Database is EMPTY!');
      console.log('   No trips found. This explains why all values are 0.');
      console.log('   Action needed: Upload Excel file to populate database.\n');
      await mongoose.disconnect();
      return;
    }

    // Get sample trips
    console.log('Sample trips (first 5):');
    const sampleTrips = await Trip.find({}).limit(5).lean();
    sampleTrips.forEach((trip, index) => {
      console.log(`\n${index + 1}. Trip:`);
      console.log(`   Indent: ${trip.indent || 'N/A'}`);
      console.log(`   Indent Date: ${trip.indentDate || 'N/A'}`);
      console.log(`   Vehicle Number: "${trip.vehicleNumber || 'N/A'}"`);
      console.log(`   Total Km: ${trip.totalKm || 0}`);
      console.log(`   Total Load: ${trip.totalLoad || 0}`);
      console.log(`   Range: ${trip.range || 'N/A'}`);
      console.log(`   Total Cost AE: ${trip.totalCostAE || 0}`);
    });

    // Check fixed vehicles
    console.log('\n========================================');
    console.log('FIXED VEHICLES CHECK');
    console.log('========================================\n');
    const fixedVehicles = ['HR38AC7854', 'HR38AC7243', 'HR38AC0599', 'HR38AC0263', 'HR38X6465'];
    
    for (const vehicle of fixedVehicles) {
      const trips = await Trip.find({
        vehicleNumber: { $regex: new RegExp(`^${vehicle}$`, 'i') }
      }).lean();
      
      const totalKm = trips.reduce((sum, t) => sum + (Number(t.totalKm) || 0), 0);
      const tripsWithKm = trips.filter(t => (Number(t.totalKm) || 0) > 0).length;
      
      console.log(`Vehicle: ${vehicle}`);
      console.log(`   Total trips: ${trips.length}`);
      console.log(`   Trips with totalKm > 0: ${tripsWithKm}`);
      console.log(`   Total Km: ${totalKm}`);
      console.log(`   Sample vehicle numbers: ${trips.slice(0, 3).map(t => `"${t.vehicleNumber}"`).join(', ') || 'none'}\n`);
    }

    // Check all unique vehicle numbers
    console.log('========================================');
    console.log('ALL UNIQUE VEHICLE NUMBERS');
    console.log('========================================\n');
    const allVehicles = await Trip.distinct('vehicleNumber');
    console.log(`Total unique vehicles: ${allVehicles.length}`);
    console.log(`First 20 vehicles: ${allVehicles.slice(0, 20).join(', ')}\n`);

    // Check totalKm statistics
    console.log('========================================');
    console.log('TOTAL KM STATISTICS');
    console.log('========================================\n');
    const tripsWithKm = await Trip.countDocuments({ totalKm: { $gt: 0 } });
    const tripsWithoutKm = await Trip.countDocuments({ 
      $or: [
        { totalKm: { $exists: false } },
        { totalKm: 0 },
        { totalKm: null }
      ]
    });
    const totalKmSum = await Trip.aggregate([
      { $group: { _id: null, total: { $sum: '$totalKm' } } }
    ]);
    
    console.log(`Trips with totalKm > 0: ${tripsWithKm}`);
    console.log(`Trips without totalKm: ${tripsWithoutKm}`);
    console.log(`Total Km sum: ${totalKmSum[0]?.total || 0}\n`);

    // Check date ranges
    console.log('========================================');
    console.log('DATE RANGE CHECK');
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
      console.log(`Date range: ${dateStats[0].minDate} to ${dateStats[0].maxDate}`);
      console.log(`Total trips: ${dateStats[0].count}\n`);
    }

    // Check data structure
    console.log('========================================');
    console.log('DATA STRUCTURE CHECK');
    console.log('========================================\n');
    const sampleTrip = await Trip.findOne({}).lean();
    if (sampleTrip) {
      console.log('Sample trip keys:', Object.keys(sampleTrip));
      console.log('Has vehicleNumber:', 'vehicleNumber' in sampleTrip);
      console.log('Has totalKm:', 'totalKm' in sampleTrip);
      console.log('Has indentDate:', 'indentDate' in sampleTrip);
      console.log('VehicleNumber type:', typeof sampleTrip.vehicleNumber);
      console.log('TotalKm type:', typeof sampleTrip.totalKm);
      console.log('IndentDate type:', typeof sampleTrip.indentDate);
    }

    console.log('\n========================================');
    console.log('DATABASE STATE DEBUG - END');
    console.log('========================================\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('ERROR:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

debugDatabaseState();

