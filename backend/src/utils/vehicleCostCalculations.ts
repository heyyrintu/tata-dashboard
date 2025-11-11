import { filterIndentsByDate } from './dateFiltering';

/**
 * Fixed vehicles list
 */
const FIXED_VEHICLES = [
  'HR38AC7854',
  'HR38AC7243',
  'HR38AC0599',
  'HR38AC0263',
  'HR38X6465'
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
  console.log(`[calculateVehicleCosts] ===== START =====`);
  console.log(`[calculateVehicleCosts] Total trips: ${allTrips.length}`);
  console.log(`[calculateVehicleCosts] Date range: ${fromDate?.toISOString().split('T')[0] || 'null'} to ${toDate?.toISOString().split('T')[0] || 'null'}`);

  // Apply date filtering
  const dateFilterResult = filterIndentsByDate(allTrips, fromDate || null, toDate || null);
  const filteredTrips = dateFilterResult.allIndentsFiltered;

  console.log(`[calculateVehicleCosts] Filtered trips after date filter: ${filteredTrips.length}`);

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

    // Calculate metrics
    const remainingKm = FIXED_KM - actualKm;
    const costForRemainingKm = remainingKm * KM_COST_RATE;
    const extraCost = TOTAL_BUDGET - costForRemainingKm;

    console.log(`[calculateVehicleCosts] Vehicle ${vehicleNumber}:`, {
      trips: vehicleTrips.length,
      actualKm,
      remainingKm,
      costForRemainingKm,
      extraCost
    });

    result.push({
      vehicleNumber,
      fixedKm: FIXED_KM,
      actualKm,
      remainingKm,
      costForRemainingKm,
      extraCost
    });
  }

  // Process "Other" row - aggregate all non-fixed vehicles
  const otherTrips = filteredTrips.filter(trip => {
    const tripVehicle = String(trip.vehicleNumber || '').trim().toUpperCase();
    if (!tripVehicle) return false;
    // Check if vehicle is not in fixed list (case-insensitive)
    return !FIXED_VEHICLES.some(fixed => fixed.toUpperCase() === tripVehicle);
  });

  // Sum totalKm for all non-fixed vehicles
  const otherActualKm = otherTrips.reduce((sum, trip) => {
    return sum + (Number(trip.totalKm) || 0);
  }, 0);

  // Calculate metrics for "Other"
  const otherRemainingKm = FIXED_KM - otherActualKm;
  const otherCostForRemainingKm = otherRemainingKm * KM_COST_RATE;
  const otherExtraCost = TOTAL_BUDGET - otherCostForRemainingKm;

  console.log(`[calculateVehicleCosts] Other (non-fixed vehicles):`, {
    trips: otherTrips.length,
    uniqueVehicles: new Set(otherTrips.map(t => String(t.vehicleNumber || '').trim())).size,
    actualKm: otherActualKm,
    remainingKm: otherRemainingKm,
    costForRemainingKm: otherCostForRemainingKm,
    extraCost: otherExtraCost
  });

  // Add "Other" row at the end
  result.push({
    vehicleNumber: 'Other',
    fixedKm: FIXED_KM,
    actualKm: otherActualKm,
    remainingKm: otherRemainingKm,
    costForRemainingKm: otherCostForRemainingKm,
    extraCost: otherExtraCost
  });

  console.log(`[calculateVehicleCosts] Total rows: ${result.length} (${FIXED_VEHICLES.length} fixed + 1 Other)`);
  console.log(`[calculateVehicleCosts] ===== END =====`);

  return result;
}

