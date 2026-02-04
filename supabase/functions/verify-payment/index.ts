import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const body = await req.json();
    const { sessionId, registrationId } = body;

    if (!sessionId && !registrationId) {
      throw new Error("Either sessionId or registrationId is required");
    }

    logStep("Request parsed", { sessionId, registrationId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let session;
    if (sessionId) {
      session = await stripe.checkout.sessions.retrieve(sessionId);
      logStep("Session retrieved from Stripe", { 
        status: session.status, 
        paymentStatus: session.payment_status 
      });
    }

    // Get registration
    let registration;
    if (registrationId) {
      const { data, error } = await supabaseAdmin
        .from("registrations")
        .select("*, ticket_tiers(*), events(name, slug)")
        .eq("id", registrationId)
        .single();

      if (error) throw new Error(`Registration not found: ${error.message}`);
      registration = data;
    } else if (session) {
      const regId = session.metadata?.registration_id;
      if (regId) {
        const { data, error } = await supabaseAdmin
          .from("registrations")
          .select("*, ticket_tiers(*), events(name, slug)")
          .eq("id", regId)
          .single();

        if (error) throw new Error(`Registration not found: ${error.message}`);
        registration = data;
      }
    }

    if (!registration) {
      throw new Error("Registration not found");
    }

    logStep("Registration found", { 
      id: registration.id, 
      status: registration.status,
      paymentStatus: registration.payment_status 
    });

    // If already confirmed, return success
    if (registration.status === "CONFIRMED" && registration.payment_status === "paid") {
      logStep("Already confirmed");
      return new Response(
        JSON.stringify({
          success: true,
          status: "confirmed",
          registration: {
            id: registration.id,
            eventName: registration.events?.name,
            tierName: registration.ticket_tiers?.name,
            quantity: registration.quantity,
            totalAmount: registration.total_amount,
            currency: registration.ticket_tiers?.currency,
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Check payment status from Stripe
    if (session && session.payment_status === "paid") {
      logStep("Payment confirmed - updating registration");

      // Update registration status
      await supabaseAdmin
        .from("registrations")
        .update({
          status: "CONFIRMED",
          payment_status: "paid",
        })
        .eq("id", registration.id);

      // Update payment record
      await supabaseAdmin
        .from("payments")
        .update({
          status: "succeeded",
          stripe_payment_intent_id: session.payment_intent as string,
        })
        .eq("stripe_checkout_session_id", sessionId);

      // Increment sold count
      await supabaseAdmin.rpc("increment_sold_count", {
        tier_id: registration.ticket_tier_id,
        increment_by: registration.quantity,
      });

      // Update promo code usage if applicable
      if (registration.promo_code_id) {
        await supabaseAdmin.rpc("increment_promo_usage", {
          promo_id: registration.promo_code_id,
        });
      }

      logStep("Registration confirmed successfully");

      return new Response(
        JSON.stringify({
          success: true,
          status: "confirmed",
          registration: {
            id: registration.id,
            eventName: registration.events?.name,
            tierName: registration.ticket_tiers?.name,
            quantity: registration.quantity,
            totalAmount: registration.total_amount,
            currency: registration.ticket_tiers?.currency,
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Payment not completed
    logStep("Payment not yet completed", { 
      stripeStatus: session?.payment_status,
      regStatus: registration.status 
    });

    return new Response(
      JSON.stringify({
        success: true,
        status: "pending",
        paymentStatus: session?.payment_status || "unknown",
        registration: {
          id: registration.id,
          status: registration.status,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
