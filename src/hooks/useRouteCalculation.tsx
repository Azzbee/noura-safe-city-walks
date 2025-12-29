import { useState, useCallback } from 'react';
import { compareRoutes, RouteComparisonResult, TimeOfDay, Coordinates, SafetyPreferences } from '@/services/routing';
import { useToast } from './use-toast';

export function useRouteCalculation() {
  const { toast } = useToast();
  const [routes, setRoutes] = useState<RouteComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateRoutes = useCallback(async (
    start: Coordinates,
    end: Coordinates,
    timeOfDay: TimeOfDay,
    preferences?: SafetyPreferences
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await compareRoutes(start, end, timeOfDay, preferences);
      setRoutes(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to calculate routes';
      setError(message);
      toast({ 
        title: 'Route calculation failed', 
        description: message,
        variant: 'destructive' 
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const clearRoutes = useCallback(() => {
    setRoutes(null);
    setError(null);
  }, []);

  return {
    routes,
    loading,
    error,
    calculateRoutes,
    clearRoutes,
  };
}
