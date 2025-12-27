import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

export interface SafetyZone {
  id: string;
  type: 'well_lit' | 'busy_street' | 'police_station' | 'hospital' | 'metro_station' | 'safe_area' | 'caution_area';
  center: [number, number];
  radius: number;
  name?: string;
  safety_score?: number;
}

// Fallback safety data for Paris when backend is unavailable
const FALLBACK_SAFETY_ZONES: SafetyZone[] = [
  { id: 'metro-1', type: 'metro_station', center: [48.8530, 2.3499], radius: 100, name: 'Châtelet' },
  { id: 'metro-2', type: 'metro_station', center: [48.8738, 2.2950], radius: 100, name: 'Charles de Gaulle Étoile' },
  { id: 'metro-3', type: 'metro_station', center: [48.8445, 2.3740], radius: 100, name: 'Bastille' },
  { id: 'police-1', type: 'police_station', center: [48.8535, 2.3478], radius: 150, name: 'Commissariat 1er' },
  { id: 'hospital-1', type: 'hospital', center: [48.8333, 2.3488], radius: 200, name: 'Hôpital Cochin' },
  { id: 'lit-1', type: 'well_lit', center: [48.8566, 2.3522], radius: 300, name: 'Île de la Cité' },
  { id: 'lit-2', type: 'well_lit', center: [48.8606, 2.3376], radius: 400, name: 'Les Halles' },
  { id: 'busy-1', type: 'busy_street', center: [48.8690, 2.3321], radius: 250, name: 'Boulevard Haussmann' },
  { id: 'busy-2', type: 'busy_street', center: [48.8530, 2.3700], radius: 300, name: 'Le Marais' },
];

export interface SafetyOverlay {
  id: string;
  type: SafetyZone['type'];
  center: [number, number];
  radius: number;
  name?: string;
  color: string;
  fillOpacity: number;
}

const getApiUrl = (): string | null => {
  try {
    return import.meta.env.VITE_ROUTING_API_URL || null;
  } catch {
    return null;
  }
};

export function useSafetyOverlays() {
  const { toast } = useToast();
  const [overlays, setOverlays] = useState<SafetyOverlay[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  const getOverlayConfig = (type: SafetyZone['type'], safetyScore?: number) => {
    switch (type) {
      case 'well_lit':
        return { color: 'hsl(45, 93%, 47%)', fillOpacity: 0.15 };
      case 'busy_street':
        return { color: 'hsl(142, 76%, 36%)', fillOpacity: 0.2 };
      case 'police_station':
        return { color: 'hsl(217, 91%, 60%)', fillOpacity: 0.3 };
      case 'hospital':
        return { color: 'hsl(0, 84%, 60%)', fillOpacity: 0.3 };
      case 'metro_station':
        return { color: 'hsl(270, 70%, 60%)', fillOpacity: 0.25 };
      case 'safe_area':
        return { color: 'hsl(142, 76%, 36%)', fillOpacity: 0.15 };
      case 'caution_area':
        return { color: 'hsl(0, 84%, 60%)', fillOpacity: 0.15 };
      default:
        // Use safety score for dynamic coloring if available
        if (safetyScore !== undefined) {
          const hue = safetyScore * 120; // 0 = red, 120 = green
          return { color: `hsl(${hue}, 70%, 50%)`, fillOpacity: 0.2 };
        }
        return { color: 'hsl(0, 0%, 50%)', fillOpacity: 0.2 };
    }
  };

  const convertToOverlays = (zones: SafetyZone[]): SafetyOverlay[] => {
    return zones.map((zone) => {
      const config = getOverlayConfig(zone.type, zone.safety_score);
      return {
        ...zone,
        ...config,
      };
    });
  };

  const loadOverlays = useCallback(async (center?: [number, number]) => {
    setLoading(true);
    
    const apiUrl = getApiUrl();
    
    if (apiUrl) {
      try {
        // Try to fetch from Python backend
        const lat = center?.[0] ?? 48.8566;
        const lng = center?.[1] ?? 2.3522;
        
        const response = await fetch(`${apiUrl}/api/safety-zones?lat=${lat}&lng=${lng}&radius=2000`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.zones && Array.isArray(data.zones)) {
            setOverlays(convertToOverlays(data.zones));
            setUsingFallback(false);
            setLoading(false);
            return;
          }
        }
        
        console.log("Backend safety zones not available, using fallback data");
      } catch (error) {
        console.log("Could not fetch safety zones from backend:", error);
      }
    }

    // Use fallback data
    setOverlays(convertToOverlays(FALLBACK_SAFETY_ZONES));
    setUsingFallback(true);
    setLoading(false);
    
    if (apiUrl) {
      toast({
        title: 'Using cached safety data',
        description: 'Live safety zones unavailable, showing sample data',
      });
    }
  }, [toast]);

  const toggleVisibility = useCallback(() => {
    if (!visible && overlays.length === 0) {
      loadOverlays();
    }
    setVisible((prev) => !prev);
  }, [visible, overlays.length, loadOverlays]);

  const refreshOverlays = useCallback((center: [number, number]) => {
    if (visible) {
      loadOverlays(center);
    }
  }, [visible, loadOverlays]);

  return {
    overlays: visible ? overlays : [],
    loading,
    visible,
    usingFallback,
    toggleVisibility,
    loadOverlays,
    refreshOverlays,
  };
}
