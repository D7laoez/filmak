-- Migration: 20260829000000_editorial_system.sql
-- Create editorial_reviews, articles, and collections_editorial tables with RLS and indexes

-- 1. editorial_reviews table
CREATE TABLE IF NOT EXISTS public.editorial_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  verdict TEXT NOT NULL,
  review_content TEXT NOT NULL,
  strengths TEXT[] DEFAULT '{}'::TEXT[],
  weaknesses TEXT[] DEFAULT '{}'::TEXT[],
  who_should_watch TEXT,
  who_may_not_enjoy TEXT,
  why_watch TEXT,
  best_for TEXT,
  mood TEXT,
  experience_level TEXT,
  recommended_viewing TEXT,
  content_notes TEXT,
  editorial_score NUMERIC(3, 1) NOT NULL CHECK (editorial_score >= 0 AND editorial_score <= 10),
  story_score NUMERIC(3, 1) CHECK (story_score >= 0 AND story_score <= 10),
  acting_score NUMERIC(3, 1) CHECK (acting_score >= 0 AND acting_score <= 10),
  visuals_score NUMERIC(3, 1) CHECK (visuals_score >= 0 AND visuals_score <= 10),
  entertainment_score NUMERIC(3, 1) CHECK (entertainment_score >= 0 AND entertainment_score <= 10),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'فريق تحرير فلمك',
  author_role TEXT NOT NULL DEFAULT 'هيئة التحرير السينمائي',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  similar_reasons JSONB DEFAULT '{}'::JSONB,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_editorial_reviews_movie_id ON public.editorial_reviews(movie_id);
CREATE INDEX IF NOT EXISTS idx_editorial_reviews_status ON public.editorial_reviews(status);
CREATE INDEX IF NOT EXISTS idx_editorial_reviews_score ON public.editorial_reviews(editorial_score DESC);

-- 2. articles table (Movie Guides & Magazine)
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  subtitle_ar TEXT,
  subtitle_en TEXT,
  excerpt_ar TEXT NOT NULL,
  excerpt_en TEXT NOT NULL,
  content_ar TEXT NOT NULL,
  content_en TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'guides',
  featured_image TEXT,
  author_name TEXT NOT NULL DEFAULT 'علي الخفاجي',
  author_role TEXT NOT NULL DEFAULT 'رئيس التحرير وناقد سينمائي',
  author_avatar TEXT DEFAULT '/icon-192.png',
  related_movie_ids INTEGER[] DEFAULT '{}'::INTEGER[],
  related_article_slugs TEXT[] DEFAULT '{}'::TEXT[],
  reading_time_minutes INTEGER NOT NULL DEFAULT 5,
  featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON public.articles(featured);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at DESC);

-- 3. collections_editorial table
CREATE TABLE IF NOT EXISTS public.collections_editorial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  description_en TEXT NOT NULL,
  editorial_intro_ar TEXT NOT NULL,
  editorial_intro_en TEXT NOT NULL,
  badge TEXT,
  cover_image TEXT,
  movie_ids INTEGER[] NOT NULL DEFAULT '{}'::INTEGER[],
  movie_curation_notes JSONB DEFAULT '{}'::JSONB,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collections_editorial_slug ON public.collections_editorial(slug);
CREATE INDEX IF NOT EXISTS idx_collections_editorial_status ON public.collections_editorial(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.editorial_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections_editorial ENABLE ROW LEVEL SECURITY;

-- Public read policies: Anyone can view published items
CREATE POLICY "Public can view published editorial reviews"
  ON public.editorial_reviews
  FOR SELECT
  USING (status = 'published');

CREATE POLICY "Public can view published articles"
  ON public.articles
  FOR SELECT
  USING (status = 'published');

CREATE POLICY "Public can view published collections"
  ON public.collections_editorial
  FOR SELECT
  USING (status = 'published');

-- Admin write policies: Admins can do anything
CREATE POLICY "Admins have full access to editorial reviews"
  ON public.editorial_reviews
  FOR ALL
  TO authenticated
  USING (public.has_role('admin', auth.uid()))
  WITH CHECK (public.has_role('admin', auth.uid()));

CREATE POLICY "Admins have full access to articles"
  ON public.articles
  FOR ALL
  TO authenticated
  USING (public.has_role('admin', auth.uid()))
  WITH CHECK (public.has_role('admin', auth.uid()));

CREATE POLICY "Admins have full access to collections"
  ON public.collections_editorial
  FOR ALL
  TO authenticated
  USING (public.has_role('admin', auth.uid()))
  WITH CHECK (public.has_role('admin', auth.uid()));
