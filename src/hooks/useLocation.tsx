import { useState, useEffect, useCallback, useRef } from 'react';

interface LocationState {
  lat: number;
  lng: number;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  watching: boolean;
}

// Default to Paris center
const PARIS_CENTER = { lat: 48.8566, lng: 2.3522 };

export function useLocation(autoWatch: boolean = false) {
  const [location, setLocation] = useState<LocationState>({
    lat: PARIS_CENTER.lat,
    lng: PARIS_CENTER.lng,
    accuracy: null,
    loading: true,
    error: null,
    watching: false,
  });

  const watchIdRef = useRef<number | null>(null);

  const updateLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        loading: false,
        error: 'Geolocation is not supported',
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(prev => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
        }));
      },
      (error) => {
        setLocation(prev => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation || watchIdRef.current !== null) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
          watching: true,
        });
      },
      (error) => {
        setLocation(prev => ({
          ...prev,
          error: error.message,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    watchIdRef.current = watchId;
    setLocation(prev => ({ ...prev, watching: true }));
  }, []);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setLocation(prev => ({ ...prev, watching: false }));
    }
  }, []);

  useEffect(() => {
    updateLocation();
  }, [updateLocation]);

  // Auto-watch mode
  useEffect(() => {
    if (autoWatch) {
      startWatching();
    } else {
      stopWatching();
    }

    return () => {
      stopWatching();
    };
  }, [autoWatch, startWatching, stopWatching]);

  return {
    ...location,
    refresh: updateLocation,
    startWatching,
    stopWatching,
  };
}
