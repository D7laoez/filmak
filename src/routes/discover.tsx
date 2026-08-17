import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Compass, Filter, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { discoverMovies, getGenres } from "@/lib/movies.functions";
import { useLocale } from "@/lib/i18n";
import { Spinner } from "@/components/Spinner";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "اكتشف — فلمك · استكشاف الأفلام والمسلسلات" },
      {
        name: "description",
        content:
          "استكشف آلاف الأفلام والمسلسلات حسب النوع، السنة، والتقييم. اعثر على ما تشاهده اليوم مع فلاتر البحث المتقدمة في فلمك.",
      },
      { property: "og:title", content: "اكتشف — Filmak Discover" },
      {
        property: "og:description",
        content:
          "Filter thousands of movies by genre, year, rating, and popularity.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://filmak.site/discover" },
      { property: "og:image", content: "https://filmak.site/icon-512.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "اكتشف — Filmak Discover" },
      {
        name: "twitter:description",
        content:
          "Filter thousands of movies by genre, year, rating, and popularity.",
      },
      { name: "twitter:image", content: "https://filmak.site/icon-512.png" },
    ],
    links: [{ rel: "canonical", href: "https://filmak.site/discover" }],
  }),
  component: DiscoverPage,
});

type SortKey =
  | "popularity.desc"
  | "vote_average.desc"
  | "primary_release_date.desc"
  | "primary_release_date.asc"
  | "revenue.desc";

function DiscoverPage() {
  const { locale, dir, t } = useLocale();
  const [genres, setGenres] = useState<number[]>([]);
  const [sort, setSort] = useState<SortKey>("popularity.desc");
  const [year, setYear] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number>(0);
  const [lang, setLang] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const genreList = useQuery({
    queryKey: ["genres", locale],
    queryFn: () => getGenres({ data: { lang: locale } }),
  });

  const params = useMemo(
    () => ({
      lang: locale,
      genreIds: genres,
      sort,
      page,
      minRating,
      year,
      lang_original: lang,
    }),
    [locale, genres, sort, page, minRating, year, lang],
  );

  const results = useQuery({
    queryKey: ["discover", params],
    queryFn: () => discoverMovies({ data: params }),
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 60 }, (_, i) => currentYear - i);

  const sortLabels: Record<SortKey, { ar: string; en: string }> = {
    "popularity.desc": { ar: "الأكثر شعبية", en: "Most popular" },
    "vote_average.desc": { ar: "الأعلى تقييماً", en: "Highest rated" },
    "primary_release_date.desc": { ar: "الأحدث", en: "Newest" },
    "primary_release_date.asc": { ar: "الأقدم", en: "Oldest" },
    "revenue.desc": { ar: "الأعلى إيراداً", en: "Highest grossing" },
  };

  const langOptions = [
    { code: null, label: t("any") },
    { code: "en", label: t("lang_en") },
    { code: "ar", label: t("lang_ar") },
    { code: "ko", label: t("lang_ko") },
    { code: "ja", label: t("lang_ja") },
    { code: "tr", label: t("lang_tr") },
    { code: "hi", label: t("lang_hi") },
    { code: "fr", label: t("lang_fr") },
    { code: "es", label: t("lang_es") },
  ];

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground pb-24">
      <header className="border-b border-border/40 backdrop-blur sticky top-0 z-30 bg-background/85">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            ← {t("brand")}
          </Link>
          <div className="mx-auto flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">{t("discover")}</h1>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters bar */}
        <div className="bg-card/60 backdrop-blur border border-border rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
            <Filter className="w-4 h-4 text-primary" />
            {t("filters")}
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {genreList.data?.map((g) => {
              const on = genres.includes(g.id);
              return (
                <button
                  key={g.id}
                  onClick={() => {
                    setPage(1);
                    setGenres((prev) =>
                      on ? prev.filter((x) => x !== g.id) : [...prev, g.id],
                    );
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${
                    on
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/60 border-border hover:bg-secondary"
                  }`}
                >
                  {g.name}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Sort */}
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-muted-foreground">
                {locale === "ar" ? "الترتيب" : "Sort"}
              </span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as SortKey);
                  setPage(1);
                }}
                className="bg-secondary/60 border border-border rounded-lg px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              >
                {(Object.keys(sortLabels) as SortKey[]).map((k) => (
                  <option key={k} value={k}>
                    {sortLabels[k][locale]}
                  </option>
                ))}
              </select>
            </label>

            {/* Year */}
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-muted-foreground">{t("year")}</span>
              <select
                value={year ?? ""}
                onChange={(e) => {
                  setYear(e.target.value ? Number(e.target.value) : null);
                  setPage(1);
                }}
                className="bg-secondary/60 border border-border rounded-lg px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">{t("any")}</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>

            {/* Min rating */}
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-muted-foreground">
                {t("min_rating")}: {minRating.toFixed(1)}
              </span>
              <input
                type="range"
                min={0}
                max={9}
                step={0.5}
                value={minRating}
                onChange={(e) => {
                  setMinRating(Number(e.target.value));
                  setPage(1);
                }}
                className="accent-primary h-9"
              />
            </label>

            {/* Original language */}
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-muted-foreground">
                {t("original_language")}
              </span>
              <select
                value={lang ?? ""}
                onChange={(e) => {
                  setLang(e.target.value || null);
                  setPage(1);
                }}
                className="bg-secondary/60 border border-border rounded-lg px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              >
                {langOptions.map((o) => (
                  <option key={o.code ?? "any"} value={o.code ?? ""}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Results grid */}
        {results.isLoading && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {results.data && results.data.results.length === 0 && (
          <p className="text-center text-muted-foreground py-16">
            {locale === "ar"
              ? "لا نتائج بهذه الفلاتر. جرّب فلاتر أوسع."
              : "No results — try broader filters."}
          </p>
        )}

        {results.data && results.data.results.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {results.data.results.map((m) => (
                <Link
                  key={m.id}
                  to="/movie/$id"
                  params={{ id: String(m.id) }}
                  className="group block"
                >
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted">
                    {m.poster && (
                      <img
                        src={m.poster}
                        alt={m.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    )}
                    <div className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 text-[11px] bg-black/70 text-primary rounded-full px-2 py-0.5 backdrop-blur">
                      <Star className="w-3 h-3 fill-primary" />
                      {m.rating}
                    </div>
                  </div>
                  <div className="mt-2">
                    <h3 className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition">
                      {m.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{m.year}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 text-sm px-3 py-2 rounded-full bg-secondary/60 border border-border hover:bg-secondary transition disabled:opacity-40"
              >
                <ChevronRight className={`w-4 h-4 ${dir === "rtl" ? "" : "hidden"}`} />
                <ChevronLeft className={`w-4 h-4 ${dir === "rtl" ? "hidden" : ""}`} />
                {locale === "ar" ? "السابق" : "Prev"}
              </button>
              <span className="text-sm text-muted-foreground px-3">
                {page} / {results.data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(results.data!.totalPages, p + 1))}
                disabled={page >= results.data.totalPages}
                className="inline-flex items-center gap-1 text-sm px-3 py-2 rounded-full bg-secondary/60 border border-border hover:bg-secondary transition disabled:opacity-40"
              >
                {locale === "ar" ? "التالي" : "Next"}
                <ChevronLeft className={`w-4 h-4 ${dir === "rtl" ? "" : "hidden"}`} />
                <ChevronRight className={`w-4 h-4 ${dir === "rtl" ? "hidden" : ""}`} />
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}