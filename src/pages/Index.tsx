import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { useLocationHistory } from '@/hooks/useLocationHistory';
import { useSavedLocations, SavedLocation } from '@/hooks/useSavedLocations';
import { useJourney } from '@/hooks/useJourney';
import { useRouteCalculation } from '@/hooks/useRouteCalculation';
import { useSafetyOverlays } from '@/hooks/useSafetyOverlays';
import { useSafetyReports } from '@/hooks/useSafetyReports';
import { useCrimeAlerts } from '@/hooks/useCrimeAlerts';
import { useDangerZoneAlerts } from '@/hooks/useDangerZoneAlerts';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useVoiceSOS } from '@/hooks/useVoiceSOS';
import { useShakeDetection } from '@/hooks/useShakeDetection';
import { useLocationSharing } from '@/hooks/useLocationSharing';
import { useJourneySafetyAlerts } from '@/hooks/useJourneySafetyAlerts';
import { useFakeCall } from '@/hooks/useFakeCall';
import { useSafePlaces } from '@/hooks/useSafePlaces';
import { useBatteryMonitor } from '@/hooks/useBatteryMonitor';
import { useWeather } from '@/hooks/useWeather';
import { TimeOfDay } from '@/services/routing';
import MapView, { RouteDisplay } from '@/components/map/MapView';
import DestinationSearch from '@/components/map/DestinationSearch';
import SavedLocationsBar from '@/components/map/SavedLocationsBar';
import TimeOfDaySelector from '@/components/map/TimeOfDaySelector';
import SOSButton from '@/components/map/SOSButton';
import SafetyOverlayToggle from '@/components/map/SafetyOverlayToggle';
import SafetyLegend from '@/components/map/SafetyLegend';
import SafetyTimeFilter from '@/components/map/SafetyTimeFilter';
import QuickReportButton from '@/components/map/QuickReportButton';
import CommunityReportsPanel from '@/components/map/CommunityReportsPanel';
import Header from '@/components/layout/Header';
import RouteServiceStatus from '@/components/routing/RouteServiceStatus';
import RouteSelector from '@/components/journey/RouteSelector';
import JourneyControls from '@/components/journey/JourneyControls';
import CheckinPrompt from '@/components/journey/CheckinPrompt';
import VoiceSOSIndicator from '@/components/journey/VoiceSOSIndicator';
import ShakeSOSIndicator from '@/components/journey/ShakeSOSIndicator';
import LocationShareButton from '@/components/journey/LocationShareButton';
import SafetyAlertBanner from '@/components/journey/SafetyAlertBanner';
import BatteryWarningBanner from '@/components/journey/BatteryWarningBanner';
import WeatherSafetyWarning from '@/components/journey/WeatherSafetyWarning';
import CrimeAlertsPanel from '@/components/map/CrimeAlertsPanel';
import HeatmapToggle from '@/components/map/HeatmapToggle';
import SafetyScoreWidget from '@/components/map/SafetyScoreWidget';
import SafePlacesLayer from '@/components/map/SafePlacesLayer';
import NearestSafePlaceButton from '@/components/map/NearestSafePlaceButton';
import WeatherWidget from '@/components/map/WeatherWidget';
import FakeCallButton from '@/components/safety/FakeCallButton';
import FakeCallScreen from '@/components/safety/FakeCallScreen';
import { useSafetyScore } from '@/hooks/useSafetyScore';
import { useGeofencing } from '@/hooks/useGeofencing';
import { useSafetyPreferences } from '@/hooks/useSafetyPreferences';
import { useProfile } from '@/hooks/useProfile';
import SafetyPreferencesOnboarding from '@/components/onboarding/SafetyPreferencesOnboarding';
import { MapSkeleton } from '@/components/ui/art-deco-skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  
  // Track location history for trail visualization
  const locationHistory = useLocationHistory(!!activeJourney);
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
    timeFilter: safetyTimeFilter,
    setTimeFilter: setSafetyTimeFilter,
  } = useSafetyOverlays();

  // Crowd-sourced safety reports
  const { reports: safetyReports, vote: voteOnReport } = useSafetyReports();

  // Real-time crime alerts
  const { 
    alerts: crimeAlerts, 
    loading: crimeAlertsLoading, 
    lastFetched: crimeAlertsLastFetched,
    fetchAlerts: refreshCrimeAlerts,
    getAlertsAsOverlays: getCrimeOverlays,
  } = useCrimeAlerts();

  // Push notifications
  const pushNotifications = usePushNotifications();

  // Register service worker on mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);
  
  const [destination, setDestination] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [geofenceVisible, setGeofenceVisible] = useState(true);
  const [selectedRouteType, setSelectedRouteType] = useState<'safest' | 'fastest' | 'balanced' | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 18) return 'day';
    if (hour >= 18 && hour < 21) return 'evening';
    if (hour >= 21 || hour < 1) return 'night';
    return 'late_night';
  });

  // Safety preferences (needed for route calculation)
  const safetyPreferences = useSafetyPreferences();

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
      timeOfDay,
      safetyPreferences.preferences
    );
  }, [destination, timeOfDay, location.lat, location.lng, location.error, activeJourney, calculateRoutes, safetyPreferences.preferences]);

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

  // Live location sharing
  const locationSharing = useLocationSharing({
    journeyId: activeJourney?.id || null,
    isActive: !!activeJourney,
  });

  const handleSOS = useCallback(() => {
    const currentLocation = !location.error 
      ? { lat: location.lat, lng: location.lng } 
      : undefined;
    // Pass tracking URL if available from location sharing
    triggerSOS(currentLocation, locationSharing.shareUrl || undefined);
  }, [location.error, location.lat, location.lng, locationSharing.shareUrl, triggerSOS]);

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

  // Danger zone proximity alerts
  const allDangerZones = useMemo(() => {
    const staticZones = safetyOverlays.filter(
      o => o.type === 'danger_zone' || o.type === 'caution_area'
    );
    return [...staticZones, ...getCrimeOverlays()];
  }, [safetyOverlays, getCrimeOverlays]);

  const userLocationForAlerts: [number, number] | undefined = !location.error 
    ? [location.lat, location.lng] 
    : undefined;

  useDangerZoneAlerts({
    userLocation: userLocationForAlerts,
    safetyOverlays: allDangerZones,
    isEnabled: !!activeJourney,
  });

  // Real-time journey safety alerts
  const journeySafetyAlerts = useJourneySafetyAlerts({
    userLocation: !location.error ? { lat: location.lat, lng: location.lng } : null,
    crimeAlerts,
    safetyReports,
    isJourneyActive: !!activeJourney,
  });

  // Geofencing for safe zones
  const geofencing = useGeofencing({
    userLat: !location.error ? location.lat : null,
    userLng: !location.error ? location.lng : null,
    enabled: !location.error,
  });

  // Profile for battery/fake call settings
  const { profile } = useProfile();

  // Safe places nearby
  const safePlaces = useSafePlaces({
    userLat: !location.error ? location.lat : null,
    userLng: !location.error ? location.lng : null,
    radiusMeters: 2000,
  });

  // Battery monitoring during journey
  const batteryMonitor = useBatteryMonitor({
    isJourneyActive: !!activeJourney,
    warningThreshold: profile?.battery_warning_threshold ?? 20,
    criticalThreshold: profile?.battery_critical_threshold ?? 10,
    onCriticalBattery: () => {
      if (profile?.auto_notify_on_critical_battery) {
        // Could trigger emergency contact notification here
        toast({
          title: 'Emergency contacts may be notified',
          description: 'Your battery is critically low.',
          variant: 'destructive',
        });
      }
    },
  });

  // Weather data
  const weather = useWeather({
    lat: !location.error ? location.lat : PARIS_CENTER[0],
    lng: !location.error ? location.lng : PARIS_CENTER[1],
  });

  // Fake call feature
  const fakeCall = useFakeCall();
  
  // Set caller name from profile when available
  useEffect(() => {
    if (profile?.fake_call_caller_name) {
      fakeCall.setCallerName(profile.fake_call_caller_name);
    }
  }, [profile?.fake_call_caller_name]);

  // Build geofence zones for map
  const geofenceZonesForMap = geofencing.geofencedLocations.map(loc => ({
    id: loc.id,
    name: loc.name,
    lat: loc.lat,
    lng: loc.lng,
    radius_m: loc.radius_m,
    isActive: geofencing.activeZones.includes(loc.id),
  }));

  const safetyScore = useSafetyScore({
    userLocation: !location.error ? { lat: location.lat, lng: location.lng } : null,
    safetyOverlays: [...safetyOverlays, ...getCrimeOverlays()],
    crimeAlerts,
    safetyReports,
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
      {/* Safety preferences onboarding */}
      {safetyPreferences.hasCompletedOnboarding === false && (
        <SafetyPreferencesOnboarding
          onComplete={safetyPreferences.savePreferences}
          onSkip={safetyPreferences.skipOnboarding}
        />
      )}

      {/* Full-screen map */}
      <MapView
        center={mapCenter}
        userLocation={userLocation}
        destination={destination ? [destination.lat, destination.lng] : undefined}
        routes={displayRoutes}
        safetyOverlays={[...safetyOverlays, ...getCrimeOverlays()]}
        crimeAlerts={crimeAlerts}
        crowdReports={safetyReports}
        onVoteReport={voteOnReport}
        timeOfDay={timeOfDay}
        locationTrail={locationHistory.getTrailGeometry()}
        isJourneyActive={!!activeJourney}
        heatmapEnabled={heatmapEnabled}
        geofenceZones={geofenceZonesForMap}
        geofenceVisible={geofenceVisible}
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
        <HeatmapToggle
          enabled={heatmapEnabled}
          onToggle={() => setHeatmapEnabled(!heatmapEnabled)}
          pointCount={crimeAlerts.length + safetyOverlays.filter(o => o.type === 'danger_zone').length}
        />
        <Button
          variant={geofenceVisible ? "default" : "outline"}
          size="sm"
          onClick={() => setGeofenceVisible(!geofenceVisible)}
          className="h-9 gap-1.5"
        >
          <Shield className="w-4 h-4" />
          <span className="text-xs">Safe Zones</span>
        </Button>
        {overlaysVisible && (
          <>
            <SafetyTimeFilter
              value={safetyTimeFilter}
              onChange={setSafetyTimeFilter}
            />
            <SafetyLegend />
          </>
        )}
      </div>

      {/* Right side panels */}
      <div className="absolute top-20 right-4 z-20 space-y-2 flex flex-col items-end">
        <WeatherWidget weather={weather.weather} loading={weather.loading} />
        <SafetyScoreWidget score={safetyScore} />
        <QuickReportButton lat={mapCenter[0]} lng={mapCenter[1]} />
        <CommunityReportsPanel 
          userLocation={!location.error ? { lat: location.lat, lng: location.lng } : null}
        />
        <CrimeAlertsPanel
          alerts={crimeAlerts}
          loading={crimeAlertsLoading}
          lastFetched={crimeAlertsLastFetched}
          onRefresh={refreshCrimeAlerts}
        />
      </div>

      {/* Weather safety warning during journey */}
      {activeJourney && weather.condition && weather.getWeatherWarnings().length > 0 && (
        <div className="absolute top-36 left-1/2 -translate-x-1/2 z-30 max-w-md w-full px-4">
          <WeatherSafetyWarning condition={weather.condition} warnings={weather.getWeatherWarnings()} />
        </div>
      )}

      {/* Battery warning banner during journey */}
      {activeJourney && batteryMonitor.isSupported && (batteryMonitor.isLow || batteryMonitor.isCritical) && (
        <div className="absolute top-48 left-1/2 -translate-x-1/2 z-30 max-w-md w-full px-4">
          <BatteryWarningBanner battery={batteryMonitor} />
        </div>
      )}

      {/* Safety alert banner during journey */}
      {activeJourney && journeySafetyAlerts.nearbyAlertCount > 0 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 max-w-md w-full px-4">
          <SafetyAlertBanner
            isInDangerZone={journeySafetyAlerts.isInDangerZone}
            nearbyAlertCount={journeySafetyAlerts.nearbyAlertCount}
          />
        </div>
      )}

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
            <NearestSafePlaceButton
              nearestPlace={safePlaces.nearestPlace}
              placesByType={safePlaces.placesByType}
              loading={safePlaces.loading}
              onNavigate={safePlaces.navigateToPlace}
              onCall={safePlaces.callPlace}
            />
            <FakeCallButton
              onSchedule={fakeCall.scheduleCall}
              onTriggerNow={fakeCall.triggerCall}
              isScheduled={fakeCall.state === 'scheduled'}
              remainingSeconds={fakeCall.getRemainingTime()}
              onCancel={fakeCall.cancelScheduled}
            />
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

            {/* Search bar, SOS, and safe places */}
            <div className="flex items-center gap-3 pointer-events-auto">
              <DestinationSearch
                onSelect={handleDestinationSelect}
                className="flex-1"
              />
              <NearestSafePlaceButton
                nearestPlace={safePlaces.nearestPlace}
                placesByType={safePlaces.placesByType}
                loading={safePlaces.loading}
                onNavigate={safePlaces.navigateToPlace}
                onCall={safePlaces.callPlace}
              />
              <SOSButton onPress={handleSOS} />
            </div>
            
            {/* Fake call quick access */}
            <div className="flex justify-center pointer-events-auto">
              <FakeCallButton
                onSchedule={fakeCall.scheduleCall}
                onTriggerNow={fakeCall.triggerCall}
                isScheduled={fakeCall.state === 'scheduled'}
                remainingSeconds={fakeCall.getRemainingTime()}
                onCancel={fakeCall.cancelScheduled}
              />
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
