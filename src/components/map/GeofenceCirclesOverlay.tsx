import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface GeofenceZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
  isActive?: boolean;
}

interface GeofenceCirclesOverlayProps {
  map: L.Map | null;
  zones: GeofenceZone[];
  visible: boolean;
  activeZones?: string[];
}

export function useGeofenceCirclesOverlay({
  map,
  zones,
  visible,
  activeZones = [],
}: GeofenceCirclesOverlayProps) {
  const layersRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    if (!map) return;

    // Clear existing layers
    layersRef.current.forEach(layer => layer.remove());
    layersRef.current = [];

    if (!visible || zones.length === 0) return;

    zones.forEach((zone) => {
      const isActive = activeZones.includes(zone.id);
      
      // Outer glow
      const glowCircle = L.circle([zone.lat, zone.lng], {
        radius: zone.radius_m + 20,
        color: isActive ? 'hsl(142, 76%, 45%)' : 'hsl(38, 92%, 55%)',
        fillColor: isActive ? 'hsl(142, 76%, 45%)' : 'hsl(38, 92%, 55%)',
        fillOpacity: 0.08,
        weight: 0,
      }).addTo(map);
      layersRef.current.push(glowCircle);

      // Main circle
      const circle = L.circle([zone.lat, zone.lng], {
        radius: zone.radius_m,
        color: isActive ? 'hsl(142, 76%, 45%)' : 'hsl(38, 92%, 55%)',
        fillColor: isActive ? 'hsl(142, 76%, 45%)' : 'hsl(38, 92%, 55%)',
        fillOpacity: isActive ? 0.25 : 0.15,
        weight: 2,
        dashArray: '6, 4',
      }).addTo(map);

      circle.bindTooltip(`🛡️ ${zone.name}`, {
        permanent: false,
        direction: 'top',
        className: 'safety-tooltip',
      });

      layersRef.current.push(circle);

      // Center marker
      const markerIcon = L.divIcon({
        className: 'geofence-marker',
        html: `
          <div style="
            width: 24px; height: 24px;
            background: ${isActive ? 'hsl(142, 76%, 45%)' : 'hsl(38, 92%, 55%)'};
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: white; font-size: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 2px solid white;
          ">🛡️</div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([zone.lat, zone.lng], { icon: markerIcon }).addTo(map);
      layersRef.current.push(marker);
    });

    return () => {
      layersRef.current.forEach(layer => layer.remove());
      layersRef.current = [];
    };
  }, [map, zones, visible, activeZones]);
}
