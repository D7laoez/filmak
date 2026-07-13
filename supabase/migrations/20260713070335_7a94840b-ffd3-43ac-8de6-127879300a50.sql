CREATE OR REPLACE FUNCTION public.resolve_login_email(_identifier text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT CASE
    WHEN position('@' in btrim(_identifier)) > 0 THEN btrim(_identifier)
    ELSE (
      SELECT au.email
      FROM public.profiles p
      JOIN auth.users au ON au.id = p.id
      WHERE lower(p.username) = lower(btrim(_identifier))
        AND length(btrim(_identifier)) BETWEEN 2 AND 120
      LIMIT 1
    )
  END
$$;

REVOKE ALL ON FUNCTION public.resolve_login_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_login_email(text) TO anon, authenticated;