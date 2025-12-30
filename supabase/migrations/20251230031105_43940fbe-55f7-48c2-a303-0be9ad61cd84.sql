-- Add featured & metrics columns to organization_products
alter table public.organization_products
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_position integer,
  add column if not exists click_count bigint not null default 0,
  add column if not exists impression_count bigint not null default 0;

-- Function to record product metrics
create or replace function public.record_organization_product_metrics(
  _product_ids uuid[],
  _event_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if _event_type = 'impression' then
    update public.organization_products
    set impression_count = impression_count + 1
    where id = any(_product_ids);
  elsif _event_type = 'click' then
    update public.organization_products
    set click_count = click_count + 1
    where id = any(_product_ids);
  end if;
end;
$$;