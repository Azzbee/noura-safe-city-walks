import { Home, Briefcase, Star, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSavedLocations, SavedLocation } from '@/hooks/useSavedLocations';
import { cn } from '@/lib/utils';

interface SavedLocationsBarProps {
  onSelect: (location: SavedLocation) => void;
  onAddNew?: () => void;
  className?: string;
}

export default function SavedLocationsBar({
  onSelect,
  onAddNew,
  className,
}: SavedLocationsBarProps) {
  const { homeLocation, workLocation, otherLocations, loading } = useSavedLocations();

  if (loading) {
    return (
      <div className={cn('flex gap-2 overflow-x-auto pb-2', className)}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-10 w-24 rounded-lg bg-card animate-pulse flex-shrink-0"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex gap-2 overflow-x-auto pb-2 scrollbar-hide', className)}>
      {homeLocation && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onSelect(homeLocation)}
          className="flex-shrink-0 gap-2"
        >
          <Home className="w-4 h-4" />
          Home
        </Button>
      )}

      {workLocation && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onSelect(workLocation)}
          className="flex-shrink-0 gap-2"
        >
          <Briefcase className="w-4 h-4" />
          Work
        </Button>
      )}

      {otherLocations.slice(0, 3).map((location) => (
        <Button
          key={location.id}
          variant="secondary"
          size="sm"
          onClick={() => onSelect(location)}
          className="flex-shrink-0 gap-2"
        >
          <Star className="w-4 h-4" />
          {location.name}
        </Button>
      ))}

      {onAddNew && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAddNew}
          className="flex-shrink-0 gap-2"
        >
          <Plus className="w-4 h-4" />
          Add
        </Button>
      )}
    </div>
  );
}
