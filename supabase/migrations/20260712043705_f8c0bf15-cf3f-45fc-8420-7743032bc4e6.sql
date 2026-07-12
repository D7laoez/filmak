
-- AI response cache: identical prompts return cached results instead of calling AI
CREATE TABLE public.ai_cache (
  cache_key TEXT PRIMARY KEY,
  lang TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response JSONB NOT NULL,
  hit_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_hit_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.ai_cache TO service_role;
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (server) can read/write

-- Rate limit tracker per IP per day
CREATE TABLE public.ai_rate_limits (
  ip TEXT NOT NULL,
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip, day)
);
GRANT ALL ON public.ai_rate_limits TO service_role;
ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: server-only

CREATE INDEX idx_ai_cache_last_hit ON public.ai_cache(last_hit_at DESC);
CREATE INDEX idx_ai_rate_limits_day ON public.ai_rate_limits(day);
