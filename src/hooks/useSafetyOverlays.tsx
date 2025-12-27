import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SafetyZone {
  id: string;
  type: 'well_lit' | 'busy_street' | 'police_station' | 'hospital' | 'metro_station';
  center: [number, number];
  radius: number;
  name?: string;
}

// Sample safety data for Paris - in production this would come from the backend
const PARIS_SAFETY_ZONES: SafetyZone[] = [
  // Metro stations (safe points)
  { id: 'metro-1', type: 'metro_station', center: [48.8530, 2.3499], radius: 100, name: 'Châtelet' },
  { id: 'metro-2', type: 'metro_station', center: [48.8738, 2.2950], radius: 100, name: 'Charles de Gaulle Étoile' },
  { id: 'metro-3', type: 'metro_station', center: [48.8445, 2.3740], radius: 100, name: 'Bastille' },
  { id: 'metro-4', type: 'metro_station', center: [48.8809, 2.3553], radius: 100, name: 'Gare du Nord' },
  { id: 'metro-5', type: 'metro_station', center: [48.8417, 2.3215], radius: 100, name: 'Montparnasse' },
  
  // Police stations
  { id: 'police-1', type: 'police_station', center: [48.8535, 2.3478], radius: 150, name: 'Commissariat 1er' },
  { id: 'police-2', type: 'police_station', center: [48.8606, 2.3376], radius: 150, name: 'Commissariat 2ème' },
  { id: 'police-3', type: 'police_station', center: [48.8772, 2.3287], radius: 150, name: 'Commissariat 9ème' },
  
  // Hospitals
  { id: 'hospital-1', type: 'hospital', center: [48.8333, 2.3488], radius: 200, name: 'Hôpital Cochin' },
  { id: 'hospital-2', type: 'hospital', center: [48.8462, 2.3625], radius: 200, name: 'Hôpital Saint-Antoine' },
  { id: 'hospital-3', type: 'hospital', center: [48.8396, 2.2828], radius: 200, name: 'Hôpital Necker' },
  
  // Well-lit areas (major boulevards and popular areas)
  { id: 'lit-1', type: 'well_lit', center: [48.8566, 2.3522], radius: 300, name: 'Île de la Cité' },
  { id: 'lit-2', type: 'well_lit', center: [48.8606, 2.3376], radius: 400, name: 'Les Halles' },
  { id: 'lit-3', type: 'well_lit', center: [48.8867, 2.3431], radius: 350, name: 'Montmartre' },
  { id: 'lit-4', type: 'well_lit', center: [48.8584, 2.2945], radius: 350, name: 'Trocadéro' },
  { id: 'lit-5', type: 'well_lit', center: [48.8738, 2.2950], radius: 300, name: 'Champs-Élysées' },
  
  // Busy streets (major commercial areas)
  { id: 'busy-1', type: 'busy_street', center: [48.8690, 2.3321], radius: 250, name: 'Boulevard Haussmann' },
  { id: 'busy-2', type: 'busy_street', center: [48.8530, 2.3700], radius: 300, name: 'Le Marais' },
  { id: 'busy-3', type: 'busy_street', center: [48.8530, 2.3380], radius: 250, name: 'Saint-Germain' },
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

export function useSafetyOverlays() {
  const [overlays, setOverlays] = useState<SafetyOverlay[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const getOverlayConfig = (type: SafetyZone['type']) => {
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
      default:
        return { color: 'hsl(0, 0%, 50%)', fillOpacity: 0.2 };
    }
  };

  const loadOverlays = useCallback(async () => {
    setLoading(true);
    
    // In production, this would fetch from the Python backend
    // For now, use static Paris data
    const safetyOverlays: SafetyOverlay[] = PARIS_SAFETY_ZONES.map((zone) => {
      const config = getOverlayConfig(zone.type);
      return {
        ...zone,
        ...config,
      };
    });

    setOverlays(safetyOverlays);
    setLoading(false);
  }, []);

  const toggleVisibility = useCallback(() => {
    if (!visible && overlays.length === 0) {
      loadOverlays();
    }
    setVisible((prev) => !prev);
  }, [visible, overlays.length, loadOverlays]);

  return {
    overlays: visible ? overlays : [],
    loading,
    visible,
    toggleVisibility,
    loadOverlays,
  };
}
