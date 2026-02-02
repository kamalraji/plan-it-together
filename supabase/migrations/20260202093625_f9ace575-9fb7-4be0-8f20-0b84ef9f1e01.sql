-- Training Modules table
CREATE TABLE IF NOT EXISTS public.training_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  duration_minutes INTEGER DEFAULT 30,
  content_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;

-- RLS policies for training_modules (use IF NOT EXISTS pattern via DO block)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'training_modules' AND policyname = 'Team members can view training modules'
  ) THEN
    CREATE POLICY "Team members can view training modules" 
    ON public.training_modules 
    FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM workspace_team_members 
        WHERE workspace_team_members.workspace_id = training_modules.workspace_id
        AND workspace_team_members.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'training_modules' AND policyname = 'Workspace admins can manage training modules'
  ) THEN
    CREATE POLICY "Workspace admins can manage training modules" 
    ON public.training_modules 
    FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM workspace_team_members 
        WHERE workspace_team_members.workspace_id = training_modules.workspace_id
        AND workspace_team_members.user_id = auth.uid()
        AND workspace_team_members.role IN ('owner', 'admin', 'lead')
      )
    );
  END IF;
END $$;

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_training_modules_workspace ON public.training_modules(workspace_id);

-- Add update trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_training_modules_updated_at'
  ) THEN
    CREATE TRIGGER update_training_modules_updated_at
    BEFORE UPDATE ON public.training_modules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;