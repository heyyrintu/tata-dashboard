import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRangeData } from '../hooks/useRangeData';
import { LoadingSpinner } from './LoadingSpinner';
import { formatLoad } from '../utils/rangeCalculations';
import { geocodeAllLocations } from '../utils/geocoding';

interface LocationData {
  name: string;
  tripCount: number;
  totalLoad: number;
  range: string;
  lat?: number;
  lng?: number;
}

// Fix default marker icons for Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const SONIPAT_CENTER: [number, number] = [28.9931, 77.0151];

export default function IndiaMap() {
  const { data, loading } = useRangeData();
  const [locationMarkers, setLocationMarkers] = useState<Array<LocationData & { lat: number; lng: number }>>([]);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    console.log('IndiaMap: data changed', data);
    
    if (!data || !data.locations || data.locations.length === 0) {
      console.log('IndiaMap: No data or locations available');
      setLocationMarkers([]);
      return;
    }

    console.log('IndiaMap: Starting geocoding for', data.locations.length, 'locations');

    const geocodeLocations = async () => {
      setGeocodingLoading(true);
      try {
        const locationNames = data.locations.map(loc => loc.name);
        console.log('IndiaMap: Geocoding locations:', locationNames);
        const geocoded = await geocodeAllLocations(locationNames);
        console.log('IndiaMap: Geocoded successfully, got', geocoded.length, 'coordinates');
        
        const markers = data.locations.map(location => {
          const coords = geocoded.find(g => g.name === location.name);
          if (coords) {
            return { ...location, lat: coords.lat, lng: coords.lng };
          }
          return null;
        }).filter(Boolean) as Array<LocationData & { lat: number; lng: number }>;
        
        console.log('IndiaMap: Created markers:', markers.length);
        setLocationMarkers(markers);
        setMapKey(prev => prev + 1); // Force map refresh
      } catch (error) {
        console.error('Geocoding error:', error);
      } finally {
        setGeocodingLoading(false);
      }
    };

    geocodeLocations();
  }, [data]);

  const rangeCircles = [
    { radius: 100000, color: '#22d3ee', fillOpacity: 0.1 },   // 100 km
    { radius: 250000, color: '#3b82f6', fillOpacity: 0.08 }, // 250 km
    { radius: 400000, color: '#8b5cf6', fillOpacity: 0.06 },  // 400 km
    { radius: 600000, color: '#a855f7', fillOpacity: 0.04 }, // 600 km
  ];

  return (
    <div className="glass-card rounded-2xl p-6 shadow-xl border border-blue-900/30" style={{ height: '612px' }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Delivery Locations Map</h2>
        
        {/* Distance Legend */}
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22d3ee' }}></div>
            <span className="text-white">0-100 Km</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
            <span className="text-white">101-250 Km</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8b5cf6' }}></div>
            <span className="text-white">251-400 Km</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#a855f7' }}></div>
            <span className="text-white">401-600 Km</span>
          </div>
        </div>
      </div>
      
      {(loading || geocodingLoading) ? (
        <div className="flex justify-center items-center" style={{ height: 'calc(612px - 3rem)' }}>
          <LoadingSpinner />
        </div>
      ) : !data || data.locations.length === 0 ? (
        <div className="text-center py-12 text-slate-400 flex items-center justify-center" style={{ height: 'calc(612px - 3rem)' }}>
          No data available for the selected date range
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden border-t-0" style={{ height: 'calc(612px - 3rem)', marginTop: '0' }}>
          <MapContainer
            key={mapKey}
            center={SONIPAT_CENTER}
            zoom={7}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
              
            {/* Range circles */}
            {rangeCircles.map((circle, index) => (
              <Circle
                key={index}
                center={SONIPAT_CENTER}
                radius={circle.radius}
                pathOptions={{
                  color: circle.color,
                  fillColor: circle.color,
                  fillOpacity: circle.fillOpacity,
                  weight: 2,
                }}
              >
                <Popup>
                  <span className="font-bold">{circle.radius / 1000} km radius</span>
                </Popup>
              </Circle>
            ))}

            {/* Sonipat center marker */}
            <Marker position={SONIPAT_CENTER}>
              <Popup>
                <span className="font-bold">Sonipat (Hub)</span>
              </Popup>
            </Marker>

            {/* Delivery location markers */}
            {locationMarkers.map((marker, index) => 
              marker.lat && marker.lng ? (
                <Marker key={index} position={[marker.lat, marker.lng]}>
                  <Popup>
                    <div className="text-sm text-slate-800">
                      <p className="font-semibold">Location: {marker.name}</p>
                      <p className="font-semibold">Total Trips: {marker.tripCount}</p>
                      <p className="font-semibold">Total Load: {formatLoad(marker.totalLoad)} Kgs</p>
                      <p className="font-semibold">Range: {marker.range}</p>
                    </div>
                  </Popup>
                </Marker>
              ) : null
            )}
          </MapContainer>
        </div>
      )}
    </div>
  );
}

