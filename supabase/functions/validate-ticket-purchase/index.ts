import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  eventId: string;
  tierId: string;
  quantity: number;
  promoCode?: string;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  tier?: {
    id: string;
    name: string;
    price: number;
    currency: string;
    availableQuantity: number | null;
  };
  promoCode?: {
    id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
  };
  pricing?: {
    unitPrice: number;
    subtotal: number;
    discount: number;
    total: number;
    currency: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    );

    const body: ValidationRequest = await req.json();
    const { eventId, tierId, quantity, promoCode } = body;

    // Validate required fields
    if (!eventId || !tierId || !quantity || quantity < 1) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Missing required fields: eventId, tierId, quantity' 
        } as ValidationResult),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the ticket tier
    const { data: tier, error: tierError } = await supabaseClient
      .from('ticket_tiers')
      .select('*')
      .eq('id', tierId)
      .eq('event_id', eventId)
      .single();

    if (tierError || !tier) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Ticket tier not found' 
        } as ValidationResult),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if tier is active
    if (!tier.is_active) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'This ticket type is not currently available' 
        } as ValidationResult),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check sale window
    const now = new Date();
    if (tier.sale_start && new Date(tier.sale_start) > now) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: `Ticket sales start on ${new Date(tier.sale_start).toLocaleDateString()}` 
        } as ValidationResult),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (tier.sale_end && new Date(tier.sale_end) < now) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Ticket sales have ended for this tier' 
        } as ValidationResult),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check inventory
    if (tier.quantity !== null) {
      const available = tier.quantity - tier.sold_count;
      if (available <= 0) {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'This ticket type is sold out' 
          } as ValidationResult),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (quantity > available) {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: `Only ${available} tickets remaining for this tier` 
          } as ValidationResult),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Calculate base pricing
    let subtotal = tier.price * quantity;
    let discount = 0;
    let validatedPromoCode = null;

    // Validate promo code if provided
    if (promoCode) {
      const { data: promo, error: promoError } = await supabaseClient
        .from('promo_codes')
        .select('*')
        .eq('event_id', eventId)
        .ilike('code', promoCode.trim())
        .single();

      if (!promoError && promo) {
        // Check promo code is active
        if (!promo.is_active) {
          return new Response(
            JSON.stringify({ 
              valid: false, 
              error: 'This promo code is not active' 
            } as ValidationResult),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check promo validity window
        if (promo.valid_from && new Date(promo.valid_from) > now) {
          return new Response(
            JSON.stringify({ 
              valid: false, 
              error: 'This promo code is not yet active' 
            } as ValidationResult),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (promo.valid_until && new Date(promo.valid_until) < now) {
          return new Response(
            JSON.stringify({ 
              valid: false, 
              error: 'This promo code has expired' 
            } as ValidationResult),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check usage limit
        if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) {
          return new Response(
            JSON.stringify({ 
              valid: false, 
              error: 'This promo code has reached its usage limit' 
            } as ValidationResult),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check tier applicability
        if (promo.applicable_tier_ids && promo.applicable_tier_ids.length > 0) {
          if (!promo.applicable_tier_ids.includes(tierId)) {
            return new Response(
              JSON.stringify({ 
                valid: false, 
                error: 'This promo code is not valid for the selected ticket type' 
              } as ValidationResult),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        // Check quantity requirements
        if (promo.min_quantity && quantity < promo.min_quantity) {
          return new Response(
            JSON.stringify({ 
              valid: false, 
              error: `Minimum ${promo.min_quantity} tickets required for this promo code` 
            } as ValidationResult),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Calculate discount
        if (promo.discount_type === 'percentage') {
          discount = (subtotal * promo.discount_value) / 100;
        } else {
          const applicableQty = promo.max_quantity 
            ? Math.min(quantity, promo.max_quantity) 
            : quantity;
          discount = promo.discount_value * applicableQty;
        }
        discount = Math.min(discount, subtotal); // Cap at subtotal

        validatedPromoCode = {
          id: promo.id,
          code: promo.code,
          discountType: promo.discount_type as 'percentage' | 'fixed',
          discountValue: promo.discount_value,
        };
      } else {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'Invalid promo code' 
          } as ValidationResult),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Build successful response
    const result: ValidationResult = {
      valid: true,
      tier: {
        id: tier.id,
        name: tier.name,
        price: tier.price,
        currency: tier.currency,
        availableQuantity: tier.quantity !== null ? tier.quantity - tier.sold_count : null,
      },
      pricing: {
        unitPrice: tier.price,
        subtotal,
        discount,
        total: subtotal - discount,
        currency: tier.currency,
      },
    };

    if (validatedPromoCode) {
      result.promoCode = validatedPromoCode;
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: 'An error occurred during validation' 
      } as ValidationResult),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
