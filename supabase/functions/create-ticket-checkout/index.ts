import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
  eventId: string;
  tierId: string;
  quantity: number;
  promoCode?: string;
  attendeeDetails?: {
    name: string;
    email: string;
    phone?: string;
  };
}

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-TICKET-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Create client with user auth for reading
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    // Create admin client for writes
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Get authenticated user (optional - allow guest checkout)
    let user = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
      logStep("User authenticated", { userId: user?.id, email: user?.email });
    }

    const body: CheckoutRequest = await req.json();
    const { eventId, tierId, quantity, promoCode, attendeeDetails } = body;

    if (!eventId || !tierId || !quantity) {
      throw new Error("Missing required fields: eventId, tierId, quantity");
    }

    logStep("Request parsed", { eventId, tierId, quantity, promoCode });

    // Fetch ticket tier details
    const { data: tier, error: tierError } = await supabaseClient
      .from("ticket_tiers")
      .select("*")
      .eq("id", tierId)
      .eq("event_id", eventId)
      .single();

    if (tierError || !tier) {
      throw new Error("Ticket tier not found");
    }

    logStep("Tier fetched", { tierName: tier.name, price: tier.price });

    // Validate availability
    if (!tier.is_active) {
      throw new Error("This ticket type is not currently available");
    }

    const now = new Date();
    if (tier.sale_start && new Date(tier.sale_start) > now) {
      throw new Error(`Ticket sales start on ${new Date(tier.sale_start).toLocaleDateString()}`);
    }
    if (tier.sale_end && new Date(tier.sale_end) < now) {
      throw new Error("Ticket sales have ended for this tier");
    }

    if (tier.quantity !== null) {
      const available = tier.quantity - tier.sold_count;
      if (quantity > available) {
        throw new Error(`Only ${available} tickets remaining`);
      }
    }

    // Fetch event details
    const { data: event, error: eventError } = await supabaseClient
      .from("events")
      .select("id, name, slug")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      throw new Error("Event not found");
    }

    logStep("Event fetched", { eventName: event.name });

    // Calculate pricing
    let subtotal = tier.price * quantity;
    let discount = 0;
    let promoCodeId = null;

    if (promoCode) {
      const { data: promo } = await supabaseClient
        .from("promo_codes")
        .select("*")
        .eq("event_id", eventId)
        .ilike("code", promoCode.trim())
        .single();

      if (promo && promo.is_active) {
        if (promo.discount_type === "percentage") {
          discount = (subtotal * promo.discount_value) / 100;
        } else {
          discount = promo.discount_value * quantity;
        }
        discount = Math.min(discount, subtotal);
        promoCodeId = promo.id;
        logStep("Promo applied", { code: promo.code, discount });
      }
    }

    const total = Math.max(0, subtotal - discount);

    // Handle free tickets
    if (total === 0) {
      logStep("Free ticket - creating registration directly");

      const userId = user?.id || crypto.randomUUID();
      
      // Create registration
      const { data: registration, error: regError } = await supabaseAdmin
        .from("registrations")
        .insert({
          event_id: eventId,
          user_id: userId,
          ticket_tier_id: tierId,
          quantity,
          promo_code_id: promoCodeId,
          subtotal,
          discount_amount: discount,
          total_amount: total,
          status: "CONFIRMED",
          payment_status: "free",
          form_responses: attendeeDetails || {},
        })
        .select()
        .single();

      if (regError) {
        throw new Error(`Failed to create registration: ${regError.message}`);
      }

      // Update sold count
      await supabaseAdmin.rpc("increment_sold_count", {
        tier_id: tierId,
        increment_by: quantity,
      });

      logStep("Free registration created", { registrationId: registration.id });

      const origin = req.headers.get("origin") || "https://lovable.dev";
      return new Response(
        JSON.stringify({
          success: true,
          type: "free",
          registrationId: registration.id,
          redirectUrl: `${origin}/registration-success?registrationId=${registration.id}`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Paid ticket - create Stripe checkout session
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    logStep("Stripe initialized");

    // Check for existing Stripe customer
    let customerId: string | undefined;
    const customerEmail = user?.email || attendeeDetails?.email;
    
    if (customerEmail) {
      const customers = await stripe.customers.list({ 
        email: customerEmail, 
        limit: 1 
      });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Existing customer found", { customerId });
      }
    }

    // Create pending registration first
    const userId = user?.id || crypto.randomUUID();
    const { data: registration, error: regError } = await supabaseAdmin
      .from("registrations")
      .insert({
        event_id: eventId,
        user_id: userId,
        ticket_tier_id: tierId,
        quantity,
        promo_code_id: promoCodeId,
        subtotal,
        discount_amount: discount,
        total_amount: total,
        status: "PENDING",
        payment_status: "pending",
        form_responses: attendeeDetails || {},
      })
      .select()
      .single();

    if (regError) {
      throw new Error(`Failed to create registration: ${regError.message}`);
    }

    logStep("Pending registration created", { registrationId: registration.id });

    const origin = req.headers.get("origin") || "https://lovable.dev";

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: [
        {
          price_data: {
            currency: tier.currency.toLowerCase(),
            product_data: {
              name: `${tier.name} - ${event.name}`,
              description: tier.description || `${quantity}x ${tier.name} ticket(s)`,
            },
            unit_amount: Math.round(total * 100 / quantity), // Discounted unit price in cents
          },
          quantity,
        },
      ],
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&registration_id=${registration.id}`,
      cancel_url: `${origin}/events/${event.slug || eventId}?payment=cancelled`,
      metadata: {
        registration_id: registration.id,
        event_id: eventId,
        tier_id: tierId,
        quantity: quantity.toString(),
        promo_code_id: promoCodeId || "",
      },
      payment_intent_data: {
        metadata: {
          registration_id: registration.id,
          event_id: eventId,
        },
      },
    });

    logStep("Checkout session created", { sessionId: session.id });

    // Update registration with session ID
    await supabaseAdmin
      .from("registrations")
      .update({ stripe_session_id: session.id })
      .eq("id", registration.id);

    // Create payment record
    await supabaseAdmin.from("payments").insert({
      registration_id: registration.id,
      event_id: eventId,
      user_id: userId,
      amount: total,
      currency: tier.currency,
      status: "pending",
      stripe_checkout_session_id: session.id,
      stripe_customer_id: customerId,
      metadata: {
        tier_name: tier.name,
        quantity,
        promo_code: promoCode || null,
      },
    });

    logStep("Payment record created");

    return new Response(
      JSON.stringify({
        success: true,
        type: "paid",
        url: session.url,
        sessionId: session.id,
        registrationId: registration.id,
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
