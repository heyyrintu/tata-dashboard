import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import Trip from '../models/Trip';
import { getAnalytics } from '../controllers/analyticsController';
import { getRangeWiseAnalytics } from '../controllers/analyticsController';
import { getVehicleCostAnalytics } from '../controllers/analyticsController';
import { Request, Response } from 'express';

const mockRequest = (query: any = {}): Partial<Request> => ({
  query
} as Partial<Request>);

const mockResponse = (): Partial<Response> => {
  const res: any = {
    json: (data: any) => {
      console.log('Response:', JSON.stringify(data, null, 2));
      return res;
    },
    status: (code: number) => {
      res.statusCode = code;
      return res;
    }
  };
  return res;
};

const debugAllEndpoints = async () => {
  try {
    console.log('========================================');
    console.log('ALL API ENDPOINTS DEBUG');
    console.log('========================================\n');

    await connectDatabase();
    console.log('✓ Database connected\n');

    const totalTrips = await Trip.countDocuments({});
    console.log(`Total trips in database: ${totalTrips}\n`);

    if (totalTrips === 0) {
      console.log('⚠️  WARNING: Database is empty! Cannot test endpoints.\n');
      await mongoose.disconnect();
      return;
    }

    // Test 1: getAnalytics (MainDashboard)
    console.log('========================================');
    console.log('TEST 1: /api/analytics (getAnalytics)');
    console.log('========================================\n');
    try {
      const req1 = mockRequest() as Request;
      const res1 = mockResponse() as Response;
      await getAnalytics(req1, res1);
    } catch (error) {
      console.error('ERROR:', error);
    }

    console.log('\n');

    // Test 2: getRangeWiseAnalytics (RangeWiseTable, SummaryCards)
    console.log('========================================');
    console.log('TEST 2: /api/analytics/range-wise');
    console.log('========================================\n');
    try {
      const req2 = mockRequest() as Request;
      const res2 = mockResponse() as Response;
      await getRangeWiseAnalytics(req2, res2);
    } catch (error) {
      console.error('ERROR:', error);
    }

    console.log('\n');

    // Test 3: getVehicleCostAnalytics (VehicleCostTable)
    console.log('========================================');
    console.log('TEST 3: /api/analytics/vehicle-cost');
    console.log('========================================\n');
    try {
      const req3 = mockRequest() as Request;
      const res3 = mockResponse() as Response;
      await getVehicleCostAnalytics(req3, res3);
    } catch (error) {
      console.error('ERROR:', error);
    }

    console.log('\n');

    // Test with date filters
    console.log('========================================');
    console.log('TESTING WITH DATE FILTERS');
    console.log('========================================\n');

    const dateStats = await Trip.aggregate([
      {
        $group: {
          _id: null,
          minDate: { $min: '$indentDate' },
          maxDate: { $max: '$indentDate' }
        }
      }
    ]);

    if (dateStats[0] && dateStats[0].minDate && dateStats[0].maxDate) {
      const fromDate = dateStats[0].minDate.toISOString().split('T')[0];
      const toDate = dateStats[0].maxDate.toISOString().split('T')[0];

      console.log(`Testing with date range: ${fromDate} to ${toDate}\n`);

      console.log('--- getAnalytics with dates ---');
      try {
        const req4 = mockRequest({ fromDate, toDate }) as Request;
        const res4 = mockResponse() as Response;
        await getAnalytics(req4, res4);
      } catch (error) {
        console.error('ERROR:', error);
      }

      console.log('\n--- getRangeWiseAnalytics with dates ---');
      try {
        const req5 = mockRequest({ fromDate, toDate }) as Request;
        const res5 = mockResponse() as Response;
        await getRangeWiseAnalytics(req5, res5);
      } catch (error) {
        console.error('ERROR:', error);
      }

      console.log('\n--- getVehicleCostAnalytics with dates ---');
      try {
        const req6 = mockRequest({ fromDate, toDate }) as Request;
        const res6 = mockResponse() as Response;
        await getVehicleCostAnalytics(req6, res6);
      } catch (error) {
        console.error('ERROR:', error);
      }
    }

    console.log('\n========================================');
    console.log('ALL ENDPOINTS TEST COMPLETE');
    console.log('========================================\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('ERROR:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

debugAllEndpoints();

