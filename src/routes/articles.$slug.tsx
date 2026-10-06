import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useMemo } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  BookOpen,
  Sparkles,
  Film,
  Star,
  Share2,
  CheckCircle2,
  ChevronRight,
  UserCheck,
  Award,
} from "lucide-react";
import {
  getEditorialArticleBySlug,
  getEditorialArticles,
  hasSubstantialArticle,
  type Article,
} from "@/lib/editorial.functions";
import { getMovieDetails } from "@/lib/movies.functions";
import { useLocale } from "@/lib/i18n";
import { Spinner } from "@/components/Spinner";
import { ShareButton } from "@/components/ShareButton";
import { AdSlot } from "@/components/AdSlot";
import { safeJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/articles/$slug")({
  loader: async ({ params }) => {
    try {
      const article = await getEditorialArticleBySlug({ data: { slug: params.slug } }).catch(() => null);
      if (!article) return { article: null, relatedMovies: [], otherArticles: [] };

      // Fetch related movie details
      const moviePromises = (article.related_movie_ids || []).slice(0, 5).map((id) =>
        getMovieDetails({ data: { id, lang: "ar" } }).catch(() => null),
      );
      const relatedMovies = (await Promise.all(moviePromises)).filter(Boolean);

      // Fetch other recent articles
      const otherArticles = (await getEditorialArticles({ data: { limit: 4 } }).catch(() => [])) || [];

      return {
        article,
        relatedMovies,
        otherArticles: otherArticles.filter((a) => a.slug !== params.slug).slice(0, 3),
      };
    } catch {
      return { article: null, relatedMovies: [], otherArticles: [] };
    }
  },
  head: ({ loaderData, params }) => {
    const article = loaderData?.article;
    if (!article) {
      return { meta: [{ title: "المقال غير موجود — فلمك" }] };
    }
    const title = `${article.title_ar} — مجلة فلمك | Filmak`;
    const description = article.excerpt_ar;
    const url = `https://filmak.site/articles/${params.slug}`;
    const image = article.featured_image || "https://filmak.site/icon-512.png";
    const monetizable = hasSubstantialArticle(article);

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title_ar,
      alternativeHeadline: article.title_en,
      description: article.excerpt_ar,
      image: [image],
      datePublished: article.published_at,
      dateModified: article.updated_at,
      author: {
        "@type": "Person",
        name: article.author_name,
        jobTitle: article.author_role,
      },
      publisher: {
        "@type": "Organization",
        name: "فلمك — Filmak",
        logo: {
          "@type": "ImageObject",
          url: "https://filmak.site/icon-512.png",
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": url,
      },
    };

    const breadcrumbLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "الرئيسية",
          item: "https://filmak.site/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "المقالات والأدلة",
          item: "https://filmak.site/articles",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: article.title_ar,
          item: url,
        },
      ],
    };

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: monetizable ? "index, follow" : "noindex, follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { property: "article:published_time", content: article.published_at },
        { property: "article:modified_time", content: article.updated_at },
        { property: "article:author", content: article.author_name },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: safeJsonLd(jsonLd) },
        { type: "application/ld+json", children: safeJsonLd(breadcrumbLd) },
      ],
    };
  },
  component: ArticleReaderPage,
});

