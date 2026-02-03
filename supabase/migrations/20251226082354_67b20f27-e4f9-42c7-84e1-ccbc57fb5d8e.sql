-- Organizations table for Cloud-backed organizer onboarding
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL,
  description text NULL,
  website text NULL,
  email text NULL,
  phone text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Basic RLS: owners can manage their own organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their organizations"
ON public.organizations
FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert their organizations"
ON public.organizations
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their organizations"
ON public.organizations
FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their organizations"
ON public.organizations
FOR DELETE
USING (auth.uid() = owner_id);

-- Keep updated_at in sync
CREATE OR REPLACE FUNCTION public.set_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS organizations_set_updated_at ON public.organizations;
CREATE TRIGGER organizations_set_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.set_organizations_updated_at();
