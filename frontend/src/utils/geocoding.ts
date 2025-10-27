import axios from 'axios';

interface GeocodeCache {
  [location: string]: { lat: number; lng: number };
}

const geocodeCache: GeocodeCache = {};

export const geocodeLocation = async (locationName: string): Promise<{ lat: number; lng: number } | null> => {
  // Check cache first
  if (geocodeCache[locationName]) {
    return geocodeCache[locationName];
  }

  try {
    // Using Nominatim (OpenStreetMap) - Free
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search`,
      {
        params: {
          q: `${locationName}, India`,
          format: 'json',
          limit: 1,
        },
      }
    );

    if (response.data && response.data.length > 0) {
      const coords = {
        lat: parseFloat(response.data[0].lat),
        lng: parseFloat(response.data[0].lon),
      };

      geocodeCache[locationName] = coords;
      return coords;
    }
  } catch (error) {
    console.error(`Geocoding failed for ${locationName}:`, error);
  }

  return null;
};

export const geocodeAllLocations = async (
  locations: string[]
): Promise<Array<{ name: string; lat: number; lng: number }>> => {
  const uniqueLocations = [...new Set(locations)].filter(loc => loc && loc.trim());
  const geocoded: Array<{ name: string; lat: number; lng: number }> = [];

  for (const location of uniqueLocations) {
    const coords = await geocodeLocation(location);
    if (coords) {
      geocoded.push({ name: location, ...coords });
    }
    // Add 1 second delay to respect API rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return geocoded;
};

