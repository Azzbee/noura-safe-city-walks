import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons in Leaflet with React
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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
  const [map, setMap] = useState<L.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    const container = document.getElementById('map-container');
    if (!container || map) return;

    const leafletMap = L.map(container, {
      center: center,
      zoom: zoom,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(leafletMap);

    setMap(leafletMap);
    setMapReady(true);

    return () => {
      leafletMap.remove();
    };
  }, []);

  // Update center/zoom
  useEffect(() => {
    if (!map) return;
    map.setView(center, zoom);
  }, [map, center, zoom]);

  // User location marker
  useEffect(() => {
    if (!map || !mapReady) return;

    const userIcon = L.divIcon({
      className: 'user-marker',
      html: `<div style="width: 16px; height: 16px; background: hsl(217, 91%, 60%); border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    let marker: L.Marker | null = null;
    if (userLocation) {
      marker = L.marker(userLocation, { icon: userIcon }).addTo(map);
    }

    return () => {
      if (marker) marker.remove();
    };
  }, [map, mapReady, userLocation]);

  // Destination marker
  useEffect(() => {
    if (!map || !mapReady) return;

    const destIcon = L.divIcon({
      className: 'destination-marker',
      html: `<div style="width: 20px; height: 20px; background: hsl(0, 84%, 60%); border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
        <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
      </div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    let marker: L.Marker | null = null;
    if (destination) {
      marker = L.marker(destination, { icon: destIcon }).addTo(map);
    }

    return () => {
      if (marker) marker.remove();
    };
  }, [map, mapReady, destination]);

  // Routes
  useEffect(() => {
    if (!map || !mapReady) return;

    const polylines: L.Polyline[] = [];
    routes.forEach((route) => {
      const polyline = L.polyline(route.geometry, {
        color: route.color,
        opacity: route.opacity ?? 0.8,
        weight: route.weight ?? 5,
      }).addTo(map);
      polylines.push(polyline);
    });

    return () => {
      polylines.forEach((p) => p.remove());
    };
  }, [map, mapReady, routes]);

  return (
    <div 
      id="map-container" 
      className={`w-full h-full ${className}`}
    />
  );
}
