-- Create event_waitlist table for managing waitlist entries
CREATE TABLE public.event_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_tier_id UUID REFERENCES public.ticket_tiers(id) ON DELETE SET NULL,
  
  -- Attendee Info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Queue Management
  position INTEGER NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'vip')),
  
  -- Metadata
  source TEXT NOT NULL DEFAULT 'website' CHECK (source IN ('website', 'referral', 'manual')),
  notes TEXT,
  referred_by TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'invited', 'promoted', 'expired', 'removed')),
  invited_at TIMESTAMPTZ,
  promoted_at TIMESTAMPTZ,
  registration_id UUID REFERENCES public.registrations(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_waitlist_event_position ON public.event_waitlist(event_id, position) WHERE status = 'waiting';
CREATE INDEX idx_waitlist_event_status ON public.event_waitlist(event_id, status);
CREATE INDEX idx_waitlist_email ON public.event_waitlist(email);

-- Enable RLS
ALTER TABLE public.event_waitlist ENABLE ROW LEVEL SECURITY;

-- Workspace team members can manage waitlist
CREATE POLICY "Workspace team can manage waitlist"
  ON public.event_waitlist FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      JOIN public.workspaces w ON w.id = wtm.workspace_id
      WHERE w.event_id = event_waitlist.event_id
      AND wtm.user_id = auth.uid()
    )
  );

-- Event organizers can manage
CREATE POLICY "Event organizers can manage waitlist"
  ON public.event_waitlist FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.organizations o ON o.id = e.organization_id
      WHERE e.id = event_waitlist.event_id
      AND o.owner_id = auth.uid()
    )
  );

-- Function to swap positions atomically
CREATE OR REPLACE FUNCTION public.reorder_waitlist_positions(
  p_event_id UUID,
  p_entry_id UUID,
  p_new_position INTEGER
) RETURNS VOID AS $$
DECLARE
  v_old_position INTEGER;
BEGIN
  -- Get current position
  SELECT position INTO v_old_position
  FROM public.event_waitlist
  WHERE id = p_entry_id AND status = 'waiting';
  
  IF v_old_position IS NULL THEN
    RAISE EXCEPTION 'Entry not found';
  END IF;
  
  -- Shift other entries
  IF p_new_position < v_old_position THEN
    UPDATE public.event_waitlist
    SET position = position + 1, updated_at = NOW()
    WHERE event_id = p_event_id
      AND status = 'waiting'
      AND position >= p_new_position
      AND position < v_old_position;
  ELSE
    UPDATE public.event_waitlist
    SET position = position - 1, updated_at = NOW()
    WHERE event_id = p_event_id
      AND status = 'waiting'
      AND position > v_old_position
      AND position <= p_new_position;
  END IF;
  
  -- Update the moved entry
  UPDATE public.event_waitlist
  SET position = p_new_position, updated_at = NOW()
  WHERE id = p_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updated_at
CREATE TRIGGER update_event_waitlist_updated_at
  BEFORE UPDATE ON public.event_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();