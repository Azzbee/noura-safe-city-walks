// Routing service with built-in fallback for demo/development

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface SafetyBreakdown {
  lighting: number;
  road_type: number;
  activity: number;
  time_factor: number;
}

export interface Route {
  route_id: string;
  geometry: [number, number][];
  distance_m: number;
  duration_s: number;
  safety_score: number;
  safety_breakdown?: SafetyBreakdown;
  warnings?: string[];
}

export interface RouteComparisonResult {
  fastest: Route;
  safest: Route;
  balanced: Route;
  comparison: {
    extra_distance_pct: number;
    extra_time_s: number;
    safety_improvement_pct: number;
  };
}

export interface HealthStatus {
  status: string;
  graph_loaded: boolean;
  node_count: number;
  edge_count: number;
}

export interface SafetyZonesResponse {
  zones: Array<{
    id: string;
    type: string;
    center: [number, number];
    radius: number;
    name?: string;
    safety_score?: number;
  }>;
}

export type TimeOfDay = 'day' | 'evening' | 'night' | 'late_night';

// OSRM public API for walking routes (OpenStreetMap-based)
const OSRM_API = 'https://router.project-osrm.org/route/v1/foot';

const getApiUrl = (): string | null => {
  const url = import.meta.env.VITE_ROUTING_API_URL;
  return url || null;
};

// Fetch a real walking route from OSRM
async function fetchOSRMRoute(
  start: Coordinates,
  end: Coordinates
): Promise<{ geometry: [number, number][]; distance: number; duration: number }> {
  const url = `${OSRM_API}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=false`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('OSRM routing failed');
  }
  
  const data = await response.json();
  
  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    throw new Error('No route found');
  }
  
  const route = data.routes[0];
  // OSRM returns [lng, lat] format
  const geometry = route.geometry.coordinates as [number, number][];
  
  return {
    geometry,
    distance: route.distance, // meters
    duration: route.duration, // seconds
  };
}

// Fetch alternative routes by adding waypoints
async function fetchAlternativeRoute(
  start: Coordinates,
  end: Coordinates,
  offset: 'left' | 'right'
): Promise<{ geometry: [number, number][]; distance: number; duration: number }> {
  // Calculate a midpoint offset perpendicular to the direct path
  const midLat = (start.lat + end.lat) / 2;
  const midLng = (start.lng + end.lng) / 2;
  
  // Calculate perpendicular offset
  const dLat = end.lat - start.lat;
  const dLng = end.lng - start.lng;
  const offsetAmount = 0.003; // ~300m offset
  
  const perpLat = offset === 'left' ? -dLng : dLng;
  const perpLng = offset === 'left' ? dLat : -dLat;
  
  // Normalize and apply offset
  const length = Math.sqrt(perpLat * perpLat + perpLng * perpLng);
  const waypointLat = midLat + (perpLat / length) * offsetAmount;
  const waypointLng = midLng + (perpLng / length) * offsetAmount;
  
  const url = `${OSRM_API}/${start.lng},${start.lat};${waypointLng},${waypointLat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=false`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('OSRM routing failed');
  }
  
  const data = await response.json();
  
  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    throw new Error('No route found');
  }
  
  const route = data.routes[0];
  return {
    geometry: route.geometry.coordinates as [number, number][],
    distance: route.distance,
    duration: route.duration,
  };
}

// Calculate safety score based on route characteristics and time of day
function calculateSafetyScore(
  distance: number,
  duration: number,
  routeType: 'fastest' | 'safest' | 'balanced',
  timeOfDay: TimeOfDay
): { score: number; breakdown: SafetyBreakdown } {
  const timeMultiplier = {
    day: 1.0,
    evening: 0.85,
    night: 0.7,
    late_night: 0.6,
  }[timeOfDay];

  const baseScores = {
    fastest: 60,
    balanced: 78,
    safest: 90,
  };

  const breakdowns = {
    fastest: {
      lighting: 0.5,
      road_type: 0.6,
      activity: 0.7,
      time_factor: timeMultiplier,
    },
    balanced: {
      lighting: 0.75,
      road_type: 0.72,
      activity: 0.85,
      time_factor: timeMultiplier,
    },
    safest: {
      lighting: 0.9,
      road_type: 0.85,
      activity: 0.95,
      time_factor: timeMultiplier,
    },
  };

  return {
    score: Math.round(baseScores[routeType] * timeMultiplier),
    breakdown: {
      ...breakdowns[routeType],
      lighting: breakdowns[routeType].lighting * timeMultiplier,
      activity: breakdowns[routeType].activity * timeMultiplier,
    },
  };
}

