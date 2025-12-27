import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Twilio from "https://esm.sh/twilio@4.19.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Twilio configuration
const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

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

// Send SMS via Twilio
async function sendSMS(to: string, body: string): Promise<{ success: boolean; error?: string; sid?: string }> {
  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    console.log("Twilio credentials not configured");
    return { success: false, error: "Twilio not configured" };
  }

  try {
    const twilioClient = Twilio(twilioAccountSid, twilioAuthToken);
    const message = await twilioClient.messages.create({
      body: body.substring(0, 1600), // SMS limit
      from: twilioPhoneNumber,
      to: to,
    });
    
    console.log("SMS sent successfully, SID:", message.sid);
    return { success: true, sid: message.sid };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Twilio SMS error:", error);
    return { success: false, error: errorMessage };
  }
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
          ? `Traveling to: ${journey.end_address}` 
          : "";
      }
    }

    // Build alert messages
    const alertMessages = {
      sos: `🆘 EMERGENCY: ${userName} triggered SOS!`,
      missed_checkin: `⚠️ ALERT: ${userName} missed safety check-in.`,
      safe_word: `🚨 URGENT: ${userName} used safe word.`,
    };

    const alertSubjects = {
      sos: `🆘 SOS Alert from ${userName}`,
      missed_checkin: `⚠️ Missed Check-in Alert for ${userName}`,
      safe_word: `🚨 Safe Word Alert from ${userName}`,
    };

    // SMS message (shorter for SMS limits)
    const locationLink = location 
      ? `\nLocation: https://maps.google.com/?q=${location.lat},${location.lng}` 
      : "";
    
    const smsMessage = `${alertMessages[alert_type]}${journeyInfo ? `\n${journeyInfo}` : ""}${locationLink}\n\nPlease contact them NOW. - Noura Safety`;

    // Send notifications to each contact
    const notificationResults: Array<{
      contact: string;
      type: string;
      success: boolean;
      error?: string;
      sid?: string;
    }> = [];

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
                       style="color: #60a5fa; display: inline-block; margin: 10px 0; padding: 10px 20px; background: #2563eb; border-radius: 6px; text-decoration: none;">
                      📍 View on Google Maps
                    </a>
                  ` : ""}
                  <p style="margin-top: 20px; color: #f87171; font-size: 16px; font-weight: bold;">
                    ⚠️ Please try to contact them immediately!
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

      // Send SMS notification via Twilio
      if (contact.notify_sms && contact.phone) {
        console.log("Sending SMS to:", contact.phone);
        const smsResult = await sendSMS(contact.phone, smsMessage);
        notificationResults.push({ 
          contact: contact.name, 
          type: "sms", 
          success: smsResult.success,
          error: smsResult.error,
          sid: smsResult.sid,
        });
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

    const successCount = notificationResults.filter(r => r.success).length;
    const failCount = notificationResults.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        notified: successCount,
        failed: failCount,
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
