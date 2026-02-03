-- Assign roles based on desiredRole at signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If user explicitly requested ORGANIZER during signup
  IF NEW.raw_user_meta_data->>'desiredRole' = 'ORGANIZER' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'organizer')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Default to PARTICIPANT role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'participant')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on auth.users to run after user creation
DROP TRIGGER IF EXISTS on_auth_user_role_assignment ON auth.users;

CREATE TRIGGER on_auth_user_role_assignment
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role_assignment();