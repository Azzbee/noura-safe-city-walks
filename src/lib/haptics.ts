// Haptic feedback and sound effects for mobile interactions

// Haptic patterns
export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'sos';

const hapticPatterns: Record<HapticPattern, number[]> = {
  light: [10],
  medium: [25],
  heavy: [50],
  success: [10, 50, 10],
  warning: [30, 50, 30],
  error: [50, 100, 50, 100, 50],
  sos: [100, 50, 100, 50, 100, 200, 300, 50, 300, 50, 300, 200, 100, 50, 100, 50, 100], // ... --- ...
};

// Check if Vibration API is supported
export function isHapticSupported(): boolean {
  return 'vibrate' in navigator;
}

// Trigger haptic feedback
export function triggerHaptic(pattern: HapticPattern = 'medium'): boolean {
  if (!isHapticSupported()) return false;
  
  try {
    navigator.vibrate(hapticPatterns[pattern]);
    return true;
  } catch {
    return false;
  }
}

// Sound effect URLs (using Web Audio API-friendly base64 or URLs)
const soundEffects = {
  sos: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU',
  checkin: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU',
  success: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU',
  alert: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU',
};

export type SoundEffect = keyof typeof soundEffects;

// Audio context singleton
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioContext;
}

// Generate a simple beep tone
function generateTone(
  frequency: number,
  duration: number,
  volume: number = 0.3,
  type: OscillatorType = 'sine'
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

// Play sound effect
export function playSound(effect: SoundEffect): void {
  switch (effect) {
    case 'sos':
      // Urgent alarm pattern
      generateTone(880, 0.15, 0.4, 'square');
      setTimeout(() => generateTone(660, 0.15, 0.4, 'square'), 200);
      setTimeout(() => generateTone(880, 0.15, 0.4, 'square'), 400);
      break;
    case 'checkin':
      // Gentle notification
      generateTone(523, 0.1, 0.25, 'sine');
      setTimeout(() => generateTone(659, 0.1, 0.25, 'sine'), 120);
      setTimeout(() => generateTone(784, 0.15, 0.3, 'sine'), 240);
      break;
    case 'success':
      // Pleasant confirmation
      generateTone(523, 0.08, 0.2, 'sine');
      setTimeout(() => generateTone(659, 0.08, 0.2, 'sine'), 100);
      setTimeout(() => generateTone(784, 0.12, 0.25, 'sine'), 200);
      break;
    case 'alert':
      // Warning tone
      generateTone(440, 0.2, 0.35, 'sawtooth');
      setTimeout(() => generateTone(440, 0.2, 0.35, 'sawtooth'), 300);
      break;
  }
}

// Combined feedback function
export function triggerFeedback(
  haptic: HapticPattern = 'medium',
  sound?: SoundEffect
): void {
  triggerHaptic(haptic);
  if (sound) {
    playSound(sound);
  }
}

// SOS feedback - maximum urgency
export function triggerSOSFeedback(): void {
  triggerHaptic('sos');
  playSound('sos');
}

// Check-in prompt feedback
export function triggerCheckinFeedback(): void {
  triggerHaptic('warning');
  playSound('checkin');
}

// Success feedback (journey complete, check-in responded)
export function triggerSuccessFeedback(): void {
  triggerHaptic('success');
  playSound('success');
}

// Alert feedback (missed check-in, warning)
export function triggerAlertFeedback(): void {
  triggerHaptic('error');
  playSound('alert');
}
