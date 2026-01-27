ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS gov_registration_id text,
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'UNVERIFIED',
  ADD COLUMN IF NOT EXISTS verification_source text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS city text;