import { createFileRoute } from "@tanstack/react-router";

const BASE = "https://filmak.site";
const COLLECTION_SLUGS = [
  "best-movies-2026", "horror-movies", "romantic-movies", "action-movies", "comedy-movies",
  "sci-fi-movies", "korean-movies", "turkish-movies", "arabic-movies", "movies-like-inception",
];

async function tmdbList(path: string): Promise<Array<{ id: number }>> {
  const key = process.env.TMDB_API_KEY;
  if (!key) return [];
  try {
    const r = await fetch(`https://api.themoviedb.org/3${path}?api_key=${key}&language=en-US&page=1`);
    if (!r.ok) return [];
    const j = (await r.json()) as { results?: Array<{ id: number }> };
    return j.results ?? [];
  } catch {
    return [];
  }
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [popularMovies, topMovies, popularTv, topTv, trendingMovies, trendingTv] = await Promise.all([
          tmdbList("/movie/popular"),
          tmdbList("/movie/top_rated"),
          tmdbList("/tv/popular"),
          tmdbList("/tv/top_rated"),
          tmdbList("/trending/movie/week"),
          tmdbList("/trending/tv/week"),
        ]);

        // Only include public, indexable landing pages. Private/auth routes are intentionally excluded.
        const urls = [
          "/",
          "/discover",
          "/about",
          "/privacy",
          "/faq",
          "/tonight",
          ...COLLECTION_SLUGS.map((s) => `/collections/${s}`),
        ];

        const movieIds = new Set([...popularMovies, ...topMovies, ...trendingMovies].map((m) => m.id));
        const tvIds = new Set([...popularTv, ...topTv, ...trendingTv].map((m) => m.id));
        const genreIds = [28, 35, 18, 27, 10749, 878, 16, 80, 99, 14, 36, 10402, 9648, 10751, 10752, 37];

        for (const id of movieIds) urls.push(`/movie/${id}`);
        for (const id of tvIds) urls.push(`/tv/${id}`);
        for (const id of genreIds) urls.push(`/genre/${id}`);

        const uniqueUrls = [...new Set(urls)];
        const now = new Date().toISOString();
        const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${uniqueUrls
          .map((u) => `  <url><loc>${BASE}${u}</loc><lastmod>${now}</lastmod><changefreq>${u.startsWith("/movie/") || u.startsWith("/tv/") ? "weekly" : "daily"}</changefreq></url>`)
          .join("\n")}\n</urlset>`;

        return new Response(body, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
          },
        });
      },
    },
  },
});
