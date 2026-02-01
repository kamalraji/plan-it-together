import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface CheckoutResponse {
  success: boolean;
  type?: 'free' | 'paid';
  url?: string;
  sessionId?: string;
  registrationId?: string;
  redirectUrl?: string;
  error?: string;
}

interface VerifyPaymentResponse {
  success: boolean;
  status: 'confirmed' | 'pending' | 'failed';
  paymentStatus?: string;
  registration?: {
    id: string;
    eventName?: string;
    tierName?: string;
    quantity?: number;
    totalAmount?: number;
    currency?: string;
    status?: string;
  };
  error?: string;
}

export const useTicketCheckout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckout = async (request: CheckoutRequest): Promise<CheckoutResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke<CheckoutResponse>(
        'create-ticket-checkout',
        { body: request }
      );

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to create checkout');
      }

      // Handle free tickets - redirect immediately
      if (data.type === 'free' && data.redirectUrl) {
        toast.success('Registration confirmed!');
        window.location.href = data.redirectUrl;
        return data;
      }

      // Handle paid tickets - redirect to Stripe
      if (data.type === 'paid' && data.url) {
        // Open in new tab by default
        window.open(data.url, '_blank');
        toast.info('Complete your payment in the new tab');
        return data;
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout failed';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (
    sessionId?: string,
    registrationId?: string
  ): Promise<VerifyPaymentResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke<VerifyPaymentResponse>(
        'verify-payment',
        { body: { sessionId, registrationId } }
      );

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to verify payment');
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createCheckout,
    verifyPayment,
    loading,
    error,
  };
};
