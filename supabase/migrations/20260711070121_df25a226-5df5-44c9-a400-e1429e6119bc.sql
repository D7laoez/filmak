-- 1) Create the unified user_lists table
CREATE TABLE public.user_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  media_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('favorite', 'watchlist', 'watched')),
  rating NUMERIC(3,1) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 10)),
  note TEXT,
  title TEXT NOT NULL,
  poster TEXT,
  year TEXT,
  tmdb_rating NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, media_type, media_id, status)
);

-- 2) Grants — only signed-in users own rows here, so anon is not granted read.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_lists TO authenticated;
GRANT ALL ON public.user_lists TO service_role;

-- 3) RLS
ALTER TABLE public.user_lists ENABLE ROW LEVEL SECURITY;

-- 4) Policies — every action scoped to auth.uid()
CREATE POLICY "Users can view their own list entries"
  ON public.user_lists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own list entries"
  ON public.user_lists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own list entries"
  ON public.user_lists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own list entries"
  ON public.user_lists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5) updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_lists_updated_at
  BEFORE UPDATE ON public.user_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful index for browsing by status
CREATE INDEX idx_user_lists_user_status ON public.user_lists (user_id, status, created_at DESC);

-- 6) Migrate existing favorites into the new table as status='favorite'
INSERT INTO public.user_lists (user_id, media_type, media_id, status, title, poster, year, tmdb_rating, created_at)
SELECT user_id, 'movie', movie_id, 'favorite', title, poster, year, rating, created_at
FROM public.favorites
ON CONFLICT (user_id, media_type, media_id, status) DO NOTHING;