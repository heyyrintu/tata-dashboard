/**
 * Destination normalisation, zone mapping and hub distance.
 *
 * The MIS sheet is typed by hand, so the same town arrives in several
 * spellings and cases (GHAZIABAD / Ghaziabad, Azamghar / AZAMGARH). Left
 * alone these split one destination into several rows and understate every
 * top-destination and lane number, so everything here funnels through
 * normaliseDestination first.
 *
 * Distance is great-circle between hub and destination multiplied by a road
 * factor. It is deliberately approximate - the MIS has no km column, and the
 * bands only need to be right to the nearest band, not the nearest kilometre.
 * Towns missing from CITY_GEO fall into the Unmapped band rather than being
 * guessed at, so a gap stays visible instead of quietly skewing a band.
 */

export interface CityGeo {
  lat: number;
  lon: number;
  /** Home state, used for the zone rollup. */
  state: string;
}

/** Straight-line to road-distance multiplier for Indian highway routes. */
const ROAD_FACTOR = 1.25;

/**
 * Towns treated as Delhi NCR in the zone view regardless of home state.
 * Kept deliberately tight - the statutory NCR reaches as far as Karnal and
 * Meerut, which would swallow the Haryana and UP zones. Edit this list to
 * change how the zone chart splits.
 */
const NCR_CORE = new Set([
  'Delhi', 'Gurgaon', 'Manesar', 'Faridabad', 'Noida', 'Greater Noida',
  'Gautam Buddh Nagar', 'Jewar', 'Ghaziabad', 'Sonipat', 'Palwal', 'Hodal',
  'Rewari', 'Dharuhera', 'Bhiwadi', 'Jhajjar',
]);

/**
 * Spelling variants seen in the source sheet, keyed by lowercased raw value.
 * Case-only variants need no entry - title-casing already collapses those.
 */
const SPELLING_FIXES: Record<string, string> = {
  'azamghar': 'Azamgarh',
  'haldawani': 'Haldwani',
  'barelly': 'Bareilly',
  'jallandhar': 'Jalandhar',
  'kapurtha': 'Kapurthala',
  'hosiarpur': 'Hoshiarpur',
  'koshambi': 'Kaushambi',
  'sahabad': 'Shahabad',
  'shahbad': 'Shahabad',
  'rudurpur': 'Rudrapur',
  'kiccha': 'Kichha',
  'jewer': 'Jewar',
  'badgam': 'Budgam',
  'puri garhwal': 'Pauri Garhwal',
  'patiala road': 'Patiala',
  'saharanpur road dehradun': 'Dehradun',
  'imt manesar sec 2a': 'Manesar',
  'gautambudh nagar': 'Gautam Buddh Nagar',
  'mahendergarh': 'Mahendragarh',
};

/**
 * Approximate coordinates for every destination present in the data.
 * Ambiguous names are resolved to the state that matches the rest of the
 * network: Bilaspur and Hamirpur to Himachal (the Solan/Baddi cluster),
 * Srinagar to J&K (the Anantnag/Budgam cluster), Fatehpur to UP.
 */
