import mongoose from 'mongoose';
import Trip from '../models/Trip';
import { connectDatabase } from '../config/database';
import { parseExcelFile } from '../utils/excelParser';
import * as path from 'path';

const compareExcelToDB = async () => {
  try {
    console.log('========================================');
    console.log('EXCEL vs DATABASE COMPARISON');
    console.log('========================================\n');

    // Connect to database
    await connectDatabase();
    console.log('✓ Database connected\n');

    // Find Excel file
    const excelPath = path.join(__dirname, '../../../MIS MASTER SHEET July 2025.xlsx');
    console.log(`Reading Excel file: ${excelPath}\n`);

    // Parse Excel file
    const excelTrips = parseExcelFile(excelPath);
    console.log(`Excel trips parsed: ${excelTrips.length}\n`);

    // Query database
    const dbTrips = await Trip.find({}).lean();
    console.log(`Database trips: ${dbTrips.length}\n`);

    if (excelTrips.length === 0) {
      console.log('⚠️  ERROR: Excel file parsed 0 trips!');
      await mongoose.disconnect();
      return;
    }

    if (dbTrips.length === 0) {
      console.log('⚠️  ERROR: Database has 0 trips!');
      console.log('   Action needed: Upload Excel file to database.\n');
      await mongoose.disconnect();
      return;
    }

    // Compare Vehicle Numbers
    console.log('========================================');
    console.log('VEHICLE NUMBER COMPARISON');
    console.log('========================================\n');

    const fixedVehicles = ['HR38AC7854', 'HR38AC7243', 'HR38AC0599', 'HR38AC0263', 'HR38X6465'];
    
    for (const vehicle of fixedVehicles) {
      const excelMatches = excelTrips.filter(t => 
        String(t.vehicleNumber || '').trim().toUpperCase() === vehicle.toUpperCase()
      );
      const dbMatches = dbTrips.filter(t => 
        String(t.vehicleNumber || '').trim().toUpperCase() === vehicle.toUpperCase()
      );

      const excelTotalKm = excelMatches.reduce((sum, t) => sum + (Number(t.totalKm) || 0), 0);
      const dbTotalKm = dbMatches.reduce((sum, t) => sum + (Number(t.totalKm) || 0), 0);

      console.log(`Vehicle: ${vehicle}`);
      console.log(`   Excel: ${excelMatches.length} trips, ${excelTotalKm} km`);
      console.log(`   DB:    ${dbMatches.length} trips, ${dbTotalKm} km`);
      console.log(`   Match: ${excelMatches.length === dbMatches.length ? '✓' : '✗'} (${excelMatches.length === dbMatches.length ? 'OK' : 'MISMATCH'})`);
      console.log(`   Km Match: ${excelTotalKm === dbTotalKm ? '✓' : '✗'} (${excelTotalKm === dbTotalKm ? 'OK' : 'MISMATCH'})\n`);
    }

    // Compare Total Km values
    console.log('========================================');
    console.log('TOTAL KM COMPARISON');
    console.log('========================================\n');

    const excelTotalKm = excelTrips.reduce((sum, t) => sum + (Number(t.totalKm) || 0), 0);
    const dbTotalKm = dbTrips.reduce((sum, t) => sum + (Number(t.totalKm) || 0), 0);
    const excelWithKm = excelTrips.filter(t => (Number(t.totalKm) || 0) > 0).length;
    const dbWithKm = dbTrips.filter(t => (Number(t.totalKm) || 0) > 0).length;

    console.log(`Excel Total Km: ${excelTotalKm.toLocaleString('en-IN')} km`);
    console.log(`DB Total Km:   ${dbTotalKm.toLocaleString('en-IN')} km`);
    console.log(`Match: ${excelTotalKm === dbTotalKm ? '✓' : '✗'}\n`);

    console.log(`Excel trips with Km > 0: ${excelWithKm}`);
    console.log(`DB trips with Km > 0: ${dbWithKm}`);
    console.log(`Match: ${excelWithKm === dbWithKm ? '✓' : '✗'}\n`);

    // Sample comparison
    console.log('========================================');
    console.log('SAMPLE DATA COMPARISON (First 5 rows)');
    console.log('========================================\n');

    for (let i = 0; i < Math.min(5, excelTrips.length, dbTrips.length); i++) {
      const excelTrip = excelTrips[i];
      const dbTrip = dbTrips[i];
      
      console.log(`Row ${i + 1}:`);
      console.log(`   Excel Vehicle: "${excelTrip.vehicleNumber || 'N/A'}", TotalKm: ${excelTrip.totalKm || 0}`);
      console.log(`   DB Vehicle:    "${dbTrip.vehicleNumber || 'N/A'}", TotalKm: ${dbTrip.totalKm || 0}`);
      console.log(`   Match: ${excelTrip.vehicleNumber === dbTrip.vehicleNumber && excelTrip.totalKm === dbTrip.totalKm ? '✓' : '✗'}\n`);
    }

    // Check for missing data
    console.log('========================================');
    console.log('MISSING DATA CHECK');
    console.log('========================================\n');

    const excelVehicles = new Set(excelTrips.map(t => String(t.vehicleNumber || '').trim().toUpperCase()));
    const dbVehicles = new Set(dbTrips.map(t => String(t.vehicleNumber || '').trim().toUpperCase()));

    console.log(`Unique vehicles in Excel: ${excelVehicles.size}`);
    console.log(`Unique vehicles in DB: ${dbVehicles.size}\n`);

    console.log('========================================');
    console.log('COMPARISON COMPLETE');
    console.log('========================================\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('ERROR:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

compareExcelToDB();

