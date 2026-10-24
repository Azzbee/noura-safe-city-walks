import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { triggerHaptic } from '@/lib/haptics';

interface BatteryManager {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
}

interface UseBatteryMonitorProps {
  isJourneyActive: boolean;
  warningThreshold?: number;
  criticalThreshold?: number;
  onCriticalBattery?: () => void;
}

export interface BatteryStatus {
  level: number;
  charging: boolean;
  isSupported: boolean;
  isLow: boolean;
  isCritical: boolean;
}

export function useBatteryMonitor({
  isJourneyActive,
  warningThreshold = 20,
  criticalThreshold = 10,
  onCriticalBattery,
}: UseBatteryMonitorProps) {
  const [status, setStatus] = useState<BatteryStatus>({
    level: 100,
    charging: false,
    isSupported: false,
    isLow: false,
    isCritical: false,
  });
  
  const { toast } = useToast();
  const hasWarnedRef = useRef(false);
  const hasCriticalRef = useRef(false);
  const batteryRef = useRef<BatteryManager | null>(null);
  // Keep the latest callback in a ref so an inline arrow from the caller
  // does not re-subscribe to the Battery API (and re-set state) every render.
  const onCriticalRef = useRef(onCriticalBattery);
  onCriticalRef.current = onCriticalBattery;

  const updateBatteryStatus = useCallback((battery: BatteryManager) => {
    const level = Math.round(battery.level * 100);
    const charging = battery.charging;
    const isLow = level <= warningThreshold && !charging;
    const isCritical = level <= criticalThreshold && !charging;

    setStatus((prev) =>
      prev.level === level &&
      prev.charging === charging &&
      prev.isSupported &&
      prev.isLow === isLow &&
      prev.isCritical === isCritical
        ? prev
        : { level, charging, isSupported: true, isLow, isCritical }
    );

    // Only show warnings during active journey
    if (isJourneyActive && !charging) {
      // Warning at threshold
      if (isLow && !isCritical && !hasWarnedRef.current) {
        hasWarnedRef.current = true;
        triggerHaptic('warning');
        toast({
          title: '⚡ Low Battery Warning',
          description: `Battery at ${level}%. Consider charging soon or enabling power saving mode.`,
          variant: 'destructive',
        });
      }

      // Critical alert
      if (isCritical && !hasCriticalRef.current) {
        hasCriticalRef.current = true;
        triggerHaptic('notification');
        toast({
          title: '🔋 Critical Battery Level',
          description: `Battery at ${level}%! Your phone may shut down soon. Consider notifying your contacts.`,
          variant: 'destructive',
        });
        onCriticalRef.current?.();
      }
    }

    // Reset warnings if charging or level increased
    if (charging || level > warningThreshold) {
      hasWarnedRef.current = false;
    }
    if (charging || level > criticalThreshold) {
      hasCriticalRef.current = false;
    }
  }, [isJourneyActive, warningThreshold, criticalThreshold, toast]);

  useEffect(() => {
    const nav = navigator as NavigatorWithBattery;
    
    if (!nav.getBattery) {
      setStatus(prev => (prev.isSupported ? { ...prev, isSupported: false } : prev));
      return;
    }

    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    nav.getBattery().then((battery) => {
      if (!mounted) return;
      
      batteryRef.current = battery;
      updateBatteryStatus(battery);

      const handleChange = () => {
        if (batteryRef.current) {
          updateBatteryStatus(batteryRef.current);
        }
      };

      battery.addEventListener('levelchange', handleChange);
      battery.addEventListener('chargingchange', handleChange);

      unsubscribe = () => {
        battery.removeEventListener('levelchange', handleChange);
        battery.removeEventListener('chargingchange', handleChange);
      };
    }).catch((err) => {
      console.error('Battery API error:', err);
      if (mounted) {
        setStatus(prev => ({ ...prev, isSupported: false }));
      }
    });

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [updateBatteryStatus]);

  // Reset warnings when journey starts
  useEffect(() => {
    if (isJourneyActive) {
      hasWarnedRef.current = false;
      hasCriticalRef.current = false;
    }
  }, [isJourneyActive]);

  const getBatteryIcon = useCallback((): string => {
    if (status.charging) return '🔌';
    if (status.level > 80) return '🔋';
    if (status.level > 50) return '🔋';
    if (status.level > 20) return '🪫';
    return '🪫';
  }, [status]);

  return {
    ...status,
    getBatteryIcon,
  };
}