export const CITY_GEO: Record<string, CityGeo> = {
  // --- Delhi NCR ---
  'Delhi': { lat: 28.61, lon: 77.21, state: 'Delhi' },
  'Gurgaon': { lat: 28.46, lon: 77.03, state: 'Haryana' },
  'Manesar': { lat: 28.35, lon: 76.93, state: 'Haryana' },
  'Faridabad': { lat: 28.41, lon: 77.31, state: 'Haryana' },
  'Noida': { lat: 28.54, lon: 77.39, state: 'Uttar Pradesh' },
  'Greater Noida': { lat: 28.47, lon: 77.50, state: 'Uttar Pradesh' },
  'Gautam Buddh Nagar': { lat: 28.47, lon: 77.51, state: 'Uttar Pradesh' },
  'Jewar': { lat: 28.12, lon: 77.56, state: 'Uttar Pradesh' },
  'Ghaziabad': { lat: 28.67, lon: 77.43, state: 'Uttar Pradesh' },
  'Palwal': { lat: 28.14, lon: 77.33, state: 'Haryana' },
  'Hodal': { lat: 27.89, lon: 77.37, state: 'Haryana' },
  'Rewari': { lat: 28.20, lon: 76.62, state: 'Haryana' },
  'Dharuhera': { lat: 28.20, lon: 76.79, state: 'Haryana' },
  'Bhiwadi': { lat: 28.21, lon: 76.86, state: 'Rajasthan' },
  'Jhajjar': { lat: 28.61, lon: 76.66, state: 'Haryana' },

  // --- Haryana ---
  'Sonipat': { lat: 28.99, lon: 77.02, state: 'Haryana' },
  'Panipat': { lat: 29.39, lon: 76.97, state: 'Haryana' },
  'Karnal': { lat: 29.69, lon: 76.99, state: 'Haryana' },
  'Kurukshetra': { lat: 29.97, lon: 76.88, state: 'Haryana' },
  'Ambala': { lat: 30.38, lon: 76.78, state: 'Haryana' },
  'Kaithal': { lat: 29.80, lon: 76.40, state: 'Haryana' },
  'Jagadhri': { lat: 30.17, lon: 77.30, state: 'Haryana' },
  'Shahabad': { lat: 30.17, lon: 76.87, state: 'Haryana' },
  'Hisar': { lat: 29.15, lon: 75.72, state: 'Haryana' },
  'Rohtak': { lat: 28.90, lon: 76.61, state: 'Haryana' },
  'Mahendragarh': { lat: 28.28, lon: 76.15, state: 'Haryana' },
  'Narnaul': { lat: 28.04, lon: 76.11, state: 'Haryana' },
  'Panchkula': { lat: 30.69, lon: 76.85, state: 'Haryana' },

  // --- Punjab + Chandigarh ---
  'Ludhiana': { lat: 30.90, lon: 75.86, state: 'Punjab' },
  'Jalandhar': { lat: 31.33, lon: 75.58, state: 'Punjab' },
  'Amritsar': { lat: 31.63, lon: 74.87, state: 'Punjab' },
  'Patiala': { lat: 30.34, lon: 76.39, state: 'Punjab' },
  'Bathinda': { lat: 30.21, lon: 74.95, state: 'Punjab' },
  'Mohali': { lat: 30.70, lon: 76.72, state: 'Punjab' },
  'Rupnagar': { lat: 30.97, lon: 76.53, state: 'Punjab' },
  'Sangrur': { lat: 30.25, lon: 75.84, state: 'Punjab' },
  'Hoshiarpur': { lat: 31.53, lon: 75.91, state: 'Punjab' },
  'Kapurthala': { lat: 31.38, lon: 75.38, state: 'Punjab' },
  'Pathankot': { lat: 32.27, lon: 75.65, state: 'Punjab' },
  'Abohar': { lat: 30.14, lon: 74.20, state: 'Punjab' },
  'Faridkot': { lat: 30.67, lon: 74.76, state: 'Punjab' },
  'Chandigarh': { lat: 30.73, lon: 76.78, state: 'Chandigarh' },

  // --- Himachal ---
  'Solan': { lat: 30.91, lon: 77.10, state: 'Himachal Pradesh' },
  'Baddi': { lat: 30.96, lon: 76.79, state: 'Himachal Pradesh' },
  'Bilaspur': { lat: 31.33, lon: 76.76, state: 'Himachal Pradesh' },
  'Hamirpur': { lat: 31.68, lon: 76.52, state: 'Himachal Pradesh' },
  'Kangra': { lat: 32.10, lon: 76.27, state: 'Himachal Pradesh' },

  // --- Uttarakhand ---
  'Dehradun': { lat: 30.32, lon: 78.03, state: 'Uttarakhand' },
  'Haridwar': { lat: 29.95, lon: 78.16, state: 'Uttarakhand' },
  'Rishikesh': { lat: 30.10, lon: 78.29, state: 'Uttarakhand' },
  'Roorkee': { lat: 29.87, lon: 77.89, state: 'Uttarakhand' },
  'Haldwani': { lat: 29.22, lon: 79.51, state: 'Uttarakhand' },
  'Kichha': { lat: 28.91, lon: 79.52, state: 'Uttarakhand' },
  'Rudrapur': { lat: 28.98, lon: 79.40, state: 'Uttarakhand' },
  'Tanakpur': { lat: 29.07, lon: 80.11, state: 'Uttarakhand' },
  'Bageshwar': { lat: 29.84, lon: 79.77, state: 'Uttarakhand' },
  'Pauri Garhwal': { lat: 30.15, lon: 78.78, state: 'Uttarakhand' },

  // --- J&K / Ladakh ---
  'Jammu': { lat: 32.73, lon: 74.86, state: 'Jammu and Kashmir' },
  'Srinagar': { lat: 34.08, lon: 74.80, state: 'Jammu and Kashmir' },
  'Anantnag': { lat: 33.73, lon: 75.15, state: 'Jammu and Kashmir' },
  'Budgam': { lat: 34.02, lon: 74.72, state: 'Jammu and Kashmir' },
  'Kathua': { lat: 32.37, lon: 75.52, state: 'Jammu and Kashmir' },
  'Kargil': { lat: 34.56, lon: 76.13, state: 'Ladakh' },

  // --- Uttar Pradesh ---
  'Lucknow': { lat: 26.85, lon: 80.95, state: 'Uttar Pradesh' },
  'Kanpur': { lat: 26.45, lon: 80.33, state: 'Uttar Pradesh' },
  'Agra': { lat: 27.18, lon: 78.01, state: 'Uttar Pradesh' },
  'Aligarh': { lat: 27.90, lon: 78.08, state: 'Uttar Pradesh' },
  'Firozabad': { lat: 27.15, lon: 78.40, state: 'Uttar Pradesh' },
  'Bareilly': { lat: 28.37, lon: 79.43, state: 'Uttar Pradesh' },
  'Moradabad': { lat: 28.84, lon: 78.77, state: 'Uttar Pradesh' },
  'Bijnor': { lat: 29.37, lon: 78.14, state: 'Uttar Pradesh' },
  'Bulandshahr': { lat: 28.40, lon: 77.85, state: 'Uttar Pradesh' },
  'Muzaffarnagar': { lat: 29.47, lon: 77.70, state: 'Uttar Pradesh' },
  'Meerut': { lat: 28.98, lon: 77.71, state: 'Uttar Pradesh' },
  'Saharanpur': { lat: 29.97, lon: 77.55, state: 'Uttar Pradesh' },
  'Hardoi': { lat: 27.42, lon: 80.11, state: 'Uttar Pradesh' },
  'Banda': { lat: 25.48, lon: 80.33, state: 'Uttar Pradesh' },
  'Fatehpur': { lat: 25.93, lon: 80.80, state: 'Uttar Pradesh' },
  'Azamgarh': { lat: 26.07, lon: 83.19, state: 'Uttar Pradesh' },
  'Kaushambi': { lat: 25.53, lon: 81.38, state: 'Uttar Pradesh' },
  'Kabrai': { lat: 25.40, lon: 79.99, state: 'Uttar Pradesh' },
  'Varanasi': { lat: 25.32, lon: 82.97, state: 'Uttar Pradesh' },

  // --- Rajasthan ---
  'Jaipur': { lat: 26.91, lon: 75.79, state: 'Rajasthan' },
  'Ajmer': { lat: 26.45, lon: 74.64, state: 'Rajasthan' },
  'Kota': { lat: 25.21, lon: 75.86, state: 'Rajasthan' },
  'Udaipur': { lat: 24.58, lon: 73.71, state: 'Rajasthan' },
  'Bhilwara': { lat: 25.35, lon: 74.64, state: 'Rajasthan' },
  'Jodhpur': { lat: 26.24, lon: 73.02, state: 'Rajasthan' },
  'Bikaner': { lat: 28.02, lon: 73.31, state: 'Rajasthan' },
  'Jaisalmer': { lat: 26.92, lon: 70.91, state: 'Rajasthan' },
  'Sri Ganganagar': { lat: 29.92, lon: 73.88, state: 'Rajasthan' },
  'Sikar': { lat: 27.62, lon: 75.14, state: 'Rajasthan' },
  'Churu': { lat: 28.30, lon: 74.97, state: 'Rajasthan' },
  'Jhunjhunu': { lat: 28.13, lon: 75.40, state: 'Rajasthan' },
  'Dungarpur': { lat: 23.84, lon: 73.71, state: 'Rajasthan' },
  'Banswara': { lat: 23.55, lon: 74.44, state: 'Rajasthan' },

  // --- Gujarat ---
  'Ahmedabad': { lat: 23.03, lon: 72.58, state: 'Gujarat' },
  'Rajkot': { lat: 22.30, lon: 70.80, state: 'Gujarat' },
  'Himmatnagar': { lat: 23.60, lon: 72.96, state: 'Gujarat' },
  'Halvad': { lat: 23.02, lon: 71.18, state: 'Gujarat' },
  'Gandhidham': { lat: 23.08, lon: 70.13, state: 'Gujarat' },
};

