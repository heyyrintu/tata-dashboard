import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRangeData } from '../hooks/useRangeData';
import { Skeleton } from './ui/skeleton';
import { formatLoad } from '../utils/rangeCalculations';
import { geocodeAllLocations } from '../utils/geocoding';
import { useTheme } from '../context/ThemeContext';
import { RANGE_COLORS } from '../utils/constants';

interface LocationData {
  name: string;
  indentCount: number;
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

// Component to handle map resize
function MapResizeHandler() {
  const map = useMap();
  
  useEffect(() => {
    // Trigger resize after a short delay to ensure container is rendered
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [map]);
  
  return null;
}

export default function IndiaMap() {
  const { data, loading } = useRangeData();
  const { theme } = useTheme();
  const [locationMarkers, setLocationMarkers] = useState<Array<LocationData & { lat: number; lng: number }>>([]);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    if (!data || !data.locations || data.locations.length === 0) {
      setLocationMarkers([]);
      return;
    }

    const geocodeLocations = async () => {
      setGeocodingLoading(true);
      try {
        const locationNames = data.locations.map(loc => loc.name);
        const geocoded = await geocodeAllLocations(locationNames);
        
        const markers = data.locations.map(location => {
          const coords = geocoded.find(g => g.name === location.name);
          if (coords) {
            return { ...location, lat: coords.lat, lng: coords.lng };
          }
          return null;
        }).filter(Boolean) as Array<LocationData & { lat: number; lng: number }>;
        
        setLocationMarkers(markers);
        setMapKey(prev => prev + 1);
      } catch (error) {
        console.error('Geocoding error:', error);
      } finally {
        setGeocodingLoading(false);
      }
    };

    geocodeLocations();
  }, [data]);

  const rangeCircles = [
    { radius: 100000, color: RANGE_COLORS['0-100Km'] || '#E01E1F', fillOpacity: 0.1 },   // 100 km - Red
    { radius: 250000, color: RANGE_COLORS['101-250Km'] || '#FEA519', fillOpacity: 0.08 }, // 250 km - Orange/Yellow
    { radius: 400000, color: RANGE_COLORS['251-400Km'] || '#FF6B35', fillOpacity: 0.06 },  // 400 km - Orange-Red
    { radius: 600000, color: RANGE_COLORS['401-600Km'] || '#FF8C42', fillOpacity: 0.04 }, // 600 km - Light Orange
  ];

  return (
    <div className={`rounded-xl overflow-hidden mb-12 ${
      theme === 'light' 
        ? 'p-[3px] shadow-2xl' 
        : 'shadow-2xl border border-red-900/20'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.15), rgba(220, 38, 38, 0.15), rgba(185, 28, 28, 0.15))',
      boxShadow: '0 25px 50px -12px rgba(220, 38, 38, 0.25), 0 0 0 1px rgba(220, 38, 38, 0.05)'
    } : {}}>
      <div className={`rounded-xl p-8 flex flex-col backdrop-blur-sm transition-all duration-300 ${
        theme === 'light' ? 'bg-gradient-to-br from-white via-red-50/30 to-white border-0' : 'bg-white/95'
      }`} style={theme === 'light' ? { border: 'none' } : {}}>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <div className="w-2 h-10 bg-gradient-to-b from-red-500 via-red-600 to-red-700 rounded-full shadow-lg"></div>
              <div className="absolute inset-0 w-2 h-10 bg-gradient-to-b from-red-400 to-red-600 rounded-full opacity-50 blur-sm"></div>
            </div>
            <div className="flex-1 flex justify-between items-center">
              <h3 className={`text-2xl font-bold tracking-tight ${
                theme === 'light' ? 'text-gray-900' : 'text-gray-900'
              }`}>
                Delivery Locations Map
              </h3>
              {/* Distance Legend */}
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: RANGE_COLORS['0-100Km'] || '#E01E1F' }}></div>
                  <span className={theme === 'light' ? 'text-black' : 'text-black'}>0-100 Km</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: RANGE_COLORS['101-250Km'] || '#FEA519' }}></div>
                  <span className={theme === 'light' ? 'text-black' : 'text-white'}>101-250 Km</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: RANGE_COLORS['251-400Km'] || '#FF6B35' }}></div>
                  <span className={theme === 'light' ? 'text-black' : 'text-white'}>251-400 Km</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: RANGE_COLORS['401-600Km'] || '#FF8C42' }}></div>
                  <span className={theme === 'light' ? 'text-black' : 'text-white'}>401-600 Km</span>
                </div>
              </div>
            </div>
          </div>
          <div className="h-1.5 w-20 bg-gradient-to-r from-red-500 via-red-600 to-red-700 rounded-full ml-5 shadow-sm"></div>
        </div>
        <div className="flex-1 min-h-0" style={{ minHeight: '500px', height: '500px' }}>
      {(loading || geocodingLoading) ? (
        <div className="flex items-end gap-3 h-64 pt-4 px-4">
          {[40, 70, 55, 85, 35, 65, 50, 75].map((h, i) => (
            <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
          ))}
        </div>
      ) : !data || data.locations.length === 0 ? (
        <div className="text-center py-12 text-black flex items-center justify-center h-full">
          No data available for the selected date range
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ height: '500px', width: '100%' }}>
          <MapContainer
            key={mapKey}
            center={SONIPAT_CENTER}
            zoom={7}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
            whenReady={() => {
              // Map is ready
            }}
          >
            <MapResizeHandler />
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
                      <p className="font-semibold">Total Indents: {marker.indentCount}</p>
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
      </div>
    </div>
  );
}

