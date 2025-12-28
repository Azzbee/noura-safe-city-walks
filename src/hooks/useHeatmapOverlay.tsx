import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { SafetyOverlay } from '@/hooks/useSafetyOverlays';
import { CrimeAlert } from '@/hooks/useCrimeAlerts';

// Extend Leaflet types for heatmap
declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: {
      minOpacity?: number;
      maxZoom?: number;
      max?: number;
      radius?: number;
      blur?: number;
      gradient?: { [key: number]: string };
    }
  ): L.Layer;
}

interface UseHeatmapOverlayProps {
  map: L.Map | null;
  safetyOverlays: SafetyOverlay[];
  crimeAlerts: CrimeAlert[];
  enabled: boolean;
}

export function useHeatmapOverlay({
  map,
  safetyOverlays,
  crimeAlerts,
  enabled,
}: UseHeatmapOverlayProps) {
  const heatLayerRef = useRef<L.Layer | null>(null);

  // Generate heatmap points from safety overlays and crime alerts
  const generateHeatPoints = useCallback(() => {
    const points: Array<[number, number, number]> = [];

    // Add points from safety overlays (danger zones and caution areas)
    safetyOverlays.forEach((overlay) => {
      if (overlay.type === 'danger_zone') {
        // High intensity for danger zones
        points.push([overlay.center[0], overlay.center[1], 1.0]);
        // Add surrounding points for larger coverage
        const offset = overlay.radius / 111000; // Convert meters to degrees approx
        points.push([overlay.center[0] + offset * 0.5, overlay.center[1], 0.7]);
        points.push([overlay.center[0] - offset * 0.5, overlay.center[1], 0.7]);
        points.push([overlay.center[0], overlay.center[1] + offset * 0.5, 0.7]);
        points.push([overlay.center[0], overlay.center[1] - offset * 0.5, 0.7]);
      } else if (overlay.type === 'caution_area') {
        // Medium intensity for caution areas
        points.push([overlay.center[0], overlay.center[1], 0.6]);
      }
    });

    // Add points from crime alerts
    crimeAlerts.forEach((alert) => {
      const intensity = alert.severity === 'high' ? 1.0 : alert.severity === 'medium' ? 0.7 : 0.4;
      points.push([alert.lat, alert.lng, intensity]);
    });

    return points;
  }, [safetyOverlays, crimeAlerts]);

  // Update heatmap layer
  useEffect(() => {
    if (!map) return;

    // Remove existing heatmap layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (!enabled) return;

    const points = generateHeatPoints();
    if (points.length === 0) return;

    // Create heatmap layer with custom gradient
    heatLayerRef.current = L.heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 17,
      max: 1.0,
      minOpacity: 0.3,
      gradient: {
        0.0: 'hsl(142, 76%, 36%)',    // Safe green
        0.25: 'hsl(45, 93%, 47%)',     // Warning yellow
        0.5: 'hsl(25, 95%, 53%)',      // Caution orange
        0.75: 'hsl(0, 84%, 60%)',      // Danger red
        1.0: 'hsl(0, 84%, 40%)',       // Critical dark red
      },
    }).addTo(map);

    return () => {
      if (heatLayerRef.current && map) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map, enabled, generateHeatPoints]);

  return {
    isEnabled: enabled,
    pointCount: generateHeatPoints().length,
  };
}
