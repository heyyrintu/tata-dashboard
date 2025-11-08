import { format } from 'date-fns';
import { endOfDayUTC } from './dateFilter';

function normalizeDateToKey(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  return format(d, 'yyyy-MM-dd');
}

function normalizeVehicle(v?: string | null): string {
  if (!v) return '';
  // trim + collapse multi-spaces to single space
  return v.replace(/\s+/g, ' ').trim();
}

function normalizeRemarks(r?: string | null): string {
  if (!r) return '';
  return r.toLowerCase().replace(/\s+/g, ' ').trim();
}

function isSecondTrip(remarksNorm: string): boolean {
  return remarksNorm.includes('2nd trip');
}

export interface TripCountResult {
  totalTrips: number;
  groups: Map<string, number>; // key: `${date}::${vehicle}`, value: 1 or 2
}

export interface TripDocument {
  indentDate: Date;
  vehicleNumber: string;
  remarks?: string;
}

/**
 * Calculate trip counts by vehicle-day with "2nd trip" rule.
 * 
 * Logic:
 * 1. Take indentDate first (the actual date from the indent)
 * 2. Find associated vehicle number for that date
 * 3. Group by unique combinations of: indentDate + vehicleNumber
 * 4. For each date+vehicle combination:
 *    - Check remarks: if "2nd trip" exists → count as 2 trips
 *    - Otherwise → count as 1 trip
 * 5. Sum all trips
 * 
 * Required fields: indentDate, vehicleNumber, remarks
 */
export function calculateTripsByVehicleDay(
  documents: TripDocument[],
  dateFrom?: Date,
  dateTo?: Date
): TripCountResult {
  // Step 1 & 2: Group by indentDate + vehicleNumber
  // Key format: "yyyy-MM-dd::VEHICLE_NUMBER"
  const groups = new Map<string, { hasSecondTrip: boolean }>();

  for (const doc of documents) {
    // Step 1: Take indentDate first
    const rawDate = doc.indentDate;
    // Step 2: Find associated vehicle number
    const rawVehicle = doc.vehicleNumber;
    const rawRemarks = doc.remarks;

    if (!rawDate || !rawVehicle) continue;

    const dateObj = new Date(rawDate);
    if (isNaN(+dateObj)) continue; // invalid date

    // Optional date filter (only used if provided)
    if (dateFrom && dateObj < dateFrom) continue;
    if (dateTo) {
      const endDate = endOfDayUTC(dateTo);
      if (dateObj > endDate) continue;
    }

    // Step 3: Create unique key: indentDate + vehicleNumber
    const dateKey = normalizeDateToKey(dateObj); // Format: "yyyy-MM-dd"
    const vehicle = normalizeVehicle(rawVehicle);
    if (!vehicle) continue;

    const key = `${dateKey}::${vehicle}`; // Unique combination: date + vehicle

    // Step 4: Check remarks for "2nd trip"
    const entry = groups.get(key) ?? { hasSecondTrip: false };
    const remarksNorm = normalizeRemarks(rawRemarks);
    if (isSecondTrip(remarksNorm)) {
      entry.hasSecondTrip = true; // Mark as having "2nd trip"
    }
    groups.set(key, entry);
  }

  // Step 5: Count trips - if "2nd trip" exists, count 2, otherwise 1
  const tripCounts = new Map<string, number>();
  let totalTrips = 0;
  for (const [key, val] of groups.entries()) {
    // If remarks shows "2nd trip": count +1 (total = 2), otherwise count 1
    const trips = val.hasSecondTrip ? 2 : 1;
    tripCounts.set(key, trips);
    totalTrips += trips;
  }

  return { totalTrips, groups: tripCounts };
}

export interface TripsOverTimePoint {
  date: string;
  trips: number;
}

/**
 * Aggregate trips over time (daily/weekly/monthly) based on vehicle-day counts.
 */
export function aggregateTripsOverTime(
  documents: TripDocument[],
  granularity: 'daily' | 'weekly' | 'monthly',
  dateFrom?: Date,
  dateTo?: Date
): TripsOverTimePoint[] {
  const { groups } = calculateTripsByVehicleDay(documents, dateFrom, dateTo);
  const byPeriod = new Map<string, number>();

  for (const key of groups.keys()) {
    const [dateKey] = key.split('::');
    const dateObj = new Date(dateKey);

    let periodKey = '';
    if (granularity === 'daily') {
      periodKey = format(dateObj, 'yyyy-MM-dd');
    } else if (granularity === 'weekly') {
      // ISO week: week number and year
      const firstThursday = new Date(dateObj.getTime());
      firstThursday.setDate(dateObj.getDate() + 4 - (dateObj.getDay() || 7));
      const yearStart = new Date(firstThursday.getFullYear(), 0, 1);
      const week = Math.ceil((((+firstThursday - +yearStart) / 86400000) + 1) / 7);
      periodKey = `Week ${String(week).padStart(2, '0')}, ${firstThursday.getFullYear()}`;
    } else {
      periodKey = format(dateObj, 'yyyy-MM');
    }

    const trips = groups.get(key)!;
    byPeriod.set(periodKey, (byPeriod.get(periodKey) ?? 0) + trips);
  }

  return [...byPeriod.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, trips]) => ({ date, trips }));
}

