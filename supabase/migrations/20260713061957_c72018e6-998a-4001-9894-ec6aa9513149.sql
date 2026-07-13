
INSERT INTO public.profiles (id, username, display_name)
SELECT
  u.id,
  -- generate a safe unique username per user
  COALESCE(
    NULLIF(regexp_replace(COALESCE(u.raw_user_meta_data->>'username', ''), '[^a-zA-Z0-9_.-]', '', 'g'), ''),
    NULLIF(regexp_replace(split_part(u.email, '@', 1), '[^a-zA-Z0-9_.-]', '', 'g'), ''),
    'user' || substr(u.id::text, 1, 6)
  ) || CASE WHEN row_number() OVER (
    PARTITION BY lower(COALESCE(
      NULLIF(regexp_replace(COALESCE(u.raw_user_meta_data->>'username', ''), '[^a-zA-Z0-9_.-]', '', 'g'), ''),
      NULLIF(regexp_replace(split_part(u.email, '@', 1), '[^a-zA-Z0-9_.-]', '', 'g'), ''),
      'user' || substr(u.id::text, 1, 6)
    )) ORDER BY u.created_at
  ) > 1 THEN substr(u.id::text, 1, 4) ELSE '' END AS username,
  u.raw_user_meta_data->>'username' AS display_name
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);
