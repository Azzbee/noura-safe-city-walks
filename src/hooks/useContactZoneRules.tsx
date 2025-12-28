import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ContactZoneRule {
  id: string;
  contact_id: string;
  location_id: string;
  notify_on_enter: boolean;
  notify_on_exit: boolean;
}

export function useContactZoneRules(locationId?: string) {
  const { user } = useAuth();
  const [rules, setRules] = useState<ContactZoneRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = useCallback(async () => {
    if (!user) {
      setRules([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('contact_zone_rules')
        .select('*')
        .eq('user_id', user.id);

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setRules(
        (data || []).map((r) => ({
          id: r.id,
          contact_id: r.contact_id,
          location_id: r.location_id,
          notify_on_enter: r.notify_on_enter,
          notify_on_exit: r.notify_on_exit,
        }))
      );
    } catch (error) {
      console.error('Error fetching contact zone rules:', error);
    } finally {
      setLoading(false);
    }
  }, [user, locationId]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const upsertRule = async (
    contactId: string,
    locId: string,
    notifyOnEnter: boolean,
    notifyOnExit: boolean
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('contact_zone_rules')
        .upsert(
          {
            user_id: user.id,
            contact_id: contactId,
            location_id: locId,
            notify_on_enter: notifyOnEnter,
            notify_on_exit: notifyOnExit,
          },
          { onConflict: 'contact_id,location_id' }
        )
        .select()
        .single();

      if (error) throw error;

      await fetchRules();
      return data;
    } catch (error) {
      console.error('Error upserting contact zone rule:', error);
      return null;
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('contact_zone_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      return true;
    } catch (error) {
      console.error('Error deleting contact zone rule:', error);
      return false;
    }
  };

  const getRulesForLocation = (locId: string) => {
    return rules.filter((r) => r.location_id === locId);
  };

  const getRulesForContact = (contactId: string) => {
    return rules.filter((r) => r.contact_id === contactId);
  };

  return {
    rules,
    loading,
    refresh: fetchRules,
    upsertRule,
    deleteRule,
    getRulesForLocation,
    getRulesForContact,
  };
}
