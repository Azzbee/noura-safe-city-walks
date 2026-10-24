import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Navigation, Phone, X, Shield, Pill, TrainFront, Store, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SafePlace, SafePlaceType } from '@/hooks/useSafePlaces';
import { getPlaceIcon, getPlaceColor, getPlaceLabel } from './SafePlacesLayer';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';

interface NearestSafePlaceButtonProps {
  nearestPlace: SafePlace | null;
  placesByType: Record<SafePlaceType, SafePlace[]>;
  onNavigate: (place: SafePlace) => void;
  onCall: (place: SafePlace) => void;
  loading?: boolean;
  className?: string;
}

const QUICK_TYPES: SafePlaceType[] = ['police', 'hospital', 'metro', 'store_24h'];

export default function NearestSafePlaceButton({
  nearestPlace,
  placesByType,
  onNavigate,
  onCall,
  loading,
  className,
}: NearestSafePlaceButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const handleNavigate = (place: SafePlace) => {
    triggerHaptic('medium');
    onNavigate(place);
    setIsExpanded(false);
  };

  return (
    <div className={cn("relative", className)}>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-2 left-0 w-[min(300px,calc(100vw-2rem))] z-50"
          >
            <Card className="bg-card/95 backdrop-blur border-border/50 shadow-xl">
              <CardHeader className="pb-2 pt-3 px-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-safe" />
                  Nearby Safe Places
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsExpanded(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-3">
                {/* Quick type buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_TYPES.map(type => {
                    const nearest = placesByType[type]?.[0];
                    const Icon = getPlaceIcon(type);
                    
                    return (
                      <Button
                        key={type}
                        variant="outline"
                        size="sm"
                        className="h-auto py-2 px-3 flex-col items-start gap-0.5"
                        onClick={() => nearest && handleNavigate(nearest)}
                        disabled={!nearest}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Icon className={cn("w-4 h-4", getPlaceColor(type))} />
                          <span className="text-xs">{getPlaceLabel(type)}</span>
                        </div>
                        {nearest?.distance_m && (
                          <span className="text-[10px] text-muted-foreground pl-6">
                            {formatDistance(nearest.distance_m)}
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </div>

                {/* Nearest overall with call option */}
                {nearestPlace && (
                  <div className="p-2 rounded-lg bg-safe/10 border border-safe/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-safe" />
                      <span className="text-xs font-medium">Nearest Safe Place</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{nearestPlace.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistance(nearestPlace.distance_m || 0)} • {getPlaceLabel(nearestPlace.type)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {nearestPlace.phone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onCall(nearestPlace)}
                          >
                            <Phone className="w-4 h-4 text-primary" />
                          </Button>
                        )}
                        <Button
                          variant="default"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleNavigate(nearestPlace)}
                        >
                          <Navigation className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main button */}
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "w-full h-11 sm:h-9 gap-2 bg-safe/10 border-safe/30 hover:bg-safe/20 text-safe",
          isExpanded && "ring-2 ring-safe/50"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={loading}
      >
        <Shield className="w-4 h-4" />
        <span>Safe Places</span>
        {nearestPlace && (
          <span className="text-xs opacity-80">
            {formatDistance(nearestPlace.distance_m || 0)}
          </span>
        )}
        <ChevronDown className={cn(
          "w-3 h-3 transition-transform",
          isExpanded && "rotate-180"
        )} />
      </Button>
    </div>
  );
}
