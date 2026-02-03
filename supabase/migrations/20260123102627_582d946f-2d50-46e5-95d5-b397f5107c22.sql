-- Create payments table for tracking Stripe transactions
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded')),
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  stripe_customer_id TEXT,
  payment_method TEXT,
  refund_amount NUMERIC DEFAULT 0,
  refund_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient lookups
CREATE INDEX idx_payments_registration_id ON public.payments(registration_id);
CREATE INDEX idx_payments_event_id ON public.payments(event_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_stripe_session ON public.payments(stripe_checkout_session_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view their own payments"
ON public.payments
FOR SELECT
USING (auth.uid() = user_id);

-- Event owners can view payments for their events
CREATE POLICY "Event owners can view payments"
ON public.payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = payments.event_id
    AND e.owner_id = auth.uid()
  )
);

-- Service role can manage all payments (for edge functions)
CREATE POLICY "Service role can manage payments"
ON public.payments
FOR ALL
USING (auth.role() = 'service_role');

-- Trigger to update updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add payment_status to registrations for quick reference
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Add stripe_session_id to registrations for webhook reconciliation  
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;