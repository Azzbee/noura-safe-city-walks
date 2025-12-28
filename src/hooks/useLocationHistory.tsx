import { useState, useEffect, useRef, useCallback } from 'react';

export interface LocationPoint {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

interface LocationHistoryState {
  currentLocation: LocationPoint | null;
  locationHistory: LocationPoint[];
  isTracking: boolean;
  error: string | null;
}

const MAX_HISTORY_POINTS = 100; // Keep last 100 location points
const PARIS_CENTER = { lat: 48.8566, lng: 2.3522 };

export function useLocationHistory(isActive: boolean = false) {
  const [state, setState] = useState<LocationHistoryState>({
    currentLocation: null,
    locationHistory: [],
    isTracking: false,
    error: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const historyRef = useRef<LocationPoint[]>([]);

  const addLocationPoint = useCallback((point: LocationPoint) => {
    historyRef.current = [...historyRef.current, point].slice(-MAX_HISTORY_POINTS);
    setState(prev => ({
      ...prev,
      currentLocation: point,
      locationHistory: historyRef.current,
    }));
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation || watchIdRef.current !== null) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const point: LocationPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
          accuracy: position.coords.accuracy,
          speed: position.coords.speed ?? undefined,
          heading: position.coords.heading ?? undefined,
        };
        addLocationPoint(point);
        setState(prev => ({ ...prev, isTracking: true, error: null }));
      },
      (error) => {
        setState(prev => ({ ...prev, error: error.message }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000,
      }
    );

    watchIdRef.current = watchId;
  }, [addLocationPoint]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setState(prev => ({ ...prev, isTracking: false }));
    }
  }, []);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    setState(prev => ({ ...prev, locationHistory: [] }));
  }, []);

  // Get the trail geometry as [lat, lng] pairs
  const getTrailGeometry = useCallback((): [number, number][] => {
    return historyRef.current.map(point => [point.lat, point.lng] as [number, number]);
  }, []);

  useEffect(() => {
    if (isActive) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [isActive, startTracking, stopTracking]);

  return {
    ...state,
    startTracking,
    stopTracking,
    clearHistory,
    getTrailGeometry,
    // Fallback location for when tracking fails
    fallbackLocation: PARIS_CENTER,
  };
}
