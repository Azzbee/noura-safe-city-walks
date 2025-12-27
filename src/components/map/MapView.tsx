import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons in Leaflet with React
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom markers
const userIcon = L.divIcon({
  className: 'user-marker',
  html: `<div class="w-4 h-4 bg-fastest rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const destinationIcon = L.divIcon({
  className: 'destination-marker',
  html: `<div class="w-5 h-5 bg-danger rounded-full border-2 border-white shadow-lg flex items-center justify-center">
    <div class="w-2 h-2 bg-white rounded-full"></div>
  </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface MapControllerProps {
  center: [number, number];
  zoom?: number;
}

function MapController({ center, zoom = 15 }: MapControllerProps) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
}

export interface RouteDisplay {
  geometry: [number, number][];
  color: string;
  opacity?: number;
  weight?: number;
}

interface MapViewProps {
  center: [number, number];
  userLocation?: [number, number];
  destination?: [number, number];
  routes?: RouteDisplay[];
  zoom?: number;
  className?: string;
}

export default function MapView({
  center,
  userLocation,
  destination,
  routes = [],
  zoom = 15,
  className = '',
}: MapViewProps) {
  const mapRef = useRef<L.Map>(null);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={`w-full h-full ${className}`}
      ref={mapRef}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      
      <MapController center={center} zoom={zoom} />

      {/* Routes */}
      {routes.map((route, index) => (
        <Polyline
          key={index}
          positions={route.geometry}
          color={route.color}
          opacity={route.opacity ?? 0.8}
          weight={route.weight ?? 5}
        />
      ))}

      {/* User location marker */}
      {userLocation && (
        <Marker position={userLocation} icon={userIcon} />
      )}

      {/* Destination marker */}
      {destination && (
        <Marker position={destination} icon={destinationIcon} />
      )}
    </MapContainer>
  );
}
