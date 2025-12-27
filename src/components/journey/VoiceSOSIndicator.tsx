import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceSOSIndicatorProps {
  isListening: boolean;
  isSupported: boolean;
  hasSafeWord: boolean;
}

export default function VoiceSOSIndicator({ 
  isListening, 
  isSupported, 
  hasSafeWord 
}: VoiceSOSIndicatorProps) {
  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
        <MicOff className="w-4 h-4" />
        <span>Voice SOS not supported</span>
      </div>
    );
  }

  if (!hasSafeWord) {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 px-3 py-2 rounded-lg">
        <AlertCircle className="w-4 h-4" />
        <span>Set a safe word in Settings to enable voice SOS</span>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-all",
        isListening 
          ? "bg-primary/10 text-primary" 
          : "bg-muted/50 text-muted-foreground"
      )}
    >
      <div className="relative">
        <Mic className={cn(
          "w-4 h-4 transition-colors",
          isListening && "text-primary"
        )} />
        {isListening && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
        )}
      </div>
      <span>
        {isListening ? 'Listening for safe word...' : 'Voice SOS inactive'}
      </span>
    </div>
  );
}
