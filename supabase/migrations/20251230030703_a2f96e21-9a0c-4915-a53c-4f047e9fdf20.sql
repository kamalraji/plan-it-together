-- Harden function search_path for organization products updated_at trigger
create or replace function public.set_organization_products_updated_at()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;