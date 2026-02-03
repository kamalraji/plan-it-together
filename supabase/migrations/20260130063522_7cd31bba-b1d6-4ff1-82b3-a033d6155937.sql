-- Create or replace the function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_with_qr()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, avatar_url, qr_code)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'user_name',
      new.email
    ),
    COALESCE(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    ),
    md5(random()::text)
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(user_profiles.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(user_profiles.avatar_url, EXCLUDED.avatar_url);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_qr();