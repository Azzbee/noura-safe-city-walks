import { Smartphone, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShakeSOSIndicatorProps {
  isListening: boolean;
  isSupported: boolean;
}

export default function ShakeSOSIndicator({ 
  isListening, 
  isSupported 
}: ShakeSOSIndicatorProps) {
  if (!isSupported) {
    return null; // Don't show anything if not supported
  }

  return (
    <div 
      className={cn(
        "flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-all",
        isListening 
          ? "bg-amber-500/10 text-amber-500" 
          : "bg-muted/50 text-muted-foreground"
      )}
    >
      <Smartphone className={cn(
        "w-4 h-4",
        isListening && "animate-pulse"
      )} />
      <span>
        {isListening ? 'Shake 3x for SOS' : 'Shake SOS inactive'}
      </span>
    </div>
  );
}
