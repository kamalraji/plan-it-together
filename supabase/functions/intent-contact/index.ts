import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface IntentContactPayload {
  intent: string | null;
  name: string;
  email: string;
  message: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body = (await req.json()) as IntentContactPayload;

    const subjectPrefix = body.intent === "demo"
      ? "Demo request"
      : body.intent === "pricing"
      ? "Pricing question"
      : body.intent === "walkthrough"
      ? "Guided walkthrough"
      : "Help request";

    const emailBody = `
      Intent: ${body.intent ?? "general"}
      Name: ${body.name}
      Email: ${body.email}

      Message:
      ${body.message}
    `;

    const emailResponse = await resend.emails.send({
      from: "Thittam1Hub <onboarding@resend.dev>",
      to: ["founder@example.com"],
      subject: `${subjectPrefix} via Thittam1Hub help form`,
      text: emailBody,
    });

    console.log("Intent contact email sent", emailResponse);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error in intent-contact function", error);
    return new Response(JSON.stringify({ error: "Failed to submit request" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
