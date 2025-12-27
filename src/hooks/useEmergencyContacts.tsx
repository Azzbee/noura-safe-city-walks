import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email?: string;
  priority: number;
  notify_sms: boolean;
  notify_email: boolean;
  notify_on_start: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactFormData {
  name: string;
  phone: string;
  email?: string;
  priority?: number;
  notify_sms?: boolean;
  notify_email?: boolean;
  notify_on_start?: boolean;
}

export function useEmergencyContacts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error fetching contacts:', error);
      toast({ title: 'Error', description: 'Failed to load contacts', variant: 'destructive' });
    } else {
      setContacts(data as EmergencyContact[]);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const addContact = useCallback(async (contact: ContactFormData) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('emergency_contacts')
      .insert({
        user_id: user.id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        priority: contact.priority ?? contacts.length + 1,
        notify_sms: contact.notify_sms ?? true,
        notify_email: contact.notify_email ?? true,
        notify_on_start: contact.notify_on_start ?? false,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: 'Failed to add contact', variant: 'destructive' });
      return { error };
    }

    setContacts((prev) => [...prev, data as EmergencyContact]);
    toast({ title: 'Contact added', description: `${contact.name} added to emergency contacts` });
    return { data, error: null };
  }, [user, contacts.length, toast]);

  const updateContact = useCallback(async (id: string, updates: Partial<ContactFormData>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('emergency_contacts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: 'Failed to update contact', variant: 'destructive' });
      return { error };
    }

    setContacts((prev) =>
      prev.map((c) => (c.id === id ? (data as EmergencyContact) : c))
    );
    toast({ title: 'Contact updated' });
    return { data, error: null };
  }, [user, toast]);

  const deleteContact = useCallback(async (id: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('emergency_contacts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete contact', variant: 'destructive' });
      return { error };
    }

    setContacts((prev) => prev.filter((c) => c.id !== id));
    toast({ title: 'Contact removed' });
    return { error: null };
  }, [user, toast]);

  return {
    contacts,
    loading,
    addContact,
    updateContact,
    deleteContact,
    refetch: fetchContacts,
  };
}
