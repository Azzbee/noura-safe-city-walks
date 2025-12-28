import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface CrimeAlert {
  id: string;
  title: string;
  description: string;
  location: string;
  lat: number;
  lng: number;
  severity: 'low' | 'medium' | 'high';
  publishedAt: string;
  source: string;
  url: string;
}

export function useCrimeAlerts() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<CrimeAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-crime-alerts');

      if (fnError) {
        console.error('Error fetching crime alerts:', fnError);
        setError(fnError.message);
        return [];
      }

      if (data?.success && data.alerts) {
        setAlerts(data.alerts);
        setLastFetched(new Date(data.fetchedAt));
        
        // Show toast for high severity alerts
        const highSeverityAlerts = data.alerts.filter((a: CrimeAlert) => a.severity === 'high');
        if (highSeverityAlerts.length > 0) {
          toast({
            title: `${highSeverityAlerts.length} High Priority Alert${highSeverityAlerts.length > 1 ? 's' : ''}`,
            description: 'New crime reports detected in Paris area',
            variant: 'destructive',
          });
        }

        return data.alerts as CrimeAlert[];
      }

      return [];
    } catch (err) {
      console.error('Error fetching crime alerts:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Auto-refresh every 15 minutes
  useEffect(() => {
    fetchAlerts();
    
    const interval = setInterval(() => {
      fetchAlerts();
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Convert crime alerts to safety overlay format
  const getAlertsAsOverlays = useCallback(() => {
    return alerts.map((alert) => ({
      id: `crime-${alert.id}`,
      type: 'danger_zone' as const,
      center: [alert.lat, alert.lng] as [number, number],
      radius: alert.severity === 'high' ? 200 : alert.severity === 'medium' ? 150 : 100,
      name: `${alert.title} (${alert.source})`,
      color: alert.severity === 'high' 
        ? 'hsl(0, 84%, 50%)' 
        : alert.severity === 'medium' 
          ? 'hsl(25, 95%, 53%)' 
          : 'hsl(45, 93%, 47%)',
      fillOpacity: alert.severity === 'high' ? 0.25 : alert.severity === 'medium' ? 0.2 : 0.15,
    }));
  }, [alerts]);

  return {
    alerts,
    loading,
    lastFetched,
    error,
    fetchAlerts,
    getAlertsAsOverlays,
  };
}
