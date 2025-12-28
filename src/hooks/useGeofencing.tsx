import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePushNotifications } from './usePushNotifications';
import { useToast } from './use-toast';
import { triggerGeofenceEnterFeedback, triggerGeofenceExitFeedback } from '@/lib/haptics';

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

  // Log geofence event to history
  const logGeofenceEvent = useCallback(async (
    locationId: string,
    eventType: 'entered' | 'exited',
    lat: number,
    lng: number
  ) => {
    if (!user) return;

    try {
      await supabase.from('geofence_events').insert({
        user_id: user.id,
        location_id: locationId,
        event_type: eventType,
        lat,
        lng,
      });
    } catch (error) {
      console.error('Error logging geofence event:', error);
    }
  }, [user]);

  // Notify emergency contacts about geofence event
  const notifyContacts = useCallback(async (
    locationId: string,
    locationName: string,
    eventType: 'entered' | 'exited',
    lat: number,
    lng: number
  ) => {
    if (!user) return;

    try {
      // Get contact zone rules for this location
      const { data: rules } = await supabase
        .from('contact_zone_rules')
        .select('contact_id, notify_on_enter, notify_on_exit')
        .eq('user_id', user.id)
        .eq('location_id', locationId);

      // Get all contacts
      const { data: allContacts } = await supabase
        .from('emergency_contacts')
        .select('id, name, phone, email, notify_sms, notify_email')
        .eq('user_id', user.id)
        .order('priority', { ascending: true });

      if (!allContacts || allContacts.length === 0) return;

      // Filter contacts based on rules
      let contactsToNotify = allContacts;

      if (rules && rules.length > 0) {
        // If rules exist, only notify contacts with matching rules
        const ruleMap = new Map(rules.map(r => [r.contact_id, r]));
        contactsToNotify = allContacts.filter(contact => {
          const rule = ruleMap.get(contact.id);
          if (!rule) return false; // No rule means no notification for this location
          if (eventType === 'entered' && !rule.notify_on_enter) return false;
          if (eventType === 'exited' && !rule.notify_on_exit) return false;
          return true;
        });
      }

      if (contactsToNotify.length === 0) return;

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
          contact_ids: contactsToNotify.map(c => c.id),
        },
      });

      console.log(`Geofence notification sent to ${contactsToNotify.length} contacts: ${message}`);
    } catch (error) {
      console.error('Error sending geofence notification:', error);
    }
  }, [user]);

  // Simulate entering or leaving a zone (test mode)
  const simulateGeofenceEvent = useCallback(async (
    locationId: string,
    eventType: 'entered' | 'exited'
  ) => {
    const location = geofencedLocations.find(l => l.id === locationId);
    if (!location) return;

    // Log the event
    await logGeofenceEvent(locationId, eventType, location.lat, location.lng);

    // Show notification
    const title = eventType === 'entered' 
      ? `Arrived at ${location.name}` 
      : `Left ${location.name}`;
    
    showLocalNotification(title, 'Test simulation - contacts notified.', {
      tag: `geofence-test-${locationId}`,
    });
    
    toast({
      title: `[Test] ${title}`,
      description: 'Simulated event logged. Contacts notified.',
    });

    // Notify contacts
    await notifyContacts(locationId, location.name, eventType, location.lat, location.lng);

    // Update active zones state
    if (eventType === 'entered') {
      setActiveZones(prev => [...prev.filter(id => id !== locationId), locationId]);
    } else {
      setActiveZones(prev => prev.filter(id => id !== locationId));
    }
  }, [geofencedLocations, logGeofenceEvent, notifyContacts, showLocalNotification, toast]);

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
        triggerGeofenceEnterFeedback();
        logGeofenceEvent(location.id, 'entered', userLat, userLng);
        showLocalNotification(`Arrived at ${location.name}`, 'Your contacts have been notified.', {
          tag: `geofence-${location.id}`,
        });
        toast({
          title: `Arrived at ${location.name}`,
          description: 'Your emergency contacts have been notified.',
        });
        notifyContacts(location.id, location.name, 'entered', userLat, userLng);
        lastNotificationRef.current.set(location.id, now);
      } else if (prevState.isInside && !isInside && location.notify_on_exit) {
        // Exited zone
        triggerGeofenceExitFeedback();
        logGeofenceEvent(location.id, 'exited', userLat, userLng);
        showLocalNotification(`Left ${location.name}`, 'Your contacts have been notified.', {
          tag: `geofence-${location.id}`,
        });
        toast({
          title: `Left ${location.name}`,
          description: 'Your emergency contacts have been notified.',
        });
        notifyContacts(location.id, location.name, 'exited', userLat, userLng);
        lastNotificationRef.current.set(location.id, now);
      }

      geofenceStatesRef.current.set(location.id, { locationId: location.id, isInside });
    }

    setActiveZones(currentlyInside);
  }, [enabled, userLat, userLng, geofencedLocations, showLocalNotification, toast, notifyContacts, logGeofenceEvent]);

  return {
    geofencedLocations,
    activeZones,
    loading,
    refresh: fetchGeofencedLocations,
    simulateGeofenceEvent,
    checkGeofences,
  };
}
