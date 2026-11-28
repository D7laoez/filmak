import { createFileRoute } from "@tanstack/react-router";
import {
  getEditorialArticles,
  getCollectionMovies,
  hasEditorialDepth,
} from "@/lib/editorial.functions";

const BASE = "https://filmak.site";

// Keep the sitemap focused on pages where Filmak provides clear editorial,
// curatorial, or product value instead of bulk-indexing TMDB catalogue pages.
const INDEXABLE_ROUTES = [
  "/",
  "/discover",
  "/free-movies",
  "/articles",
  "/collections",
  "/movie-night",
  "/pick",
  "/tonight",
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

const GENRE_IDS = [
  28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 53, 10752, 37,
];

async function fetchTmdbIds(endpoint: string, key: string): Promise<number[]> {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3${endpoint}?api_key=${key}&language=ar-SA`,
      {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: Array<{ id?: number }> };
    return (data.results ?? [])
      .map((item) => item.id)
      .filter((id): id is number => typeof id === "number" && Number.isInteger(id) && id > 0);
  } catch {
    return [];
  }
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

type SitemapEntry = {
  path: string;
  lastmod?: string;
  changefreq: "daily" | "weekly" | "monthly";
  priority: string;
};

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const articles = await getEditorialArticles({ data: { limit: 100 } }).catch(() => []);
        const articleEntries: SitemapEntry[] = articles
          .filter((article) => article?.slug && hasEditorialDepth(article))
          .map((article) => ({
            path: `/articles/${article.slug}`,
            lastmod: article.updated_at ? article.updated_at.slice(0, 10) : undefined,
            changefreq: "weekly" as const,
            priority: "0.8",
          }));
        // Keep the sitemap aligned with collection pages' indexability rule:
        // include only collections that currently render enough real items.
        const collectionResults: Array<SitemapEntry | null> = await Promise.all(
          COLLECTION_SLUGS.map(async (slug): Promise<SitemapEntry | null> => {
            try {
              const result = await getCollectionMovies({ data: { slug } });
              return result.collection && (result.items?.length ?? 0) >= 5
                ? { path: `/collections/${slug}`, changefreq: "weekly", priority: "0.8" }
                : null;
            } catch {
              return null;
            }
          }),
        );
        const collectionEntries = collectionResults.filter(
          (entry): entry is SitemapEntry => entry !== null,
        );

        const staticEntries: SitemapEntry[] = INDEXABLE_ROUTES.map((path) => ({
          path,
          changefreq:
            path === "/" || path === "/discover" || path === "/articles" || path === "/collections"
              ? "daily"
              : "monthly",
          priority:
            path === "/"
              ? "1.0"
              : path === "/articles" || path === "/collections" || path === "/discover"
                ? "0.9"
                : "0.7",
        }));

        const genreEntries: SitemapEntry[] = GENRE_IDS.map((id) => ({
          path: `/genre/${id}`,
          changefreq: "weekly",
          priority: "0.8",
        }));

        const tmdbKey = process.env.TMDB_API_KEY;
        let mediaEntries: SitemapEntry[] = [];
        if (tmdbKey) {
          const [trendM, popM, topM, trendTv, popTv] = await Promise.all([
            fetchTmdbIds("/trending/movie/week", tmdbKey),
            fetchTmdbIds("/movie/popular", tmdbKey),
            fetchTmdbIds("/movie/top_rated", tmdbKey),
            fetchTmdbIds("/trending/tv/week", tmdbKey),
            fetchTmdbIds("/tv/popular", tmdbKey),
          ]);
          const movieIds = Array.from(new Set([...trendM, ...popM, ...topM])).slice(0, 60);
          const tvIds = Array.from(new Set([...trendTv, ...popTv])).slice(0, 40);
          mediaEntries = [
            ...movieIds.map((id) => ({
              path: `/movie/${id}`,
              changefreq: "weekly" as const,
              priority: "0.8",
            })),
            ...tvIds.map((id) => ({
              path: `/tv/${id}`,
              changefreq: "weekly" as const,
              priority: "0.8",
            })),
          ];
        }

        const seen = new Set<string>();
        const entries = [
          ...staticEntries,
          ...genreEntries,
          ...articleEntries,
          ...collectionEntries,
          ...mediaEntries,
        ].filter((e) => {
          if (seen.has(e.path)) return false;
          seen.add(e.path);
          return true;
        });

        const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
          .map((e) => {
            const lastmodTag = e.lastmod ? `<lastmod>${xmlEscape(e.lastmod)}</lastmod>` : "";
            return `  <url><loc>${xmlEscape(`${BASE}${e.path}`)}</loc>${lastmodTag}<changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`;
          })
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
