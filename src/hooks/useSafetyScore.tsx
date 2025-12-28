import { useMemo } from 'react';
import { SafetyOverlay } from '@/hooks/useSafetyOverlays';
import { CrimeAlert } from '@/hooks/useCrimeAlerts';
import { SafetyReport } from '@/hooks/useSafetyReports';

interface UseSafetyScoreProps {
  userLocation: { lat: number; lng: number } | null;
  safetyOverlays: SafetyOverlay[];
  crimeAlerts: CrimeAlert[];
  safetyReports: SafetyReport[];
}

export interface SafetyScore {
  score: number; // 0-100
  level: 'safe' | 'moderate' | 'caution' | 'danger';
  label: string;
  factors: {
    dangerZones: number;
    crimeAlerts: number;
    safetyReports: number;
    safeZones: number;
  };
  nearbyThreats: number;
}

// Calculate distance between two points in meters
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

export function useSafetyScore({
  userLocation,
  safetyOverlays,
  crimeAlerts,
  safetyReports,
}: UseSafetyScoreProps): SafetyScore {
  return useMemo(() => {
    if (!userLocation) {
      return {
        score: 100,
        level: 'safe',
        label: 'Unknown',
        factors: { dangerZones: 0, crimeAlerts: 0, safetyReports: 0, safeZones: 0 },
        nearbyThreats: 0,
      };
    }

    const SCAN_RADIUS = 500; // meters
    let penalties = 0;
    let bonuses = 0;
    let nearbyThreats = 0;

    const factors = {
      dangerZones: 0,
      crimeAlerts: 0,
      safetyReports: 0,
      safeZones: 0,
    };

    // Check safety overlays
    const dangerTypes = ['danger_zone', 'caution_area'];
    const safeTypes = ['police_station', 'hospital', 'metro_station', 'well_lit', 'safe_area'];

    safetyOverlays.forEach((overlay) => {
      const distance = getDistanceMeters(
        userLocation.lat,
        userLocation.lng,
        overlay.center[0],
        overlay.center[1]
      );

      if (distance <= SCAN_RADIUS) {
        if (dangerTypes.includes(overlay.type)) {
          const isDanger = overlay.type === 'danger_zone';
          const severity = distance < overlay.radius 
            ? (isDanger ? 30 : 15) 
            : (isDanger ? 15 : 8);
          penalties += severity;
          factors.dangerZones++;
          nearbyThreats++;
        } else if (safeTypes.includes(overlay.type)) {
          bonuses += distance < overlay.radius ? 10 : 5;
          factors.safeZones++;
        }
      }
    });

    // Check crime alerts
    crimeAlerts.forEach((alert) => {
      const distance = getDistanceMeters(
        userLocation.lat,
        userLocation.lng,
        alert.lat,
        alert.lng
      );

      if (distance <= SCAN_RADIUS) {
        const basePenalty = alert.severity === 'high' ? 25 : alert.severity === 'medium' ? 15 : 8;
        const distanceFactor = 1 - (distance / SCAN_RADIUS);
        penalties += basePenalty * distanceFactor;
        factors.crimeAlerts++;
        nearbyThreats++;
      }
    });

    // Check crowd-sourced safety reports
    safetyReports.forEach((report) => {
      const distance = getDistanceMeters(
        userLocation.lat,
        userLocation.lng,
        Number(report.lat),
        Number(report.lng)
      );

      if (distance <= SCAN_RADIUS) {
        const negativeTypes = ['harassment', 'theft', 'assault', 'suspicious', 'poor_lighting'];
        if (negativeTypes.includes(report.report_type)) {
          const distanceFactor = 1 - (distance / SCAN_RADIUS);
          penalties += 10 * distanceFactor;
          factors.safetyReports++;
          nearbyThreats++;
        }
      }
    });

    // Calculate final score
    const rawScore = 100 - penalties + bonuses;
    const score = Math.max(0, Math.min(100, rawScore));

    // Determine level
    let level: SafetyScore['level'];
    let label: string;

    if (score >= 80) {
      level = 'safe';
      label = 'Safe Area';
    } else if (score >= 60) {
      level = 'moderate';
      label = 'Moderate';
    } else if (score >= 40) {
      level = 'caution';
      label = 'Use Caution';
    } else {
      level = 'danger';
      label = 'High Risk';
    }

    return {
      score: Math.round(score),
      level,
      label,
      factors,
      nearbyThreats,
    };
  }, [userLocation, safetyOverlays, crimeAlerts, safetyReports]);
}
