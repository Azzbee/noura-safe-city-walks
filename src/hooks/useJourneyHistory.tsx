import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Journey } from './useJourney';

export function useJourneyHistory() {
  const { user } = useAuth();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJourneys = useCallback(async () => {
    if (!user) {
      setJourneys([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('journeys')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['completed', 'cancelled', 'alert_triggered'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching journey history:', error);
    } else {
      setJourneys(
        data.map((j) => ({
          ...j,
          status: j.status as Journey['status'],
          route_geometry: j.route_geometry as [number, number][] | undefined,
        }))
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchJourneys();
  }, [fetchJourneys]);

  return {
    journeys,
    loading,
    refetch: fetchJourneys,
  };
}
