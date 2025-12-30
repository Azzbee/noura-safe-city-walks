import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, User, Volume2, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FakeCallScreenProps {
  state: 'ringing' | 'active' | 'ended';
  callerName: string;
  callDuration: string;
  currentResponse: string;
  onAnswer: () => void;
  onDecline: () => void;
  onEnd: () => void;
  onNextResponse: () => void;
}

export default function FakeCallScreen({
  state,
  callerName,
  callDuration,
  currentResponse,
  onAnswer,
  onDecline,
  onEnd,
  onNextResponse,
}: FakeCallScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 flex flex-col"
    >
      {/* Top section with caller info */}
      <div className="flex-1 flex flex-col items-center justify-center pt-20">
        {/* Avatar */}
        <motion.div
          animate={state === 'ringing' ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className={cn(
            "w-32 h-32 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mb-6",
            state === 'ringing' && "ring-4 ring-safe/50 ring-offset-4 ring-offset-zinc-900"
          )}
        >
          <User className="w-16 h-16 text-foreground/80" />
        </motion.div>

        {/* Caller name */}
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          {callerName}
        </h1>

        {/* Call status */}
        <p className="text-lg text-muted-foreground">
          {state === 'ringing' && 'Incoming Call...'}
          {state === 'active' && callDuration}
          {state === 'ended' && 'Call Ended'}
        </p>

        {/* Active call - fake voice response */}
        {state === 'active' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 mx-8 p-6 rounded-2xl bg-card/50 border border-border/50 max-w-sm"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Volume2 className="w-4 h-4 text-primary" />
              </div>
              <p className="text-foreground italic">"{currentResponse}"</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onNextResponse}
              className="w-full"
            >
              Next Response
            </Button>
          </motion.div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="pb-16 px-8">
        {state === 'ringing' && (
          <div className="flex justify-center gap-16">
            {/* Decline */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onDecline}
              className="w-20 h-20 rounded-full bg-destructive flex items-center justify-center shadow-lg shadow-destructive/30"
            >
              <PhoneOff className="w-8 h-8 text-destructive-foreground" />
            </motion.button>

            {/* Answer */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              onClick={onAnswer}
              className="w-20 h-20 rounded-full bg-safe flex items-center justify-center shadow-lg shadow-safe/30"
            >
              <Phone className="w-8 h-8 text-safe-foreground" />
            </motion.button>
          </div>
        )}

        {state === 'active' && (
          <div className="space-y-4">
            {/* Call controls */}
            <div className="flex justify-center gap-8 mb-8">
              <div className="w-14 h-14 rounded-full bg-card flex items-center justify-center">
                <Mic className="w-6 h-6 text-foreground" />
              </div>
              <div className="w-14 h-14 rounded-full bg-card flex items-center justify-center">
                <Volume2 className="w-6 h-6 text-foreground" />
              </div>
            </div>

            {/* End call */}
            <div className="flex justify-center">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onEnd}
                className="w-20 h-20 rounded-full bg-destructive flex items-center justify-center shadow-lg shadow-destructive/30"
              >
                <PhoneOff className="w-8 h-8 text-destructive-foreground" />
              </motion.button>
            </div>
          </div>
        )}

        {state === 'ended' && (
          <div className="flex justify-center">
            <p className="text-muted-foreground">Returning to app...</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
