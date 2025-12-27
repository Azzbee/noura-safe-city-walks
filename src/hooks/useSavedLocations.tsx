import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface SavedLocation {
  id: string;
  name: string;
  label: string;
  lat: number;
  lng: number;
  address: string | null;
}

export function useSavedLocations() {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchLocations = async () => {
    if (!user) {
      setLocations([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('saved_locations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setLocations(data.map(loc => ({
        id: loc.id,
        name: loc.name,
        label: loc.label || 'saved',
        lat: Number(loc.lat),
        lng: Number(loc.lng),
        address: loc.address,
      })));
    } catch (error) {
      console.error('Error fetching saved locations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [user]);

  const saveLocation = async (
    name: string,
    label: string,
    lat: number,
    lng: number,
    address?: string
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('saved_locations')
        .insert({
          user_id: user.id,
          name,
          label,
          lat,
          lng,
          address,
        })
        .select()
        .single();

      if (error) throw error;

      const newLocation: SavedLocation = {
        id: data.id,
        name: data.name,
        label: data.label || 'saved',
        lat: Number(data.lat),
        lng: Number(data.lng),
        address: data.address,
      };

      setLocations(prev => [...prev, newLocation]);
      toast({ title: 'Location saved' });
      
      return newLocation;
    } catch (error) {
      console.error('Error saving location:', error);
      toast({ title: 'Failed to save location', variant: 'destructive' });
      return null;
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLocations(prev => prev.filter(loc => loc.id !== id));
      toast({ title: 'Location deleted' });
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({ title: 'Failed to delete location', variant: 'destructive' });
    }
  };

  const homeLocation = locations.find(loc => loc.label === 'home');
  const workLocation = locations.find(loc => loc.label === 'work');
  const otherLocations = locations.filter(loc => loc.label !== 'home' && loc.label !== 'work');

  return {
    locations,
    homeLocation,
    workLocation,
    otherLocations,
    loading,
    saveLocation,
    deleteLocation,
    refresh: fetchLocations,
  };
}
