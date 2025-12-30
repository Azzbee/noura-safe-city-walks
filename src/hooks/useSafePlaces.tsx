import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SafePlaceType = 'police' | 'hospital' | 'pharmacy_24h' | 'metro' | 'store_24h' | 'fire_station';

export interface SafePlace {
  id: string;
  name: string;
  type: SafePlaceType;
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  opening_hours?: Record<string, unknown>;
  verified: boolean;
  distance_m?: number;
}

interface UseSafePlacesProps {
  userLat: number | null;
  userLng: number | null;
  radiusMeters?: number;
  types?: SafePlaceType[];
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function useSafePlaces({
  userLat,
  userLng,
  radiusMeters = 2000,
  types,
}: UseSafePlacesProps) {
  const [places, setPlaces] = useState<SafePlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaces = useCallback(async () => {
    if (userLat === null || userLng === null) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('safe_places')
        .select('*');

      if (types && types.length > 0) {
        query = query.in('type', types);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Calculate distances and filter by radius
      const placesWithDistance = (data || [])
        .map(place => ({
          id: place.id,
          name: place.name,
          type: place.type as SafePlaceType,
          lat: Number(place.lat),
          lng: Number(place.lng),
          address: place.address ?? undefined,
          phone: place.phone ?? undefined,
          opening_hours: place.opening_hours as Record<string, unknown> | undefined,
          verified: place.verified ?? false,
          distance_m: calculateDistance(userLat, userLng, Number(place.lat), Number(place.lng)),
        }))
        .filter(place => place.distance_m <= radiusMeters)
        .sort((a, b) => a.distance_m - b.distance_m);

      setPlaces(placesWithDistance);
    } catch (err) {
      console.error('Error fetching safe places:', err);
      setError('Failed to load safe places');
    } finally {
      setLoading(false);
    }
  }, [userLat, userLng, radiusMeters, types]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  // Get nearest place of any type
  const nearestPlace = useMemo(() => {
    return places.length > 0 ? places[0] : null;
  }, [places]);

  // Get nearest place by type
  const getNearestByType = useCallback((type: SafePlaceType): SafePlace | null => {
    return places.find(p => p.type === type) || null;
  }, [places]);

  // Get places grouped by type
  const placesByType = useMemo(() => {
    const grouped: Record<SafePlaceType, SafePlace[]> = {
      police: [],
      hospital: [],
      pharmacy_24h: [],
      metro: [],
      store_24h: [],
      fire_station: [],
    };

    places.forEach(place => {
      if (grouped[place.type]) {
        grouped[place.type].push(place);
      }
    });

    return grouped;
  }, [places]);

  // Navigate to a place (open in maps)
  const navigateToPlace = useCallback((place: SafePlace) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&travelmode=walking`;
    window.open(url, '_blank');
  }, []);

  // Call a place
  const callPlace = useCallback((place: SafePlace) => {
    if (place.phone) {
      window.location.href = `tel:${place.phone}`;
    }
  }, []);

  return {
    places,
    loading,
    error,
    nearestPlace,
    getNearestByType,
    placesByType,
    navigateToPlace,
    callPlace,
    refresh: fetchPlaces,
  };
}
