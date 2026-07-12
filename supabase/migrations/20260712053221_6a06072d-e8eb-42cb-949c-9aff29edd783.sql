
CREATE TABLE IF NOT EXISTS public.sitemap_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL,
  http_status integer,
  message text,
  submitted_urls integer,
  indexed_urls integer,
  errors integer,
  warnings integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.sitemap_submissions TO authenticated;
GRANT ALL ON public.sitemap_submissions TO service_role;

ALTER TABLE public.sitemap_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view submissions" ON public.sitemap_submissions;
CREATE POLICY "Admins can view submissions" ON public.sitemap_submissions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert submissions" ON public.sitemap_submissions;
CREATE POLICY "Admins can insert submissions" ON public.sitemap_submissions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND submitted_by = auth.uid());

CREATE INDEX IF NOT EXISTS idx_sitemap_submissions_created_at
  ON public.sitemap_submissions (created_at DESC);
