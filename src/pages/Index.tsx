import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { useSavedLocations, SavedLocation } from '@/hooks/useSavedLocations';
import { useJourney } from '@/hooks/useJourney';
import { useRouteCalculation } from '@/hooks/useRouteCalculation';
import { useSafetyOverlays } from '@/hooks/useSafetyOverlays';
import { useVoiceSOS } from '@/hooks/useVoiceSOS';
import { useShakeDetection } from '@/hooks/useShakeDetection';
import { useLocationSharing } from '@/hooks/useLocationSharing';
import { TimeOfDay } from '@/services/routing';
import MapView, { RouteDisplay } from '@/components/map/MapView';
import DestinationSearch from '@/components/map/DestinationSearch';
import SavedLocationsBar from '@/components/map/SavedLocationsBar';
import TimeOfDaySelector from '@/components/map/TimeOfDaySelector';
import SOSButton from '@/components/map/SOSButton';
import SafetyOverlayToggle from '@/components/map/SafetyOverlayToggle';
import SafetyLegend from '@/components/map/SafetyLegend';
import Header from '@/components/layout/Header';
import RouteServiceStatus from '@/components/routing/RouteServiceStatus';
import RouteSelector from '@/components/journey/RouteSelector';
import JourneyControls from '@/components/journey/JourneyControls';
import CheckinPrompt from '@/components/journey/CheckinPrompt';
import VoiceSOSIndicator from '@/components/journey/VoiceSOSIndicator';
import ShakeSOSIndicator from '@/components/journey/ShakeSOSIndicator';
import LocationShareButton from '@/components/journey/LocationShareButton';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Paris center coordinates
const PARIS_CENTER: [number, number] = [48.8566, 2.3522];

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    activeJourney,
    pendingCheckin,
    startJourney,
    completeJourney,
    cancelJourney,
    respondToCheckin,
    triggerSOS,
  } = useJourney();
  
  // Enable real-time tracking when journey is active
  const location = useLocation(!!activeJourney);
  
  const { 
    routes, 
    loading: routesLoading, 
    calculateRoutes, 
    clearRoutes 
  } = useRouteCalculation();

  const {
    overlays: safetyOverlays,
    loading: overlaysLoading,
    visible: overlaysVisible,
    toggleVisibility: toggleOverlays,
  } = useSafetyOverlays();
  
  const [destination, setDestination] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [selectedRouteType, setSelectedRouteType] = useState<'safest' | 'fastest' | 'balanced' | null>(null);
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

  // Calculate routes when destination is set
  useEffect(() => {
    if (!destination || activeJourney) return;
    
    const userLat = location.error ? PARIS_CENTER[0] : location.lat;
    const userLng = location.error ? PARIS_CENTER[1] : location.lng;

    calculateRoutes(
      { lat: userLat, lng: userLng },
      { lat: destination.lat, lng: destination.lng },
      timeOfDay
    );
  }, [destination, timeOfDay, location.lat, location.lng, location.error, activeJourney, calculateRoutes]);

  const handleDestinationSelect = (lat: number, lng: number, address: string) => {
    setDestination({ lat, lng, address });
    setSelectedRouteType(null);
    toast({ title: 'Destination set', description: address });
  };

  const handleSavedLocationSelect = (loc: SavedLocation) => {
    setDestination({ lat: loc.lat, lng: loc.lng, address: loc.address || loc.name });
    setSelectedRouteType(null);
    toast({ title: 'Destination set', description: loc.name });
  };

  const handleCancelRoute = () => {
    setDestination(null);
    setSelectedRouteType(null);
    clearRoutes();
  };

  const handleStartJourney = async () => {
    if (!routes || !selectedRouteType || !destination) return;

    const selectedRoute = routes[selectedRouteType];
    const userLat = location.error ? PARIS_CENTER[0] : location.lat;
    const userLng = location.error ? PARIS_CENTER[1] : location.lng;

    await startJourney({
      startLat: userLat,
      startLng: userLng,
      endLat: destination.lat,
      endLng: destination.lng,
      endAddress: destination.address,
      routeGeometry: selectedRoute.geometry.map(([lng, lat]) => [lat, lng] as [number, number]),
      distanceM: selectedRoute.distance_m,
      durationS: selectedRoute.duration_s,
      safetyScore: selectedRoute.safety_score,
      timeOfDay,
    });

    clearRoutes();
  };

  const handleSOS = useCallback(() => {
    const currentLocation = !location.error 
      ? { lat: location.lat, lng: location.lng } 
      : undefined;
    triggerSOS(currentLocation);
  }, [location.error, location.lat, location.lng, triggerSOS]);

  // Voice SOS - listens for safe word during active journey
  const voiceSOS = useVoiceSOS({
    isActive: !!activeJourney,
    onSafeWordDetected: handleSOS,
  });

  // Shake detection SOS
  const shakeDetection = useShakeDetection({
    isActive: !!activeJourney,
    onShakeDetected: handleSOS,
  });

  // Live location sharing
  const locationSharing = useLocationSharing({
    journeyId: activeJourney?.id || null,
    isActive: !!activeJourney,
  });

  // Convert routes to display format
  const displayRoutes = useMemo<RouteDisplay[]>(() => {
    // Show active journey route
    if (activeJourney?.route_geometry) {
      return [{
        geometry: activeJourney.route_geometry,
        color: 'hsl(142, 76%, 36%)',
        weight: 6,
        opacity: 0.9,
      }];
    }

    // Show route options
    if (!routes) return [];

    const routeColors = {
      safest: 'hsl(142, 76%, 36%)',
      balanced: 'hsl(45, 93%, 47%)',
      fastest: 'hsl(217, 91%, 60%)',
    };

    if (selectedRouteType) {
      // Only show selected route
      const route = routes[selectedRouteType];
      return [{
        geometry: route.geometry.map(([lng, lat]) => [lat, lng] as [number, number]),
        color: routeColors[selectedRouteType],
        weight: 6,
        opacity: 0.9,
      }];
    }

    // Show all routes with different opacities
    return [
      {
        geometry: routes.safest.geometry.map(([lng, lat]) => [lat, lng] as [number, number]),
        color: routeColors.safest,
        weight: 5,
        opacity: 0.6,
      },
      {
        geometry: routes.balanced.geometry.map(([lng, lat]) => [lat, lng] as [number, number]),
        color: routeColors.balanced,
        weight: 5,
        opacity: 0.6,
      },
      {
        geometry: routes.fastest.geometry.map(([lng, lat]) => [lat, lng] as [number, number]),
        color: routeColors.fastest,
        weight: 5,
        opacity: 0.6,
      },
    ];
  }, [routes, selectedRouteType, activeJourney]);

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
        routes={displayRoutes}
        safetyOverlays={safetyOverlays}
        zoom={15}
      />

      {/* Header with menu and user */}
      <Header />

      {/* Safety overlay toggle and legend */}
      <div className="absolute top-20 left-4 z-20 space-y-2 pointer-events-auto">
        <SafetyOverlayToggle
          visible={overlaysVisible}
          loading={overlaysLoading}
          onToggle={toggleOverlays}
        />
        {overlaysVisible && <SafetyLegend />}
      </div>

      {/* Check-in prompt overlay */}
      {pendingCheckin && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 right-4 z-30 max-w-sm mx-auto">
          <CheckinPrompt onRespond={respondToCheckin} />
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-4 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none">
        {/* Active journey controls */}
        {activeJourney && (
          <div className="pointer-events-auto space-y-3">
            <div className="flex gap-2 flex-wrap">
              <VoiceSOSIndicator
                isListening={voiceSOS.isListening}
                isSupported={voiceSOS.isSupported}
                hasSafeWord={voiceSOS.hasSafeWord}
              />
              <ShakeSOSIndicator
                isListening={shakeDetection.isListening}
                isSupported={shakeDetection.isSupported}
              />
            </div>
            <LocationShareButton
              shareUrl={locationSharing.shareUrl}
              onCopy={locationSharing.copyShareUrl}
            />
            <JourneyControls
              journey={activeJourney}
              onComplete={completeJourney}
              onCancel={cancelJourney}
            />
          </div>
        )}

        {/* Route selector */}
        {routes && !activeJourney && (
          <div className="pointer-events-auto">
            <RouteSelector
              routes={routes}
              selectedRoute={selectedRouteType}
              onSelectRoute={setSelectedRouteType}
              onStartJourney={handleStartJourney}
              onCancel={handleCancelRoute}
              loading={routesLoading}
            />
          </div>
        )}

        {/* Regular controls when no journey/routes */}
        {!activeJourney && !routes && (
          <>
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
              <SavedLocationsBar onSelect={handleSavedLocationSelect} />
            </div>

            {/* Search bar and SOS */}
            <div className="flex items-center gap-3 pointer-events-auto">
              <DestinationSearch
                onSelect={handleDestinationSelect}
                className="flex-1"
              />
              <SOSButton onPress={handleSOS} />
            </div>
          </>
        )}

        {/* Always show SOS when journey is active */}
        {activeJourney && (
          <div className="flex justify-end pointer-events-auto">
            <SOSButton onPress={handleSOS} />
          </div>
        )}
      </div>
    </div>
  );
}
