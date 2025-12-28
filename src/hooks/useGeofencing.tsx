import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePushNotifications } from './usePushNotifications';
import { useToast } from './use-toast';

interface GeofencedLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
  notify_on_enter: boolean;
  notify_on_exit: boolean;
}

interface GeofenceState {
  locationId: string;
  isInside: boolean;
}

// Calculate distance between two points in meters using Haversine formula
function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface UseGeofencingProps {
  userLat: number | null;
  userLng: number | null;
  enabled?: boolean;
}

export function useGeofencing({ userLat, userLng, enabled = true }: UseGeofencingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { showLocalNotification } = usePushNotifications();
  
  const [geofencedLocations, setGeofencedLocations] = useState<GeofencedLocation[]>([]);
  const [activeZones, setActiveZones] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const geofenceStatesRef = useRef<Map<string, GeofenceState>>(new Map());
  const lastNotificationRef = useRef<Map<string, number>>(new Map());

  // Fetch geofenced locations
  const fetchGeofencedLocations = useCallback(async () => {
    if (!user) {
      setGeofencedLocations([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('saved_locations')
        .select('id, name, lat, lng, geofence_radius_m, notify_on_enter, notify_on_exit')
        .eq('user_id', user.id)
        .eq('geofence_enabled', true);

      if (error) throw error;

      setGeofencedLocations(
        (data || []).map((loc) => ({
          id: loc.id,
          name: loc.name,
          lat: Number(loc.lat),
          lng: Number(loc.lng),
          radius_m: loc.geofence_radius_m || 200,
          notify_on_enter: loc.notify_on_enter ?? true,
          notify_on_exit: loc.notify_on_exit ?? true,
        }))
      );
    } catch (error) {
      console.error('Error fetching geofenced locations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGeofencedLocations();
  }, [fetchGeofencedLocations]);

  // Notify emergency contacts about geofence event
  const notifyContacts = useCallback(async (
    locationName: string,
    eventType: 'entered' | 'exited',
    lat: number,
    lng: number
  ) => {
    if (!user) return;

    try {
      const { data: contacts } = await supabase
        .from('emergency_contacts')
        .select('id, name, phone, email, notify_sms, notify_email')
        .eq('user_id', user.id)
        .order('priority', { ascending: true });

      if (!contacts || contacts.length === 0) return;

      // Get user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const userName = profile?.full_name || 'Your contact';
      const action = eventType === 'entered' ? 'arrived at' : 'left';
      const message = `${userName} has ${action} "${locationName}"`;

      // Send notifications via edge function
      await supabase.functions.invoke('notify-emergency-contacts', {
        body: {
          user_id: user.id,
          alert_type: 'geofence',
          message,
          lat,
          lng,
          location_name: locationName,
          event_type: eventType,
        },
      });

      console.log(`Geofence notification sent: ${message}`);
    } catch (error) {
      console.error('Error sending geofence notification:', error);
    }
  }, [user]);

  // Check geofences
  const checkGeofences = useCallback(() => {
    if (!enabled || userLat === null || userLng === null || geofencedLocations.length === 0) {
      return;
    }

    const now = Date.now();
    const NOTIFICATION_COOLDOWN = 60000; // 1 minute cooldown between notifications
    const currentlyInside: string[] = [];

    for (const location of geofencedLocations) {
      const distance = getDistanceMeters(userLat, userLng, location.lat, location.lng);
      const isInside = distance <= location.radius_m;
      const prevState = geofenceStatesRef.current.get(location.id);
      const lastNotification = lastNotificationRef.current.get(location.id) || 0;

      if (isInside) {
        currentlyInside.push(location.id);
      }

      // Skip if no previous state (first check)
      if (prevState === undefined) {
        geofenceStatesRef.current.set(location.id, { locationId: location.id, isInside });
        continue;
      }

      // Check for state change with cooldown
      if (now - lastNotification < NOTIFICATION_COOLDOWN) {
        continue;
      }

      if (!prevState.isInside && isInside && location.notify_on_enter) {
        // Entered zone
        showLocalNotification(`Arrived at ${location.name}`, 'Your contacts have been notified.', {
          tag: `geofence-${location.id}`,
        });
        toast({
          title: `Arrived at ${location.name}`,
          description: 'Your emergency contacts have been notified.',
        });
        notifyContacts(location.name, 'entered', userLat, userLng);
        lastNotificationRef.current.set(location.id, now);
      } else if (prevState.isInside && !isInside && location.notify_on_exit) {
        // Exited zone
        showLocalNotification(`Left ${location.name}`, 'Your contacts have been notified.', {
          tag: `geofence-${location.id}`,
        });
        toast({
          title: `Left ${location.name}`,
          description: 'Your emergency contacts have been notified.',
        });
        notifyContacts(location.name, 'exited', userLat, userLng);
        lastNotificationRef.current.set(location.id, now);
      }

      geofenceStatesRef.current.set(location.id, { locationId: location.id, isInside });
    }

    setActiveZones(currentlyInside);
  }, [enabled, userLat, userLng, geofencedLocations, showLocalNotification, toast, notifyContacts]);

  return {
    geofencedLocations,
    activeZones,
    loading,
    refresh: fetchGeofencedLocations,
  };
}
