const BASE = "https://api.themoviedb.org/3";

export const IMG = (
  path: string | null,
  size: "w200" | "w300" | "w500" | "w780" | "original" = "w500",
) => (path ? `https://image.tmdb.org/t/p/${size}${path}` : null);

// In-memory TTL cache for TMDB responses.
type CacheEntry = { value: unknown; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const MAX_ENTRIES = 500;

function cacheGet<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  cache.delete(key);
  cache.set(key, entry);
  return entry.value as T;
}

function cacheSet(key: string, value: unknown, ttlMs: number) {
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function ttlFor(path: string): number {
  if (path.includes("/genre/") && path.includes("/list")) return 1000 * 60 * 60 * 24;
  if (path.startsWith("/search/")) return 1000 * 60 * 15;
  if (path.startsWith("/movie/") || path.startsWith("/tv/") || path.startsWith("/person/")) {
    if (
      /\/(movie|tv)\/(popular|top_rated|now_playing|upcoming|on_the_air|airing_today)/.test(
        path,
      )
    ) {
      return 1000 * 60 * 30;
    }
    return 1000 * 60 * 60;
  }
  if (path.startsWith("/trending/")) return 1000 * 60 * 30;
  if (path.startsWith("/discover/")) return 1000 * 60 * 30;
  return 1000 * 60 * 15;
}

async function tmdb<T>(
  path: string,
  params: Record<string, string> = {},
  lang: "ar" | "en" = "ar",
): Promise<T> {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    console.warn("WARN: TMDB_API_KEY is missing from environment. Returning empty dataset.");
    if (path.includes("/list")) return { genres: [] } as unknown as T;
    return { results: [], total_pages: 1 } as unknown as T;
  }
  const cacheKey = `${lang}|${path}|${new URLSearchParams(params).toString()}`;
  const cached = cacheGet<T>(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const url = new URL(BASE + path);
    url.searchParams.set("api_key", key);
    url.searchParams.set("language", lang === "en" ? "en-US" : "ar");
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.warn(`TMDB ${res.status}: ${await res.text()}`);
      if (path.includes("/list")) return { genres: [] } as unknown as T;
      return { results: [], total_pages: 1 } as unknown as T;
    }
    const data = (await res.json()) as T;
    cacheSet(cacheKey, data, ttlFor(path));
    return data;
  } catch (err) {
    console.warn(`TMDB fetch error for ${path}:`, err);
    if (path.includes("/list")) return { genres: [] } as unknown as T;
    return { results: [], total_pages: 1 } as unknown as T;
  }
}

export type TmdbMovie = {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids?: number[];
};

export const tmdbGet = tmdb;