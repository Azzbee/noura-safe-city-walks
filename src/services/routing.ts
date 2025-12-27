// Routing service that calls the Python backend

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

const getApiUrl = (): string => {
  const url = import.meta.env.VITE_ROUTING_API_URL;
  if (!url) {
    throw new Error('VITE_ROUTING_API_URL environment variable is not set');
  }
  return url;
};

export async function getRoute(
  start: Coordinates,
  end: Coordinates,
  safetyWeight: number,
  timeOfDay: TimeOfDay
): Promise<Route> {
  const apiUrl = getApiUrl();
  
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
