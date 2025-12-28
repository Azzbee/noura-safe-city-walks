import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SafetyOverlay } from '@/hooks/useSafetyOverlays';

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
  safetyOverlays?: SafetyOverlay[];
  zoom?: number;
  className?: string;
}

export default function MapView({
  center,
  userLocation,
  destination,
  routes = [],
  safetyOverlays = [],
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

  // Routes with glowing animated trails
  useEffect(() => {
    if (!map || !mapReady) return;

    const polylines: L.Polyline[] = [];
    
    routes.forEach((route) => {
      // Outer glow layer
      const glowOuter = L.polyline(route.geometry, {
        color: route.color,
        opacity: 0.15,
        weight: (route.weight ?? 5) + 12,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
      polylines.push(glowOuter);

      // Middle glow layer
      const glowMiddle = L.polyline(route.geometry, {
        color: route.color,
        opacity: 0.3,
        weight: (route.weight ?? 5) + 6,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
      polylines.push(glowMiddle);

      // Main route line
      const mainLine = L.polyline(route.geometry, {
        color: route.color,
        opacity: route.opacity ?? 0.9,
        weight: route.weight ?? 5,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
      polylines.push(mainLine);

      // Animated dashed overlay for active routes
      const animatedDash = L.polyline(route.geometry, {
        color: '#ffffff',
        opacity: 0.4,
        weight: 2,
        dashArray: '8, 16',
        lineCap: 'round',
        lineJoin: 'round',
        className: 'animated-route',
      }).addTo(map);
      polylines.push(animatedDash);
    });

    return () => {
      polylines.forEach((p) => p.remove());
    };
  }, [map, mapReady, routes]);

  // Safety overlays
  useEffect(() => {
    if (!map || !mapReady) return;

    const circles: L.Circle[] = [];
    const markers: L.Marker[] = [];

    safetyOverlays.forEach((overlay) => {
      // Add circle for the zone
      const circle = L.circle(overlay.center, {
        radius: overlay.radius,
        color: overlay.color,
        fillColor: overlay.color,
        fillOpacity: overlay.fillOpacity,
        weight: 1,
      }).addTo(map);
      circles.push(circle);

      // Add icon marker for POIs (police, hospital, metro)
      if (['police_station', 'hospital', 'metro_station'].includes(overlay.type)) {
        const iconHtml = getOverlayIcon(overlay.type);
        const icon = L.divIcon({
          className: 'safety-marker',
          html: iconHtml,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker(overlay.center, { icon })
          .bindTooltip(overlay.name || '', { 
            permanent: false, 
            direction: 'top',
            className: 'safety-tooltip',
          })
          .addTo(map);
        markers.push(marker);
      }
    });

    return () => {
      circles.forEach((c) => c.remove());
      markers.forEach((m) => m.remove());
    };
  }, [map, mapReady, safetyOverlays]);

  return (
    <div 
      id="map-container" 
      className={`w-full h-full ${className}`}
    />
  );
}

function getOverlayIcon(type: string): string {
  const icons: Record<string, string> = {
    police_station: `<div style="width: 24px; height: 24px; background: hsl(217, 91%, 60%); border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🛡</div>`,
    hospital: `<div style="width: 24px; height: 24px; background: hsl(0, 84%, 60%); border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🏥</div>`,
    metro_station: `<div style="width: 24px; height: 24px; background: hsl(270, 70%, 60%); border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">M</div>`,
  };
  return icons[type] || '';
}
