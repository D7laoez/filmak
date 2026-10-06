import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  BookOpen,
  Sparkles,
  Clock,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Compass,
  Film,
  Search,
  Filter,
} from "lucide-react";
import { getEditorialArticles, hasSubstantialArticle, type Article } from "@/lib/editorial.functions";
import { useLocale } from "@/lib/i18n";
import { Spinner } from "@/components/Spinner";
import { safeJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/articles")({
  head: () => {
    const title = "مقالات وأدلة سينمائية — مجلة فلمك | Filmak Magazine";
    const description =
      "مقالات سينمائية نقدية، تحليلات للأعمال الكبرى، أدلة مشاهدة متخصصة، وترشيحات منتقاة بعناية من فريق تحرير فلمك.";
    const url = "https://filmak.site/articles";
    const image = "https://filmak.site/icon-512.png";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: safeJsonLd({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            description,
            url,
            publisher: {
              "@type": "Organization",
              name: "فلمك — Filmak",
              logo: "https://filmak.site/icon-512.png",
            },
          }),
        },
      ],
    };
  },
  component: ArticlesIndexPage,
});

const CATEGORIES = [
  { id: "all", label_ar: "الكل", label_en: "All" },
  { id: "guides", label_ar: "أدلة المشاهدة", label_en: "Viewing Guides" },
  { id: "comparisons", label_ar: "مقارنات وترشيحات", label_en: "Comparisons" },
  { id: "spotlight", label_ar: "جواهر مخفية", label_en: "Spotlight" },
  { id: "genre-deep-dive", label_ar: "سينما عالمية", label_en: "World Cinema" },
  { id: "collections", label_ar: "أجواء ومزاج", label_en: "Mood & Vibe" },
];

