import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './use-toast';
import { CrimeAlert } from './useCrimeAlerts';
import { SafetyReport } from './useSafetyReports';
import { triggerHaptic } from '@/lib/haptics';

interface SafetyZone {
  id: string;
  lat: number;
  lng: number;
  radius: number;
  name?: string;
  type: 'crime' | 'danger' | 'caution' | 'report';
  severity?: 'low' | 'medium' | 'high';
}

interface UseJourneySafetyAlertsProps {
  userLocation: { lat: number; lng: number } | null;
  crimeAlerts: CrimeAlert[];
  safetyReports: SafetyReport[];
  isJourneyActive: boolean;
  alertCooldownMs?: number; // Prevent spam alerts
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useJourneySafetyAlerts({
  userLocation,
  crimeAlerts,
  safetyReports,
  isJourneyActive,
  alertCooldownMs = 60000, // 1 minute cooldown per zone
}: UseJourneySafetyAlertsProps) {
  const { toast } = useToast();
  const [activeAlerts, setActiveAlerts] = useState<SafetyZone[]>([]);
  const [alertHistory, setAlertHistory] = useState<string[]>([]);
  const lastAlertTimeRef = useRef<Record<string, number>>({});

  // Convert crime alerts and safety reports to safety zones
  const safetyZones = useCallback((): SafetyZone[] => {
    const zones: SafetyZone[] = [];

    // Add crime alerts
    crimeAlerts.forEach((alert) => {
      zones.push({
        id: `crime-${alert.id}`,
        lat: alert.lat,
        lng: alert.lng,
        radius: alert.severity === 'high' ? 200 : alert.severity === 'medium' ? 150 : 100,
        name: alert.title,
        type: 'crime',
        severity: alert.severity,
      });
    });

    // Add danger/caution safety reports
    safetyReports
      .filter((r) => r.report_type === 'danger' || r.report_type === 'caution')
      .forEach((report) => {
        zones.push({
          id: `report-${report.id}`,
          lat: report.lat,
          lng: report.lng,
          radius: report.report_type === 'danger' ? 150 : 100,
          name: report.description || `${report.report_type} area`,
          type: report.report_type === 'danger' ? 'danger' : 'caution',
          severity: report.report_type === 'danger' ? 'high' : 'medium',
        });
      });

    return zones;
  }, [crimeAlerts, safetyReports]);

  // Check proximity and trigger alerts
  useEffect(() => {
    if (!isJourneyActive || !userLocation) {
      setActiveAlerts([]);
      return;
    }

    const zones = safetyZones();
    const now = Date.now();
    const nearbyZones: SafetyZone[] = [];

    zones.forEach((zone) => {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        zone.lat,
        zone.lng
      );

      // Check if user is within the zone radius + 50m buffer (approaching)
      const approachRadius = zone.radius + 50;
      
      if (distance <= approachRadius) {
        nearbyZones.push(zone);

        // Check cooldown
        const lastAlertTime = lastAlertTimeRef.current[zone.id] || 0;
        if (now - lastAlertTime > alertCooldownMs) {
          // Only alert once per cooldown period
          lastAlertTimeRef.current[zone.id] = now;
          
          // Trigger alert
          const isEntering = distance <= zone.radius;
          const alertMessage = isEntering
            ? `You are in a ${zone.severity || ''} safety area`
            : `Approaching: ${zone.name || 'Safety concern ahead'}`;

          triggerHaptic(zone.severity === 'high' ? 'heavy' : 'medium');

          toast({
            title: zone.severity === 'high' ? '⚠️ Safety Alert' : '📍 Heads Up',
            description: alertMessage,
            variant: zone.severity === 'high' ? 'destructive' : 'default',
          });

          setAlertHistory((prev) => [
            ...prev.slice(-19), // Keep last 20 alerts
            `${new Date().toLocaleTimeString()}: ${alertMessage}`,
          ]);
        }
      }
    });

    setActiveAlerts(nearbyZones);
  }, [userLocation, isJourneyActive, safetyZones, alertCooldownMs, toast]);

  const clearAlertHistory = useCallback(() => {
    setAlertHistory([]);
    lastAlertTimeRef.current = {};
  }, []);

  return {
    activeAlerts,
    alertHistory,
    clearAlertHistory,
    isInDangerZone: activeAlerts.some((a) => a.severity === 'high'),
    nearbyAlertCount: activeAlerts.length,
  };
}
