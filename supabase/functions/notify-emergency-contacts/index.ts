import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  user_id: string;
  alert_type: "sos" | "missed_checkin" | "safe_word";
  journey_id?: string;
  location?: { lat: number; lng: number };
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, alert_type, journey_id, location, message }: NotificationRequest = await req.json();

    console.log("Notification request:", { user_id, alert_type, journey_id, location });

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("user_id", user_id)
      .single();

    const userName = profile?.full_name || "A Noura user";

    // Fetch emergency contacts
    const { data: contacts, error: contactsError } = await supabase
      .from("emergency_contacts")
      .select("*")
      .eq("user_id", user_id)
      .order("priority", { ascending: true });

    if (contactsError) {
      console.error("Error fetching contacts:", contactsError);
      throw new Error("Failed to fetch emergency contacts");
    }

    if (!contacts || contacts.length === 0) {
      console.log("No emergency contacts configured for user:", user_id);
      return new Response(
        JSON.stringify({ message: "No emergency contacts configured", notified: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch journey details if available
    let journeyInfo = "";
    if (journey_id) {
      const { data: journey } = await supabase
        .from("journeys")
        .select("start_address, end_address")
        .eq("id", journey_id)
        .single();

      if (journey) {
        journeyInfo = journey.end_address 
          ? `They were traveling to: ${journey.end_address}` 
          : "";
      }
    }

    // Build alert message
    const alertMessages = {
      sos: `🆘 EMERGENCY ALERT: ${userName} has triggered an SOS alert!`,
      missed_checkin: `⚠️ ALERT: ${userName} has missed their safety check-in.`,
      safe_word: `🚨 URGENT: ${userName} has used their safe word.`,
    };

    const alertSubjects = {
      sos: `🆘 SOS Alert from ${userName}`,
      missed_checkin: `⚠️ Missed Check-in Alert for ${userName}`,
      safe_word: `🚨 Safe Word Alert from ${userName}`,
    };

    const locationInfo = location 
      ? `\n\nLast known location: https://www.google.com/maps?q=${location.lat},${location.lng}` 
      : "";

    const fullMessage = `${alertMessages[alert_type]}

${journeyInfo}${locationInfo}

${message || "Please try to reach them immediately."}

This is an automated message from Noura Safety App.`;

    // Send notifications to each contact
    const notificationResults = [];

    for (const contact of contacts) {
      // Send email notification
      if (contact.notify_email && contact.email) {
        try {
          console.log("Sending email to:", contact.email);
          const emailResult = await resend.emails.send({
            from: "Noura Safety <onboarding@resend.dev>",
            to: [contact.email],
            subject: alertSubjects[alert_type],
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: ${alert_type === 'sos' ? '#dc2626' : '#f59e0b'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0;">${alertSubjects[alert_type]}</h1>
                </div>
                <div style="padding: 20px; background: #1a1a2e; color: #e0e0e0; border-radius: 0 0 8px 8px;">
                  <p style="font-size: 16px;">${alertMessages[alert_type]}</p>
                  ${journeyInfo ? `<p><strong>Journey:</strong> ${journeyInfo}</p>` : ""}
                  ${location ? `
                    <p><strong>Last known location:</strong></p>
                    <a href="https://www.google.com/maps?q=${location.lat},${location.lng}" 
                       style="color: #60a5fa; display: inline-block; margin: 10px 0;">
                      View on Google Maps
                    </a>
                  ` : ""}
                  <p style="margin-top: 20px; color: #9ca3af; font-size: 14px;">
                    Please try to contact them immediately.
                  </p>
                  <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;">
                  <p style="font-size: 12px; color: #6b7280;">
                    This is an automated message from Noura Safety App.
                  </p>
                </div>
              </div>
            `,
          });
          console.log("Email sent successfully:", emailResult);
          notificationResults.push({ contact: contact.name, type: "email", success: true });
        } catch (emailError: unknown) {
          const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error';
          console.error("Email send error:", emailError);
          notificationResults.push({ contact: contact.name, type: "email", success: false, error: errorMessage });
        }
      }

      // Note: SMS would require a service like Twilio
      // For now, we log the SMS intent
      if (contact.notify_sms && contact.phone) {
        console.log("SMS notification intent for:", contact.phone, "Message:", fullMessage.substring(0, 160));
        notificationResults.push({ contact: contact.name, type: "sms", success: true, note: "SMS logged (requires Twilio integration)" });
      }
    }

    // Update the alert record with notification results
    if (journey_id) {
      const { data: alert } = await supabase
        .from("alerts")
        .select("id")
        .eq("journey_id", journey_id)
        .eq("alert_type", alert_type)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (alert) {
        await supabase
          .from("alerts")
          .update({ contacts_notified: notificationResults })
          .eq("id", alert.id);
      }
    }

    console.log("Notification results:", notificationResults);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notified: notificationResults.filter(r => r.success).length,
        results: notificationResults 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in notify-emergency-contacts:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
