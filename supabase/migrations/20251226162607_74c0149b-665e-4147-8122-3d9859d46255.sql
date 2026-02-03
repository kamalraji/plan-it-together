-- 1) EVENTS TABLE
create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  mode public.event_mode not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  capacity integer,
  visibility public.event_visibility not null default 'PUBLIC',
  status public.event_status not null default 'DRAFT',
  organization_id uuid references public.organizations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.events enable row level security;

-- Anyone can view events
create policy "Public can view events"
  on public.events
  for select
  using (true);

-- Organizers/admins can manage events
create policy "Organizers manage events"
  on public.events
  for all
  using (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    or public.has_role(auth.uid(), 'organizer'::public.app_role)
  )
  with check (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    or public.has_role(auth.uid(), 'organizer'::public.app_role)
  );


-- 2) REGISTRATIONS TABLE
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status public.registration_status not null default 'PENDING',
  form_responses jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

alter table public.registrations enable row level security;

-- Users can view & update their own registrations
create policy "Users manage own registrations select"
  on public.registrations
  for select
  using (user_id = auth.uid());

create policy "Users manage own registrations update"
  on public.registrations
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Organizers/admins can see all registrations
create policy "Organizers view registrations"
  on public.registrations
  for select
  using (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    or public.has_role(auth.uid(), 'organizer'::public.app_role)
  );


-- 3) ATTENDANCE_RECORDS TABLE
create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  registration_id uuid not null references public.registrations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id text,
  check_in_time timestamptz not null default now(),
  check_in_method text not null check (check_in_method in ('QR_SCAN', 'MANUAL')),
  volunteer_id uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index attendance_records_event_reg_idx
  on public.attendance_records (event_id, registration_id);

alter table public.attendance_records enable row level security;

-- Users can see their own attendance
create policy "Users can see own attendance"
  on public.attendance_records
  for select
  using (user_id = auth.uid());

-- Staff can see attendance for all events
create policy "Staff see attendance"
  on public.attendance_records
  for select
  using (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    or public.has_role(auth.uid(), 'organizer'::public.app_role)
    or public.has_role(auth.uid(), 'volunteer'::public.app_role)
  );

-- Only staff can insert attendance
create policy "Staff insert attendance"
  on public.attendance_records
  for insert
  with check (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    or public.has_role(auth.uid(), 'organizer'::public.app_role)
    or public.has_role(auth.uid(), 'volunteer'::public.app_role)
  );


-- 4) USER_PROFILES TABLE WITH USER-SPECIFIC QR CODE
create table public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  organization text,
  qr_code text unique not null,
  created_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

-- Users can view & update their own profile
create policy "Users manage own profile select"
  on public.user_profiles
  for select
  using (id = auth.uid());

create policy "Users manage own profile update"
  on public.user_profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Staff can read profiles for check-in
create policy "Staff read profiles"
  on public.user_profiles
  for select
  using (
    id = auth.uid()
    or public.has_role(auth.uid(), 'admin'::public.app_role)
    or public.has_role(auth.uid(), 'organizer'::public.app_role)
    or public.has_role(auth.uid(), 'volunteer'::public.app_role)
  );


-- 5) TRIGGER TO AUTO-CREATE USER_PROFILE WITH QR CODE ON SIGNUP
create or replace function public.handle_new_user_with_qr()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profiles (id, full_name, qr_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    encode(gen_random_bytes(16), 'hex')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_with_qr on auth.users;

create trigger on_auth_user_created_with_qr
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user_with_qr();


-- 6) ENABLE REALTIME FOR ATTENDANCE_RECORDS
alter table public.attendance_records replica identity full;

alter publication supabase_realtime add table public.attendance_records;