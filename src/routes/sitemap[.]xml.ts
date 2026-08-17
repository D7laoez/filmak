import { createFileRoute } from "@tanstack/react-router";

const BASE = "https://filmak.site";
const PUBLIC_ROUTES = ["/", "/discover", "/about", "/privacy"];
const MOVIE_GENRES = [28, 35, 18, 27, 10749, 878, 16, 80, 99, 14, 36, 10402, 9648, 10751, 10752, 37];

type TmdbItem = { id: number };

async function tmdbList(path: string, page: number): Promise<TmdbItem[]> {
  const key = process.env.TMDB_API_KEY;
  if (!key) return [];
  try {
    const url = new URL(`https://api.themoviedb.org/3${path}`);
    url.searchParams.set("api_key", key);
    url.searchParams.set("language", "en-US");
    url.searchParams.set("page", String(page));
    const r = await fetch(url.toString());
    if (!r.ok) return [];
    const j = (await r.json()) as { results?: TmdbItem[] };
    return j.results ?? [];
  } catch {
    return [];
  }
}

async function collect(path: string, pages = 5): Promise<number[]> {
  const batches = await Promise.all(Array.from({ length: pages }, (_, i) => tmdbList(path, i + 1)));
  return [...new Set(batches.flat().map((x) => x.id).filter(Boolean))];
}

function xmlEscape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [movieIds, tvIds] = await Promise.all([
          collect("/movie/popular"),
          collect("/tv/popular"),
        ]);
        const urls = [
          ...PUBLIC_ROUTES,
          ...MOVIE_GENRES.map((id) => `/genre/${id}`),
          ...movieIds.map((id) => `/movie/${id}`),
          ...tvIds.map((id) => `/tv/${id}`),
        ];
        const uniqueUrls = [...new Set(urls)];
        const today = new Date().toISOString().slice(0, 10);
        const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${uniqueUrls.map((u) => {
          const stable = u === "/" || u === "/discover" || u.startsWith("/genre/");
          return `  <url><loc>${xmlEscape(`${BASE}${u}`)}</loc><lastmod>${today}</lastmod><changefreq>${stable ? "daily" : "weekly"}</changefreq><priority>${u === "/" ? "1.0" : u.startsWith("/movie/") || u.startsWith("/tv/") ? "0.8" : "0.7"}</priority></url>`;
        }).join("\n")}\n</urlset>`;
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
