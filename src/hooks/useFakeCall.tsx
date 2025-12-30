import { useState, useCallback, useRef, useEffect } from 'react';
import { triggerHaptic } from '@/lib/haptics';

export interface FakeCallSettings {
  callerName: string;
  callerPhoto?: string;
  ringtoneEnabled: boolean;
}

type FakeCallState = 'idle' | 'scheduled' | 'ringing' | 'active' | 'ended';

const FAKE_RESPONSES = [
  "Hey, where are you? I've been waiting!",
  "Are you almost here? We're all waiting for you.",
  "Hello? Can you hear me? I'm outside your location now.",
  "I'm coming to pick you up, stay right there!",
  "Everything okay? You sound strange. I'm on my way.",
];

export function useFakeCall() {
  const [state, setState] = useState<FakeCallState>('idle');
  const [callerName, setCallerName] = useState('Mom');
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [currentResponse, setCurrentResponse] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, []);

  // Schedule a fake call after delay
  const scheduleCall = useCallback((delaySeconds: number, name?: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    if (name) setCallerName(name);
    const triggerTime = new Date(Date.now() + delaySeconds * 1000);
    setScheduledTime(triggerTime);
    setState('scheduled');

    timerRef.current = setTimeout(() => {
      triggerCall();
    }, delaySeconds * 1000);
  }, []);

  // Trigger the call immediately
  const triggerCall = useCallback(() => {
    setState('ringing');
    triggerHaptic('notification');
    
    // Vibration pattern for incoming call
    if ('vibrate' in navigator) {
      const pattern = [200, 100, 200, 100, 200, 500];
      const vibrationInterval = setInterval(() => {
        navigator.vibrate(pattern);
      }, 2000);
      
      // Store for cleanup
      timerRef.current = setTimeout(() => {
        clearInterval(vibrationInterval);
        navigator.vibrate(0);
      }, 30000); // Stop after 30s if not answered
    }
  }, []);

  // Answer the call
  const answerCall = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    navigator.vibrate?.(0);
    
    setState('active');
    setCallDuration(0);
    setCurrentResponse(0);
    triggerHaptic('light');

    // Start call duration timer
    callTimerRef.current = setInterval(() => {
      setCallDuration(d => d + 1);
    }, 1000);
  }, []);

  // Play next response
  const nextResponse = useCallback(() => {
    setCurrentResponse(r => (r + 1) % FAKE_RESPONSES.length);
    triggerHaptic('light');
  }, []);

  // End the call
  const endCall = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    navigator.vibrate?.(0);
    
    setState('ended');
    triggerHaptic('light');

    // Reset after a moment
    setTimeout(() => {
      setState('idle');
      setScheduledTime(null);
      setCallDuration(0);
    }, 2000);
  }, []);

  // Decline/cancel the call
  const declineCall = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    navigator.vibrate?.(0);
    
    setState('idle');
    setScheduledTime(null);
    triggerHaptic('light');
  }, []);

  // Cancel scheduled call
  const cancelScheduled = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState('idle');
    setScheduledTime(null);
  }, []);

  // Get remaining time until scheduled call
  const getRemainingTime = useCallback((): number => {
    if (!scheduledTime) return 0;
    return Math.max(0, Math.floor((scheduledTime.getTime() - Date.now()) / 1000));
  }, [scheduledTime]);

  // Format call duration
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    state,
    callerName,
    setCallerName,
    scheduledTime,
    callDuration,
    currentResponse: FAKE_RESPONSES[currentResponse],
    scheduleCall,
    triggerCall,
    answerCall,
    endCall,
    declineCall,
    cancelScheduled,
    nextResponse,
    getRemainingTime,
    formatDuration,
    isActive: state !== 'idle',
  };
}
