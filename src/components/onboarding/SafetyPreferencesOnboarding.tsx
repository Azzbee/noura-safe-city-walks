import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Lightbulb, Shield, MapPin, Users, Camera, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SafetyFactor {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const safetyFactors: SafetyFactor[] = [
  {
    id: 'lighting',
    label: 'Well-Lit Paths',
    description: 'Streets with adequate lighting at night',
    icon: <Lightbulb className="w-6 h-6" />,
  },
  {
    id: 'police_stations',
    label: 'Police Presence',
    description: 'Routes near police stations and security posts',
    icon: <Shield className="w-6 h-6" />,
  },
  {
    id: 'busy_areas',
    label: 'Busy Areas',
    description: 'Paths through populated, high-traffic zones',
    icon: <Users className="w-6 h-6" />,
  },
  {
    id: 'cctv_coverage',
    label: 'CCTV Coverage',
    description: 'Areas with surveillance camera coverage',
    icon: <Camera className="w-6 h-6" />,
  },
  {
    id: 'safe_landmarks',
    label: 'Safe Landmarks',
    description: 'Near hospitals, fire stations, public buildings',
    icon: <MapPin className="w-6 h-6" />,
  },
];

interface SafetyPreferencesOnboardingProps {
  onComplete: (preferences: Record<string, number>) => void;
  onSkip?: () => void;
}

export default function SafetyPreferencesOnboarding({
  onComplete,
  onSkip,
}: SafetyPreferencesOnboardingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [preferences, setPreferences] = useState<Record<string, number>>({});

  const currentFactor = safetyFactors[currentIndex];
  const isLastFactor = currentIndex === safetyFactors.length - 1;
  const isFirstFactor = currentIndex === 0;

  const handleRating = (rating: number) => {
    setPreferences(prev => ({ ...prev, [currentFactor.id]: rating }));
  };

  const handleNext = () => {
    if (isLastFactor) {
      onComplete(preferences);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstFactor) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const currentRating = preferences[currentFactor?.id] || 0;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 border border-primary/10 rotate-45" />
        <div className="absolute bottom-10 right-10 w-24 h-24 border border-primary/10 rotate-12" />
        <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-primary/30 rounded-full" />
        <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-amber-500/20 rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md"
      >
        <Card className="bg-card/80 backdrop-blur-lg border-primary/20 p-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary">Personalize Your Safety</span>
            </motion.div>
            <h2 className="text-xl font-display font-semibold text-foreground">
              What matters most to you?
            </h2>
            <p className="text-sm text-muted-foreground">
              Rate each safety factor to customize your route recommendations
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {safetyFactors.map((factor, idx) => (
              <motion.div
                key={factor.id}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  idx === currentIndex
                    ? 'w-8 bg-primary'
                    : idx < currentIndex
                    ? 'w-1.5 bg-primary/60'
                    : 'w-1.5 bg-muted'
                )}
              />
            ))}
          </div>

          {/* Factor card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFactor.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex flex-col items-center text-center space-y-4 py-4">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-amber-500/10 border border-primary/30 flex items-center justify-center text-primary"
                >
                  {currentFactor.icon}
                </motion.div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {currentFactor.label}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentFactor.description}
                  </p>
                </div>
              </div>

              {/* Star rating */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRating(star)}
                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1"
                  >
                    <Star
                      className={cn(
                        'w-10 h-10 transition-all duration-200',
                        star <= currentRating
                          ? 'fill-primary text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]'
                          : 'text-muted-foreground/40 hover:text-muted-foreground'
                      )}
                    />
                  </motion.button>
                ))}
              </div>

              <div className="flex justify-center">
                <span className="text-xs text-muted-foreground">
                  {currentRating === 0
                    ? 'Tap to rate importance'
                    : currentRating === 1
                    ? 'Not important'
                    : currentRating === 2
                    ? 'Slightly important'
                    : currentRating === 3
                    ? 'Moderately important'
                    : currentRating === 4
                    ? 'Very important'
                    : 'Essential'}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={isFirstFactor}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentRating === 0}
              className="flex-1"
            >
              {isLastFactor ? 'Complete' : 'Next'}
              {!isLastFactor && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>

          {/* Skip option */}
          {onSkip && (
            <button
              onClick={onSkip}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
