-- Update the trigger function to auto-assign organizer role on signup
-- No approval workflow needed - organizers are auto-approved
CREATE OR REPLACE FUNCTION public.handle_new_user_role_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If user explicitly requested ORGANIZER during signup, grant it immediately
  IF NEW.raw_user_meta_data->>'desiredRole' = 'ORGANIZER' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'organizer')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Always assign participant role as base role for all users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'participant')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;