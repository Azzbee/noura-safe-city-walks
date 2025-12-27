import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useJourneyHistory } from '@/hooks/useJourneyHistory';
import { Journey } from '@/hooks/useJourney';
import { formatDuration, formatDistance } from '@/services/routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, MapPin, Clock, Shield, AlertTriangle, CheckCircle, XCircle, Navigation } from 'lucide-react';
import { format } from 'date-fns';

function JourneyCard({ journey }: { journey: Journey }) {
  const statusConfig = {
    completed: {
      icon: CheckCircle,
      label: 'Completed',
      color: 'bg-safe/20 text-safe',
    },
    cancelled: {
      icon: XCircle,
      label: 'Cancelled',
      color: 'bg-muted text-muted-foreground',
    },
    alert_triggered: {
      icon: AlertTriangle,
      label: 'Alert Triggered',
      color: 'bg-destructive/20 text-destructive',
    },
    active: {
      icon: Navigation,
      label: 'Active',
      color: 'bg-primary/20 text-primary',
    },
    planned: {
      icon: Clock,
      label: 'Planned',
      color: 'bg-muted text-muted-foreground',
    },
  };

  const status = statusConfig[journey.status] || statusConfig.planned;
  const StatusIcon = status.icon;

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-medium truncate max-w-[200px]">
                {journey.end_address || 'Unknown destination'}
              </span>
            </div>
            {journey.start_address && (
              <p className="text-sm text-muted-foreground pl-6">
                From: {journey.start_address}
              </p>
            )}
          </div>
          <Badge className={status.color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {journey.distance_m && (
            <div className="flex items-center gap-1">
              <Navigation className="w-4 h-4" />
              {formatDistance(journey.distance_m)}
            </div>
          )}
          {journey.duration_s && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDuration(journey.duration_s)}
            </div>
          )}
          {journey.safety_score && (
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-safe" />
              {Math.round(journey.safety_score * 100)}% safe
            </div>
          )}
        </div>

        <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-border">
          <span>
            {journey.started_at
              ? format(new Date(journey.started_at), 'MMM d, yyyy h:mm a')
              : format(new Date(journey.created_at), 'MMM d, yyyy h:mm a')}
          </span>
          {journey.completed_at && (
            <span>
              Ended: {format(new Date(journey.completed_at), 'h:mm a')}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function JourneyHistory() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { journeys, loading } = useJourneyHistory();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Journey History</h1>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-4">
        {journeys.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <Navigation className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-lg font-medium mb-2">No journeys yet</h2>
              <p className="text-muted-foreground mb-4">
                Your completed journeys will appear here.
              </p>
              <Button onClick={() => navigate('/')}>
                Start a Journey
              </Button>
            </CardContent>
          </Card>
        ) : (
          journeys.map((journey) => (
            <JourneyCard key={journey.id} journey={journey} />
          ))
        )}
      </main>
    </div>
  );
}
