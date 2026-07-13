-- ai_cache and ai_rate_limits are server-only tables written from server functions
-- via service_role, which bypasses RLS. Adding an explicit deny-all policy for
-- authenticated/anon so the Supabase linter no longer flags "RLS enabled, no policy"
-- and to make the intent explicit in schema.

CREATE POLICY "server-only: no client access"
  ON public.ai_cache
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "server-only: no client access"
  ON public.ai_rate_limits
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);
