-- Allow app admins to manage all events regardless of organization membership

create policy "Admins manage all events"
  on public.events
  for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));