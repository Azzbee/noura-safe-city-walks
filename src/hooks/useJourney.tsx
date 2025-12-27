import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { TimeOfDay } from '@/services/routing';

export interface Journey {
  id: string;
  user_id: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled' | 'alert_triggered';
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  start_address?: string;
  end_address?: string;
  route_geometry?: [number, number][];
  distance_m?: number;
  duration_s?: number;
  safety_score?: number;
  safety_weight?: number;
  time_of_day?: string;
  checkin_interval: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface Checkin {
  id: string;
  journey_id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'missed';
  prompted_at: string;
  responded_at?: string;
  response?: string;
  lat?: number;
  lng?: number;
}

interface StartJourneyParams {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  startAddress?: string;
  endAddress?: string;
  routeGeometry?: [number, number][];
  distanceM?: number;
  durationS?: number;
  safetyScore?: number;
  safetyWeight?: number;
  timeOfDay?: TimeOfDay;
  checkinInterval?: number;
}

export function useJourney() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);
  const [pendingCheckin, setPendingCheckin] = useState<Checkin | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch active journey on mount
  useEffect(() => {
    if (!user) {
      setActiveJourney(null);
      setLoading(false);
      return;
    }

    const fetchActiveJourney = async () => {
      const { data, error } = await supabase
        .from('journeys')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error fetching active journey:', error);
      } else if (data) {
        setActiveJourney({
          ...data,
          status: data.status as Journey['status'],
          route_geometry: data.route_geometry as [number, number][] | undefined,
        });
      }
      setLoading(false);
    };

    fetchActiveJourney();
  }, [user]);

  // Check for pending check-ins when there's an active journey
  useEffect(() => {
    if (!activeJourney || !user) return;

    const checkForPendingCheckin = async () => {
      const { data } = await supabase
        .from('checkins')
        .select('*')
        .eq('journey_id', activeJourney.id)
        .eq('status', 'pending')
        .order('prompted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setPendingCheckin(data as Checkin);
      }
    };

    checkForPendingCheckin();
    const interval = setInterval(checkForPendingCheckin, 30000);

    return () => clearInterval(interval);
  }, [activeJourney, user]);

  const startJourney = useCallback(async (params: StartJourneyParams) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('journeys')
      .insert({
        user_id: user.id,
        status: 'active',
        start_lat: params.startLat,
        start_lng: params.startLng,
        end_lat: params.endLat,
        end_lng: params.endLng,
        start_address: params.startAddress,
        end_address: params.endAddress,
        route_geometry: params.routeGeometry,
        distance_m: params.distanceM,
        duration_s: params.durationS,
        safety_score: params.safetyScore,
        safety_weight: params.safetyWeight,
        time_of_day: params.timeOfDay,
        checkin_interval: params.checkinInterval ?? 5,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: 'Failed to start journey', variant: 'destructive' });
      return { error };
    }

    setActiveJourney({
      ...data,
      status: data.status as Journey['status'],
      route_geometry: data.route_geometry as [number, number][] | undefined,
    });
    toast({ title: 'Journey started', description: 'Stay safe!' });

    // Create first check-in prompt
    await createCheckin(data.id);

    return { data, error: null };
  }, [user, toast]);

  const createCheckin = async (journeyId: string) => {
    if (!user) return;

    const { data } = await supabase
      .from('checkins')
      .insert({
        journey_id: journeyId,
        user_id: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (data) {
      setPendingCheckin(data as Checkin);
    }
  };

  const respondToCheckin = useCallback(async (response: 'safe' | 'help') => {
    if (!pendingCheckin || !user) return;

    const { error } = await supabase
      .from('checkins')
      .update({
        status: 'confirmed',
        response,
        responded_at: new Date().toISOString(),
      })
      .eq('id', pendingCheckin.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to respond', variant: 'destructive' });
      return;
    }

    setPendingCheckin(null);

    if (response === 'help' && activeJourney) {
      // Trigger SOS
      await triggerSOS();
    } else {
      toast({ title: 'Check-in confirmed', description: "We'll check in again soon" });
      
      // Schedule next check-in
      if (activeJourney) {
        setTimeout(() => {
          createCheckin(activeJourney.id);
        }, (activeJourney.checkin_interval || 5) * 60 * 1000);
      }
    }
  }, [pendingCheckin, activeJourney, user, toast]);

  const completeJourney = useCallback(async () => {
    if (!activeJourney) return;

    const { error } = await supabase
      .from('journeys')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', activeJourney.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to complete journey', variant: 'destructive' });
      return;
    }

    setActiveJourney(null);
    setPendingCheckin(null);
    toast({ title: 'Journey completed', description: 'You arrived safely!' });
  }, [activeJourney, toast]);

  const cancelJourney = useCallback(async () => {
    if (!activeJourney) return;

    const { error } = await supabase
      .from('journeys')
      .update({ status: 'cancelled' })
      .eq('id', activeJourney.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to cancel journey', variant: 'destructive' });
      return;
    }

    setActiveJourney(null);
    setPendingCheckin(null);
    toast({ title: 'Journey cancelled' });
  }, [activeJourney, toast]);

  const triggerSOS = useCallback(async (currentLocation?: { lat: number; lng: number }) => {
    if (!user) return;

    // Update journey status to alert_triggered if active
    if (activeJourney) {
      await supabase
        .from('journeys')
        .update({ status: 'alert_triggered' })
        .eq('id', activeJourney.id);
      
      setActiveJourney((prev) => prev ? { ...prev, status: 'alert_triggered' } : null);
    }

    // Create alert with location
    const { error } = await supabase
      .from('alerts')
      .insert({
        user_id: user.id,
        journey_id: activeJourney?.id,
        alert_type: 'sos',
        lat: currentLocation?.lat,
        lng: currentLocation?.lng,
      });

    if (error) {
      toast({ title: 'Error', description: 'Failed to send SOS', variant: 'destructive' });
      return;
    }

    // Call the notification edge function
    try {
      await supabase.functions.invoke('notify-emergency-contacts', {
        body: {
          user_id: user.id,
          alert_type: 'sos',
          journey_id: activeJourney?.id,
          location: currentLocation,
        },
      });
    } catch (notifyError) {
      console.error('Failed to notify contacts:', notifyError);
    }

    toast({ 
      title: 'SOS Sent', 
      description: 'Emergency contacts are being notified',
      variant: 'destructive',
    });
  }, [user, activeJourney, toast]);

  return {
    activeJourney,
    pendingCheckin,
    loading,
    startJourney,
    completeJourney,
    cancelJourney,
    respondToCheckin,
    triggerSOS,
  };
}
