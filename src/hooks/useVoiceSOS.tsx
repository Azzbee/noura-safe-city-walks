import { useState, useEffect, useCallback, useRef } from 'react';
import { useProfile } from './useProfile';
import { useToast } from './use-toast';

// Web Speech API types
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

interface UseVoiceSOSProps {
  isActive: boolean;
  onSafeWordDetected: () => void;
}

export function useVoiceSOS({ isActive, onSafeWordDetected }: UseVoiceSOSProps) {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for Web Speech API support
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionAPI);
  }, []);

  const safeWord = profile?.safe_word?.toLowerCase().trim();

  const checkForSafeWord = useCallback((transcript: string) => {
    if (!safeWord) return false;
    
    const normalizedTranscript = transcript.toLowerCase().trim();
    console.log('Checking transcript:', normalizedTranscript, 'for safe word:', safeWord);
    
    // Check if the transcript contains the safe word
    if (normalizedTranscript.includes(safeWord)) {
      console.log('SAFE WORD DETECTED!');
      return true;
    }
    
    return false;
  }, [safeWord]);

  const startListening = useCallback(() => {
    if (!isSupported || !safeWord) {
      console.log('Voice SOS not available:', { isSupported, hasSafeWord: !!safeWord });
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Voice recognition started');
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      const latestResult = results[results.length - 1];
      const transcript = latestResult[0].transcript;
      
      setLastTranscript(transcript);

      if (checkForSafeWord(transcript)) {
        // Safe word detected - trigger SOS
        recognition.stop();
        setIsListening(false);
        
        toast({
          title: '🚨 Safe Word Detected',
          description: 'Triggering emergency SOS...',
          variant: 'destructive',
        });
        
        onSafeWordDetected();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      
      // Don't show error for aborted recognition (happens on stop)
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        toast({
          title: 'Voice Recognition Error',
          description: `Error: ${event.error}. Retrying...`,
          variant: 'destructive',
        });
      }
      
      // Restart after error (except for not-allowed)
      if (event.error !== 'not-allowed' && isActive) {
        restartTimeoutRef.current = setTimeout(() => {
          if (isActive) startListening();
        }, 1000);
      }
    };

    recognition.onend = () => {
      console.log('Voice recognition ended');
      setIsListening(false);
      
      // Auto-restart if still active
      if (isActive && safeWord) {
        restartTimeoutRef.current = setTimeout(() => {
          if (isActive) startListening();
        }, 500);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
    }
  }, [isSupported, safeWord, isActive, checkForSafeWord, onSafeWordDetected, toast]);

  const stopListening = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Start/stop based on active state
  useEffect(() => {
    if (isActive && safeWord && isSupported) {
      startListening();
    } else {
      stopListening();
    }

    return () => stopListening();
  }, [isActive, safeWord, isSupported, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    hasSafeWord: !!safeWord,
    lastTranscript,
    startListening,
    stopListening,
  };
}
