import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Looking up share token:", token);

    // Find the share token and validate it
    const { data: shareToken, error: tokenError } = await supabase
      .from("location_share_tokens")
      .select(`
        *,
        journeys!inner(
          id,
          status,
          start_address,
          end_address,
          end_lat,
          end_lng,
          started_at
        )
      `)
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (tokenError || !shareToken) {
      console.log("Token not found or expired:", tokenError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the user's name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", shareToken.user_id)
      .single();

    // Get the latest location for this journey
    const { data: latestLocation } = await supabase
      .from("journey_locations")
      .select("*")
      .eq("journey_id", shareToken.journey_id)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get location history (last 50 points for trail)
    const { data: locationHistory } = await supabase
      .from("journey_locations")
      .select("lat, lng, recorded_at")
      .eq("journey_id", shareToken.journey_id)
      .order("recorded_at", { ascending: false })
      .limit(50);

    const journey = shareToken.journeys;

    return new Response(
      JSON.stringify({
        user_name: profile?.full_name || "User",
        journey: {
          id: journey.id,
          status: journey.status,
          destination: journey.end_address,
          destination_coords: { lat: journey.end_lat, lng: journey.end_lng },
          started_at: journey.started_at,
        },
        current_location: latestLocation ? {
          lat: latestLocation.lat,
          lng: latestLocation.lng,
          accuracy: latestLocation.accuracy,
          speed: latestLocation.speed,
          recorded_at: latestLocation.recorded_at,
        } : null,
        location_trail: (locationHistory || []).reverse(),
        expires_at: shareToken.expires_at,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in get-shared-location:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