function ArticleReaderPage() {
  const { dir, locale, t } = useLocale();
  const ar = locale === "ar";
  const { article, relatedMovies, otherArticles } = Route.useLoaderData();
  const Arrow = dir === "rtl" ? ArrowRight : ArrowLeft;

  if (!article) {
    return (
      <main dir={dir} className="min-h-screen grid place-items-center bg-background px-4">
        <div className="text-center max-w-md">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{ar ? "المقال غير موجود" : "Article Not Found"}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {ar ? "ربما تم نقل المقال أو تغيير رابطه." : "This article may have been moved or renamed."}
          </p>
          <Link
            to="/articles"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-5 py-2.5 text-sm font-medium"
          >
            <Arrow className="w-4 h-4" />
            {ar ? "تصفح كل المقالات" : "Browse all articles"}
          </Link>
        </div>
      </main>
    );
  }

  const title = ar ? article.title_ar : article.title_en;
  const subtitle = ar ? article.subtitle_ar : article.subtitle_en;
  const content = ar ? article.content_ar : article.content_en;
  const excerpt = ar ? article.excerpt_ar : article.excerpt_en;

  return (
    <main dir={dir} className="min-h-screen bg-background text-foreground pb-24">
      {/* Article Header & Hero */}
      <header className="relative border-b border-border/40 bg-card/40 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,theme(colors.primary.DEFAULT/0.12),transparent_60%)] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-14 relative">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6 flex-wrap" aria-label="Breadcrumbs">
            <Link to="/" className="hover:text-primary transition">
              {ar ? "الرئيسية" : "Home"}
            </Link>
            <span>/</span>
            <Link to="/articles" className="hover:text-primary transition">
              {ar ? "المقالات والأدلة" : "Articles & Guides"}
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">
              {title}
            </span>
          </nav>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs text-primary font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              {ar ? article.category_label_ar : article.category_label_en}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              {title}
            </h1>

            {subtitle && (
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-normal">
                {subtitle}
              </p>
            )}

            {/* Author & Meta bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/60">
              <div className="flex items-center gap-3">
                <img
                  src={article.author_avatar || "/icon-192.png"}
                  alt={article.author_name}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/30"
                />
                <div>
                  <div className="font-semibold text-sm flex items-center gap-1.5">
                    {article.author_name}
                    <UserCheck className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="text-xs text-muted-foreground">{article.author_role}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(article.published_at).toLocaleDateString(ar ? "ar-EG" : "en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {article.reading_time_minutes} {ar ? "دقائق قراءة" : "min read"}
                </span>
                <ShareButton title={title} text={excerpt.slice(0, 100)} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-12">
        {/* Featured Image */}
        {article.featured_image && (
          <div className="aspect-video w-full rounded-3xl overflow-hidden shadow-2xl border border-border/60 bg-muted">
            <img
              src={article.featured_image}
              alt={title}
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        )}

        {/* Lead Excerpt */}
        <div className="rounded-2xl border-r-4 rtl:border-r-4 ltr:border-l-4 border-primary bg-primary/5 p-6 md:p-7 text-base md:text-lg leading-relaxed text-foreground/90 font-medium">
          {excerpt}
        </div>

        {/* Article Body */}
        <article className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-foreground text-base md:text-lg leading-relaxed">
          {content.split("\n\n").map((para, i) => {
            if (para.startsWith("## ")) {
              return (
                <h2 key={i} className="text-2xl md:text-3xl font-black text-foreground pt-6 pb-2 border-b border-border/40">
                  {para.replace("## ", "")}
                </h2>
              );
            }
            if (para.startsWith("### ")) {
              return (
                <h3 key={i} className="text-xl md:text-2xl font-bold text-foreground pt-4 text-primary">
                  {para.replace("### ", "")}
                </h3>
              );
            }
            if (para.startsWith("---")) {
              return <hr key={i} className="border-border/60 my-6" />;
            }
            if (para.startsWith("* ") || para.startsWith("- ")) {
              const items = para.split("\n").map((line) => line.replace(/^[\*\-]\s+/, ""));
              return (
                <ul key={i} className="space-y-2 ps-6 list-disc text-muted-foreground my-4">
                  {items.map((it, idx) => (
                    <li key={idx} className="leading-relaxed">
                      <span
                        dangerouslySetInnerHTML={{
                          __html: it
                            .replace(/\*\*(.*?)\*\*/g, "<strong class='text-foreground font-semibold'>$1</strong>")
                            .replace(/\*(.*?)\*/g, "<em>$1</em>"),
                        }}
                      />
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p
                key={i}
                className="leading-8 text-foreground/90"
                dangerouslySetInnerHTML={{
                  __html: para
                    .replace(/\*\*(.*?)\*\*/g, "<strong class='text-foreground font-bold'>$1</strong>")
                    .replace(/\*(.*?)\*/g, "<em>$1</em>"),
                }}
              />
            );
          })}
        </article>

        {/* Related Featured Movies Highlight Cards */}
        {relatedMovies && relatedMovies.length > 0 && (
          <section className="rounded-3xl border border-border bg-card p-6 md:p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">{ar ? "الأعمال المذكورة في هذا الدليل" : "Featured Movies in This Guide"}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {relatedMovies.map((m: any) => (
                <Link
                  key={m.id}
                  to="/movie/$id"
                  params={{ id: String(m.id) }}
                      reloadDocument
                  className="group flex gap-3 bg-secondary/40 border border-border rounded-xl p-3 hover:border-primary/50 transition"
                >
                  {m.poster ? (
                    <img src={m.poster} alt={m.title} className="w-14 h-20 rounded-md object-cover shrink-0" loading="lazy" />
                  ) : (
                    <div className="w-14 h-20 rounded-md bg-muted shrink-0 grid place-items-center">
                      <Film className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-sm truncate group-hover:text-primary transition">{m.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.year}</p>
                    </div>
                    <div className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                      <Star className="w-3 h-3 fill-primary" />
                      {m.rating} / 10
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* AdSense slot placed below high-value editorial content */}
        <div className="pt-4">
          {monetizable ? (
            <AdSlot slot="1234567890" editorialEligible className="min-h-[100px]" />
          ) : null}
        </div>

        {/* Author Bio Box */}
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-start">
          <img
            src={article.author_avatar || "/icon-192.png"}
            alt={article.author_name}
            className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/40"
          />
          <div className="space-y-1">
            <h3 className="font-bold text-base">{article.author_name}</h3>
            <p className="text-xs text-primary font-medium">{article.author_role}</p>
            <p className="text-xs text-muted-foreground leading-relaxed pt-1">
              {ar
                ? "كاتب وناقد سينمائي في منصة فلمك، مهتم بتحليل البنية الدرامية وهندسة السرد في السينما العالمية والمستقلة."
                : "Film analyst and senior editor at FILMAK, specializing in narrative architecture and global cinema."}
            </p>
          </div>
        </div>

        {/* Related Articles Carousel / Grid */}
        {otherArticles && otherArticles.length > 0 && (
          <section className="pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                {ar ? "أدلة ومقالات ذات صلة" : "Related Guides & Articles"}
              </h2>
              <Link to="/articles" className="text-xs text-primary hover:underline">
                {ar ? "عرض كل المقالات ←" : "View all guides →"}
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {otherArticles.map((art) => (
                <Link
                  key={art.id}
                  to="/articles/$slug"
                  params={{ slug: art.slug }}
                  className="group rounded-2xl border border-border bg-card overflow-hidden p-4 space-y-3 hover:border-primary/40 transition block"
                >
                  <span className="text-[10px] font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                    {ar ? art.category_label_ar : art.category_label_en}
                  </span>
                  <h3 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition">
                    {ar ? art.title_ar : art.title_en}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {ar ? art.excerpt_ar : art.excerpt_en}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
