import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, Download, Share2, LogIn, LogOut, MapPin, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface GeofenceEvent {
  id: string;
  location_id: string;
  location_name: string;
  event_type: 'entered' | 'exited';
  lat: number;
  lng: number;
  created_at: string;
}

interface GeofenceEventRow {
  id: string;
  location_id: string;
  event_type: 'entered' | 'exited';
  lat: number;
  lng: number;
  created_at: string;
  saved_locations: { name: string } | null;
}

export default function GeofenceHistory() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [events, setEvents] = useState<GeofenceEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const fetchEvents = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('geofence_events')
        .select(`
          id,
          location_id,
          event_type,
          lat,
          lng,
          created_at,
          saved_locations (name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setEvents(
        (data || []).map((e: GeofenceEventRow) => ({
          id: e.id,
          location_id: e.location_id,
          location_name: e.saved_locations?.name || 'Unknown',
          event_type: e.event_type,
          lat: Number(e.lat),
          lng: Number(e.lng),
          created_at: e.created_at,
        }))
      );
    } catch (error) {
      console.error('Error fetching geofence events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const exportData = () => {
    const csv = [
      ['Date', 'Time', 'Location', 'Event', 'Latitude', 'Longitude'].join(','),
      ...events.map((e) =>
        [
          format(new Date(e.created_at), 'yyyy-MM-dd'),
          format(new Date(e.created_at), 'HH:mm:ss'),
          `"${e.location_name}"`,
          e.event_type,
          e.lat,
          e.lng,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geofence-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'History exported' });
  };

  const shareData = async () => {
    const text = events
      .slice(0, 10)
      .map(
        (e) =>
          `${e.event_type === 'entered' ? '📍' : '🚶'} ${e.location_name} - ${format(new Date(e.created_at), 'MMM d, HH:mm')}`
      )
      .join('\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Geofence History',
          text: `Recent location events:\n\n${text}`,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied to clipboard' });
    }
  };

  const clearHistory = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('geofence_events')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setEvents([]);
      toast({ title: 'History cleared' });
    } catch (error) {
      console.error('Error clearing history:', error);
      toast({ title: 'Failed to clear history', variant: 'destructive' });
    }
  };

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
        <div className="container max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/geofence-settings')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Zone History</h1>
              <p className="text-sm text-muted-foreground">{events.length} events</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={shareData} disabled={events.length === 0}>
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={exportData} disabled={events.length === 0}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-3">
        {events.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No geofence events yet</p>
              <p className="text-sm text-muted-foreground/70">
                Events will appear here when you enter or leave safe zones
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {events.map((event, index) => (
              <Card
                key={event.id}
                className="animate-fade-in-up opacity-0"
                style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'forwards' }}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        event.event_type === 'entered'
                          ? 'bg-safe/20 text-safe'
                          : 'bg-danger/20 text-danger'
                      }`}
                    >
                      {event.event_type === 'entered' ? (
                        <LogIn className="w-5 h-5" />
                      ) : (
                        <LogOut className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{event.location_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.event_type === 'entered' ? 'Arrived' : 'Left'} •{' '}
                        {format(new Date(event.created_at), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              onClick={clearHistory}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear History
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
