-- Networking Meetings table for 1-on-1 meeting scheduler
CREATE TABLE public.networking_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  proposed_time TIMESTAMPTZ NOT NULL,
  proposed_location TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED', 'CANCELLED')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE(event_id, requester_id, receiver_id, proposed_time)
);

-- Event Icebreakers table
CREATE TABLE public.event_icebreakers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Icebreaker Answers table
CREATE TABLE public.icebreaker_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  icebreaker_id UUID NOT NULL REFERENCES public.event_icebreakers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(icebreaker_id, user_id)
);

-- Contact Exchanges table
CREATE TABLE public.contact_exchanges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  shared_fields JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id, target_user_id)
);

-- Create indexes for performance
CREATE INDEX idx_networking_meetings_event ON public.networking_meetings(event_id);
CREATE INDEX idx_networking_meetings_requester ON public.networking_meetings(requester_id);
CREATE INDEX idx_networking_meetings_receiver ON public.networking_meetings(receiver_id);
CREATE INDEX idx_networking_meetings_status ON public.networking_meetings(status);
CREATE INDEX idx_event_icebreakers_event ON public.event_icebreakers(event_id);
CREATE INDEX idx_event_icebreakers_active ON public.event_icebreakers(event_id, is_active);
CREATE INDEX idx_icebreaker_answers_icebreaker ON public.icebreaker_answers(icebreaker_id);
CREATE INDEX idx_contact_exchanges_event ON public.contact_exchanges(event_id);
CREATE INDEX idx_contact_exchanges_user ON public.contact_exchanges(user_id);

-- Enable RLS
ALTER TABLE public.networking_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_icebreakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icebreaker_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_exchanges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for networking_meetings
CREATE POLICY "Users can view their own meetings"
ON public.networking_meetings FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create meeting requests"
ON public.networking_meetings FOR INSERT
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their own meetings"
ON public.networking_meetings FOR UPDATE
USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own meeting requests"
ON public.networking_meetings FOR DELETE
USING (auth.uid() = requester_id);

-- RLS Policies for event_icebreakers (read-only for attendees)
CREATE POLICY "Attendees can view event icebreakers"
ON public.event_icebreakers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.registrations r
    WHERE r.event_id = event_icebreakers.event_id
    AND r.user_id = auth.uid()
    AND r.status = 'CONFIRMED'
  )
  OR EXISTS (
    SELECT 1 FROM public.event_checkins ec
    WHERE ec.event_id = event_icebreakers.event_id
    AND ec.user_id = auth.uid()
  )
);

-- RLS Policies for icebreaker_answers
CREATE POLICY "Users can view icebreaker answers"
ON public.icebreaker_answers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.event_icebreakers ei
    WHERE ei.id = icebreaker_answers.icebreaker_id
    AND (
      EXISTS (
        SELECT 1 FROM public.registrations r
        WHERE r.event_id = ei.event_id AND r.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.event_checkins ec
        WHERE ec.event_id = ei.event_id AND ec.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can submit their own answers"
ON public.icebreaker_answers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own answers"
ON public.icebreaker_answers FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for contact_exchanges
CREATE POLICY "Users can view their contact exchanges"
ON public.contact_exchanges FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = target_user_id);

CREATE POLICY "Users can create contact exchanges"
ON public.contact_exchanges FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their contact exchanges"
ON public.contact_exchanges FOR DELETE
USING (auth.uid() = user_id);