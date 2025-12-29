-- Create enums for the application
CREATE TYPE public.user_role AS ENUM ('SUPER_ADMIN', 'ORGANIZER', 'PARTICIPANT', 'JUDGE', 'VOLUNTEER', 'SPEAKER');
CREATE TYPE public.user_status AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');
CREATE TYPE public.event_mode AS ENUM ('OFFLINE', 'ONLINE', 'HYBRID');
CREATE TYPE public.event_status AS ENUM ('DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED');
CREATE TYPE public.event_visibility AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED');
CREATE TYPE public.registration_status AS ENUM ('PENDING', 'CONFIRMED', 'WAITLISTED', 'CANCELLED');
CREATE TYPE public.organization_category AS ENUM ('COLLEGE', 'COMPANY', 'INDUSTRY', 'NON_PROFIT');
CREATE TYPE public.verification_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  status public.user_status DEFAULT 'PENDING',
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table for RBAC (separate from profiles to prevent privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category public.organization_category NOT NULL,
  verification_status public.verification_status DEFAULT 'PENDING',
  branding JSONB DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  page_url TEXT UNIQUE,
  follower_count INTEGER DEFAULT 0,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create organization_admins table
CREATE TABLE public.organization_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'ADMIN',
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  mode public.event_mode NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  capacity INTEGER,
  registration_deadline TIMESTAMPTZ,
  organizer_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  visibility public.event_visibility DEFAULT 'PUBLIC',
  branding JSONB DEFAULT '{}',
  venue JSONB,
  virtual_links JSONB,
  status public.event_status DEFAULT 'DRAFT',
  landing_page_url TEXT UNIQUE,
  invite_link TEXT UNIQUE,
  leaderboard_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create follows table (users following organizations)
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  followed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, organization_id)
);

-- Create registrations table
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.registration_status DEFAULT 'PENDING',
  metadata JSONB DEFAULT '{}',
  qr_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles (only admins can manage roles)
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for organizations
CREATE POLICY "Anyone can view verified organizations" ON public.organizations
  FOR SELECT TO authenticated USING (verification_status = 'VERIFIED' OR verification_status = 'PENDING');

CREATE POLICY "Org admins can update their organization" ON public.organizations
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.organization_admins
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create organizations" ON public.organizations
  FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for organization_admins
CREATE POLICY "Users can view org admins of their orgs" ON public.organization_admins
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.organization_admins oa
      WHERE oa.organization_id = organization_admins.organization_id
      AND oa.user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can manage org admins" ON public.organization_admins
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.organization_admins oa
      WHERE oa.organization_id = organization_admins.organization_id
      AND oa.user_id = auth.uid()
      AND oa.role = 'OWNER'
    )
  );

-- RLS Policies for events
CREATE POLICY "Anyone can view public events" ON public.events
  FOR SELECT TO authenticated USING (
    visibility = 'PUBLIC' OR 
    organizer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.organization_admins
      WHERE organization_id = events.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can create events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their events" ON public.events
  FOR UPDATE TO authenticated USING (
    organizer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.organization_admins
      WHERE organization_id = events.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can delete their events" ON public.events
  FOR DELETE TO authenticated USING (organizer_id = auth.uid());

-- RLS Policies for follows
CREATE POLICY "Users can view their follows" ON public.follows
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can follow organizations" ON public.follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow organizations" ON public.follows
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- RLS Policies for registrations
CREATE POLICY "Users can view their registrations" ON public.registrations
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = registrations.event_id
      AND events.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Users can register for events" ON public.registrations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their registrations" ON public.registrations
  FOR UPDATE TO authenticated USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = registrations.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at
  BEFORE UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_events_organizer ON public.events(organizer_id);
CREATE INDEX idx_events_organization ON public.events(organization_id);
CREATE INDEX idx_events_visibility ON public.events(visibility);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_registrations_event ON public.registrations(event_id);
CREATE INDEX idx_registrations_user ON public.registrations(user_id);
CREATE INDEX idx_registrations_status ON public.registrations(status);
CREATE INDEX idx_follows_user ON public.follows(user_id);
CREATE INDEX idx_follows_org ON public.follows(organization_id);
CREATE INDEX idx_org_admins_org ON public.organization_admins(organization_id);
CREATE INDEX idx_org_admins_user ON public.organization_admins(user_id);