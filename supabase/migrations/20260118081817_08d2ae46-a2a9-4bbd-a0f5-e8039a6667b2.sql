-- Create workspace_runsheet_cues table for technical runsheet management
CREATE TABLE workspace_runsheet_cues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  
  -- Timing
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 5,
  
  -- Cue details
  title TEXT NOT NULL,
  description TEXT,
  cue_type TEXT DEFAULT 'general' CHECK (cue_type IN ('audio', 'visual', 'lighting', 'stage', 'general')),
  
  -- Assignment
  technician_id UUID,
  
  -- Status
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'delayed', 'skipped')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  
  -- Ordering
  order_index INTEGER DEFAULT 0,
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_runsheet_cues_workspace ON workspace_runsheet_cues(workspace_id);
CREATE INDEX idx_runsheet_cues_event ON workspace_runsheet_cues(event_id);
CREATE INDEX idx_runsheet_cues_status ON workspace_runsheet_cues(status);
CREATE INDEX idx_runsheet_cues_scheduled ON workspace_runsheet_cues(scheduled_time);

-- Enable RLS
ALTER TABLE workspace_runsheet_cues ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Workspace team can view runsheet cues"
  ON workspace_runsheet_cues FOR SELECT
  USING (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Workspace team can insert runsheet cues"
  ON workspace_runsheet_cues FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Workspace team can update runsheet cues"
  ON workspace_runsheet_cues FOR UPDATE
  USING (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Workspace team can delete runsheet cues"
  ON workspace_runsheet_cues FOR DELETE
  USING (public.has_workspace_access(workspace_id, auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER set_runsheet_cues_updated_at
  BEFORE UPDATE ON workspace_runsheet_cues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();