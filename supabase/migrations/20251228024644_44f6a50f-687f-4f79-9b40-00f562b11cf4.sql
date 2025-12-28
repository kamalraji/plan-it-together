-- Ensure organization owners are active members so they can manage events

-- 1) Create trigger to automatically insert membership for new organizations
create trigger handle_new_organization_membership_trigger
after insert on public.organizations
for each row
execute function public.handle_new_organization_membership();

-- 2) Backfill memberships for existing organizations where owner is not yet a member
insert into public.organization_memberships (organization_id, user_id, role, status)
select o.id, o.owner_id, 'OWNER'::organization_membership_role, 'ACTIVE'::organization_membership_status
from public.organizations o
left join public.organization_memberships m
  on m.organization_id = o.id
 and m.user_id = o.owner_id
where m.id is null;