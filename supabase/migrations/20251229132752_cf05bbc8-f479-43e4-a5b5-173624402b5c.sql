-- Create tables for organization testimonials and sponsors
CREATE TABLE IF NOT EXISTS public.organization_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  author_name text NOT NULL,
  author_role text,
  quote text NOT NULL,
  highlight boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  position integer,
  CONSTRAINT organization_testimonials_organization_fk
    FOREIGN KEY (organization_id)
    REFERENCES public.organizations(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.organization_sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  logo_url text,
  website_url text,
  tier text,
  created_at timestamptz NOT NULL DEFAULT now(),
  position integer,
  CONSTRAINT organization_sponsors_organization_fk
    FOREIGN KEY (organization_id)
    REFERENCES public.organizations(id)
    ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.organization_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_sponsors ENABLE ROW LEVEL SECURITY;

-- RLS policies for organization_testimonials
CREATE POLICY "Org admins manage testimonials"
ON public.organization_testimonials
FOR ALL
USING (
  is_org_admin_for_org(organization_id, auth.uid())
)
WITH CHECK (
  is_org_admin_for_org(organization_id, auth.uid())
);

CREATE POLICY "Public read testimonials"
ON public.organization_testimonials
FOR SELECT
USING (true);

-- RLS policies for organization_sponsors
CREATE POLICY "Org admins manage sponsors"
ON public.organization_sponsors
FOR ALL
USING (
  is_org_admin_for_org(organization_id, auth.uid())
)
WITH CHECK (
  is_org_admin_for_org(organization_id, auth.uid())
);

CREATE POLICY "Public read sponsors"
ON public.organization_sponsors
FOR SELECT
USING (true);