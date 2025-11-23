import { filterIndentsByDate } from './dateFiltering';

/**
 * Fixed vehicles list
 */
const FIXED_VEHICLES = [
  'HR38AC7854',
  'HR38AC7243',
  'HR38AC0599',
  'HR38AC0263'
];

export interface VehicleCostData {
  vehicleNumber: string;
  fixedKm: number;
  actualKm: number;
  remainingKm: number;
  costForRemainingKm: number;
  extraCost: number;
}

/**
 * Calculate vehicle cost analytics
 * 
 * @param allTrips - All trips from database
 * @param fromDate - Start date (optional)
 * @param toDate - End date (optional)
 * @returns Array of vehicle cost data (fixed vehicles first, then "Other" row)
 */
export function calculateVehicleCosts(
  allTrips: any[],
  fromDate?: Date | null,
  toDate?: Date | null
): VehicleCostData[] {
  // Apply date filtering only if dates are actually provided
  // If both are null/undefined, use all trips
  let filteredTrips = allTrips;
  console.log(`[DEBUG calculateVehicleCosts] Input: ${allTrips.length} trips, fromDate=${fromDate?.toISOString().split('T')[0] || 'null'}, toDate=${toDate?.toISOString().split('T')[0] || 'null'}`);
  
  if ((fromDate !== null && fromDate !== undefined) || (toDate !== null && toDate !== undefined)) {
    const dateFilterResult = filterIndentsByDate(allTrips, fromDate || null, toDate || null);
    filteredTrips = dateFilterResult.allIndentsFiltered;
    console.log(`[DEBUG calculateVehicleCosts] After date filter: ${filteredTrips.length} trips`);
  } else {
    console.log(`[DEBUG calculateVehicleCosts] No date filter - using all ${filteredTrips.length} trips`);
  }

  const FIXED_KM = 5000;
  const KM_COST_RATE = 31;
  const TOTAL_BUDGET = 155000;

  const result: VehicleCostData[] = [];

  // Process each fixed vehicle
  for (const vehicleNumber of FIXED_VEHICLES) {
    // Filter trips for this vehicle (case-insensitive, trim whitespace)
    const vehicleTrips = filteredTrips.filter(trip => {
      const tripVehicle = String(trip.vehicleNumber || '').trim().toUpperCase();
      return tripVehicle === vehicleNumber.toUpperCase();
    });

    // Sum totalKm for this vehicle
    const actualKm = vehicleTrips.reduce((sum, trip) => {
      return sum + (Number(trip.totalKm) || 0);
    }, 0);
    
    console.log(`[DEBUG calculateVehicleCosts] Vehicle ${vehicleNumber}: ${vehicleTrips.length} trips, ${actualKm} km`);

    // Calculate metrics
    const remainingKm = FIXED_KM - actualKm;
    const costForRemainingKm = remainingKm * KM_COST_RATE;
    const extraCost = TOTAL_BUDGET - costForRemainingKm;

    result.push({
      vehicleNumber,
      fixedKm: FIXED_KM,
      actualKm,
      remainingKm,
      costForRemainingKm,
      extraCost
    });
  }

  return result;
}

