import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Timeout configurations (in minutes)
const CHECKIN_TIMEOUT = 2; // Time to wait after check-in prompt before marking as missed
const ESCALATION_LEVELS = [
  { minutes: 0, level: 1, action: "first_reminder" },
  { minutes: 2, level: 2, action: "notify_contacts" },
  { minutes: 5, level: 3, action: "emergency_alert" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Checking for missed check-ins...");

    // Find all pending check-ins that have exceeded the timeout
    const timeoutThreshold = new Date(Date.now() - CHECKIN_TIMEOUT * 60 * 1000).toISOString();

    const { data: pendingCheckins, error: checkinsError } = await supabase
      .from("checkins")
      .select(`
        *,
        journeys!inner(
          id,
          user_id,
          status,
          start_address,
          end_address,
          start_lat,
          start_lng,
          end_lat,
          end_lng
        )
      `)
      .eq("status", "pending")
      .lt("prompted_at", timeoutThreshold)
      .eq("journeys.status", "active");

    if (checkinsError) {
      console.error("Error fetching pending check-ins:", checkinsError);
      throw checkinsError;
    }

    console.log(`Found ${pendingCheckins?.length || 0} missed check-ins`);

    const results: Array<{
      checkin_id: string;
      user_id: string;
      action: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const checkin of pendingCheckins || []) {
      const userId = checkin.journeys.user_id;
      const journeyId = checkin.journey_id;
      const promptedAt = new Date(checkin.prompted_at);
      const minutesSincePrompt = (Date.now() - promptedAt.getTime()) / (1000 * 60);

      // Determine escalation level
      let currentLevel = ESCALATION_LEVELS[0];
      for (const level of ESCALATION_LEVELS) {
        if (minutesSincePrompt >= CHECKIN_TIMEOUT + level.minutes) {
          currentLevel = level;
        }
      }

      console.log(`Check-in ${checkin.id}: ${minutesSincePrompt.toFixed(1)} mins, level ${currentLevel.level}`);

      try {
        // Mark check-in as missed
        await supabase
          .from("checkins")
          .update({ status: "missed" })
          .eq("id", checkin.id);

        // Check if we've already created an alert for this journey
        const { data: existingAlert } = await supabase
          .from("alerts")
          .select("id, contacts_notified")
          .eq("journey_id", journeyId)
          .eq("alert_type", "missed_checkin")
          .eq("resolved", false)
          .maybeSingle();

        // Determine what action to take based on escalation level
        if (currentLevel.action === "first_reminder" && !existingAlert) {
          // Create alert record
          await supabase.from("alerts").insert({
            user_id: userId,
            journey_id: journeyId,
            alert_type: "missed_checkin",
            message: "First reminder: User missed check-in",
            lat: checkin.lat,
            lng: checkin.lng,
          });

          results.push({
            checkin_id: checkin.id,
            user_id: userId,
            action: "first_reminder",
            success: true,
          });
        } else if (currentLevel.action === "notify_contacts") {
          // Notify emergency contacts
          console.log("Escalating to notify emergency contacts");

          const notifyResponse = await fetch(`${supabaseUrl}/functions/v1/notify-emergency-contacts`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              user_id: userId,
              alert_type: "missed_checkin",
              journey_id: journeyId,
              location: checkin.lat && checkin.lng 
                ? { lat: checkin.lat, lng: checkin.lng }
                : null,
              message: "User has not responded to safety check-in.",
            }),
          });

          const notifyResult = await notifyResponse.json();
          console.log("Notify result:", notifyResult);

          results.push({
            checkin_id: checkin.id,
            user_id: userId,
            action: "notify_contacts",
            success: notifyResult.success || false,
            error: notifyResult.error,
          });
        } else if (currentLevel.action === "emergency_alert") {
          // Final escalation - update journey to alert_triggered
          await supabase
            .from("journeys")
            .update({ status: "alert_triggered" })
            .eq("id", journeyId);

          // Send another notification with higher urgency
          await fetch(`${supabaseUrl}/functions/v1/notify-emergency-contacts`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              user_id: userId,
              alert_type: "missed_checkin",
              journey_id: journeyId,
              location: checkin.lat && checkin.lng 
                ? { lat: checkin.lat, lng: checkin.lng }
                : null,
              message: "CRITICAL: User has not responded for extended period. Emergency services may need to be contacted.",
            }),
          });

          results.push({
            checkin_id: checkin.id,
            user_id: userId,
            action: "emergency_alert",
            success: true,
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error processing check-in ${checkin.id}:`, error);
        results.push({
          checkin_id: checkin.id,
          user_id: userId,
          action: currentLevel.action,
          success: false,
          error: errorMessage,
        });
      }
    }

    return new Response(
      JSON.stringify({
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in check-missed-checkins:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
