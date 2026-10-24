import { useState, useEffect, useCallback, useRef } from 'react';

// iOS 13+ exposes DeviceMotionEvent.requestPermission()
type DeviceMotionEventWithPermission = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

interface ShakeDetectionOptions {
  threshold?: number;
  timeout?: number;
  shakeCount?: number;
}

interface UseShakeDetectionProps {
  isActive: boolean;
  onShakeDetected: () => void;
  options?: ShakeDetectionOptions;
}

export function useShakeDetection({ 
  isActive, 
  onShakeDetected,
  options = {} 
}: UseShakeDetectionProps) {
  const {
    threshold = 15, // Acceleration threshold (m/s²)
    timeout = 1000, // Time window for shake detection (ms)
    shakeCount = 3, // Number of shakes required
  } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  const lastAcceleration = useRef({ x: 0, y: 0, z: 0 });
  const shakeTimestamps = useRef<number[]>([]);
  const hasTriggered = useRef(false);

  // Check for DeviceMotionEvent support
  useEffect(() => {
    const supported = 'DeviceMotionEvent' in window;
    setIsSupported(supported);
    
    // Check if permission API exists (iOS 13+)
    if (supported && typeof (DeviceMotionEvent as unknown as DeviceMotionEventWithPermission).requestPermission !== 'function') {
      // Android or older iOS - permission not needed
      setPermissionGranted(true);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof (DeviceMotionEvent as unknown as DeviceMotionEventWithPermission).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as unknown as DeviceMotionEventWithPermission).requestPermission!();
        if (permission === 'granted') {
          setPermissionGranted(true);
          return true;
        }
      } catch (error) {
        console.error('Error requesting motion permission:', error);
      }
      return false;
    }
    return true;
  }, []);

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    if (!event.accelerationIncludingGravity || hasTriggered.current) return;

    const { x, y, z } = event.accelerationIncludingGravity;
    if (x === null || y === null || z === null) return;

    // Calculate acceleration change
    const deltaX = Math.abs(x - lastAcceleration.current.x);
    const deltaY = Math.abs(y - lastAcceleration.current.y);
    const deltaZ = Math.abs(z - lastAcceleration.current.z);
    
    const totalDelta = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

    // Update last acceleration
    lastAcceleration.current = { x, y, z };

    // Check if this is a shake
    if (totalDelta > threshold) {
      const now = Date.now();
      
      // Remove old timestamps outside the timeout window
      shakeTimestamps.current = shakeTimestamps.current.filter(
        ts => now - ts < timeout
      );
      
      // Add current shake
      shakeTimestamps.current.push(now);

      console.log(`Shake detected! Count: ${shakeTimestamps.current.length}, Delta: ${totalDelta.toFixed(2)}`);

      // Check if we've reached the required shake count
      if (shakeTimestamps.current.length >= shakeCount) {
        console.log('SHAKE SOS TRIGGERED!');
        hasTriggered.current = true;
        shakeTimestamps.current = [];
        onShakeDetected();
        
        // Reset after 3 seconds to allow triggering again
        setTimeout(() => {
          hasTriggered.current = false;
        }, 3000);
      }
    }
  }, [threshold, timeout, shakeCount, onShakeDetected]);

  const startListening = useCallback(async () => {
    if (!isSupported) return false;

    const hasPermission = await requestPermission();
    if (!hasPermission) return false;

    window.addEventListener('devicemotion', handleMotion);
    setIsListening(true);
    hasTriggered.current = false;
    shakeTimestamps.current = [];
    console.log('Shake detection started');
    return true;
  }, [isSupported, requestPermission, handleMotion]);

  const stopListening = useCallback(() => {
    window.removeEventListener('devicemotion', handleMotion);
    setIsListening(false);
    shakeTimestamps.current = [];
    console.log('Shake detection stopped');
  }, [handleMotion]);

  // Auto start/stop based on isActive
  useEffect(() => {
    if (isActive && isSupported && permissionGranted) {
      startListening();
    } else {
      stopListening();
    }

    return () => stopListening();
  }, [isActive, isSupported, permissionGranted, startListening, stopListening]);

  return {
    isSupported,
    isListening,
    permissionGranted,
    requestPermission,
    startListening,
    stopListening,
  };
}
