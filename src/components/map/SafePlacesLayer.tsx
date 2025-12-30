import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shield, Building2, Pill, TrainFront, Store, Flame } from 'lucide-react';
import { SafePlace, SafePlaceType } from '@/hooks/useSafePlaces';
import { cn } from '@/lib/utils';

interface SafePlacesLayerProps {
  places: SafePlace[];
  onPlaceClick?: (place: SafePlace) => void;
  selectedType?: SafePlaceType | 'all';
  className?: string;
}

const PLACE_CONFIG: Record<SafePlaceType, { icon: typeof Shield; color: string; label: string }> = {
  police: { icon: Shield, color: 'text-blue-400', label: 'Police' },
  hospital: { icon: Building2, color: 'text-red-400', label: 'Hospital' },
  pharmacy_24h: { icon: Pill, color: 'text-green-400', label: 'Pharmacy 24h' },
  metro: { icon: TrainFront, color: 'text-purple-400', label: 'Metro' },
  store_24h: { icon: Store, color: 'text-orange-400', label: 'Store 24h' },
  fire_station: { icon: Flame, color: 'text-red-500', label: 'Fire Station' },
};

export function getPlaceIcon(type: SafePlaceType) {
  return PLACE_CONFIG[type]?.icon || Shield;
}

export function getPlaceColor(type: SafePlaceType) {
  return PLACE_CONFIG[type]?.color || 'text-muted-foreground';
}

export function getPlaceLabel(type: SafePlaceType) {
  return PLACE_CONFIG[type]?.label || type;
}

// This component is for displaying in UI lists, not on the map directly
// The map markers would be added through the MapView component
export default function SafePlacesLayer({
  places,
  onPlaceClick,
  selectedType = 'all',
  className,
}: SafePlacesLayerProps) {
  const filteredPlaces = useMemo(() => {
    if (selectedType === 'all') return places;
    return places.filter(p => p.type === selectedType);
  }, [places, selectedType]);

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {filteredPlaces.map((place, index) => {
        const config = PLACE_CONFIG[place.type];
        const Icon = config?.icon || Shield;

        return (
          <motion.button
            key={place.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onPlaceClick?.(place)}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-card/50 hover:bg-card/80 
                       border border-border/30 hover:border-border/50 transition-all text-left"
          >
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
              "bg-background/50"
            )}>
              <Icon className={cn("w-5 h-5", config?.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{place.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {place.address || getPlaceLabel(place.type)}
              </p>
            </div>
            {place.distance_m !== undefined && (
              <span className="text-xs font-medium text-primary tabular-nums">
                {formatDistance(place.distance_m)}
              </span>
            )}
          </motion.button>
        );
      })}

      {filteredPlaces.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No safe places found nearby
        </p>
      )}
    </div>
  );
}
