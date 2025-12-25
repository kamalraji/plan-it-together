-- 1) Create enums for workspace and booking status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workspace_status') THEN
    CREATE TYPE public.workspace_status AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE public.booking_status AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
  END IF;
END $$;

-- 2) Workspaces table: one workspace per event (for now), owned by organizer
CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL,
  name text NOT NULL,
  status public.workspace_status NOT NULL DEFAULT 'ACTIVE',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Services table: marketplace services offered by organizers (optionally tied to a workspace)
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  category text,
  base_price numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Bookings table: marketplace bookings for services, used for activity & revenue metrics
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  organizer_id uuid NOT NULL,
  buyer_id uuid,
  status public.booking_status NOT NULL DEFAULT 'PENDING',
  amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5) Enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 6) RLS policies
-- Workspaces: organizers can manage their own workspaces
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'workspaces' AND policyname = 'organizer_manage_own_workspaces'
  ) THEN
    CREATE POLICY organizer_manage_own_workspaces
    ON public.workspaces
    USING (auth.uid() = organizer_id)
    WITH CHECK (auth.uid() = organizer_id);
  END IF;
END $$;

-- Services: organizers manage their own services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'services' AND policyname = 'organizer_manage_own_services'
  ) THEN
    CREATE POLICY organizer_manage_own_services
    ON public.services
    USING (auth.uid() = organizer_id)
    WITH CHECK (auth.uid() = organizer_id);
  END IF;
END $$;

-- Bookings: organizers manage, buyers can view/manage their own
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookings' AND policyname = 'organizer_manage_own_bookings'
  ) THEN
    CREATE POLICY organizer_manage_own_bookings
    ON public.bookings
    USING (auth.uid() = organizer_id)
    WITH CHECK (auth.uid() = organizer_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookings' AND policyname = 'buyer_manage_own_bookings'
  ) THEN
    CREATE POLICY buyer_manage_own_bookings
    ON public.bookings
    USING (auth.uid() = buyer_id)
    WITH CHECK (auth.uid() = buyer_id);
  END IF;
END $$;

-- 7) Attach updated_at trigger to new tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_workspaces'
  ) THEN
    CREATE TRIGGER set_updated_at_workspaces
    BEFORE UPDATE ON public.workspaces
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_services'
  ) THEN
    CREATE TRIGGER set_updated_at_services
    BEFORE UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_bookings'
  ) THEN
    CREATE TRIGGER set_updated_at_bookings
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;