function ArticlesIndexPage() {
  const { locale, dir, t } = useLocale();
  const ar = locale === "ar";
  const Arrow = dir === "rtl" ? ArrowRight : ArrowLeft;
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const articlesQuery = useQuery({
    queryKey: ["editorial-articles", selectedCategory],
    queryFn: () =>
      getEditorialArticles({
        data: { category: selectedCategory === "all" ? undefined : selectedCategory },
      }),
  });

  const allArticles = (articlesQuery.data ?? []).filter(hasSubstantialArticle);
  const filteredArticles = allArticles.filter((art) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = ar ? art.title_ar : art.title_en;
    const excerpt = ar ? art.excerpt_ar : art.excerpt_en;
    return title.toLowerCase().includes(q) || excerpt.toLowerCase().includes(q);
  });

  const featuredArticle = allArticles.find((a) => a.featured) ?? allArticles[0];
  const gridArticles = filteredArticles.filter((a) => a.id !== featuredArticle?.id || searchQuery.trim().length > 0);

  return (
    <main dir={dir} className="min-h-screen bg-background text-foreground pb-24">
      {/* Header Banner */}
      <section className="relative overflow-hidden border-b border-border/40 bg-card/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,theme(colors.primary.DEFAULT/0.15),transparent_60%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 relative">
          <div className="flex items-center gap-2 mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs hover:bg-secondary transition"
            >
              <Arrow className="w-3.5 h-3.5" />
              {ar ? "الرئيسية" : "Home"}
            </Link>
            <span className="text-muted-foreground text-xs">/</span>
            <span className="text-xs text-primary font-medium">
              {ar ? "المقالات والأدلة" : "Articles & Guides"}
            </span>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs text-primary font-semibold mb-4">
              <BookOpen className="w-3.5 h-3.5" />
              {ar ? "مجلة فلمك السينمائية" : "FILMAK Editorial Magazine"}
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              {ar ? "أدلة وتحليلات نقدية" : "In-Depth Cinema Guides"}{" "}
              <span className="text-primary">{ar ? "تثري ذوقك السينمائي" : "& Expert Curation"}</span>
            </h1>
            <p className="mt-4 text-muted-foreground text-base md:text-lg leading-relaxed">
              {ar
                ? "محتوى تحريري أصلي بقلم نقاد فلمك: استكشف روائع الخيال العلمي، ألغاز الإثارة النفسية، والجواهر السينمائية المظلومة بدون حشو أو معلومات مكررة."
                : "Original editorial articles and curated viewing guides crafted by film analysts. Discover hidden gems, psychological masterworks, and cinematic deep dives."}
            </p>
          </div>

          {/* Search bar */}
          <div className="mt-8 max-w-md relative">
            <Search
              className={`absolute ${dir === "rtl" ? "right-3.5" : "left-3.5"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`}
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={ar ? "ابحث في مقالات وأدلة فلمك..." : "Search articles and guides..."}
              className={`w-full bg-secondary/60 border border-border rounded-full py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 ${
                dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4"
              }`}
            />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 text-xs px-4 py-2 rounded-full border transition font-medium ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "bg-card border-border hover:bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {ar ? cat.label_ar : cat.label_en}
            </button>
          ))}
        </div>

        {articlesQuery.isLoading ? (
          <div className="py-20 flex justify-center">
            <Spinner size={48} label={t("loading")} />
          </div>
        ) : (
          <>
            {/* Featured Hero Article */}
            {featuredArticle && !searchQuery.trim() && selectedCategory === "all" && (
              <section className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-xl transition hover:border-primary/40 group">
                <Link
                  to="/articles/$slug"
                  params={{ slug: featuredArticle.slug }}
                  className="grid md:grid-cols-12 gap-6 p-6 md:p-8 items-center"
                >
                  <div className="md:col-span-7 space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs text-primary font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      {ar ? "مقال مميز" : "Featured Guide"} ·{" "}
                      {ar ? featuredArticle.category_label_ar : featuredArticle.category_label_en}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black leading-snug group-hover:text-primary transition">
                      {ar ? featuredArticle.title_ar : featuredArticle.title_en}
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed line-clamp-3">
                      {ar ? featuredArticle.excerpt_ar : featuredArticle.excerpt_en}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2">
                      <span className="font-medium text-foreground">
                        ✍️ {featuredArticle.author_name}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {featuredArticle.reading_time_minutes} {ar ? "دقائق قراءة" : "min read"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(featuredArticle.published_at).toLocaleDateString(
                          ar ? "ar-EG" : "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="md:col-span-5 aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden bg-muted relative">
                    {featuredArticle.featured_image && (
                      <img
                        src={featuredArticle.featured_image}
                        alt={ar ? featuredArticle.title_ar : featuredArticle.title_en}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        loading="eager"
                      />
                    )}
                  </div>
                </Link>
              </section>
            )}

            {/* Articles Grid */}
            {filteredArticles.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-base font-medium">
                  {ar ? "لم نجد مقالات تطابق بحثك" : "No articles matched your query"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {ar ? "جرّب تصنيفاً آخر أو كلمات بحث مختلفة." : "Try selecting another category or searching different terms."}
                </p>
              </div>
            ) : (
              <section className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Film className="w-5 h-5 text-primary" />
                  {ar ? "أحدث الأدلة والمقالات" : "Latest Guides & Articles"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gridArticles.map((art) => (
                    <article
                      key={art.id}
                      className="group flex flex-col rounded-2xl border border-border/70 bg-card/70 backdrop-blur-md overflow-hidden shadow-sm hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex-1"
                    >
                      <Link
                        to="/articles/$slug"
                        params={{ slug: art.slug }}
                        className="block aspect-video bg-muted overflow-hidden relative"
                      >
                        {art.featured_image ? (
                          <img
                            src={art.featured_image}
                            alt={ar ? art.title_ar : art.title_en}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                        ) : (
                          <div className="w-full h-full grid place-items-center bg-secondary/50">
                            <BookOpen className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3 bg-black/75 backdrop-blur text-[11px] text-white px-2.5 py-1 rounded-full font-medium">
                          {ar ? art.category_label_ar : art.category_label_en}
                        </div>
                      </Link>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <Link
                            to="/articles/$slug"
                            params={{ slug: art.slug }}
                            className="block group-hover:text-primary transition"
                          >
                            <h3 className="font-bold text-lg leading-snug line-clamp-2">
                              {ar ? art.title_ar : art.title_en}
                            </h3>
                          </Link>
                          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                            {ar ? art.excerpt_ar : art.excerpt_en}
                          </p>
                        </div>

                        <div className="border-t border-border/50 pt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>✍️ {art.author_name}</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {art.reading_time_minutes} {ar ? "د" : "min"}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
