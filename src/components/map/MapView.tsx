import { useEffect, useState, useRef } from 'react';
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
  locationTrail?: [number, number][];
  isJourneyActive?: boolean;
  zoom?: number;
  className?: string;
}

// Create animated user marker HTML
function createUserMarkerHTML(isActive: boolean): string {
  const baseColor = isActive ? 'hsl(38, 92%, 55%)' : 'hsl(217, 91%, 60%)';
  const pulseColor = isActive ? 'hsl(38, 92%, 55%)' : 'hsl(217, 91%, 60%)';
  
  return `
    <div class="user-marker-container" style="position: relative; width: 40px; height: 40px;">
      <!-- Outer pulse ring -->
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: ${pulseColor};
        opacity: 0.2;
        animation: user-pulse 2s ease-out infinite;
      "></div>
      <!-- Inner pulse ring -->
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: ${pulseColor};
        opacity: 0.3;
        animation: user-pulse 2s ease-out infinite 0.5s;
      "></div>
      <!-- Main marker -->
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 18px;
        height: 18px;
        background: ${baseColor};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 20px ${pulseColor}40;
      "></div>
      <!-- Direction indicator (arrow) when active -->
      ${isActive ? `
        <div style="
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-bottom: 10px solid ${baseColor};
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
        "></div>
      ` : ''}
    </div>
  `;
}

// Add CSS animation styles to document
function injectMarkerStyles(): void {
  const styleId = 'noura-marker-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes user-pulse {
      0% {
        transform: translate(-50%, -50%) scale(0.5);
        opacity: 0.4;
      }
      100% {
        transform: translate(-50%, -50%) scale(1.5);
        opacity: 0;
      }
    }
    
    @keyframes trail-glow {
      0%, 100% {
        stroke-opacity: 0.6;
        filter: drop-shadow(0 0 4px currentColor);
      }
      50% {
        stroke-opacity: 0.9;
        filter: drop-shadow(0 0 8px currentColor);
      }
    }
    
    .location-trail {
      animation: trail-glow 2s ease-in-out infinite;
    }
  `;
  document.head.appendChild(style);
}

export default function MapView({
  center,
  userLocation,
  destination,
  routes = [],
  safetyOverlays = [],
  locationTrail = [],
  isJourneyActive = false,
  zoom = 15,
  className = '',
}: MapViewProps) {
  const [map, setMap] = useState<L.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const trailLayerRef = useRef<L.Polyline[]>([]);

  // Inject marker animation styles
  useEffect(() => {
    injectMarkerStyles();
  }, []);

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

  // Animated user location marker
  useEffect(() => {
    if (!map || !mapReady) return;

    // Remove existing marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-marker-wrapper',
        html: createUserMarkerHTML(isJourneyActive),
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      userMarkerRef.current = L.marker(userLocation, { 
        icon: userIcon,
        zIndexOffset: 1000, // Keep on top
      }).addTo(map);
    }

    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    };
  }, [map, mapReady, userLocation, isJourneyActive]);

  // Location trail during active journey
  useEffect(() => {
    if (!map || !mapReady) return;

    // Clear existing trail
    trailLayerRef.current.forEach(layer => layer.remove());
    trailLayerRef.current = [];

    if (locationTrail.length > 1 && isJourneyActive) {
      // Gradient trail effect - older segments are more transparent
      const segmentCount = Math.min(locationTrail.length - 1, 20);
      
      for (let i = Math.max(0, locationTrail.length - segmentCount - 1); i < locationTrail.length - 1; i++) {
        const opacity = 0.2 + (0.6 * (i - (locationTrail.length - segmentCount - 1)) / segmentCount);
        const segment = [locationTrail[i], locationTrail[i + 1]];
        
        // Glow layer
        const glowLine = L.polyline(segment, {
          color: 'hsl(38, 92%, 55%)',
          opacity: opacity * 0.4,
          weight: 12,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);
        trailLayerRef.current.push(glowLine);

        // Main trail line
        const mainLine = L.polyline(segment, {
          color: 'hsl(38, 92%, 55%)',
          opacity: opacity,
          weight: 4,
          lineCap: 'round',
          lineJoin: 'round',
          className: 'location-trail',
        }).addTo(map);
        trailLayerRef.current.push(mainLine);
      }
    }

    return () => {
      trailLayerRef.current.forEach(layer => layer.remove());
      trailLayerRef.current = [];
    };
  }, [map, mapReady, locationTrail, isJourneyActive]);

  // Destination marker
  useEffect(() => {
    if (!map || !mapReady) return;

    const destIcon = L.divIcon({
      className: 'destination-marker',
      html: `
        <div style="position: relative; width: 32px; height: 32px;">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 32px;
            height: 32px;
            background: hsl(0, 72%, 63%);
            opacity: 0.2;
            border-radius: 50%;
            animation: user-pulse 2s ease-out infinite;
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 22px;
            height: 22px;
            background: hsl(0, 72%, 63%);
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
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
