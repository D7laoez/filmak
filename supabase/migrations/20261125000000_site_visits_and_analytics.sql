-- Idempotent migration for real site visit tracking & admin analytics RPC
CREATE TABLE IF NOT EXISTS public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  path text NOT NULL,
  referrer text,
  ip_address text,
  country text,
  city text,
  user_agent text,
  device_type text,
  browser text,
  os text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON public.site_visits (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_visits_path ON public.site_visits (path);
CREATE INDEX IF NOT EXISTS idx_site_visits_session_id ON public.site_visits (session_id);

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'site_visits' AND policyname = 'Admins can read site_visits'
  ) THEN
    CREATE POLICY "Admins can read site_visits"
      ON public.site_visits
      FOR SELECT
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.admin_site_analytics(days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days integer := GREATEST(1, LEAST(COALESCE(days, 30), 365));
  v_since timestamptz := now() - make_interval(days => v_days);
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_visits', (SELECT count(*)::integer FROM public.site_visits WHERE created_at >= v_since),
    'unique_sessions', (SELECT count(DISTINCT session_id)::integer FROM public.site_visits WHERE created_at >= v_since),
    'unique_ips', (SELECT count(DISTINCT ip_address)::integer FROM public.site_visits WHERE created_at >= v_since AND ip_address IS NOT NULL),
    'logged_in_visits', (SELECT count(*)::integer FROM public.site_visits WHERE created_at >= v_since AND user_id IS NOT NULL),
    'top_paths', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT path, count(*)::integer AS visits
        FROM public.site_visits
        WHERE created_at >= v_since
        GROUP BY path
        ORDER BY visits DESC
        LIMIT 15
      ) t
    ), '[]'::jsonb),
    'top_ips', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT ip_address AS ip, count(*)::integer AS visits, max(created_at) AS last_seen
        FROM public.site_visits
        WHERE created_at >= v_since AND ip_address IS NOT NULL
        GROUP BY ip_address
        ORDER BY visits DESC
        LIMIT 15
      ) t
    ), '[]'::jsonb),
    'countries', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT COALESCE(country, 'Unknown') AS country, count(*)::integer AS visits
        FROM public.site_visits
        WHERE created_at >= v_since
        GROUP BY COALESCE(country, 'Unknown')
        ORDER BY visits DESC
        LIMIT 15
      ) t
    ), '[]'::jsonb),
    'devices', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT COALESCE(device_type, 'unknown') AS device, count(*)::integer AS visits
        FROM public.site_visits
        WHERE created_at >= v_since
        GROUP BY COALESCE(device_type, 'unknown')
        ORDER BY visits DESC
      ) t
    ), '[]'::jsonb),
    'daily', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT
          to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
          count(*)::integer AS visits,
          count(DISTINCT session_id)::integer AS sessions
        FROM public.site_visits
        WHERE created_at >= v_since
        GROUP BY date_trunc('day', created_at)
        ORDER BY date_trunc('day', created_at) ASC
      ) t
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;
