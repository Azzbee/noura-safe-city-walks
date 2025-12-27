import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { useSavedLocations, SavedLocation } from '@/hooks/useSavedLocations';
import { TimeOfDay } from '@/services/routing';
import MapView from '@/components/map/MapView';
import DestinationSearch from '@/components/map/DestinationSearch';
import SavedLocationsBar from '@/components/map/SavedLocationsBar';
import TimeOfDaySelector from '@/components/map/TimeOfDaySelector';
import SOSButton from '@/components/map/SOSButton';
import Header from '@/components/layout/Header';
import RouteServiceStatus from '@/components/routing/RouteServiceStatus';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Paris center coordinates
const PARIS_CENTER: [number, number] = [48.8566, 2.3522];

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  
  const [destination, setDestination] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 18) return 'day';
    if (hour >= 18 && hour < 21) return 'evening';
    if (hour >= 21 || hour < 1) return 'night';
    return 'late_night';
  });

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleDestinationSelect = (lat: number, lng: number, address: string) => {
    setDestination({ lat, lng, address });
    toast({ title: 'Destination set', description: address });
  };

  const handleSavedLocationSelect = (loc: SavedLocation) => {
    setDestination({ lat: loc.lat, lng: loc.lng, address: loc.address || loc.name });
    toast({ title: 'Destination set', description: loc.name });
  };

  const handleSOS = () => {
    toast({
      title: 'SOS Activated',
      description: 'Contacting your emergency contacts...',
      variant: 'destructive',
    });
    // TODO: Implement SOS functionality
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const mapCenter: [number, number] = location.error 
    ? PARIS_CENTER 
    : [location.lat, location.lng];

  const userLocation: [number, number] | undefined = !location.error 
    ? [location.lat, location.lng] 
    : undefined;

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Full-screen map */}
      <MapView
        center={mapCenter}
        userLocation={userLocation}
        destination={destination ? [destination.lat, destination.lng] : undefined}
        zoom={15}
      />

      {/* Header with menu and user */}
      <Header />

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-4 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none">
        {/* Service status */}
        <div className="flex justify-center pointer-events-auto">
          <RouteServiceStatus />
        </div>

        {/* Time of day selector */}
        <div className="flex justify-center pointer-events-auto">
          <TimeOfDaySelector value={timeOfDay} onChange={setTimeOfDay} />
        </div>

        {/* Saved locations */}
        <div className="pointer-events-auto">
          <SavedLocationsBar
            onSelect={handleSavedLocationSelect}
          />
        </div>

        {/* Search bar and SOS */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <DestinationSearch
            onSelect={handleDestinationSelect}
            className="flex-1"
          />
          <SOSButton onPress={handleSOS} />
        </div>
      </div>
    </div>
  );
}
