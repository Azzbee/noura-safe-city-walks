import { useState } from 'react';
import { AlertTriangle, Phone, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { triggerSOSFeedback } from '@/lib/haptics';

interface SOSButtonProps {
  onPress: () => void;
  className?: string;
  size?: 'default' | 'large';
}

// Emergency numbers by country - defaulting to France (Paris app)
const EMERGENCY_NUMBERS = {
  police: '17',
  ambulance: '15',
  fire: '18',
  general: '112', // EU-wide emergency number
};

export default function SOSButton({
  onPress,
  className,
  size = 'default',
}: SOSButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const isLarge = size === 'large';

  const handlePress = () => {
    // Trigger intense haptic and sound feedback
    triggerSOSFeedback();
    setShowDialog(true);
  };

  const handleConfirmSOS = () => {
    setShowDialog(false);
    onPress();
  };

  const handleCallEmergency = (number: string) => {
    // Close dialog first
    setShowDialog(false);
    
    // Trigger haptic feedback
    triggerSOSFeedback();
    
    // Also notify contacts in background
    onPress();
    
    // Initiate phone call
    window.location.href = `tel:${number}`;
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={handlePress}
        aria-label="Emergency SOS"
        className={cn(
          'relative overflow-hidden font-display font-bold uppercase tracking-wider',
          'bg-gradient-to-br from-danger via-danger to-danger/80',
          'hover:from-danger/90 hover:via-danger hover:to-danger',
          'animate-pulse-danger transition-all duration-300',
          'border border-danger/30',
          'active:scale-95',
          isLarge
            ? 'h-24 w-24 rounded-full text-base gap-1 flex-col shadow-glow-danger'
            : 'h-11 sm:h-14 px-5 sm:px-8 rounded-full gap-3 shadow-elevated shrink-0',
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
              <Phone className="w-5 h-5 hidden sm:block" />
              <span className="sm:hidden">SOS</span>
              <span className="hidden sm:inline">Emergency SOS</span>
            </>
          )}
        </div>
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-danger">
              <AlertTriangle className="w-6 h-6" />
              Emergency SOS
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left space-y-3">
              <p>Choose an action:</p>
              
              {/* Emergency call buttons */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <Button
                  variant="destructive"
                  size="lg"
                  className="h-16 flex-col gap-1"
                  onClick={() => handleCallEmergency(EMERGENCY_NUMBERS.police)}
                >
                  <PhoneCall className="w-5 h-5" />
                  <span className="text-xs">Police (17)</span>
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  className="h-16 flex-col gap-1"
                  onClick={() => handleCallEmergency(EMERGENCY_NUMBERS.ambulance)}
                >
                  <PhoneCall className="w-5 h-5" />
                  <span className="text-xs">SAMU (15)</span>
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  className="h-16 flex-col gap-1"
                  onClick={() => handleCallEmergency(EMERGENCY_NUMBERS.fire)}
                >
                  <PhoneCall className="w-5 h-5" />
                  <span className="text-xs">Fire (18)</span>
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  className="h-16 flex-col gap-1"
                  onClick={() => handleCallEmergency(EMERGENCY_NUMBERS.general)}
                >
                  <PhoneCall className="w-5 h-5" />
                  <span className="text-xs">EU (112)</span>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground pt-2">
                Calling will also notify your emergency contacts with your live location.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={handleConfirmSOS}
              className="w-full bg-warning hover:bg-warning/90 text-warning-foreground"
            >
              Notify Contacts Only
            </AlertDialogAction>
            <AlertDialogCancel className="w-full">Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
