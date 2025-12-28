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

// Add CSS animation and Art Deco map styles to document
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

    /* Art Deco Map Styling */
    .leaflet-container {
      background: hsl(230, 25%, 7%) !important;
    }

    /* Custom tile filter for Art Deco amber warmth */
    .leaflet-tile-pane {
      filter: sepia(15%) saturate(120%) hue-rotate(-5deg) brightness(0.95);
    }

    /* Style zoom controls */
    .leaflet-control-zoom {
      border: none !important;
      background: transparent !important;
    }

    .leaflet-control-zoom a {
      background: hsl(230, 20%, 12%) !important;
      color: hsl(38, 92%, 55%) !important;
      border: 1px solid hsl(38, 92%, 55%, 0.3) !important;
      width: 36px !important;
      height: 36px !important;
      line-height: 36px !important;
      font-size: 18px !important;
      margin-bottom: 4px !important;
      border-radius: 8px !important;
      transition: all 0.2s ease !important;
      box-shadow: 0 4px 12px -2px hsl(0, 0%, 0%, 0.4) !important;
    }

    .leaflet-control-zoom a:hover {
      background: hsl(38, 92%, 55%, 0.15) !important;
      color: hsl(38, 92%, 65%) !important;
      border-color: hsl(38, 92%, 55%, 0.5) !important;
      transform: scale(1.05);
    }

    /* Attribution styling */
    .leaflet-control-attribution {
      background: hsl(230, 20%, 12%, 0.9) !important;
      color: hsl(230, 10%, 55%) !important;
      font-size: 10px !important;
      padding: 2px 8px !important;
      border-radius: 4px 0 0 0 !important;
    }

    .leaflet-control-attribution a {
      color: hsl(38, 92%, 55%) !important;
    }

    /* Safety tooltip styling */
    .safety-tooltip {
      background: hsl(230, 20%, 12%) !important;
      border: 1px solid hsl(38, 92%, 55%, 0.3) !important;
      color: hsl(45, 20%, 95%) !important;
      padding: 8px 12px !important;
      border-radius: 8px !important;
      font-family: 'DM Sans', sans-serif !important;
      font-size: 12px !important;
      box-shadow: 0 4px 20px -4px hsl(0, 0%, 0%, 0.5) !important;
    }

    .safety-tooltip::before {
      border-top-color: hsl(230, 20%, 12%) !important;
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
    police_station: `
      <div style="
        width: 32px; height: 32px;
        background: linear-gradient(135deg, hsl(217, 91%, 50%), hsl(217, 91%, 40%));
        border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 16px;
        box-shadow: 0 4px 12px -2px hsla(217, 91%, 40%, 0.5), 0 0 0 2px hsla(38, 92%, 55%, 0.2);
        border: 1px solid hsla(217, 91%, 70%, 0.3);
        transform: rotate(-2deg);
      ">🛡️</div>`,
    hospital: `
      <div style="
        width: 32px; height: 32px;
        background: linear-gradient(135deg, hsl(0, 72%, 55%), hsl(0, 72%, 45%));
        border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 16px;
        box-shadow: 0 4px 12px -2px hsla(0, 72%, 45%, 0.5), 0 0 0 2px hsla(38, 92%, 55%, 0.2);
        border: 1px solid hsla(0, 72%, 70%, 0.3);
        transform: rotate(1deg);
      ">🏥</div>`,
    metro_station: `
      <div style="
        width: 32px; height: 32px;
        background: linear-gradient(135deg, hsl(38, 92%, 50%), hsl(38, 85%, 40%));
        border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        color: hsl(230, 25%, 7%); font-size: 14px; font-weight: 800;
        font-family: 'Syne', sans-serif;
        box-shadow: 0 4px 12px -2px hsla(38, 92%, 45%, 0.5), 0 0 0 2px hsla(38, 92%, 55%, 0.3);
        border: 1px solid hsla(38, 92%, 70%, 0.4);
        letter-spacing: -1px;
      ">M</div>`,
    pharmacy: `
      <div style="
        width: 32px; height: 32px;
        background: linear-gradient(135deg, hsl(160, 60%, 45%), hsl(160, 60%, 35%));
        border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 18px; font-weight: bold;
        box-shadow: 0 4px 12px -2px hsla(160, 60%, 35%, 0.5), 0 0 0 2px hsla(38, 92%, 55%, 0.2);
        border: 1px solid hsla(160, 60%, 60%, 0.3);
      ">+</div>`,
    cafe: `
      <div style="
        width: 32px; height: 32px;
        background: linear-gradient(135deg, hsl(30, 70%, 45%), hsl(30, 70%, 35%));
        border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 16px;
        box-shadow: 0 4px 12px -2px hsla(30, 70%, 35%, 0.5), 0 0 0 2px hsla(38, 92%, 55%, 0.2);
        border: 1px solid hsla(30, 70%, 60%, 0.3);
      ">☕</div>`,
  };
  return icons[type] || '';
}
