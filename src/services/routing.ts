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

const getApiUrl = (): string | null => {
  const url = import.meta.env.VITE_ROUTING_API_URL;
  return url || null;
};

// Generate intermediate points for a more natural-looking route
function generateRoutePoints(
  start: Coordinates,
  end: Coordinates,
  variation: number = 0
): [number, number][] {
  const points: [number, number][] = [];
  const numPoints = 8 + Math.floor(Math.random() * 5);
  
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Add some variation for different route types
    const jitterLat = (Math.random() - 0.5) * 0.002 * variation;
    const jitterLng = (Math.random() - 0.5) * 0.002 * variation;
    
    const lat = start.lat + (end.lat - start.lat) * t + jitterLat;
    const lng = start.lng + (end.lng - start.lng) * t + jitterLng;
    
    // Format: [lng, lat] for GeoJSON compatibility
    points.push([lng, lat]);
  }
  
  return points;
}

// Calculate distance using Haversine formula
function calculateDistance(start: Coordinates, end: Coordinates): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (end.lat - start.lat) * Math.PI / 180;
  const dLng = (end.lng - start.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Generate mock route comparison for demo purposes
function generateMockRoutes(
  start: Coordinates,
  end: Coordinates,
  timeOfDay: TimeOfDay
): RouteComparisonResult {
  const baseDistance = calculateDistance(start, end);
  const walkingSpeed = 5; // km/h
  const baseDuration = (baseDistance / 1000) / walkingSpeed * 3600; // seconds
  
  // Time of day affects safety scores
  const timeMultiplier = {
    day: 1.0,
    evening: 0.85,
    night: 0.7,
    late_night: 0.6,
  }[timeOfDay];

  const fastest: Route = {
    route_id: 'fastest-' + Date.now(),
    geometry: generateRoutePoints(start, end, 0.5),
    distance_m: Math.round(baseDistance * 1.05),
    duration_s: Math.round(baseDuration),
    safety_score: Math.round(60 * timeMultiplier),
    safety_breakdown: {
      lighting: 0.5 * timeMultiplier,
      road_type: 0.6,
      activity: 0.7 * timeMultiplier,
      time_factor: timeMultiplier,
    },
    warnings: timeOfDay === 'late_night' ? ['Limited street lighting on some sections'] : [],
  };

  const safest: Route = {
    route_id: 'safest-' + Date.now(),
    geometry: generateRoutePoints(start, end, 2),
    distance_m: Math.round(baseDistance * 1.25),
    duration_s: Math.round(baseDuration * 1.2),
    safety_score: Math.round(90 * timeMultiplier),
    safety_breakdown: {
      lighting: 0.9 * timeMultiplier,
      road_type: 0.85,
      activity: 0.95 * timeMultiplier,
      time_factor: timeMultiplier,
    },
    warnings: [],
  };

  const balanced: Route = {
    route_id: 'balanced-' + Date.now(),
    geometry: generateRoutePoints(start, end, 1),
    distance_m: Math.round(baseDistance * 1.12),
    duration_s: Math.round(baseDuration * 1.08),
    safety_score: Math.round(78 * timeMultiplier),
    safety_breakdown: {
      lighting: 0.75 * timeMultiplier,
      road_type: 0.72,
      activity: 0.85 * timeMultiplier,
      time_factor: timeMultiplier,
    },
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
}

export async function getRoute(
  start: Coordinates,
  end: Coordinates,
  safetyWeight: number,
  timeOfDay: TimeOfDay
): Promise<Route> {
  const apiUrl = getApiUrl();
  
  if (!apiUrl) {
    // Use mock routing
    const routes = generateMockRoutes(start, end, timeOfDay);
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
    // Use mock routing - simulate a small delay for realism
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 300));
    return generateMockRoutes(start, end, timeOfDay);
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
