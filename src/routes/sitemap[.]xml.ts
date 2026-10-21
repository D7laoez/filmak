import { createFileRoute } from "@tanstack/react-router";
import { getEditorialArticles, getCollectionMovies, hasEditorialDepth } from "@/lib/editorial.functions";

const BASE = "https://filmak.site";

// Keep the sitemap focused on pages where Filmak provides clear editorial,
// curatorial, or product value instead of bulk-indexing TMDB catalogue pages.
const INDEXABLE_ROUTES = [
  "/",
  "/articles",
  "/collections",
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
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const articles = await getEditorialArticles({ data: { limit: 100 } }).catch(() => []);
        const articleUrls = articles
          .filter((article) => article?.slug && hasEditorialDepth(article))
          .map((article) => `/articles/${article.slug}`);
        // Keep the sitemap aligned with collection pages' indexability rule:
        // include only collections that currently render enough real items.
        const collectionResults = await Promise.all(
          COLLECTION_SLUGS.map(async (slug) => {
            try {
              const result = await getCollectionMovies({ data: { slug } });
              return result.collection && (result.items?.length ?? 0) >= 5
                ? `/collections/${slug}`
                : null;
            } catch {
              return null;
            }
          }),
        );
        const collectionUrls = collectionResults.filter(
          (url): url is string => url !== null,
        );

        const uniqueUrls = [
          ...new Set([...INDEXABLE_ROUTES, ...articleUrls, ...collectionUrls]),
        ];

        const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${uniqueUrls
          .map((u) => `  <url><loc>${xmlEscape(`${BASE}${u}`)}</loc></url>`)
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
