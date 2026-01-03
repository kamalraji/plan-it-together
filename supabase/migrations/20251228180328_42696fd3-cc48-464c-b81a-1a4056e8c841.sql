-- Create table for certificate criteria per event
CREATE TABLE IF NOT EXISTS public.certificate_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  type text NOT NULL, -- e.g. PARTICIPATION, WINNER, VOLUNTEER
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.certificate_criteria ENABLE ROW LEVEL SECURITY;

-- Organizers/admins manage certificate criteria
CREATE POLICY "Organizers manage certificate criteria" ON public.certificate_criteria
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'organizer'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'organizer'::app_role));

-- Create table for issued certificates
CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id text NOT NULL UNIQUE, -- public-friendly ID embedded in QR
  recipient_id uuid NOT NULL, -- auth user id / user_profiles.id
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  type text NOT NULL, -- e.g. PARTICIPATION, WINNER
  qr_payload text NOT NULL, -- payload encoded into QR (can be full URL or just certificate_id)
  pdf_url text, -- optional link to generated PDF stored elsewhere
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb, -- extra info (rank, score, team name, etc.)
  issued_at timestamptz NOT NULL DEFAULT now(),
  distributed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Organizers/admins can manage certificates (for their events in general)
CREATE POLICY "Organizers manage certificates" ON public.certificates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'organizer'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'organizer'::app_role));

-- Users can view their own certificates
CREATE POLICY "Users view own certificates" ON public.certificates
FOR SELECT
USING (recipient_id = auth.uid());