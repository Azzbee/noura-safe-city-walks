import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MapView from '@/components/map/MapView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, AlertTriangle, Loader2, ArrowLeft, Wifi, WifiOff, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface SharedLocationData {
  user_name: string;
  journey: {
    id: string;
    status: string;
    destination: string;
    destination_coords: { lat: number; lng: number };
    started_at: string;
  };
  current_location: {
    lat: number;
    lng: number;
    accuracy: number;
    speed: number | null;
    recorded_at: string;
  } | null;
  location_trail: Array<{ lat: number; lng: number; recorded_at: string }>;
  expires_at: string;
}

export default function TrackLocation() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [data, setData] = useState<SharedLocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchLocation = async () => {
    if (!token) {
      setError('Invalid tracking link');
      setLoading(false);
      return;
    }

    try {
      const { data: result, error: invokeError } = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-shared-location?token=${token}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      ).then(res => res.json().then(data => ({ data, error: null })))
        .catch(err => ({ data: null, error: err }));

      if (invokeError || result?.error) {
        setError(result?.error || 'Failed to load location');
        setData(null);
      } else {
        setData(result);
        setError(null);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Error fetching location:', err);
      setError('Failed to load location');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchLocation();
  }, [token]);

  // Set up real-time subscription when journey is active
  useEffect(() => {
    if (!data || data.journey.status !== 'active') {
      setIsLive(false);
      return;
    }

    const journeyId = data.journey.id;
    
    // Subscribe to real-time location updates
    channelRef.current = supabase
      .channel(`journey-locations-${journeyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'journey_locations',
          filter: `journey_id=eq.${journeyId}`,
        },
        (payload) => {
          console.log('Real-time location update:', payload);
          const newLocation = payload.new as {
            lat: number;
            lng: number;
            accuracy: number;
            speed: number | null;
            recorded_at: string;
          };

          setData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              current_location: {
                lat: Number(newLocation.lat),
                lng: Number(newLocation.lng),
                accuracy: Number(newLocation.accuracy),
                speed: newLocation.speed ? Number(newLocation.speed) : null,
                recorded_at: newLocation.recorded_at,
              },
              location_trail: [
                ...prev.location_trail,
                {
                  lat: Number(newLocation.lat),
                  lng: Number(newLocation.lng),
                  recorded_at: newLocation.recorded_at,
                },
              ],
            };
          });
          setLastUpdate(new Date());
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'journeys',
          filter: `id=eq.${journeyId}`,
        },
        (payload) => {
          console.log('Journey status update:', payload);
          const updated = payload.new as { status: string };
          setData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              journey: {
                ...prev.journey,
                status: updated.status,
              },
            };
          });

          if (updated.status === 'alert_triggered') {
            toast({
              title: '🚨 Emergency Alert',
              description: 'This user has triggered an SOS or missed a check-in!',
              variant: 'destructive',
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsLive(false);
    };
  }, [data?.journey.id, data?.journey.status, toast]);

  // Fallback polling every 30 seconds if realtime isn't working
  useEffect(() => {
    if (!data || data.journey.status !== 'active') return;
    if (isLive) return; // Don't poll if realtime is working

    const interval = setInterval(fetchLocation, 30000);
    return () => clearInterval(interval);
  }, [data, isLive]);

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied',
        description: 'Share this link with others to track this journey',
      });
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the URL manually',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading location...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Unable to Track</h2>
            <p className="text-muted-foreground">{error || 'This tracking link is invalid or has expired.'}</p>
            <Button asChild variant="outline">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to Noura
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user_name, journey, current_location, location_trail } = data;
  const isActive = journey.status === 'active';
  const isAlert = journey.status === 'alert_triggered';

  const mapCenter: [number, number] = current_location 
    ? [current_location.lat, current_location.lng]
    : [journey.destination_coords.lat, journey.destination_coords.lng];

  const trailRoute = location_trail.length > 1 
    ? [{
        geometry: location_trail.map(loc => [loc.lat, loc.lng] as [number, number]),
        color: isAlert ? 'hsl(0, 84%, 60%)' : 'hsl(38, 92%, 55%)',
        weight: 4,
        opacity: 0.8,
      }]
    : [];

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Map */}
      <MapView
        center={mapCenter}
        userLocation={current_location ? [current_location.lat, current_location.lng] : undefined}
        destination={[journey.destination_coords.lat, journey.destination_coords.lng]}
        routes={trailRoute}
        isJourneyActive={isActive}
        zoom={16}
      />

      {/* Live indicator */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-30"
          >
            <div className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
              backdrop-blur-md shadow-lg
              ${isLive 
                ? 'bg-safe/20 text-safe border border-safe/30' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }
            `}>
              {isLive ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-safe opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-safe"></span>
                  </span>
                  <Wifi className="w-3 h-3" />
                  Live Tracking
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  Updating every 30s
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header info card */}
      <div className="absolute top-12 left-4 right-4 z-20">
        <Card className={`backdrop-blur-md ${isAlert ? 'border-destructive bg-destructive/10' : 'bg-card/90'}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Navigation className="w-5 h-5 text-primary" />
                Tracking {user_name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={isActive ? 'default' : isAlert ? 'destructive' : 'secondary'}>
                  {isAlert ? '🚨 ALERT' : isActive ? 'Active' : journey.status}
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyShareLink}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isAlert && (
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="bg-destructive/20 text-destructive p-3 rounded-lg text-sm font-medium"
              >
                ⚠️ This user has triggered an emergency alert or missed a check-in!
              </motion.div>
            )}
            
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground">Destination</p>
                <p className="font-medium">{journey.destination || 'Unknown'}</p>
              </div>
            </div>

            {current_location && (
              <div className="flex items-start gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground">Last Update</p>
                  <p className="font-medium">
                    {lastUpdate ? lastUpdate.toLocaleTimeString() : new Date(current_location.recorded_at).toLocaleTimeString()}
                    {current_location.speed && current_location.speed > 0 && (
                      <span className="text-muted-foreground ml-2">
                        ({Math.round(current_location.speed * 3.6)} km/h)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {!current_location && isActive && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Waiting for location update...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer with branding */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <Card className="bg-card/90 backdrop-blur-md">
          <CardContent className="py-3 text-center">
            <p className="text-sm text-muted-foreground">
              Powered by <span className="font-semibold text-primary">Noura</span> Safety
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This link expires {new Date(data.expires_at).toLocaleString()}
            </p>
            {location_trail.length > 0 && (
              <p className="text-xs text-primary mt-1">
                {location_trail.length} location update{location_trail.length > 1 ? 's' : ''} recorded
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
