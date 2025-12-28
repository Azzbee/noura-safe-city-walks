import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

// VAPID public key - should match the one in the edge function
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Check if push notifications are supported
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Check existing subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isSupported || !user) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error('Error checking push subscription:', error);
      }
    };

    checkSubscription();
  }, [isSupported, user]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: 'Not supported',
        description: 'Push notifications are not supported in this browser',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: 'Notifications enabled',
          description: 'You will now receive safety alerts',
        });
        return true;
      } else {
        toast({
          title: 'Notifications blocked',
          description: 'Please enable notifications in your browser settings',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported, toast]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !user) {
      return false;
    }

    setIsLoading(true);

    try {
      // Request permission first
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setIsLoading(false);
          return false;
        }
      }

      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      const subscriptionJson = subscription.toJSON();

      // Save subscription to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionJson.endpoint!,
          p256dh: subscriptionJson.keys!.p256dh,
          auth: subscriptionJson.keys!.auth,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      setIsSubscribed(true);
      toast({
        title: 'Subscribed',
        description: 'You will receive push notifications for safety alerts',
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: 'Subscription failed',
        description: 'Could not enable push notifications',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user, permission, requestPermission, toast]);

  const unsubscribe = useCallback(async () => {
    if (!user) return false;

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove from database
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      setIsSubscribed(false);
      toast({
        title: 'Unsubscribed',
        description: 'You will no longer receive push notifications',
      });

      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Show a local notification (for immediate alerts like danger zone entry)
  const showLocalNotification = useCallback((title: string, body: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      // Fallback to toast
      toast({
        title,
        description: body,
        variant: title.toLowerCase().includes('danger') ? 'destructive' : 'default',
      });
      return;
    }

    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    } catch (error) {
      console.error('Error showing notification:', error);
      // Fallback to toast
      toast({
        title,
        description: body,
      });
    }
  }, [isSupported, permission, toast]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    requestPermission,
    showLocalNotification,
  };
}
