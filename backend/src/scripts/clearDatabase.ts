import { connectDatabase } from '../config/database';
import Trip from '../models/Trip';

/**
 * Script to clear all Trip data from the database
 * Usage: npx ts-node src/scripts/clearDatabase.ts
 */

const clearDatabase = async () => {
  try {
    console.log('🔌 Connecting to database...');
    await connectDatabase();
    
    console.log('🗑️  Clearing all Trip data...');
    const result = await Trip.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.deletedCount} trips from the database`);
    console.log('✨ Database is now empty and ready for fresh data upload');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
};

clearDatabase();

