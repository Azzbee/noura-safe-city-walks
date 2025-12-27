import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MapView from '@/components/map/MapView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [data, setData] = useState<SharedLocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = async () => {
    if (!token) {
      setError('Invalid tracking link');
      setLoading(false);
      return;
    }

    try {
      const response = await supabase.functions.invoke('get-shared-location', {
        body: {},
        headers: {},
      });

      // Manually call with query params since invoke doesn't support them well
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

  // Poll for updates every 15 seconds
  useEffect(() => {
    if (!data || data.journey.status !== 'active') return;

    const interval = setInterval(fetchLocation, 15000);
    return () => clearInterval(interval);
  }, [data]);

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
        color: 'hsl(217, 91%, 60%)',
        weight: 4,
        opacity: 0.7,
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
        zoom={15}
      />

      {/* Header info card */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <Card className={isAlert ? 'border-destructive bg-destructive/10' : ''}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Navigation className="w-5 h-5 text-primary" />
                Tracking {user_name}
              </CardTitle>
              <Badge variant={isActive ? 'default' : isAlert ? 'destructive' : 'secondary'}>
                {isAlert ? '🚨 ALERT' : isActive ? 'Active' : journey.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isAlert && (
              <div className="bg-destructive/20 text-destructive p-3 rounded-lg text-sm font-medium">
                ⚠️ This user has triggered an emergency alert or missed a check-in!
              </div>
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
                    {new Date(current_location.recorded_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}

            {!current_location && isActive && (
              <p className="text-sm text-muted-foreground">
                Waiting for location update...
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer with branding */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <Card className="bg-card/90 backdrop-blur">
          <CardContent className="py-3 text-center">
            <p className="text-sm text-muted-foreground">
              Powered by <span className="font-semibold text-primary">Noura</span> Safety
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This link expires {new Date(data.expires_at).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
