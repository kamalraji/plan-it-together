-- Drop overly permissive SELECT policies on organizations
DROP POLICY IF EXISTS "Organizations are viewable - owner_id only for authenticated" ON public.organizations;
DROP POLICY IF EXISTS "Public can view organizations" ON public.organizations;

-- Create properly scoped RLS policies for organizations

-- 1. Organization members can view full organization details (including owner_id for management)
CREATE POLICY "Org members view full organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_memberships om
    WHERE om.organization_id = organizations.id
    AND om.user_id = auth.uid()
    AND om.status = 'ACTIVE'
  )
);

-- 2. Event owners can view organizations linked to their events
CREATE POLICY "Event owners view related organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.organization_id = organizations.id
    AND e.owner_id = auth.uid()
  )
);

-- 3. Platform admins can view all organizations
CREATE POLICY "Admins view all organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);

-- Note: Anonymous/public users should use get_public_organization(_slug) function
-- which already returns only safe fields (no owner_id, no email, no phone)

-- Update the get_public_organization function to also exclude sensitive contact info
CREATE OR REPLACE FUNCTION public.get_public_organization(_slug text)
RETURNS TABLE(
  id uuid, 
  name text, 
  slug text, 
  description text, 
  logo_url text, 
  banner_url text,
  primary_color text, 
  secondary_color text, 
  website text, 
  category text,
  city text, 
  state text, 
  country text, 
  verification_status text,
  seo_title text, 
  seo_description text, 
  seo_image_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.id, o.name, o.slug, o.description, o.logo_url, o.banner_url,
    o.primary_color, o.secondary_color, o.website, o.category,
    o.city, o.state, o.country, o.verification_status,
    o.seo_title, o.seo_description, o.seo_image_url
  FROM public.organizations o
  WHERE o.slug = _slug;
$$;

-- Create a new function for public organization listing (for marketplace/discovery)
CREATE OR REPLACE FUNCTION public.get_public_organizations_list()
RETURNS TABLE(
  id uuid, 
  name text, 
  slug text, 
  description text, 
  logo_url text,
  category text,
  city text, 
  state text, 
  country text, 
  verification_status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.id, o.name, o.slug, o.description, o.logo_url,
    o.category, o.city, o.state, o.country, o.verification_status
  FROM public.organizations o
  WHERE o.verification_status = 'VERIFIED'
  ORDER BY o.name;
$$;