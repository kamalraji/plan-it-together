import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PromoCode, getPromoCodeStatus, calculateDiscount } from '@/types/promoCode';

interface PromoCodeValidationResult {
  isValid: boolean;
  promoCode: PromoCode | null;
  errorMessage: string | null;
  discountAmount: number;
}

export function usePromoCodeValidation(eventId: string | null) {
  const [isValidating, setIsValidating] = useState(false);
  const [appliedPromoCode, setAppliedPromoCode] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const validatePromoCode = useCallback(async (
    code: string,
    ticketTierId?: string,
    quantity: number = 1,
    subtotal: number = 0
  ): Promise<PromoCodeValidationResult> => {
    if (!eventId || !code.trim()) {
      return { isValid: false, promoCode: null, errorMessage: 'No code provided', discountAmount: 0 };
    }

    setIsValidating(true);
    setPromoError(null);

    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('event_id', eventId)
        .ilike('code', code.trim())
        .single();

      if (error || !data) {
        const errorMsg = 'Invalid promo code';
        setPromoError(errorMsg);
        setAppliedPromoCode(null);
        return { isValid: false, promoCode: null, errorMessage: errorMsg, discountAmount: 0 };
      }

      const promoCode: PromoCode = {
        id: data.id,
        event_id: data.event_id,
        code: data.code,
        name: data.name,
        discount_type: data.discount_type as 'percentage' | 'fixed',
        discount_value: data.discount_value,
        max_uses: data.max_uses,
        current_uses: data.current_uses,
        valid_from: data.valid_from,
        valid_until: data.valid_until,
        min_quantity: data.min_quantity ?? 1,
        max_quantity: data.max_quantity,
        applicable_tier_ids: data.applicable_tier_ids,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      // Check status
      const status = getPromoCodeStatus(promoCode);
      if (status !== 'active') {
        let errorMsg = '';
        switch (status) {
          case 'expired': errorMsg = 'This promo code has expired'; break;
          case 'exhausted': errorMsg = 'This promo code has reached its usage limit'; break;
          case 'upcoming': errorMsg = 'This promo code is not yet active'; break;
          case 'inactive': errorMsg = 'This promo code is not active'; break;
          default: errorMsg = 'Invalid promo code';
        }
        setPromoError(errorMsg);
        setAppliedPromoCode(null);
        return { isValid: false, promoCode: null, errorMessage: errorMsg, discountAmount: 0 };
      }

      // Check tier applicability
      if (promoCode.applicable_tier_ids && promoCode.applicable_tier_ids.length > 0) {
        if (ticketTierId && !promoCode.applicable_tier_ids.includes(ticketTierId)) {
          const errorMsg = 'This promo code is not valid for the selected ticket type';
          setPromoError(errorMsg);
          setAppliedPromoCode(null);
          return { isValid: false, promoCode: null, errorMessage: errorMsg, discountAmount: 0 };
        }
      }

      // Check quantity requirements
      if (quantity < promoCode.min_quantity) {
        const errorMsg = `Minimum ${promoCode.min_quantity} ticket(s) required for this code`;
        setPromoError(errorMsg);
        setAppliedPromoCode(null);
        return { isValid: false, promoCode: null, errorMessage: errorMsg, discountAmount: 0 };
      }

      // Calculate discount
      const discountAmount = calculateDiscount(promoCode, subtotal, quantity, ticketTierId);
      
      setAppliedPromoCode(promoCode);
      setPromoError(null);
      return { isValid: true, promoCode, errorMessage: null, discountAmount };

    } catch (error) {
      console.error('Error validating promo code:', error);
      const errorMsg = 'Failed to validate promo code';
      setPromoError(errorMsg);
      setAppliedPromoCode(null);
      return { isValid: false, promoCode: null, errorMessage: errorMsg, discountAmount: 0 };
    } finally {
      setIsValidating(false);
    }
  }, [eventId]);

  const clearPromoCode = useCallback(() => {
    setAppliedPromoCode(null);
    setPromoError(null);
  }, []);

  return {
    isValidating,
    appliedPromoCode,
    promoError,
    validatePromoCode,
    clearPromoCode
  };
}
