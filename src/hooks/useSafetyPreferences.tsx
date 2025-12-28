import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SafetyPreferences {
  lighting: number;
  police_stations: number;
  busy_areas: number;
  cctv_coverage: number;
  safe_landmarks: number;
}

const DEFAULT_PREFERENCES: SafetyPreferences = {
  lighting: 3,
  police_stations: 3,
  busy_areas: 3,
  cctv_coverage: 2,
  safe_landmarks: 3,
};

export function useSafetyPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<SafetyPreferences | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setPreferences(null);
      setHasCompletedOnboarding(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('safety_preferences')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.safety_preferences) {
        const prefs = data.safety_preferences as unknown as SafetyPreferences;
        setPreferences(prefs);
        setHasCompletedOnboarding(true);
      } else {
        setPreferences(null);
        setHasCompletedOnboarding(false);
      }
    } catch (error) {
      console.error('Error fetching safety preferences:', error);
      setPreferences(DEFAULT_PREFERENCES);
      setHasCompletedOnboarding(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const savePreferences = useCallback(async (newPreferences: Record<string, number>) => {
    if (!user) return false;

    const prefs: SafetyPreferences = {
      lighting: newPreferences.lighting || 3,
      police_stations: newPreferences.police_stations || 3,
      busy_areas: newPreferences.busy_areas || 3,
      cctv_coverage: newPreferences.cctv_coverage || 2,
      safe_landmarks: newPreferences.safe_landmarks || 3,
    };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ safety_preferences: prefs as unknown as null })
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences(prefs);
      setHasCompletedOnboarding(true);
      return true;
    } catch (error) {
      console.error('Error saving safety preferences:', error);
      return false;
    }
  }, [user]);

  const skipOnboarding = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    setHasCompletedOnboarding(true);
  }, []);

  return {
    preferences: preferences || DEFAULT_PREFERENCES,
    hasCompletedOnboarding,
    loading,
    savePreferences,
    skipOnboarding,
    refresh: fetchPreferences,
  };
}
