import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Webhook signature verified");
      } catch (err) {
        logStep("Webhook signature verification failed", { error: (err as Error).message });
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 400, headers: corsHeaders }
        );
      }
    } else {
      // For testing without webhook secret
      event = JSON.parse(body);
      logStep("Webhook parsed (no signature verification)");
    }

    logStep("Event type", { type: event.type });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", { 
          sessionId: session.id,
          paymentStatus: session.payment_status 
        });

        const registrationId = session.metadata?.registration_id;
        if (!registrationId) {
          logStep("No registration ID in metadata");
          break;
        }

        if (session.payment_status === "paid") {
          // Update registration
          await supabaseAdmin
            .from("registrations")
            .update({
              status: "CONFIRMED",
              payment_status: "paid",
            })
            .eq("id", registrationId);

          // Update payment record
          await supabaseAdmin
            .from("payments")
            .update({
              status: "succeeded",
              stripe_payment_intent_id: session.payment_intent as string,
              stripe_customer_id: session.customer as string,
            })
            .eq("stripe_checkout_session_id", session.id);

          // Get registration to update inventory
          const { data: registration } = await supabaseAdmin
            .from("registrations")
            .select("ticket_tier_id, quantity, promo_code_id")
            .eq("id", registrationId)
            .single();

          if (registration) {
            // Increment sold count
            await supabaseAdmin.rpc("increment_sold_count", {
              tier_id: registration.ticket_tier_id,
              increment_by: registration.quantity,
            });

            // Update promo code usage
            if (registration.promo_code_id) {
              await supabaseAdmin.rpc("increment_promo_usage", {
                promo_id: registration.promo_code_id,
              });
            }
          }

          logStep("Registration confirmed", { registrationId });
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const registrationId = session.metadata?.registration_id;
        
        if (registrationId) {
          // Cancel the pending registration
          await supabaseAdmin
            .from("registrations")
            .update({
              status: "CANCELLED",
              payment_status: "failed",
            })
            .eq("id", registrationId)
            .eq("status", "PENDING");

          await supabaseAdmin
            .from("payments")
            .update({ status: "failed" })
            .eq("stripe_checkout_session_id", session.id);

          logStep("Registration cancelled due to expired session", { registrationId });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const registrationId = paymentIntent.metadata?.registration_id;
        
        if (registrationId) {
          await supabaseAdmin
            .from("registrations")
            .update({ payment_status: "failed" })
            .eq("id", registrationId);

          await supabaseAdmin
            .from("payments")
            .update({ 
              status: "failed",
              metadata: { 
                failure_reason: paymentIntent.last_payment_error?.message 
              }
            })
            .eq("stripe_payment_intent_id", paymentIntent.id);

          logStep("Payment failed", { 
            registrationId,
            reason: paymentIntent.last_payment_error?.message 
          });
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;
        
        if (paymentIntentId) {
          const refundAmount = charge.amount_refunded / 100;
          const isFullRefund = charge.refunded;

          await supabaseAdmin
            .from("payments")
            .update({ 
              status: isFullRefund ? "refunded" : "partially_refunded",
              refund_amount: refundAmount,
            })
            .eq("stripe_payment_intent_id", paymentIntentId);

          if (isFullRefund) {
            // Get registration to update inventory
            const { data: payment } = await supabaseAdmin
              .from("payments")
              .select("registration_id")
              .eq("stripe_payment_intent_id", paymentIntentId)
              .single();

            if (payment?.registration_id) {
              const { data: registration } = await supabaseAdmin
                .from("registrations")
                .select("ticket_tier_id, quantity")
                .eq("id", payment.registration_id)
                .single();

              if (registration) {
                await supabaseAdmin
                  .from("registrations")
                  .update({ 
                    status: "CANCELLED",
                    payment_status: "refunded" 
                  })
                  .eq("id", payment.registration_id);

                // Decrement sold count
                await supabaseAdmin.rpc("decrement_sold_count", {
                  tier_id: registration.ticket_tier_id,
                  decrement_by: registration.quantity,
                });
              }
            }
          }

          logStep("Refund processed", { 
            paymentIntentId, 
            refundAmount, 
            isFullRefund 
          });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
