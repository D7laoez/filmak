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
                : "0.6",
        }));

        const seen = new Set<string>();
        const entries = [...staticEntries, ...articleEntries, ...collectionEntries].filter((e) => {
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
