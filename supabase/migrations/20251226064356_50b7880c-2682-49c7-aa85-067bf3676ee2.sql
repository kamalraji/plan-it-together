-- Create table to store onboarding checklist completion per user & organization
CREATE TABLE IF NOT EXISTS public.onboarding_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid NULL,
  item_id text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now()
);

-- Basic index for lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_checklist_user_org
  ON public.onboarding_checklist (user_id, organization_id);

ALTER TABLE public.onboarding_checklist ENABLE ROW LEVEL SECURITY;

-- Users can see their own checklist items
CREATE POLICY "Users can view their own checklist items"
  ON public.onboarding_checklist
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own checklist items
CREATE POLICY "Users can create their own checklist items"
  ON public.onboarding_checklist
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own checklist items
CREATE POLICY "Users can update their own checklist items"
  ON public.onboarding_checklist
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own checklist items (e.g., to reset onboarding)
CREATE POLICY "Users can delete their own checklist items"
  ON public.onboarding_checklist
  FOR DELETE
  USING (auth.uid() = user_id);