CREATE OR REPLACE FUNCTION public.handle_new_user_with_qr()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- Generate a deterministic-length hex string for the QR code without relying on pgcrypto
  -- to avoid gen_random_bytes() extension issues.
  insert into public.user_profiles (id, full_name, qr_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    md5(random()::text || clock_timestamp()::text)
  )
  on conflict (id) do nothing;

  return new;
end;
$function$;
