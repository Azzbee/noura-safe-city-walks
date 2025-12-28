import { useState, useCallback, useEffect } from 'react';
import { useToast } from './use-toast';

export type TimeFilter = 'all' | 'day' | 'night' | 'late_night';

export interface SafetyZone {
  id: string;
  type: 'well_lit' | 'busy_street' | 'police_station' | 'hospital' | 'metro_station' | 'safe_area' | 'caution_area' | 'pharmacy' | 'open_24h' | 'danger_zone';
  center: [number, number];
  radius: number;
  name?: string;
  safety_score?: number;
  time_relevance?: 'always' | 'day_only' | 'night_only' | 'late_night';
}

// Comprehensive Paris safety data with time relevance
const PARIS_SAFETY_ZONES: SafetyZone[] = [
  // Metro Stations (major hubs - well-lit, staffed, cameras)
  { id: 'metro-chatelet', type: 'metro_station', center: [48.8584, 2.3470], radius: 120, name: 'Châtelet-Les Halles', time_relevance: 'always' },
  { id: 'metro-gare-du-nord', type: 'metro_station', center: [48.8809, 2.3553], radius: 100, name: 'Gare du Nord', time_relevance: 'always' },
  { id: 'metro-gare-de-lyon', type: 'metro_station', center: [48.8448, 2.3735], radius: 100, name: 'Gare de Lyon', time_relevance: 'always' },
  { id: 'metro-saint-lazare', type: 'metro_station', center: [48.8756, 2.3244], radius: 100, name: 'Saint-Lazare', time_relevance: 'always' },
  { id: 'metro-montparnasse', type: 'metro_station', center: [48.8427, 2.3210], radius: 100, name: 'Montparnasse', time_relevance: 'always' },
  { id: 'metro-bastille', type: 'metro_station', center: [48.8530, 2.3690], radius: 80, name: 'Bastille', time_relevance: 'always' },
  { id: 'metro-republique', type: 'metro_station', center: [48.8675, 2.3636], radius: 80, name: 'République', time_relevance: 'always' },
  { id: 'metro-nation', type: 'metro_station', center: [48.8483, 2.3960], radius: 80, name: 'Nation', time_relevance: 'always' },
  { id: 'metro-opera', type: 'metro_station', center: [48.8708, 2.3316], radius: 80, name: 'Opéra', time_relevance: 'always' },
  { id: 'metro-concorde', type: 'metro_station', center: [48.8656, 2.3212], radius: 70, name: 'Concorde', time_relevance: 'always' },
  { id: 'metro-etoile', type: 'metro_station', center: [48.8738, 2.2950], radius: 90, name: 'Charles de Gaulle-Étoile', time_relevance: 'always' },
  { id: 'metro-trocadero', type: 'metro_station', center: [48.8627, 2.2874], radius: 70, name: 'Trocadéro', time_relevance: 'always' },
  { id: 'metro-odeon', type: 'metro_station', center: [48.8525, 2.3390], radius: 60, name: 'Odéon', time_relevance: 'always' },
  { id: 'metro-pigalle', type: 'metro_station', center: [48.8822, 2.3373], radius: 60, name: 'Pigalle', time_relevance: 'always' },
  { id: 'metro-belleville', type: 'metro_station', center: [48.8718, 2.3768], radius: 60, name: 'Belleville', time_relevance: 'always' },

  // Police Stations (Commissariats) - 24/7
  { id: 'police-1er', type: 'police_station', center: [48.8607, 2.3461], radius: 200, name: 'Commissariat 1er arr.', time_relevance: 'always' },
  { id: 'police-2e', type: 'police_station', center: [48.8675, 2.3420], radius: 180, name: 'Commissariat 2e arr.', time_relevance: 'always' },
  { id: 'police-3e', type: 'police_station', center: [48.8643, 2.3589], radius: 180, name: 'Commissariat 3e arr.', time_relevance: 'always' },
  { id: 'police-4e', type: 'police_station', center: [48.8543, 2.3565], radius: 180, name: 'Commissariat 4e arr.', time_relevance: 'always' },
  { id: 'police-5e', type: 'police_station', center: [48.8469, 2.3510], radius: 180, name: 'Commissariat 5e arr.', time_relevance: 'always' },
  { id: 'police-6e', type: 'police_station', center: [48.8498, 2.3326], radius: 180, name: 'Commissariat 6e arr.', time_relevance: 'always' },
  { id: 'police-7e', type: 'police_station', center: [48.8559, 2.3136], radius: 180, name: 'Commissariat 7e arr.', time_relevance: 'always' },
  { id: 'police-8e', type: 'police_station', center: [48.8754, 2.3054], radius: 180, name: 'Commissariat 8e arr.', time_relevance: 'always' },
  { id: 'police-9e', type: 'police_station', center: [48.8769, 2.3404], radius: 180, name: 'Commissariat 9e arr.', time_relevance: 'always' },
  { id: 'police-10e', type: 'police_station', center: [48.8762, 2.3577], radius: 180, name: 'Commissariat 10e arr.', time_relevance: 'always' },
  { id: 'police-11e', type: 'police_station', center: [48.8596, 2.3781], radius: 180, name: 'Commissariat 11e arr.', time_relevance: 'always' },
  { id: 'police-12e', type: 'police_station', center: [48.8408, 2.3875], radius: 180, name: 'Commissariat 12e arr.', time_relevance: 'always' },
  { id: 'police-13e', type: 'police_station', center: [48.8286, 2.3582], radius: 180, name: 'Commissariat 13e arr.', time_relevance: 'always' },
  { id: 'police-14e', type: 'police_station', center: [48.8321, 2.3258], radius: 180, name: 'Commissariat 14e arr.', time_relevance: 'always' },
  { id: 'police-15e', type: 'police_station', center: [48.8411, 2.2950], radius: 180, name: 'Commissariat 15e arr.', time_relevance: 'always' },
  { id: 'police-16e', type: 'police_station', center: [48.8588, 2.2685], radius: 180, name: 'Commissariat 16e arr.', time_relevance: 'always' },
  { id: 'police-17e', type: 'police_station', center: [48.8862, 2.3087], radius: 180, name: 'Commissariat 17e arr.', time_relevance: 'always' },
  { id: 'police-18e', type: 'police_station', center: [48.8921, 2.3475], radius: 180, name: 'Commissariat 18e arr.', time_relevance: 'always' },
  { id: 'police-19e', type: 'police_station', center: [48.8839, 2.3827], radius: 180, name: 'Commissariat 19e arr.', time_relevance: 'always' },
  { id: 'police-20e', type: 'police_station', center: [48.8640, 2.3982], radius: 180, name: 'Commissariat 20e arr.', time_relevance: 'always' },

  // Major Hospitals - 24/7
  { id: 'hospital-hotel-dieu', type: 'hospital', center: [48.8539, 2.3489], radius: 150, name: 'Hôtel-Dieu', time_relevance: 'always' },
  { id: 'hospital-pitie', type: 'hospital', center: [48.8360, 2.3645], radius: 200, name: 'Pitié-Salpêtrière', time_relevance: 'always' },
  { id: 'hospital-cochin', type: 'hospital', center: [48.8358, 2.3391], radius: 180, name: 'Hôpital Cochin', time_relevance: 'always' },
  { id: 'hospital-lariboisiere', type: 'hospital', center: [48.8830, 2.3546], radius: 160, name: 'Lariboisière', time_relevance: 'always' },
  { id: 'hospital-saint-louis', type: 'hospital', center: [48.8742, 2.3679], radius: 160, name: 'Hôpital Saint-Louis', time_relevance: 'always' },
  { id: 'hospital-tenon', type: 'hospital', center: [48.8671, 2.4019], radius: 140, name: 'Hôpital Tenon', time_relevance: 'always' },
  { id: 'hospital-saint-antoine', type: 'hospital', center: [48.8480, 2.3830], radius: 150, name: 'Hôpital Saint-Antoine', time_relevance: 'always' },
  { id: 'hospital-necker', type: 'hospital', center: [48.8460, 2.3161], radius: 150, name: 'Hôpital Necker', time_relevance: 'always' },
  { id: 'hospital-european', type: 'hospital', center: [48.8799, 2.3278], radius: 140, name: 'Hôpital Européen', time_relevance: 'always' },
  { id: 'hospital-pompidou', type: 'hospital', center: [48.8393, 2.2706], radius: 180, name: 'Hôpital Pompidou', time_relevance: 'always' },

  // Well-Lit Tourist/Commercial Areas - day_only or always
  { id: 'lit-champs-elysees', type: 'well_lit', center: [48.8698, 2.3075], radius: 400, name: 'Champs-Élysées', time_relevance: 'always' },
  { id: 'lit-louvre', type: 'well_lit', center: [48.8606, 2.3376], radius: 300, name: 'Le Louvre', time_relevance: 'day_only' },
  { id: 'lit-ile-cite', type: 'well_lit', center: [48.8550, 2.3475], radius: 250, name: 'Île de la Cité', time_relevance: 'always' },
  { id: 'lit-saint-germain', type: 'well_lit', center: [48.8539, 2.3335], radius: 300, name: 'Saint-Germain-des-Prés', time_relevance: 'always' },
  { id: 'lit-marais', type: 'well_lit', center: [48.8594, 2.3614], radius: 350, name: 'Le Marais', time_relevance: 'always' },
  { id: 'lit-grands-boulevards', type: 'well_lit', center: [48.8711, 2.3430], radius: 300, name: 'Grands Boulevards', time_relevance: 'always' },
  { id: 'lit-haussmann', type: 'well_lit', center: [48.8738, 2.3286], radius: 280, name: 'Boulevard Haussmann', time_relevance: 'day_only' },
  { id: 'lit-montmartre', type: 'well_lit', center: [48.8867, 2.3431], radius: 300, name: 'Montmartre (tourist area)', time_relevance: 'day_only' },
  { id: 'lit-tour-eiffel', type: 'well_lit', center: [48.8584, 2.2945], radius: 350, name: 'Tour Eiffel', time_relevance: 'always' },
  { id: 'lit-trocadero', type: 'well_lit', center: [48.8612, 2.2873], radius: 250, name: 'Trocadéro Gardens', time_relevance: 'day_only' },
  { id: 'lit-latin-quarter', type: 'well_lit', center: [48.8498, 2.3466], radius: 280, name: 'Quartier Latin', time_relevance: 'always' },
  { id: 'lit-beaubourg', type: 'well_lit', center: [48.8604, 2.3522], radius: 200, name: 'Beaubourg/Centre Pompidou', time_relevance: 'day_only' },

  // Busy Streets (24/7 activity)
  { id: 'busy-rivoli', type: 'busy_street', center: [48.8565, 2.3515], radius: 200, name: 'Rue de Rivoli', time_relevance: 'always' },
  { id: 'busy-sebastopol', type: 'busy_street', center: [48.8665, 2.3528], radius: 180, name: 'Bd de Sébastopol', time_relevance: 'day_only' },
  { id: 'busy-saint-michel', type: 'busy_street', center: [48.8534, 2.3438], radius: 180, name: 'Boulevard Saint-Michel', time_relevance: 'always' },
  { id: 'busy-oberkampf', type: 'busy_street', center: [48.8653, 2.3731], radius: 200, name: 'Oberkampf', time_relevance: 'night_only' },
  { id: 'busy-bastille-nightlife', type: 'busy_street', center: [48.8535, 2.3710], radius: 200, name: 'Bastille Nightlife', time_relevance: 'night_only' },

  // 24-Hour Businesses / Pharmacies
  { id: '24h-pharmacy-champs', type: 'open_24h', center: [48.8716, 2.3020], radius: 50, name: 'Pharmacie des Champs-Élysées (24h)', time_relevance: 'always' },
  { id: '24h-pharmacy-opera', type: 'pharmacy', center: [48.8704, 2.3340], radius: 40, name: 'Grande Pharmacie de l\'Opéra', time_relevance: 'day_only' },
  { id: '24h-pharmacy-nations', type: 'open_24h', center: [48.8472, 2.3965], radius: 40, name: 'Pharmacie de la Place des Nations (24h)', time_relevance: 'always' },
  { id: '24h-pharmacy-bastille', type: 'pharmacy', center: [48.8531, 2.3698], radius: 40, name: 'Pharmacie de la Bastille', time_relevance: 'day_only' },
  { id: '24h-pharmacy-republique', type: 'pharmacy', center: [48.8677, 2.3642], radius: 40, name: 'Pharmacie République', time_relevance: 'day_only' },

  // Safe Areas (well-patrolled, residential, low crime)
  { id: 'safe-7e-invalides', type: 'safe_area', center: [48.8567, 2.3126], radius: 400, name: '7e - Invalides', time_relevance: 'always' },
  { id: 'safe-16e-passy', type: 'safe_area', center: [48.8550, 2.2680], radius: 450, name: '16e - Passy', time_relevance: 'always' },
  { id: 'safe-6e-luxembourg', type: 'safe_area', center: [48.8462, 2.3372], radius: 350, name: '6e - Luxembourg', time_relevance: 'always' },
  { id: 'safe-5e-pantheon', type: 'safe_area', center: [48.8462, 2.3461], radius: 300, name: '5e - Panthéon', time_relevance: 'always' },
  { id: 'safe-4e-ile-st-louis', type: 'safe_area', center: [48.8519, 2.3563], radius: 200, name: 'Île Saint-Louis', time_relevance: 'always' },
  { id: 'safe-8e-monceau', type: 'safe_area', center: [48.8804, 2.3093], radius: 350, name: '8e - Parc Monceau', time_relevance: 'always' },
  { id: 'safe-2e-bourse', type: 'safe_area', center: [48.8686, 2.3409], radius: 250, name: '2e - Bourse', time_relevance: 'day_only' },

  // Caution Areas (higher pickpocket/theft risk) - mostly night concerns
  { id: 'caution-gare-du-nord', type: 'caution_area', center: [48.8808, 2.3561], radius: 250, name: 'Gare du Nord (pickpockets)', time_relevance: 'always' },
  { id: 'caution-chatelet-halles', type: 'caution_area', center: [48.8614, 2.3475], radius: 200, name: 'Les Halles (late night)', time_relevance: 'late_night' },
  { id: 'caution-strasbourg-st-denis', type: 'caution_area', center: [48.8696, 2.3549], radius: 180, name: 'Strasbourg-Saint-Denis', time_relevance: 'night_only' },
  { id: 'caution-barbes', type: 'caution_area', center: [48.8839, 2.3498], radius: 200, name: 'Barbès-Rochechouart', time_relevance: 'always' },
  { id: 'caution-stalingrad', type: 'caution_area', center: [48.8841, 2.3691], radius: 180, name: 'Stalingrad', time_relevance: 'always' },
  { id: 'caution-chateau-rouge', type: 'caution_area', center: [48.8874, 2.3494], radius: 180, name: 'Château Rouge', time_relevance: 'night_only' },

  // Danger Zones (higher crime, avoid especially at night)
  { id: 'danger-porte-chapelle', type: 'danger_zone', center: [48.8976, 2.3597], radius: 300, name: 'Porte de la Chapelle (avoid at night)', time_relevance: 'night_only' },
  { id: 'danger-porte-clignancourt', type: 'danger_zone', center: [48.8976, 2.3445], radius: 250, name: 'Porte de Clignancourt', time_relevance: 'night_only' },
  { id: 'danger-marx-dormoy', type: 'danger_zone', center: [48.8907, 2.3591], radius: 200, name: 'Marx Dormoy area', time_relevance: 'always' },
  { id: 'danger-crimee', type: 'danger_zone', center: [48.8904, 2.3766], radius: 180, name: 'Crimée (late night)', time_relevance: 'late_night' },
  { id: 'danger-porte-aubervilliers', type: 'danger_zone', center: [48.9002, 2.3660], radius: 250, name: 'Porte d\'Aubervilliers', time_relevance: 'night_only' },
  { id: 'danger-bois-boulogne-night', type: 'danger_zone', center: [48.8622, 2.2502], radius: 400, name: 'Bois de Boulogne (night)', time_relevance: 'night_only' },
  { id: 'danger-bois-vincennes-night', type: 'danger_zone', center: [48.8325, 2.4330], radius: 400, name: 'Bois de Vincennes (night)', time_relevance: 'night_only' },
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
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const getOverlayConfig = (type: SafetyZone['type'], safetyScore?: number) => {
    switch (type) {
      case 'well_lit':
        return { color: 'hsl(45, 93%, 47%)', fillOpacity: 0.12 };
      case 'busy_street':
        return { color: 'hsl(142, 76%, 36%)', fillOpacity: 0.15 };
      case 'police_station':
        return { color: 'hsl(217, 91%, 60%)', fillOpacity: 0.25 };
      case 'hospital':
        return { color: 'hsl(0, 84%, 60%)', fillOpacity: 0.25 };
      case 'metro_station':
        return { color: 'hsl(270, 70%, 60%)', fillOpacity: 0.2 };
      case 'pharmacy':
        return { color: 'hsl(142, 70%, 50%)', fillOpacity: 0.2 };
      case 'open_24h':
        return { color: 'hsl(38, 92%, 55%)', fillOpacity: 0.2 };
      case 'safe_area':
        return { color: 'hsl(142, 76%, 36%)', fillOpacity: 0.1 };
      case 'caution_area':
        return { color: 'hsl(38, 92%, 55%)', fillOpacity: 0.15 };
      case 'danger_zone':
        return { color: 'hsl(0, 84%, 50%)', fillOpacity: 0.2 };
      default:
        if (safetyScore !== undefined) {
          const hue = safetyScore * 120;
          return { color: `hsl(${hue}, 70%, 50%)`, fillOpacity: 0.15 };
        }
        return { color: 'hsl(0, 0%, 50%)', fillOpacity: 0.15 };
    }
  };

  const convertToOverlays = (zones: SafetyZone[], filter: TimeFilter): SafetyOverlay[] => {
    // Filter zones based on time
    const filteredZones = zones.filter((zone) => {
      const relevance = zone.time_relevance ?? 'always';
      
      if (filter === 'all') return true;
      if (relevance === 'always') return true;
      
      switch (filter) {
        case 'day':
          return relevance === 'day_only';
        case 'night':
          return relevance === 'night_only' || relevance === 'late_night';
        case 'late_night':
          return relevance === 'late_night' || relevance === 'night_only';
        default:
          return true;
      }
    });

    return filteredZones.map((zone) => {
      const config = getOverlayConfig(zone.type, zone.safety_score);
      return {
        ...zone,
        ...config,
      };
    });
  };

  const loadOverlays = useCallback(async (center?: [number, number], filter: TimeFilter = 'all') => {
    setLoading(true);
    
    const apiUrl = getApiUrl();
    
    if (apiUrl) {
      try {
        const lat = center?.[0] ?? 48.8566;
        const lng = center?.[1] ?? 2.3522;
        
        const response = await fetch(`${apiUrl}/api/safety-zones?lat=${lat}&lng=${lng}&radius=5000`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.zones && Array.isArray(data.zones)) {
            setOverlays(convertToOverlays(data.zones, filter));
            setUsingFallback(false);
            setLoading(false);
            return;
          }
        }
        
        console.log("Backend safety zones not available, using Paris data");
      } catch (error) {
        console.log("Could not fetch safety zones from backend:", error);
      }
    }

    // Use comprehensive Paris safety data
    setOverlays(convertToOverlays(PARIS_SAFETY_ZONES, filter));
    setUsingFallback(true);
    setLoading(false);
  }, []);

  const toggleVisibility = useCallback(() => {
    if (!visible && overlays.length === 0) {
      loadOverlays(undefined, timeFilter);
    }
    setVisible((prev) => !prev);
  }, [visible, overlays.length, loadOverlays, timeFilter]);

  // Update overlays when time filter changes
  useEffect(() => {
    if (visible) {
      loadOverlays(undefined, timeFilter);
    }
  }, [timeFilter, visible, loadOverlays]);

  // Load overlays immediately when visible is set to true
  useEffect(() => {
    if (visible && overlays.length === 0) {
      loadOverlays(undefined, timeFilter);
    }
  }, [visible, overlays.length, loadOverlays, timeFilter]);

  const refreshOverlays = useCallback((center: [number, number]) => {
    if (visible) {
      loadOverlays(center, timeFilter);
    }
  }, [visible, loadOverlays, timeFilter]);

  return {
    overlays: visible ? overlays : [],
    loading,
    visible,
    usingFallback,
    timeFilter,
    setTimeFilter,
    toggleVisibility,
    loadOverlays,
    refreshOverlays,
  };
}
