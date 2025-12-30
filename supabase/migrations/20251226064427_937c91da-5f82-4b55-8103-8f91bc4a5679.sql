ALTER TABLE public.onboarding_checklist
  ADD CONSTRAINT onboarding_checklist_user_org_item_unique
  UNIQUE (user_id, organization_id, item_id);