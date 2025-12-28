import { AlertTriangle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SOSButtonProps {
  onPress: () => void;
  className?: string;
  size?: 'default' | 'large';
}

export default function SOSButton({
  onPress,
  className,
  size = 'default',
}: SOSButtonProps) {
  const isLarge = size === 'large';

  return (
    <Button
      variant="destructive"
      onClick={onPress}
      className={cn(
        'relative overflow-hidden font-display font-bold uppercase tracking-wider',
        'bg-gradient-to-br from-danger via-danger to-danger/80',
        'hover:from-danger/90 hover:via-danger hover:to-danger',
        'animate-pulse-danger transition-all duration-300',
        'border border-danger/30',
        isLarge
          ? 'h-24 w-24 rounded-full text-base gap-1 flex-col shadow-glow-danger'
          : 'h-14 px-8 rounded-full gap-3 shadow-elevated',
        className
      )}
    >
      {/* Animated ring effect for large button */}
      {isLarge && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-danger-foreground/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border border-danger-foreground/10" />
        </>
      )}
      
      <div className="relative z-10 flex items-center justify-center gap-2 flex-col">
        {isLarge ? (
          <>
            <AlertTriangle className="w-8 h-8 drop-shadow-lg" />
            <span className="text-sm font-bold">SOS</span>
          </>
        ) : (
          <>
            <Phone className="w-5 h-5" />
            <span>Emergency SOS</span>
          </>
        )}
      </div>
    </Button>
  );
}
