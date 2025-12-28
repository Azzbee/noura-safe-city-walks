import { useEffect, useRef, useCallback } from 'react';
import { SafetyOverlay } from './useSafetyOverlays';
import { usePushNotifications } from './usePushNotifications';

interface UseDangerZoneAlertsProps {
  userLocation: [number, number] | undefined;
  safetyOverlays: SafetyOverlay[];
  isEnabled: boolean;
}

// Calculate distance between two points in meters
function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
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

export function useDangerZoneAlerts({
  userLocation,
  safetyOverlays,
  isEnabled,
}: UseDangerZoneAlertsProps) {
  const { showLocalNotification, permission, requestPermission } = usePushNotifications();
  const alertedZonesRef = useRef<Set<string>>(new Set());
  const lastLocationRef = useRef<[number, number] | null>(null);

  // Request permission on first use
  useEffect(() => {
    if (isEnabled && permission === 'default') {
      requestPermission();
    }
  }, [isEnabled, permission, requestPermission]);

  // Check for danger zone proximity
  const checkProximity = useCallback(() => {
    if (!userLocation || !isEnabled) return;

    const dangerZones = safetyOverlays.filter(
      (overlay) => overlay.type === 'danger_zone' || overlay.type === 'caution_area'
    );

    for (const zone of dangerZones) {
      const distance = getDistanceMeters(
        userLocation[0],
        userLocation[1],
        zone.center[0],
        zone.center[1]
      );

      const isInZone = distance <= zone.radius;
      const isApproaching = distance <= zone.radius + 100; // 100m buffer
      const zoneKey = `${zone.id}-${zone.type}`;

      // Check if we've already alerted for this zone recently
      if (alertedZonesRef.current.has(zoneKey)) {
        // If user has left the zone + buffer, remove from alerted set
        if (distance > zone.radius + 200) {
          alertedZonesRef.current.delete(zoneKey);
        }
        continue;
      }

      if (isInZone) {
        // User has entered a danger zone
        alertedZonesRef.current.add(zoneKey);
        
        const title = zone.type === 'danger_zone' 
          ? '⚠️ Danger Zone Alert' 
          : '⚡ Caution Area';
        
        const body = zone.name 
          ? `You are in ${zone.name}. Stay alert and aware of your surroundings.`
          : 'You have entered an area with reported safety concerns. Stay vigilant.';

        showLocalNotification(title, body, {
          tag: `danger-zone-${zone.id}`,
          requireInteraction: zone.type === 'danger_zone',
        });
      } else if (isApproaching && !alertedZonesRef.current.has(`approaching-${zoneKey}`)) {
        // User is approaching a danger zone (only alert once)
        alertedZonesRef.current.add(`approaching-${zoneKey}`);
        
        if (zone.type === 'danger_zone') {
          showLocalNotification(
            '📍 Approaching Danger Zone',
            zone.name 
              ? `${zone.name} is ${Math.round(distance)}m ahead. Consider an alternative route.`
              : 'A reported danger zone is nearby. Consider an alternative route.',
            { tag: `approaching-${zone.id}` }
          );
        }
      }
    }

    lastLocationRef.current = userLocation;
  }, [userLocation, safetyOverlays, isEnabled, showLocalNotification]);

  // Run proximity check when location updates
  useEffect(() => {
    checkProximity();
  }, [checkProximity]);

  // Reset alerted zones when overlays change significantly
  useEffect(() => {
    // Clear approaching alerts after 5 minutes
    const interval = setInterval(() => {
      const approachingAlerts = Array.from(alertedZonesRef.current).filter(
        (key) => key.startsWith('approaching-')
      );
      approachingAlerts.forEach((key) => alertedZonesRef.current.delete(key));
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    alertedZones: Array.from(alertedZonesRef.current),
  };
}
