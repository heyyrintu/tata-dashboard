import mongoose from 'mongoose';
import Trip from '../models/Trip';
import { connectDatabase } from '../config/database';

const checkTotalLoadAndBuckets = async () => {
  try {
    console.log('========================================');
    console.log('CHECKING TOTAL LOAD AND BUCKET/BARREL DATA');
    console.log('========================================\n');

    await connectDatabase();
    console.log('✓ Database connected\n');

    // Check totalLoad
    const tripsWithLoad = await Trip.countDocuments({ totalLoad: { $gt: 0 } });
    const tripsWithoutLoad = await Trip.countDocuments({ 
      $or: [
        { totalLoad: { $exists: false } },
        { totalLoad: 0 },
        { totalLoad: null }
      ]
    });
    const totalLoadSum = await Trip.aggregate([
      { $group: { _id: null, total: { $sum: '$totalLoad' } } }
    ]);
    
    console.log('TOTAL LOAD STATISTICS:');
    console.log(`  Trips with totalLoad > 0: ${tripsWithLoad}`);
    console.log(`  Trips without totalLoad: ${tripsWithoutLoad}`);
    console.log(`  Total Load sum: ${totalLoadSum[0]?.total || 0} kg\n`);

    // Check noOfBuckets
    const tripsWithBuckets = await Trip.countDocuments({ noOfBuckets: { $gt: 0 } });
    const tripsWithoutBuckets = await Trip.countDocuments({ 
      $or: [
        { noOfBuckets: { $exists: false } },
        { noOfBuckets: 0 },
        { noOfBuckets: null }
      ]
    });
    
    console.log('BUCKET/BARREL STATISTICS:');
    console.log(`  Trips with noOfBuckets > 0: ${tripsWithBuckets}`);
    console.log(`  Trips without noOfBuckets: ${tripsWithoutBuckets}\n`);

    // Check material field
    const materialStats = await Trip.aggregate([
      {
        $group: {
          _id: '$material',
          count: { $sum: 1 },
          totalBuckets: { $sum: '$noOfBuckets' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    console.log('MATERIAL STATISTICS:');
    materialStats.forEach(stat => {
      console.log(`  ${stat._id || 'NULL'}: ${stat.count} trips, ${stat.totalBuckets} buckets/barrels`);
    });
    console.log();

    // Sample trips
    console.log('SAMPLE TRIPS (first 5):');
    const samples = await Trip.find({}).limit(5).lean();
    samples.forEach((trip, idx) => {
      console.log(`\n${idx + 1}. Indent: ${trip.indent}`);
      console.log(`   totalLoad: ${trip.totalLoad || 0} kg`);
      console.log(`   noOfBuckets: ${trip.noOfBuckets || 0}`);
      console.log(`   material: "${trip.material || 'N/A'}"`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('ERROR:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

checkTotalLoadAndBuckets();

