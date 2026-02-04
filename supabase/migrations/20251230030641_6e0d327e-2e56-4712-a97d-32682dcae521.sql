-- 1) Create organization_products table
create table if not exists public.organization_products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  description text,
  category text,
  price text,
  link_url text,
  tags text[] default '{}',
  status text not null default 'ACTIVE',
  position integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Add foreign key to organizations
alter table public.organization_products
  add constraint organization_products_org_fk
  foreign key (organization_id)
  references public.organizations (id)
  on delete cascade;

-- 3) Updated_at trigger function
create or replace function public.set_organization_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 4) Trigger for updated_at
create trigger set_organization_products_updated_at
before update on public.organization_products
for each row execute function public.set_organization_products_updated_at();

-- 5) Enable RLS
alter table public.organization_products enable row level security;

-- 6) RLS policies
-- Public can read active products
create policy "Public read active organization products"
  on public.organization_products
  for select
  using (status = 'ACTIVE');

-- Org admins can read all products for their org
create policy "Org admins read all organization products"
  on public.organization_products
  for select
  using (is_org_admin_for_org(organization_id, auth.uid()));

-- Org admins manage products (insert/update/delete)
create policy "Org admins manage organization products"
  on public.organization_products
  for all
  using (is_org_admin_for_org(organization_id, auth.uid()))
  with check (is_org_admin_for_org(organization_id, auth.uid()));

-- 7) Helpful index
create index if not exists organization_products_org_status_position_idx
  on public.organization_products (organization_id, status, position);
