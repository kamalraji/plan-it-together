-- Extend app_role enum to support all roles used by edge functions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'organizer'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'organizer';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'participant'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'participant';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'judge'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'judge';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'volunteer'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'volunteer';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'speaker'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'speaker';
  END IF;
END $$;

-- Organizations table used by create-organization edge function
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL,
  description text,
  website text,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'organizations' 
      AND policyname = 'Public can view organizations'
  ) THEN
    CREATE POLICY "Public can view organizations"
      ON public.organizations
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'organizations' 
      AND policyname = 'Users can insert their own organizations'
  ) THEN
    CREATE POLICY "Users can insert their own organizations"
      ON public.organizations
      FOR INSERT
      WITH CHECK (owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'organizations' 
      AND policyname = 'Owners can update their organizations'
  ) THEN
    CREATE POLICY "Owners can update their organizations"
      ON public.organizations
      FOR UPDATE
      USING (owner_id = auth.uid())
      WITH CHECK (owner_id = auth.uid());
  END IF;
END $$;

-- Onboarding checklist table used by pending-organizers edge function
CREATE TABLE IF NOT EXISTS public.onboarding_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid,
  completed_at timestamptz
);

ALTER TABLE public.onboarding_checklist ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'onboarding_checklist' 
      AND policyname = 'Users can manage their own onboarding checklist'
  ) THEN
    CREATE POLICY "Users can manage their own onboarding checklist"
      ON public.onboarding_checklist
      FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Organizer approvals table used by approve-organizer edge function
CREATE TABLE IF NOT EXISTS public.organizer_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  approved_by uuid NOT NULL,
  organization_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organizer_approvals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'organizer_approvals' 
      AND policyname = 'Admins can view organizer approvals'
  ) THEN
    CREATE POLICY "Admins can view organizer approvals"
      ON public.organizer_approvals
      FOR SELECT
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'organizer_approvals' 
      AND policyname = 'Admins can insert organizer approvals'
  ) THEN
    CREATE POLICY "Admins can insert organizer approvals"
      ON public.organizer_approvals
      FOR INSERT
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;