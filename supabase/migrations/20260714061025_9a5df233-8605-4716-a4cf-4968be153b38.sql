REVOKE EXECUTE ON FUNCTION public.email_exists(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_email_by_username(text) FROM anon, authenticated, PUBLIC;