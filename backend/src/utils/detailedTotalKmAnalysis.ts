import { filterIndentsByDate } from './dateFiltering';

export interface DetailedTotalKmData {
  category: string;
  value: string;
  totalKm: number;
  tripCount: number;
  percentage: number;
}

export interface DetailedTotalKmAnalysis {
  byRange: DetailedTotalKmData[];
  byVehicle: DetailedTotalKmData[];
  byLocation: DetailedTotalKmData[];
  byCustomer: DetailedTotalKmData[];
  summary: {
    totalKm: number;
    totalTrips: number;
    tripsWithKm: number;
    avgKmPerTrip: number;
    topVehicle: { vehicle: string; totalKm: number } | null;
    topLocation: { location: string; totalKm: number } | null;
    topCustomer: { customer: string; totalKm: number } | null;
  };
}

/**
 * Calculate detailed total km analysis
 * 
 * @param allTrips - All trips from database
 * @param fromDate - Start date (optional)
 * @param toDate - End date (optional)
 * @returns Detailed total km analysis with breakdowns by range, vehicle, location, and customer
 */
export function calculateDetailedTotalKmAnalysis(
  allTrips: any[],
  fromDate?: Date | null,
  toDate?: Date | null
): DetailedTotalKmAnalysis {
  console.log(`[calculateDetailedTotalKmAnalysis] ===== START =====`);
  console.log(`[calculateDetailedTotalKmAnalysis] Total trips: ${allTrips.length}`);
  console.log(`[calculateDetailedTotalKmAnalysis] Date range: ${fromDate?.toISOString().split('T')[0] || 'null'} to ${toDate?.toISOString().split('T')[0] || 'null'}`);

  // Apply date filtering
  const dateFilterResult = filterIndentsByDate(allTrips, fromDate || null, toDate || null);
  const filteredTrips = dateFilterResult.allIndentsFiltered;

  console.log(`[calculateDetailedTotalKmAnalysis] Filtered trips after date filter: ${filteredTrips.length}`);

  // Calculate total km and trip counts
  const totalKm = filteredTrips.reduce((sum, trip) => sum + (Number(trip.totalKm) || 0), 0);
  const totalTrips = filteredTrips.length;
  const tripsWithKm = filteredTrips.filter(trip => (Number(trip.totalKm) || 0) > 0).length;
  const avgKmPerTrip = totalTrips > 0 ? totalKm / totalTrips : 0;

  // Group by Range
  const rangeMap = new Map<string, { totalKm: number; tripCount: number }>();
  filteredTrips.forEach(trip => {
    const range = (trip.range || 'Unknown').trim();
    if (!rangeMap.has(range)) {
      rangeMap.set(range, { totalKm: 0, tripCount: 0 });
    }
    const data = rangeMap.get(range)!;
    data.totalKm += Number(trip.totalKm) || 0;
    data.tripCount += 1;
  });

  const byRange: DetailedTotalKmData[] = Array.from(rangeMap.entries())
    .map(([range, data]) => ({
      category: 'Range',
      value: range,
      totalKm: data.totalKm,
      tripCount: data.tripCount,
      percentage: totalKm > 0 ? (data.totalKm / totalKm) * 100 : 0
    }))
    .sort((a, b) => b.totalKm - a.totalKm);

  // Group by Vehicle
  const vehicleMap = new Map<string, { totalKm: number; tripCount: number }>();
  filteredTrips.forEach(trip => {
    const vehicle = String(trip.vehicleNumber || 'Unknown').trim().toUpperCase();
    if (!vehicle || vehicle === 'UNKNOWN') return;
    if (!vehicleMap.has(vehicle)) {
      vehicleMap.set(vehicle, { totalKm: 0, tripCount: 0 });
    }
    const data = vehicleMap.get(vehicle)!;
    data.totalKm += Number(trip.totalKm) || 0;
    data.tripCount += 1;
  });

  const byVehicle: DetailedTotalKmData[] = Array.from(vehicleMap.entries())
    .map(([vehicle, data]) => ({
      category: 'Vehicle',
      value: vehicle,
      totalKm: data.totalKm,
      tripCount: data.tripCount,
      percentage: totalKm > 0 ? (data.totalKm / totalKm) * 100 : 0
    }))
    .sort((a, b) => b.totalKm - a.totalKm)
    .slice(0, 20); // Top 20 vehicles

  // Group by Location
  const locationMap = new Map<string, { totalKm: number; tripCount: number }>();
  filteredTrips.forEach(trip => {
    const location = String(trip.location || 'Unknown').trim();
    if (!location || location === 'Unknown') return;
    if (!locationMap.has(location)) {
      locationMap.set(location, { totalKm: 0, tripCount: 0 });
    }
    const data = locationMap.get(location)!;
    data.totalKm += Number(trip.totalKm) || 0;
    data.tripCount += 1;
  });

  const byLocation: DetailedTotalKmData[] = Array.from(locationMap.entries())
    .map(([location, data]) => ({
      category: 'Location',
      value: location,
      totalKm: data.totalKm,
      tripCount: data.tripCount,
      percentage: totalKm > 0 ? (data.totalKm / totalKm) * 100 : 0
    }))
    .sort((a, b) => b.totalKm - a.totalKm)
    .slice(0, 20); // Top 20 locations

  // Group by Customer
  const customerMap = new Map<string, { totalKm: number; tripCount: number }>();
  filteredTrips.forEach(trip => {
    const customer = String(trip.customerName || 'Unknown').trim();
    if (!customer || customer === 'Unknown') return;
    if (!customerMap.has(customer)) {
      customerMap.set(customer, { totalKm: 0, tripCount: 0 });
    }
    const data = customerMap.get(customer)!;
    data.totalKm += Number(trip.totalKm) || 0;
    data.tripCount += 1;
  });

  const byCustomer: DetailedTotalKmData[] = Array.from(customerMap.entries())
    .map(([customer, data]) => ({
      category: 'Customer',
      value: customer,
      totalKm: data.totalKm,
      tripCount: data.tripCount,
      percentage: totalKm > 0 ? (data.totalKm / totalKm) * 100 : 0
    }))
    .sort((a, b) => b.totalKm - a.totalKm)
    .slice(0, 20); // Top 20 customers

  // Find top items
  const topVehicle = byVehicle.length > 0 ? { vehicle: byVehicle[0].value, totalKm: byVehicle[0].totalKm } : null;
  const topLocation = byLocation.length > 0 ? { location: byLocation[0].value, totalKm: byLocation[0].totalKm } : null;
  const topCustomer = byCustomer.length > 0 ? { customer: byCustomer[0].value, totalKm: byCustomer[0].totalKm } : null;

  console.log(`[calculateDetailedTotalKmAnalysis] Analysis complete:`, {
    totalKm,
    totalTrips,
    tripsWithKm,
    ranges: byRange.length,
    vehicles: byVehicle.length,
    locations: byLocation.length,
    customers: byCustomer.length
  });
  console.log(`[calculateDetailedTotalKmAnalysis] ===== END =====`);

  return {
    byRange,
    byVehicle,
    byLocation,
    byCustomer,
    summary: {
      totalKm,
      totalTrips,
      tripsWithKm,
      avgKmPerTrip,
      topVehicle,
      topLocation,
      topCustomer
    }
  };
}