/** Dispatch hubs (the branch column), used as the distance origin. */
export const HUB_GEO: Record<string, CityGeo> = {
  'Sonipat': CITY_GEO['Sonipat'],
  'Lucknow': CITY_GEO['Lucknow'],
  'Gandhidham': CITY_GEO['Gandhidham'],
  'Varanasi': CITY_GEO['Varanasi'],
};

/** Collapse a raw sheet value to one canonical town name. */
export function normaliseDestination(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (!trimmed) return null;

  const fixed = SPELLING_FIXES[trimmed.toLowerCase()];
  if (fixed) return fixed;

  // Title-case so DELHI, delhi and Delhi collapse to one entry.
  return trimmed
    .toLowerCase()
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function haversineKm(a: CityGeo, b: CityGeo): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(s));
}

/** Approximate road km from hub to destination, or null if either is unmapped. */
export function roadKm(branch: string | null, destination: string | null): number | null {
  if (!branch || !destination) return null;
  const hub = HUB_GEO[branch] ?? CITY_GEO[branch];
  const dest = CITY_GEO[destination];
  if (!hub || !dest) return null;
  return Math.round(haversineKm(hub, dest) * ROAD_FACTOR);
}

export const DISTANCE_BANDS = ['0-100 km', '101-250 km', '251-400 km', '400+ km', 'Unmapped'] as const;
export type DistanceBand = (typeof DISTANCE_BANDS)[number];

export function distanceBand(km: number | null): DistanceBand {
  if (km === null) return 'Unmapped';
  if (km <= 100) return '0-100 km';
  if (km <= 250) return '101-250 km';
  if (km <= 400) return '251-400 km';
  return '400+ km';
}

const STATE_ZONE: Record<string, string> = {
  'Haryana': 'Haryana (non-NCR)',
  'Punjab': 'Punjab + Chandigarh',
  'Chandigarh': 'Punjab + Chandigarh',
  'Himachal Pradesh': 'Himachal',
  'Uttarakhand': 'Uttarakhand',
  'Jammu and Kashmir': 'J&K / Ladakh',
  'Ladakh': 'J&K / Ladakh',
  'Uttar Pradesh': 'Uttar Pradesh',
  'Rajasthan': 'Rajasthan',
  'Gujarat': 'Gujarat',
  'Delhi': 'Delhi NCR',
};

/** Zone bucket for the zone-wise view. Unmapped towns group as Other. */
export function zoneOf(destination: string | null): string {
  if (!destination) return 'Other';
  if (NCR_CORE.has(destination)) return 'Delhi NCR';
  const geo = CITY_GEO[destination];
  if (!geo) return 'Other';
  return STATE_ZONE[geo.state] ?? 'Other';
}
