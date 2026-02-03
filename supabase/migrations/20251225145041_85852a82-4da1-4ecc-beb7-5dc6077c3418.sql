-- Create organization category enum
CREATE TYPE organization_category AS ENUM ('COLLEGE', 'COMPANY', 'INDUSTRY', 'NON_PROFIT');

-- Create verification status enum
CREATE TYPE verification_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category organization_category NOT NULL,
  verification_status verification_status NOT NULL DEFAULT 'PENDING',
  verification_reason TEXT,
  logo_url TEXT,
  banner_url TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  location JSONB,
  social_links JSONB DEFAULT '{}'::jsonb,
  follower_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create organization_admins table (junction table for many-to-many)
CREATE TABLE public.organization_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'ADMIN',
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Create follows table
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Add organization_id to events table
ALTER TABLE public.events 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Create updated_at trigger for organizations
CREATE TRIGGER set_updated_at_organizations
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Create indexes for performance
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_category ON public.organizations(category);
CREATE INDEX idx_organizations_verification_status ON public.organizations(verification_status);
CREATE INDEX idx_organization_admins_org ON public.organization_admins(organization_id);
CREATE INDEX idx_organization_admins_user ON public.organization_admins(user_id);
CREATE INDEX idx_follows_user ON public.follows(user_id);
CREATE INDEX idx_follows_org ON public.follows(organization_id);
CREATE INDEX idx_events_organization ON public.events(organization_id);

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations table

-- Everyone can view verified organizations
CREATE POLICY "public_view_verified_organizations"
  ON public.organizations
  FOR SELECT
  USING (verification_status = 'VERIFIED');

-- Organization admins can view their own organizations
CREATE POLICY "admins_view_own_organizations"
  ON public.organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_admins
      WHERE organization_admins.organization_id = organizations.id
      AND organization_admins.user_id = auth.uid()
    )
  );

-- Organization admins can update their own organizations
CREATE POLICY "admins_update_own_organizations"
  ON public.organizations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_admins
      WHERE organization_admins.organization_id = organizations.id
      AND organization_admins.user_id = auth.uid()
    )
  );

-- Authenticated users can create organizations
CREATE POLICY "authenticated_create_organizations"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for organization_admins table

-- Organization admins can view their team
CREATE POLICY "admins_view_own_team"
  ON public.organization_admins
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_admins AS oa
      WHERE oa.organization_id = organization_admins.organization_id
      AND oa.user_id = auth.uid()
    )
  );

-- Organization admins can add new admins
CREATE POLICY "admins_add_team_members"
  ON public.organization_admins
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_admins AS oa
      WHERE oa.organization_id = organization_admins.organization_id
      AND oa.user_id = auth.uid()
    )
  );

-- Organization admins can remove team members
CREATE POLICY "admins_remove_team_members"
  ON public.organization_admins
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_admins AS oa
      WHERE oa.organization_id = organization_admins.organization_id
      AND oa.user_id = auth.uid()
    )
  );

-- RLS Policies for follows table

-- Users can view their own follows
CREATE POLICY "users_view_own_follows"
  ON public.follows
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can follow organizations
CREATE POLICY "users_create_follows"
  ON public.follows
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can unfollow organizations
CREATE POLICY "users_delete_own_follows"
  ON public.follows
  FOR DELETE
  USING (user_id = auth.uid());

-- Organization admins can view their followers
CREATE POLICY "admins_view_followers"
  ON public.follows
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_admins
      WHERE organization_admins.organization_id = follows.organization_id
      AND organization_admins.user_id = auth.uid()
    )
  );

-- Function to increment follower count
CREATE OR REPLACE FUNCTION public.increment_follower_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.organizations
  SET follower_count = follower_count + 1
  WHERE id = NEW.organization_id;
  RETURN NEW;
END;
$$;

-- Function to decrement follower count
CREATE OR REPLACE FUNCTION public.decrement_follower_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.organizations
  SET follower_count = follower_count - 1
  WHERE id = OLD.organization_id;
  RETURN OLD;
END;
$$;

-- Triggers for follower count
CREATE TRIGGER follows_insert_trigger
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_follower_count();

CREATE TRIGGER follows_delete_trigger
  AFTER DELETE ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_follower_count();

-- Function to auto-add creator as admin
CREATE OR REPLACE FUNCTION public.add_organization_creator_as_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.organization_admins (organization_id, user_id, role)
  VALUES (NEW.id, auth.uid(), 'OWNER');
  RETURN NEW;
END;
$$;

-- Trigger to auto-add creator as admin
CREATE TRIGGER organization_created_trigger
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.add_organization_creator_as_admin();