-- Create id_card_print_jobs table for tracking batch print jobs
CREATE TABLE public.id_card_print_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.id_card_templates(id) ON DELETE CASCADE,
  
  -- Job details
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attendee_filter JSONB,
  attendee_ids UUID[],
  
  -- Results
  total_cards INTEGER DEFAULT 0,
  generated_cards INTEGER DEFAULT 0,
  pdf_url TEXT,
  error_message TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.id_card_print_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Workspace team can view print jobs"
  ON public.id_card_print_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = id_card_print_jobs.workspace_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace team can create print jobs"
  ON public.id_card_print_jobs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = id_card_print_jobs.workspace_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace team can update print jobs"
  ON public.id_card_print_jobs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = id_card_print_jobs.workspace_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace team can delete print jobs"
  ON public.id_card_print_jobs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = id_card_print_jobs.workspace_id
      AND wtm.user_id = auth.uid()
    )
  );

-- Index for faster queries
CREATE INDEX idx_id_card_print_jobs_workspace ON public.id_card_print_jobs(workspace_id);
CREATE INDEX idx_id_card_print_jobs_event ON public.id_card_print_jobs(event_id);
CREATE INDEX idx_id_card_print_jobs_status ON public.id_card_print_jobs(status);