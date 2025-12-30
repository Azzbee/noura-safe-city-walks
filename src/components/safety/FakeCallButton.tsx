import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Clock, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FakeCallButtonProps {
  onSchedule: (delaySeconds: number) => void;
  onTriggerNow: () => void;
  isScheduled: boolean;
  remainingSeconds: number;
  onCancel: () => void;
  className?: string;
}

const TIMER_OPTIONS = [
  { label: '30 sec', seconds: 30 },
  { label: '1 min', seconds: 60 },
  { label: '2 min', seconds: 120 },
  { label: '5 min', seconds: 300 },
];

export default function FakeCallButton({
  onSchedule,
  onTriggerNow,
  isScheduled,
  remainingSeconds,
  onCancel,
  className,
}: FakeCallButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  if (isScheduled) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("relative", className)}
      >
        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Phone className="w-5 h-5 text-primary animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Fake call scheduled</p>
                <p className="text-xs text-primary">{formatRemaining(remainingSeconds)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onCancel}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-2 left-0 right-0"
          >
            <Card className="bg-card/95 backdrop-blur border-border/50 shadow-xl">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  Schedule Fake Call
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2">
                {/* Timer options */}
                <div className="grid grid-cols-2 gap-2">
                  {TIMER_OPTIONS.map(option => (
                    <Button
                      key={option.seconds}
                      variant="outline"
                      size="sm"
                      className="h-9"
                      onClick={() => {
                        onSchedule(option.seconds);
                        setIsExpanded(false);
                      }}
                    >
                      <Clock className="w-3 h-3 mr-1.5" />
                      {option.label}
                    </Button>
                  ))}
                </div>
                
                {/* Trigger now */}
                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    onTriggerNow();
                    setIsExpanded(false);
                  }}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Now
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        variant="outline"
        size="sm"
        className={cn(
          "gap-2 bg-card/80 backdrop-blur border-border/50",
          isExpanded && "ring-2 ring-primary/50"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Phone className="w-4 h-4" />
        <span>Fake Call</span>
        <ChevronDown className={cn(
          "w-3 h-3 transition-transform",
          isExpanded && "rotate-180"
        )} />
      </Button>
    </div>
  );
}
