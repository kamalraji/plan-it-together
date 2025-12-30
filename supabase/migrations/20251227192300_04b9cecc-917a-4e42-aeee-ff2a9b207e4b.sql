-- 1) Enums for organization membership
create type public.organization_membership_role as enum (
  'OWNER',
  'ADMIN',
  'ORGANIZER',
  'VIEWER'
);

create type public.organization_membership_status as enum (
  'PENDING',
  'ACTIVE',
  'REJECTED',
  'REMOVED'
);

-- 2) organization_memberships table
create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null,
  role public.organization_membership_role not null default 'ORGANIZER',
  status public.organization_membership_status not null default 'PENDING',
  invited_by uuid null,
  approved_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organization_memberships enable row level security;

-- 3) updated_at trigger for organization_memberships
create or replace function public.set_organization_memberships_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_organization_memberships_updated_at
before update on public.organization_memberships
for each row execute procedure public.set_organization_memberships_updated_at();

-- 4) Seed existing organization owners as active OWNER members (idempotent)
insert into public.organization_memberships (organization_id, user_id, role, status)
select o.id, o.owner_id, 'OWNER', 'ACTIVE'
from public.organizations o
left join public.organization_memberships m
  on m.organization_id = o.id
 and m.user_id = o.owner_id
 and m.status = 'ACTIVE'
where m.id is null;

-- 5) Automatically create OWNER membership for newly created organizations
create or replace function public.handle_new_organization_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Ensure the creator (owner_id) is an ACTIVE OWNER member of the new organization
  insert into public.organization_memberships (organization_id, user_id, role, status)
  values (new.id, new.owner_id, 'OWNER', 'ACTIVE')
  on conflict (organization_id, user_id) where status in ('PENDING', 'ACTIVE') do update
    set role = excluded.role,
        status = excluded.status;

  return new;
end;
$$;

create trigger handle_new_organization_membership
after insert on public.organizations
for each row execute function public.handle_new_organization_membership();

-- 6) RLS policies for organization_memberships

-- Users see their own memberships
create policy "Users view their memberships"
  on public.organization_memberships
  as restrictive
  for select
  to authenticated
  using (user_id = auth.uid());

-- Org admins (OWNER/ADMIN) see all memberships for their org
create policy "Org admins view org memberships"
  on public.organization_memberships
  as restrictive
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_memberships m2
      where m2.organization_id = organization_memberships.organization_id
        and m2.user_id = auth.uid()
        and m2.status = 'ACTIVE'
        and m2.role in ('OWNER', 'ADMIN')
    )
  );

-- Users can request to join an organization (PENDING membership for self)
create policy "Users request org membership"
  on public.organization_memberships
  as restrictive
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'PENDING'
  );

-- Org admins can manage memberships (approve/reject/change role)
create policy "Org admins manage memberships"
  on public.organization_memberships
  as restrictive
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.organization_memberships m2
      where m2.organization_id = organization_memberships.organization_id
        and m2.user_id = auth.uid()
        and m2.status = 'ACTIVE'
        and m2.role in ('OWNER', 'ADMIN')
    )
  )
  with check (
    exists (
      select 1
      from public.organization_memberships m2
      where m2.organization_id = organization_memberships.organization_id
        and m2.user_id = auth.uid()
        and m2.status = 'ACTIVE'
        and m2.role in ('OWNER', 'ADMIN')
    )
  );

-- 7) Tighten events RLS to require active org membership for management

-- Replace existing organizer policy with membership-based one
drop policy if exists "Organizers manage events" on public.events;

create policy "Org members manage org events"
  on public.events
  as restrictive
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = events.organization_id
        and m.user_id = auth.uid()
        and m.status = 'ACTIVE'
        and m.role in ('OWNER', 'ADMIN', 'ORGANIZER')
    )
  )
  with check (
    exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = events.organization_id
        and m.user_id = auth.uid()
        and m.status = 'ACTIVE'
        and m.role in ('OWNER', 'ADMIN', 'ORGANIZER')
    )
  );