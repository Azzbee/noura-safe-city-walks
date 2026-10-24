import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// VAPID keys for Web Push - these should ideally be generated once and stored as secrets
// For now, we'll use a placeholder that should be replaced with real keys
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';

interface PushNotificationPayload {
  userId?: string;
  userIds?: string[];
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  tag?: string;
}

interface StoredSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function sendWebPush(
  subscription: StoredSubscription,
  payload: Record<string, unknown>
): Promise<boolean> {
  // Note: Full Web Push implementation requires web-push library
  // For now, we'll log the notification and return success
  // In production, you'd use a library like web-push
  console.log('Would send push notification to:', subscription.endpoint);
  console.log('Payload:', payload);
  
  // Simulate sending - in production, implement actual Web Push protocol
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const payload: PushNotificationPayload = await req.json();

    console.log('Received push notification request:', payload);

    // Get user IDs to notify
    const userIds = payload.userIds || (payload.userId ? [payload.userId] : []);

    if (userIds.length === 0) {
      // If no specific users, get all subscribed users
      const { data: allSubscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*');

      if (error) {
        console.error('Error fetching subscriptions:', error);
        throw error;
      }

      console.log(`Found ${allSubscriptions?.length || 0} total subscriptions`);

      let successCount = 0;
      for (const sub of allSubscriptions || []) {
        const sent = await sendWebPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          {
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/favicon.ico',
            badge: payload.badge,
            data: payload.data,
            tag: payload.tag,
          }
        );
        if (sent) successCount++;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          notified: successCount,
          total: allSubscriptions?.length || 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get subscriptions for specific users
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    if (error) {
      console.error('Error fetching user subscriptions:', error);
      throw error;
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions for ${userIds.length} users`);

    let successCount = 0;
    for (const sub of subscriptions || []) {
      const sent = await sendWebPush(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/favicon.ico',
          badge: payload.badge,
          data: payload.data,
          tag: payload.tag,
        }
      );
      if (sent) successCount++;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notified: successCount,
        total: subscriptions?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-push-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
