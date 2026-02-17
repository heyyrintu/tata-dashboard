/** Conversion factor: 1 barrel = 10.5 buckets */
export const BARREL_TO_BUCKET_RATIO = 10.5;

/** Revenue rates per bucket by distance range */
export const BUCKET_RATES: Record<string, number> = {
  '0-100Km': 21,
  '101-250Km': 40,
  '251-400Km': 68,
  '401-600Km': 105,
};

/** Revenue rates per barrel by distance range */
export const BARREL_RATES: Record<string, number> = {
  '0-100Km': 220.5,
  '101-250Km': 420,
  '251-400Km': 714,
  '401-600Km': 1081.5,
};

/** Standard distance ranges */
export const DISTANCE_RANGES = ['0-100Km', '101-250Km', '251-400Km', '401-600Km'] as const;

/** Fixed vehicles for vehicle cost analytics */
export const FIXED_VEHICLES = [
  'HR38AC7854',
  'HR38AC7243',
  'HR38AC0599',
  'HR38AC0263',
] as const;

/** Vehicle cost constants */
export const FIXED_KM = 5000;
export const KM_COST_RATE = 31;
export const TOTAL_BUDGET = 155000;

/** Truck capacity by material type (kg) */
export const BUCKET_CAPACITY_KG = 6000;
export const BARREL_CAPACITY_KG = 6300;

/** Fulfillment bucket ranges */
export const FULFILLMENT_RANGES = [
  { min: 0, max: 150, label: '0 - 150' },
  { min: 151, max: 200, label: '151 - 200' },
  { min: 201, max: 250, label: '201 - 250' },
  { min: 251, max: 300, label: '251 - 300' },
  { min: 301, max: Infinity, label: '300+' },
] as const;
