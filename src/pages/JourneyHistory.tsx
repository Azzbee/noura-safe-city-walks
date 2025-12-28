import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useJourneyHistory } from '@/hooks/useJourneyHistory';
import { Journey } from '@/hooks/useJourney';
import { formatDuration, formatDistance } from '@/services/routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { JourneyHistorySkeleton } from '@/components/ui/art-deco-skeleton';
import { ArrowLeft, MapPin, Clock, Shield, AlertTriangle, CheckCircle, XCircle, Navigation } from 'lucide-react';
import { format } from 'date-fns';

function JourneyCard({ journey, index }: { journey: Journey; index: number }) {
  const statusConfig = {
    completed: {
      icon: CheckCircle,
      label: 'Completed',
      color: 'bg-safe/20 text-safe border-safe/30',
      iconColor: 'text-safe',
    },
    cancelled: {
      icon: XCircle,
      label: 'Cancelled',
      color: 'bg-muted text-muted-foreground border-muted-foreground/20',
      iconColor: 'text-muted-foreground',
    },
    alert_triggered: {
      icon: AlertTriangle,
      label: 'Alert Triggered',
      color: 'bg-destructive/20 text-destructive border-destructive/30',
      iconColor: 'text-destructive',
    },
    active: {
      icon: Navigation,
      label: 'Active',
      color: 'bg-primary/20 text-primary border-primary/30',
      iconColor: 'text-primary',
    },
    planned: {
      icon: Clock,
      label: 'Planned',
      color: 'bg-muted text-muted-foreground border-muted-foreground/20',
      iconColor: 'text-muted-foreground',
    },
  };

  const status = statusConfig[journey.status] || statusConfig.planned;
  const StatusIcon = status.icon;

  return (
    <Card 
      className="group interactive-card bg-card/80 border-border/50 backdrop-blur-sm 
                 animate-fade-in-up opacity-0"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <CardContent className="p-5 space-y-4">
        {/* Header with destination and status */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 
                              group-hover:scale-110 transition-all duration-300">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <span className="font-display font-medium truncate text-foreground/90 
                               group-hover:text-foreground transition-colors">
                {journey.end_address || 'Unknown destination'}
              </span>
            </div>
            {journey.start_address && (
              <p className="text-sm text-muted-foreground pl-11 truncate 
                            group-hover:text-muted-foreground/80 transition-colors">
                From: {journey.start_address}
              </p>
            )}
          </div>
          <Badge 
            className={`${status.color} border shrink-0 transition-all duration-300 
                        group-hover:scale-105 group-hover:shadow-sm`}
          >
            <StatusIcon className={`w-3 h-3 mr-1.5 ${status.iconColor}`} />
            {status.label}
          </Badge>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-4 text-sm">
          {journey.distance_m && (
            <div className="flex items-center gap-1.5 text-muted-foreground 
                            group-hover:text-foreground/70 transition-colors">
              <Navigation className="w-4 h-4 icon-hover" />
              <span>{formatDistance(journey.distance_m)}</span>
            </div>
          )}
          {journey.duration_s && (
            <div className="flex items-center gap-1.5 text-muted-foreground 
                            group-hover:text-foreground/70 transition-colors">
              <Clock className="w-4 h-4 icon-hover" />
              <span>{formatDuration(journey.duration_s)}</span>
            </div>
          )}
          {journey.safety_score && (
            <div className="flex items-center gap-1.5 text-safe 
                            group-hover:text-safe transition-colors">
              <Shield className="w-4 h-4 icon-hover" />
              <span>{Math.round(journey.safety_score * 100)}% safe</span>
            </div>
          )}
        </div>

        {/* Footer with timestamps */}
        <div className="flex justify-between text-xs text-muted-foreground/70 pt-3 
                        border-t border-border/50 group-hover:border-border transition-colors">
          <span className="group-hover:text-muted-foreground transition-colors">
            {journey.started_at
              ? format(new Date(journey.started_at), 'MMM d, yyyy h:mm a')
              : format(new Date(journey.created_at), 'MMM d, yyyy h:mm a')}
          </span>
          {journey.completed_at && (
            <span className="group-hover:text-muted-foreground transition-colors">
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
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
          <div className="container max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Journey History</h1>
          </div>
        </header>
        <main className="container max-w-lg mx-auto px-4 py-6">
          <JourneyHistorySkeleton />
        </main>
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
          journeys.map((journey, index) => (
            <JourneyCard key={journey.id} journey={journey} index={index} />
          ))
        )}
      </main>
    </div>
  );
}
