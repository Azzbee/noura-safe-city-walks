import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name?: string;
  phone?: string;
  safe_word?: string;
  default_checkin_interval: number;
  default_safety_weight: number;
  // Battery monitoring settings
  enable_battery_alerts?: boolean;
  battery_warning_threshold?: number;
  battery_critical_threshold?: number;
  auto_notify_on_critical_battery?: boolean;
  // Fake call settings
  fake_call_caller_name?: string;
  shake_action?: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdate {
  full_name?: string;
  phone?: string;
  safe_word?: string;
  default_checkin_interval?: number;
  default_safety_weight?: number;
  enable_battery_alerts?: boolean;
  battery_warning_threshold?: number;
  battery_critical_threshold?: number;
  auto_notify_on_critical_battery?: boolean;
  fake_call_caller_name?: string;
  shake_action?: string;
}

export function useProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
    } else if (data) {
      setProfile(data as UserProfile);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: ProfileUpdate) => {
    if (!user || !profile) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: 'Failed to update settings', variant: 'destructive' });
      return { error };
    }

    setProfile(data as UserProfile);
    toast({ title: 'Settings saved' });
    return { data, error: null };
  }, [user, profile, toast]);

  return {
    profile,
    loading,
    updateProfile,
    refetch: fetchProfile,
  };
}
