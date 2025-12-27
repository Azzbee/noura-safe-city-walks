import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UseLocationSharingProps {
  journeyId: string | null;
  isActive: boolean;
}

export function useLocationSharing({ journeyId, isActive }: UseLocationSharingProps) {
  const { user } = useAuth();
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Create a share token when journey starts
  const createShareToken = useCallback(async () => {
    if (!journeyId || !user) return null;

    // Generate a random token
    const token = crypto.randomUUID().replace(/-/g, '');
    
    // Expires 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('location_share_tokens')
      .insert({
        journey_id: journeyId,
        user_id: user.id,
        token,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating share token:', error);
      return null;
    }

    const url = `${window.location.origin}/track/${token}`;
    setShareToken(token);
    setShareUrl(url);
    return { token, url };
  }, [journeyId, user]);

  // Update location in database
  const updateLocation = useCallback(async (position: GeolocationPosition) => {
    if (!journeyId || !user) return;

    // Throttle updates to every 10 seconds
    const now = Date.now();
    if (now - lastUpdateRef.current < 10000) return;
    lastUpdateRef.current = now;

    const { coords } = position;
    
    await supabase.from('journey_locations').insert({
      journey_id: journeyId,
      user_id: user.id,
      lat: coords.latitude,
      lng: coords.longitude,
      accuracy: coords.accuracy,
      speed: coords.speed,
      heading: coords.heading,
      recorded_at: new Date().toISOString(),
    });

    console.log('Location updated:', coords.latitude, coords.longitude);
  }, [journeyId, user]);

  // Start watching location
  const startSharing = useCallback(async () => {
    if (!isActive || !journeyId) return;

    // Create share token if not exists
    if (!shareToken) {
      await createShareToken();
    }

    // Start watching position
    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        updateLocation,
        (error) => console.error('Geolocation error:', error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );
      setIsSharing(true);
      console.log('Location sharing started');
    }
  }, [isActive, journeyId, shareToken, createShareToken, updateLocation]);

  // Stop sharing
  const stopSharing = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharing(false);
    console.log('Location sharing stopped');
  }, []);

  // Copy share URL to clipboard
  const copyShareUrl = useCallback(async () => {
    if (!shareUrl) return false;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      return true;
    } catch (error) {
      console.error('Failed to copy:', error);
      return false;
    }
  }, [shareUrl]);

  // Auto start/stop based on active state
  useEffect(() => {
    if (isActive && journeyId) {
      startSharing();
    } else {
      stopSharing();
      setShareToken(null);
      setShareUrl(null);
    }

    return () => stopSharing();
  }, [isActive, journeyId, startSharing, stopSharing]);

  return {
    isSharing,
    shareToken,
    shareUrl,
    createShareToken,
    copyShareUrl,
    startSharing,
    stopSharing,
  };
}
