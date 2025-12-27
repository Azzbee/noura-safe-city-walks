import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Navigation, X, CheckCircle, Clock, MapPin } from 'lucide-react';
import { Journey } from '@/hooks/useJourney';
import { formatDuration, formatDistance } from '@/services/routing';

interface JourneyControlsProps {
  journey: Journey;
  onComplete: () => void;
  onCancel: () => void;
}

export default function JourneyControls({ 
  journey, 
  onComplete, 
  onCancel 
}: JourneyControlsProps) {
  return (
    <Card className="bg-card/95 backdrop-blur border-primary/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            <span className="font-medium">Journey Active</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Check-in: {journey.checkin_interval}min</span>
          </div>
        </div>

        {journey.end_address && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{journey.end_address}</span>
          </div>
        )}

        <div className="flex gap-2 text-xs text-muted-foreground">
          {journey.distance_m && (
            <span>{formatDistance(journey.distance_m)}</span>
          )}
          {journey.duration_s && (
            <span>• {formatDuration(journey.duration_s)}</span>
          )}
          {journey.safety_score && (
            <span>• Safety: {Math.round(journey.safety_score * 100)}%</span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onComplete}
            className="flex-1 bg-safe hover:bg-safe/90"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Arrived Safely
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="border-muted-foreground/30"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