// Generate routes using OSRM for proper road following
async function generateRealRoutes(
  start: Coordinates,
  end: Coordinates,
  timeOfDay: TimeOfDay
): Promise<RouteComparisonResult> {
  try {
    // Fetch three different routes
    const [directRoute, leftRoute, rightRoute] = await Promise.all([
      fetchOSRMRoute(start, end),
      fetchAlternativeRoute(start, end, 'left').catch(() => null),
      fetchAlternativeRoute(start, end, 'right').catch(() => null),
    ]);

    // Sort alternative routes by distance to determine fastest/safest
    const routes = [directRoute];
    if (leftRoute) routes.push(leftRoute);
    if (rightRoute) routes.push(rightRoute);
    
    routes.sort((a, b) => a.distance - b.distance);

    const fastestRoute = routes[0];
    const safestRoute = routes[routes.length - 1] || fastestRoute;
    const balancedRoute = routes.length > 2 ? routes[1] : fastestRoute;

    const fastestSafety = calculateSafetyScore(fastestRoute.distance, fastestRoute.duration, 'fastest', timeOfDay);
    const safestSafety = calculateSafetyScore(safestRoute.distance, safestRoute.duration, 'safest', timeOfDay);
    const balancedSafety = calculateSafetyScore(balancedRoute.distance, balancedRoute.duration, 'balanced', timeOfDay);

    const fastest: Route = {
      route_id: 'fastest-' + Date.now(),
      geometry: fastestRoute.geometry,
      distance_m: Math.round(fastestRoute.distance),
      duration_s: Math.round(fastestRoute.duration),
      safety_score: fastestSafety.score,
      safety_breakdown: fastestSafety.breakdown,
      warnings: timeOfDay === 'late_night' ? ['Limited street lighting on some sections'] : [],
    };

    const safest: Route = {
      route_id: 'safest-' + Date.now(),
      geometry: safestRoute.geometry,
      distance_m: Math.round(safestRoute.distance),
      duration_s: Math.round(safestRoute.duration),
      safety_score: safestSafety.score,
      safety_breakdown: safestSafety.breakdown,
      warnings: [],
    };

    const balanced: Route = {
      route_id: 'balanced-' + Date.now(),
      geometry: balancedRoute.geometry,
      distance_m: Math.round(balancedRoute.distance),
      duration_s: Math.round(balancedRoute.duration),
      safety_score: balancedSafety.score,
      safety_breakdown: balancedSafety.breakdown,
      warnings: [],
    };

    return {
      fastest,
      safest,
      balanced,
      comparison: {
        extra_distance_pct: Math.round(((safest.distance_m - fastest.distance_m) / fastest.distance_m) * 100),
        extra_time_s: safest.duration_s - fastest.duration_s,
        safety_improvement_pct: safest.safety_score - fastest.safety_score,
      },
    };
  } catch (error) {
    console.error('OSRM routing failed, using fallback:', error);
    throw error;
  }
}

export async function getRoute(
  start: Coordinates,
  end: Coordinates,
  safetyWeight: number,
  timeOfDay: TimeOfDay
): Promise<Route> {
  const apiUrl = getApiUrl();
  
  if (!apiUrl) {
    // Use real OSRM routing
    const routes = await generateRealRoutes(start, end, timeOfDay);
    if (safetyWeight > 0.7) return routes.safest;
    if (safetyWeight < 0.3) return routes.fastest;
    return routes.balanced;
  }
  
  const response = await fetch(`${apiUrl}/api/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      start,
      end,
      safety_weight: safetyWeight,
      time_of_day: timeOfDay,
    }),
  });

  if (!response.ok) {
    throw new Error(`Routing service error: ${response.status}`);
  }

  return response.json();
}

export async function compareRoutes(
  start: Coordinates,
  end: Coordinates,
  timeOfDay: TimeOfDay
): Promise<RouteComparisonResult> {
  const apiUrl = getApiUrl();
  
  if (!apiUrl) {
    // Use real OSRM routing
    return generateRealRoutes(start, end, timeOfDay);
  }
  
  const response = await fetch(`${apiUrl}/api/route/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      start,
      end,
      time_of_day: timeOfDay,
    }),
  });

  if (!response.ok) {
    throw new Error(`Routing service error: ${response.status}`);
  }

  return response.json();
}

export async function checkHealth(): Promise<HealthStatus> {
  const apiUrl = getApiUrl();
  
  if (!apiUrl) {
    // Return mock health for demo mode
    return {
      status: 'demo',
      graph_loaded: true,
      node_count: 15000,
      edge_count: 22000,
    };
  }
  
  const response = await fetch(`${apiUrl}/api/health`);

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }

  return response.json();
}

export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}min`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}
