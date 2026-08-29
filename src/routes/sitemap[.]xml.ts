import { createFileRoute } from "@tanstack/react-router";
import { getEditorialArticles } from "@/lib/editorial.functions";

const BASE = "https://filmak.site";

const STATIC_TRUST_ROUTES = [
  "/",
  "/discover",
  "/articles",
  "/collections",
  "/movie-night",
  "/pick",
  "/about",
  "/editorial-policy",
  "/contact",
  "/privacy",
  "/terms",
  "/dmca",
  "/faq",
];

const COLLECTION_SLUGS = [
  "best-movies-2026",
  "horror-movies",
  "romantic-movies",
  "action-movies",
  "comedy-movies",
  "sci-fi-movies",
  "korean-movies",
  "turkish-movies",
  "arabic-movies",
  "movies-like-inception",
];

const MOVIE_GENRES = [
  28, 35, 18, 27, 10749, 878, 16, 80, 99, 14, 36, 10402, 9648, 10751, 10752, 37,
];

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
  const batches = await Promise.all(
    Array.from({ length: pages }, (_, i) => tmdbList(path, i + 1)),
  );
  return [...new Set(batches.flat().map((x) => x.id).filter(Boolean))];
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [movieIds, tvIds, articles] = await Promise.all([
          collect("/movie/popular"),
          collect("/tv/popular"),
          getEditorialArticles({ data: { limit: 50 } }).catch(() => []),
        ]);

        const articleUrls = articles.map((a) => `/articles/${a.slug}`);
        const collectionUrls = COLLECTION_SLUGS.map((slug) => `/collections/${slug}`);

        const urls = [
          ...STATIC_TRUST_ROUTES,
          ...articleUrls,
          ...collectionUrls,
          ...MOVIE_GENRES.map((id) => `/genre/${id}`),
          ...movieIds.map((id) => `/movie/${id}`),
          ...tvIds.map((id) => `/tv/${id}`),
        ];

        const uniqueUrls = [...new Set(urls)];
        const today = new Date().toISOString().slice(0, 10);

        const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${uniqueUrls
          .map((u) => {
            const isHighPriority =
              u === "/" ||
              u === "/articles" ||
              u.startsWith("/articles/") ||
              u === "/collections" ||
              u.startsWith("/collections/");
            const priority =
              u === "/"
                ? "1.0"
                : isHighPriority
                  ? "0.9"
                  : u.startsWith("/movie/") || u.startsWith("/tv/")
                    ? "0.8"
                    : "0.7";
            const changefreq = isHighPriority ? "daily" : "weekly";
            return `  <url><loc>${xmlEscape(`${BASE}${u}`)}</loc><lastmod>${today}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
          })
          .join("\n")}\n</urlset>`;

        return new Response(body, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control":
              "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
          },
        });
      },
    },
  },
});
